use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;
use crate::paths;

#[tauri::command]
pub fn system_open_external(_app: AppHandle, url: String) -> Result<(), String> {
    if url.starts_with("http://") || url.starts_with("https://") {
        let _ = tauri_plugin_opener::open_url(&url, None::<&str>);
        Ok(())
    } else {
        Err("Invalid URL protocol".into())
    }
}

#[tauri::command]
pub fn system_open_logs() -> Result<(), String> {
    let p = paths::get_logs_dir();
    let _ = open::that_in_background(p);
    Ok(())
}

#[tauri::command]
pub fn system_open_credentials_folder() -> Result<(), String> {
    let p = paths::get_app_dir();
    let _ = open::that_in_background(p);
    Ok(())
}

#[tauri::command]
pub fn system_get_auto_launch(app: AppHandle) -> Result<bool, String> {
    match app.autolaunch().is_enabled() {
        Ok(enabled) => Ok(enabled),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub fn system_set_auto_launch(app: AppHandle, enable: bool) -> Result<bool, String> {
    let autolaunch = app.autolaunch();
    if enable {
        let _ = autolaunch.enable();
    } else {
        let _ = autolaunch.disable();
    }
    Ok(enable)
}
