use std::path::PathBuf;
use std::fs;

pub fn get_app_dir() -> PathBuf {
    if let Some(app_data) = dirs::data_dir() {
        let p = app_data.join("google-calender-widget");
        let _ = fs::create_dir_all(&p);
        return p;
    }
    PathBuf::from(".")
}

pub fn get_credentials_path() -> Option<PathBuf> {
    // Check current working directory first
    if let Ok(entries) = fs::read_dir(".") {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("client_secret") && name.ends_with(".json") {
                return Some(entry.path());
            }
        }
    }

    // Check parent directory (when running from src-tauri during dev)
    if let Ok(entries) = fs::read_dir("..") {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("client_secret") && name.ends_with(".json") {
                return Some(entry.path());
            }
        }
    }

    // Check AppData directory
    let app_dir = get_app_dir();
    if let Ok(entries) = fs::read_dir(&app_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("client_secret") && name.ends_with(".json") {
                return Some(entry.path());
            }
        }
    }

    None
}

pub fn get_tokens_path() -> PathBuf {
    get_app_dir().join("google_tokens.json")
}

pub fn get_calendar_cache_path() -> PathBuf {
    get_app_dir().join("calendar_cache.json")
}

pub fn get_selected_calendars_path() -> PathBuf {
    get_app_dir().join("selected_calendars.json")
}

pub fn get_preferences_path() -> PathBuf {
    get_app_dir().join("preferences.json")
}

pub fn get_logs_dir() -> PathBuf {
    let p = get_app_dir().join("logs");
    let _ = fs::create_dir_all(&p);
    p
}
