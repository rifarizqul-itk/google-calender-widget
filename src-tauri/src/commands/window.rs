use tauri::{LogicalPosition, LogicalSize, Size, Position, WebviewWindow};

#[tauri::command]
pub fn window_close(window: WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn window_start_dragging(window: WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn window_minimize(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn window_toggle_pin(window: WebviewWindow) -> Result<bool, String> {
    let current = window.is_always_on_top().unwrap_or(false);
    let next = !current;
    window.set_always_on_top(next).map_err(|e| e.to_string())?;
    Ok(next)
}

#[tauri::command]
pub fn window_is_pinned(window: WebviewWindow) -> Result<bool, String> {
    window.is_always_on_top().map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct ResizePayload {
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub x: Option<f64>,
    pub y: Option<f64>,
}

#[tauri::command]
pub fn window_resize(window: WebviewWindow, payload: ResizePayload) -> Result<(), String> {
    if let (Some(w), Some(h)) = (payload.width, payload.height) {
        let clamped_w = w.clamp(300.0, 1200.0);
        let clamped_h = h.clamp(400.0, 1400.0);
        let _ = window.set_size(Size::Logical(LogicalSize::new(clamped_w, clamped_h)));
    }
    if let (Some(x), Some(y)) = (payload.x, payload.y) {
        let _ = window.set_position(Position::Logical(LogicalPosition::new(x, y)));
    }

    // Save to windowState.json
    let state_path = crate::paths::get_app_dir().join("windowState.json");
    if let (Ok(pos), Ok(size)) = (window.outer_position(), window.inner_size()) {
        if let Ok(scale) = window.scale_factor() {
            let logical_pos = pos.to_logical::<f64>(scale);
            let logical_size = size.to_logical::<f64>(scale);
            let data = serde_json::json!({
                "windowState.main": {
                    "x": logical_pos.x,
                    "y": logical_pos.y,
                    "width": logical_size.width,
                    "height": logical_size.height,
                    "isMaximized": false
                }
            });
            if let Ok(raw) = serde_json::to_string_pretty(&data) {
                let _ = std::fs::write(state_path, raw);
            }
        }
    }

    Ok(())
}
