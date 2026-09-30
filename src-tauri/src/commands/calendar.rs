use std::fs;
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::paths;
use crate::commands::auth::get_valid_access_token;
use crate::commands::http_client::get_client;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CalendarItem {
    pub id: String,
    pub summary: String,
    pub background_color: String,
    pub foreground_color: String,
    pub primary: bool,
    pub selected: bool,
    pub access_role: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarListResponse {
    pub authenticated: bool,
    pub calendars: Vec<CalendarItem>,
    pub selected_ids: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GetEventsOptions {
    pub force: Option<bool>,
    pub max_results: Option<u32>,
    pub days_ahead: Option<i64>,
    pub days_past: Option<i64>,
    pub time_min: Option<String>,
    pub time_max: Option<String>,
}

pub fn get_saved_selected_calendar_ids() -> Option<Vec<String>> {
    let p = paths::get_selected_calendars_path();
    if p.exists() {
        if let Ok(raw) = fs::read_to_string(p) {
            if let Ok(ids) = serde_json::from_str::<Vec<String>>(&raw) {
                return Some(ids);
            }
        }
    }
    None
}

pub fn save_selected_calendar_ids(ids: &[String]) {
    let p = paths::get_selected_calendars_path();
    if let Ok(raw) = serde_json::to_string_pretty(ids) {
        let _ = fs::write(p, raw);
    }
}

pub fn get_cached_events() -> Option<Value> {
    let p = paths::get_calendar_cache_path();
    if p.exists() {
        if let Ok(raw) = fs::read_to_string(p) {
            return serde_json::from_str(&raw).ok();
        }
    }
    None
}

pub fn save_cached_events(val: &Value) {
    let p = paths::get_calendar_cache_path();
    if let Ok(raw) = serde_json::to_string_pretty(val) {
        let _ = fs::write(p, raw);
    }
}

pub async fn fetch_calendar_list() -> Result<(Vec<CalendarItem>, Vec<String>), String> {
    let token = get_valid_access_token().await?;
    let client = get_client();

    let res = client.get("https://www.googleapis.com/calendar/v3/users/me/calendarList")
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Google API error: {}", res.status()));
    }

    let json_val: Value = res.json().await.map_err(|e| e.to_string())?;
    let items = json_val.get("items").and_then(|v| v.as_array()).cloned().unwrap_or_default();

    let mut calendars = Vec::new();
    for item in items {
        let id = item.get("id").and_then(|v| v.as_str()).unwrap_or_default().to_string();
        let summary = item.get("summary").and_then(|v| v.as_str()).unwrap_or("Kalender").to_string();
        let bg = item.get("backgroundColor").and_then(|v| v.as_str()).unwrap_or("#38bdf8").to_string();
        let fg = item.get("foregroundColor").and_then(|v| v.as_str()).unwrap_or("#ffffff").to_string();
        let primary = item.get("primary").and_then(|v| v.as_bool()).unwrap_or(false);
        let hidden = item.get("hidden").and_then(|v| v.as_bool()).unwrap_or(false);
        let selected = item.get("selected").and_then(|v| v.as_bool()).unwrap_or(true) && !hidden;
        let access_role = item.get("accessRole").and_then(|v| v.as_str()).unwrap_or("reader").to_string();

        calendars.push(CalendarItem {
            id,
            summary,
            background_color: bg,
            foreground_color: fg,
            primary,
            selected,
            access_role,
        });
    }

    let saved = get_saved_selected_calendar_ids();
    let selected_ids = match saved {
        Some(ids) => ids,
        None => calendars.iter().filter(|c| c.selected).map(|c| c.id.clone()).collect(),
    };

    Ok((calendars, selected_ids))
}

#[tauri::command]
pub async fn calendar_get_calendar_list() -> CalendarListResponse {
    match fetch_calendar_list().await {
        Ok((calendars, selected_ids)) => CalendarListResponse {
            authenticated: true,
            calendars,
            selected_ids,
            error: None,
        },
        Err(e) => {
            if let Some(cached) = get_cached_events() {
                let cals = cached.get("calendars")
                    .and_then(|v| serde_json::from_value::<Vec<CalendarItem>>(v.clone()).ok())
                    .unwrap_or_default();
                let sel = cached.get("selectedCalendarIds")
                    .and_then(|v| serde_json::from_value::<Vec<String>>(v.clone()).ok())
                    .or_else(get_saved_selected_calendar_ids)
                    .unwrap_or_default();
                if !cals.is_empty() {
                    return CalendarListResponse {
                        authenticated: true,
                        calendars: cals,
                        selected_ids: sel,
                        error: Some(format!("Offline: {}", e)),
                    };
                }
            }
            CalendarListResponse {
                authenticated: false,
                calendars: vec![],
                selected_ids: vec![],
                error: Some(e),
            }
        }
    }
}

#[tauri::command]
pub async fn calendar_set_selected_calendars(ids: Vec<String>) -> Value {
    save_selected_calendar_ids(&ids);
    calendar_refresh_events().await
}

#[tauri::command]
pub async fn calendar_get_events(options: Option<GetEventsOptions>) -> Value {
    let opts = options.unwrap_or_default();
    
    // Check if we should return cached data
    if opts.force != Some(true) {
        if let Some(mut cached) = get_cached_events() {
            if let Some(obj) = cached.as_object_mut() {
                obj.insert("fromCache".into(), json!(true));
                obj.insert("authenticated".into(), json!(true));
            }
            return cached;
        }
    }

    calendar_refresh_events().await
}

#[tauri::command]
pub async fn calendar_refresh_events() -> Value {
    let token = match get_valid_access_token().await {
        Ok(t) => t,
        Err(err) => {
            if let Some(mut cached) = get_cached_events() {
                if let Some(obj) = cached.as_object_mut() {
                    obj.insert("authenticated".into(), json!(true));
                    obj.insert("fromCache".into(), json!(true));
                    obj.insert("offline".into(), json!(true));
                    obj.insert("error".into(), json!(err));
                }
                return cached;
            }
            return json!({
                "authenticated": false,
                "events": [],
                "calendars": [],
                "selectedCalendarIds": [],
                "error": err
            });
        }
    };

    let (all_calendars, selected_ids) = match fetch_calendar_list().await {
        Ok(res) => res,
        Err(_) => {
            if let Some(cached) = get_cached_events() {
                let cals = cached.get("calendars")
                    .and_then(|v| serde_json::from_value::<Vec<CalendarItem>>(v.clone()).ok())
                    .unwrap_or_default();
                let sel = cached.get("selectedCalendarIds")
                    .and_then(|v| serde_json::from_value::<Vec<String>>(v.clone()).ok())
                    .or_else(get_saved_selected_calendar_ids)
                    .unwrap_or_else(|| vec!["primary".into()]);
                if !cals.is_empty() {
                    (cals, sel)
                } else {
                    (
                        vec![CalendarItem {
                            id: "primary".into(),
                            summary: "Primary".into(),
                            background_color: "#38bdf8".into(),
                            foreground_color: "#ffffff".into(),
                            primary: true,
                            selected: true,
                            access_role: "owner".into(),
                        }],
                        vec!["primary".into()],
                    )
                }
            } else {
                (
                    vec![CalendarItem {
                        id: "primary".into(),
                        summary: "Primary".into(),
                        background_color: "#38bdf8".into(),
                        foreground_color: "#ffffff".into(),
                        primary: true,
                        selected: true,
                        access_role: "owner".into(),
                    }],
                    vec!["primary".into()],
                )
            }
        }
    };

    let active_calendars: Vec<CalendarItem> = all_calendars
        .iter()
        .filter(|c| selected_ids.contains(&c.id))
        .cloned()
        .collect();

    let now: DateTime<Utc> = Utc::now();
    let time_min = (now - Duration::days(60)).to_rfc3339();
    let time_max = (now + Duration::days(90)).to_rfc3339();

    let client = get_client();
    let mut all_events: Vec<Value> = Vec::new();
    let mut any_network_success = false;
    let mut any_network_attempted = false;

    for cal in active_calendars {
        let cal_id_encoded = urlencoding::encode(&cal.id);
        let url = format!(
            "https://www.googleapis.com/calendar/v3/calendars/{}/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin={}&timeMax={}",
            cal_id_encoded,
            urlencoding::encode(&time_min),
            urlencoding::encode(&time_max)
        );

        any_network_attempted = true;
        match client.get(&url).bearer_auth(&token).send().await {
            Ok(res) if res.status().is_success() => {
                if let Ok(data) = res.json::<Value>().await {
                    any_network_success = true;
                    if let Some(items) = data.get("items").and_then(|v| v.as_array()) {
                        for item in items {
                            let mut ev = item.clone();
                            if let Some(obj) = ev.as_object_mut() {
                                obj.insert("calendarId".into(), json!(cal.id));
                                obj.insert("calendarName".into(), json!(cal.summary));
                                obj.insert("calendarColor".into(), json!(cal.background_color));

                                // Flatten start & end for easy JS consumption
                                let start_val = obj.get("start")
                                    .and_then(|s| s.get("dateTime").or_else(|| s.get("date")))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or_default()
                                    .to_string();
                                let end_val = obj.get("end")
                                    .and_then(|s| s.get("dateTime").or_else(|| s.get("date")))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or_default()
                                    .to_string();

                                let event_color = if let Some(cid) = obj.get("colorId").and_then(|v| v.as_str()) {
                                    match cid {
                                        "1" => "#7986cb",
                                        "2" => "#33b679",
                                        "3" => "#8e24aa",
                                        "4" => "#e67c73",
                                        "5" => "#f6bf26",
                                        "6" => "#f4511e",
                                        "7" => "#039be5",
                                        "8" => "#616161",
                                        "9" => "#3f51b5",
                                        "10" => "#0b8043",
                                        "11" => "#d50000",
                                        _ => &cal.background_color,
                                    }
                                } else {
                                    &cal.background_color
                                };

                                let is_all_day = !start_val.contains('T') && !start_val.is_empty();

                                obj.insert("start".into(), json!(start_val));
                                obj.insert("end".into(), json!(end_val));
                                obj.insert("startFormatted".into(), json!(start_val));
                                obj.insert("endFormatted".into(), json!(end_val));
                                obj.insert("isAllDay".into(), json!(is_all_day));
                                obj.insert("eventColor".into(), json!(event_color));
                            }
                            all_events.push(ev);
                        }
                    }
                }
            }
            Ok(res) => {
                log::warn!("Google API error for calendar {}: status {}", cal.id, res.status());
            }
            Err(e) => {
                log::warn!("Network request failed for calendar {}: {}", cal.id, e);
            }
        }
    }

    // Fall back to cached events if all network requests failed
    if any_network_attempted && !any_network_success {
        log::warn!("All calendar network requests failed. Falling back to cached events.");
        if let Some(mut cached) = get_cached_events() {
            if let Some(obj) = cached.as_object_mut() {
                obj.insert("authenticated".into(), json!(true));
                obj.insert("fromCache".into(), json!(true));
                obj.insert("offline".into(), json!(true));
                obj.insert("error".into(), json!("Koneksi internet tidak tersedia. Menampilkan jadwal tersimpan."));
            }
            return cached;
        }
    }

    all_events.sort_by(|a, b| {
        let a_start = a.get("start").and_then(|v| v.as_str()).unwrap_or("");
        let b_start = b.get("start").and_then(|v| v.as_str()).unwrap_or("");
        a_start.cmp(b_start)
    });

    let result = json!({
        "authenticated": true,
        "fromCache": false,
        "events": all_events,
        "calendars": all_calendars,
        "selectedCalendarIds": selected_ids,
        "lastUpdated": now.to_rfc3339()
    });

    if any_network_success || !all_events.is_empty() {
        save_cached_events(&result);
    }
    result
}

#[tauri::command]
pub async fn calendar_create_event(data: Value) -> Result<Value, String> {
    let token = get_valid_access_token().await?;
    let calendar_id = data.get("calendarId")
        .and_then(|v| v.as_str())
        .unwrap_or("primary");

    let url = format!(
        "https://www.googleapis.com/calendar/v3/calendars/{}/events",
        urlencoding::encode(calendar_id)
    );

    let client = get_client();
    let res = client.post(&url)
        .bearer_auth(&token)
        .json(&data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err = res.text().await.unwrap_or_default();
        return Err(format!("Gagal membuat event: {}", err));
    }

    let created: Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(created)
}

#[tauri::command]
pub async fn calendar_update_event(data: Value) -> Result<Value, String> {
    let token = get_valid_access_token().await?;
    let event_id = data.get("eventId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "eventId is required".to_string())?;

    let calendar_id = data.get("calendarId")
        .and_then(|v| v.as_str())
        .unwrap_or("primary");

    let url = format!(
        "https://www.googleapis.com/calendar/v3/calendars/{}/events/{}",
        urlencoding::encode(calendar_id),
        urlencoding::encode(event_id)
    );

    let client = get_client();
    let res = client.patch(&url)
        .bearer_auth(&token)
        .json(&data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err = res.text().await.unwrap_or_default();
        return Err(format!("Gagal memperbarui event: {}", err));
    }

    let updated: Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(updated)
}

#[tauri::command]
pub async fn calendar_delete_event(data: Value) -> Result<bool, String> {
    let token = get_valid_access_token().await?;
    let event_id = data.get("eventId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "eventId is required".to_string())?;

    let calendar_id = data.get("calendarId")
        .and_then(|v| v.as_str())
        .unwrap_or("primary");

    let url = format!(
        "https://www.googleapis.com/calendar/v3/calendars/{}/events/{}",
        urlencoding::encode(calendar_id),
        urlencoding::encode(event_id)
    );

    let client = get_client();
    let res = client.delete(&url)
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err = res.text().await.unwrap_or_default();
        return Err(format!("Gagal menghapus event: {}", err));
    }

    Ok(true)
}

#[tauri::command]
pub async fn calendar_get_events_for_range(data: Value) -> Result<Value, String> {
    let time_min = data.get("timeMin").and_then(|v| v.as_str()).map(|s| s.to_string());
    let time_max = data.get("timeMax").and_then(|v| v.as_str()).map(|s| s.to_string());

    let opts = GetEventsOptions {
        force: Some(true),
        time_min,
        time_max,
        ..Default::default()
    };

    Ok(calendar_get_events(Some(opts)).await)
}
