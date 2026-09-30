use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager,
};

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_item = MenuItem::with_id(app, "toggle", "Tampilkan / Sembunyikan", true, None::<&str>)?;
    let refresh_item = MenuItem::with_id(app, "refresh", "Perbarui Kalender", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Keluar", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&toggle_item, &refresh_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Google Calendar Widget")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    let is_minimized = window.is_minimized().unwrap_or(false);
                    if is_visible && !is_minimized {
                        let _ = window.hide();
                    } else {
                        if is_minimized {
                            let _ = window.unminimize();
                        }
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => {
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    let is_minimized = window.is_minimized().unwrap_or(false);
                    if is_visible && !is_minimized {
                        let _ = window.hide();
                    } else {
                        if is_minimized {
                            let _ = window.unminimize();
                        }
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "refresh" => {
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    let updated = crate::commands::calendar::calendar_refresh_events().await;
                    let _ = app_handle.emit("calendar:events-updated", updated);
                });
            }
            "quit" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.destroy();
                }
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
