mod paths;
mod commands;
mod tray;

use tauri::{Emitter, Manager};
use commands::{
    window::*,
    system::*,
    auth::*,
    calendar::*,
    academic::*,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|app| {
            // Setup system tray
            tray::setup_tray(app)?;

            // Restore window position & size, and ensure it is shown
            if let Some(window) = app.get_webview_window("main") {
                let state_path = paths::get_app_dir().join("windowState.json");
                let mut restored = false;
                if let Ok(raw) = std::fs::read_to_string(&state_path) {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&raw) {
                        if let Some(main_state) = json.get("windowState.main") {
                            let x = main_state.get("x").and_then(|v| v.as_f64());
                            let y = main_state.get("y").and_then(|v| v.as_f64());
                            let w = main_state.get("width").and_then(|v| v.as_f64()).unwrap_or(360.0);
                            let h = main_state.get("height").and_then(|v| v.as_f64()).unwrap_or(580.0);

                            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(
                                w.clamp(300.0, 1200.0),
                                h.clamp(400.0, 1400.0),
                            )));

                            if let (Some(x), Some(y)) = (x, y) {
                                if x >= -50.0 && y >= -50.0 {
                                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
                                    restored = true;
                                }
                            }
                        }
                    }
                }

                if !restored {
                    let _ = window.center();
                }

                let _ = window.show();
                let _ = window.set_focus();
            }

            // Background auto-sync loop (every 10 minutes)
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(600));
                loop {
                    interval.tick().await;
                    // Check if authenticated
                    let status = auth_status();
                    if status.authenticated {
                        let updated = calendar_refresh_events().await;
                        let _ = app_handle.emit("calendar:events-updated", updated);

                        // Periodically request WebView2 to trim inactive caches
                        #[cfg(windows)]
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.with_webview(|webview| {
                                use webview2_com::Microsoft::Web::WebView2::Win32::{
                                    COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL, ICoreWebView2_19,
                                };
                                use windows::core::Interface;
                                unsafe {
                                    let controller = webview.controller();
                                    if let Ok(core) = controller.CoreWebView2() {
                                        if let Ok(v19) = core.cast::<ICoreWebView2_19>() {
                                            let _ = v19.SetMemoryUsageTargetLevel(COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL(1));
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            window_close,
            window_start_dragging,
            window_minimize,
            window_toggle_pin,
            window_is_pinned,
            window_resize,
            system_open_external,
            system_open_logs,
            system_open_credentials_folder,
            system_get_auto_launch,
            system_set_auto_launch,
            auth_status,
            auth_login,
            auth_logout,
            calendar_get_events,
            calendar_refresh_events,
            calendar_get_calendar_list,
            calendar_set_selected_calendars,
            calendar_create_event,
            calendar_update_event,
            calendar_delete_event,
            calendar_get_events_for_range,
            academic_get_week_info,
            academic_save_semester_start,
            academic_save_semester_total_weeks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
