use std::fs;
use chrono::{Local, NaiveDate};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::paths;
use crate::commands::calendar::{fetch_calendar_list, get_cached_events};

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct Preferences {
    pub semester_start_date: Option<String>,
    pub semester_total_weeks: Option<u32>,
}

pub fn load_preferences() -> Preferences {
    let p = paths::get_preferences_path();
    if p.exists() {
        if let Ok(raw) = fs::read_to_string(p) {
            return serde_json::from_str(&raw).unwrap_or_default();
        }
    }
    Preferences::default()
}

pub fn save_preferences(pref: &Preferences) {
    let p = paths::get_preferences_path();
    if let Ok(raw) = serde_json::to_string_pretty(pref) {
        let _ = fs::write(p, raw);
    }
}

#[tauri::command]
pub async fn academic_get_week_info() -> Value {
    let pref = load_preferences();
    let total_weeks = pref.semester_total_weeks.unwrap_or(16).clamp(1, 30);

    // 1. Detect semester calendar from calendar list
    let mut detected_cal_id: Option<String> = None;
    let mut detected_cal_name: Option<String> = None;
    let mut detected_semester: Option<u32> = None;
    let mut detected_year: Option<String> = None;

    if let Ok((calendars, selected_ids)) = fetch_calendar_list().await {
        for cal in &calendars {
            if !selected_ids.contains(&cal.id) {
                continue;
            }
            let name_upper = cal.summary.to_uppercase();
            if name_upper.contains("SEMESTER") {
                // simple extraction
                let parts: Vec<&str> = cal.summary.split(|c| c == '-' || c == '–').collect();
                if let Some(sem_part) = parts.first() {
                    let digits: String = sem_part.chars().filter(|c| c.is_ascii_digit()).collect();
                    if let Ok(num) = digits.parse::<u32>() {
                        detected_semester = Some(num);
                    }
                }
                if parts.len() > 1 {
                    detected_year = Some(parts[1].trim().to_string());
                }
                detected_cal_id = Some(cal.id.clone());
                detected_cal_name = Some(cal.summary.clone());
                break;
            }
        }
    }

    // 2. Determine semester start date (manual override > auto-detect from earliest event in cached events)
    let (start_date_str, source) = if let Some(ref manual) = pref.semester_start_date {
        (Some(manual.clone()), "manual")
    } else if let Some(ref cal_id) = detected_cal_id {
        // Find earliest event from that calendar in cache
        let mut earliest: Option<String> = None;
        if let Some(cached) = get_cached_events() {
            if let Some(events) = cached.get("events").and_then(|v| v.as_array()) {
                for ev in events {
                    if ev.get("calendarId").and_then(|v| v.as_str()) == Some(cal_id) {
                        if let Some(st) = ev.get("startFormatted").and_then(|v| v.as_str()) {
                            let date_part = st.chars().take(10).collect::<String>();
                            if earliest.is_none() || Some(&date_part) < earliest.as_ref() {
                                earliest = Some(date_part);
                            }
                        }
                    }
                }
            }
        }
        if earliest.is_some() {
            (earliest, "auto")
        } else {
            (None, "none")
        }
    } else {
        (None, "none")
    };

    // 3. Compute week number & schedule
    let mut week_number: Option<u32> = None;
    let mut schedule: Vec<Value> = Vec::new();
    let today = Local::now().date_naive();

    if let Some(ref s_str) = start_date_str {
        if let Ok(start_date) = NaiveDate::parse_from_str(s_str, "%Y-%m-%d") {
            let diff_days = (today - start_date).num_days();
            if diff_days < 0 {
                week_number = Some(0);
            } else {
                week_number = Some((diff_days / 7) as u32 + 1);
            }

            for i in 0..total_weeks {
                let w_start = start_date + chrono::Duration::days((i * 7) as i64);
                let w_end = w_start + chrono::Duration::days(6);
                let is_past = today > w_end;
                let is_current = week_number == Some(i + 1);

                schedule.push(json!({
                    "weekNum": i + 1,
                    "startDate": w_start.to_string(),
                    "endDate": w_end.to_string(),
                    "startDateStr": w_start.to_string(),
                    "endDateStr": w_end.to_string(),
                    "isCurrent": is_current,
                    "isPast": is_past
                }));
            }
        }
    }

    json!({
        "detected": {
            "calendarId": detected_cal_id,
            "calendarName": detected_cal_name,
            "semesterNumber": detected_semester,
            "academicYear": detected_year
        },
        "startDateStr": start_date_str,
        "startDateSource": source,
        "weekNumber": week_number,
        "totalWeeks": total_weeks,
        "schedule": schedule
    })
}

#[tauri::command]
pub fn academic_save_semester_start(date_str: Option<String>) -> Result<Value, String> {
    let mut pref = load_preferences();
    pref.semester_start_date = date_str.clone();
    save_preferences(&pref);
    Ok(json!({ "success": true, "semesterStartDate": date_str }))
}

#[tauri::command]
pub fn academic_save_semester_total_weeks(weeks: Option<u32>) -> Result<Value, String> {
    let mut pref = load_preferences();
    pref.semester_total_weeks = weeks;
    save_preferences(&pref);
    Ok(json!({ "success": true, "semesterTotalWeeks": weeks }))
}
