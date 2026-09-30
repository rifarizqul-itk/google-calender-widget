use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use crate::paths;
use crate::commands::http_client::get_client;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct GoogleCredentials {
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct GoogleTokens {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub scope: Option<String>,
    pub token_type: Option<String>,
    pub expiry_date: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthStatus {
    pub authenticated: bool,
    pub has_credentials: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthLoginResult {
    pub success: bool,
    pub error: Option<String>,
}

pub fn load_client_credentials() -> Result<GoogleCredentials, String> {
    let path = paths::get_credentials_path()
        .ok_or_else(|| "File client_secret.json belum ditemukan. Silakan letakkan file OAuth Client ID dari Google Cloud Console ke folder project atau AppData.".to_string())?;

    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Gagal membaca client_secret.json: {}", e))?;

    let parsed: serde_json::Value = serde_json::from_str(&raw)
        .map_err(|e| format!("Format client_secret.json tidak valid: {}", e))?;

    let creds_obj = parsed.get("installed")
        .or_else(|| parsed.get("web"))
        .ok_or_else(|| "Format client_secret.json tidak valid (wajib memiliki objek installed atau web).".to_string())?;

    let client_id = creds_obj.get("client_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "client_id tidak ditemukan di client_secret.json".to_string())?
        .to_string();

    let client_secret = creds_obj.get("client_secret")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "client_secret tidak ditemukan di client_secret.json".to_string())?
        .to_string();

    Ok(GoogleCredentials {
        client_id,
        client_secret,
    })
}

pub fn load_tokens() -> Option<GoogleTokens> {
    let path = paths::get_tokens_path();
    if !path.exists() {
        return None;
    }
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str::<GoogleTokens>(&raw).ok()
}

pub fn save_tokens(tokens: &GoogleTokens) -> Result<(), String> {
    let path = paths::get_tokens_path();
    let raw = serde_json::to_string_pretty(tokens).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn get_valid_access_token() -> Result<String, String> {
    let mut tokens = load_tokens()
        .ok_or_else(|| "Belum login. Silakan login ke Google Calendar terlebih dahulu.".to_string())?;

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let is_expired = match tokens.expiry_date {
        Some(exp) => now_ms + 60_000 >= exp, // Expired or expiring within 60s
        None => true,
    };

    if !is_expired {
        if let Some(tok) = tokens.access_token {
            return Ok(tok);
        }
    }

    // Refresh token
    let refresh_token = tokens.refresh_token.clone()
        .ok_or_else(|| "Refresh token tidak tersedia. Silakan login ulang.".to_string())?;

    let creds = load_client_credentials()?;
    let client = get_client();

    let params = [
        ("client_id", creds.client_id.as_str()),
        ("client_secret", creds.client_secret.as_str()),
        ("refresh_token", refresh_token.as_str()),
        ("grant_type", "refresh_token"),
    ];

    let res = client.post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Gagal menghubungi server Google: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gagal merefresh token: {}", err_text));
    }

    #[derive(Deserialize)]
    struct TokenRefreshResponse {
        access_token: String,
        expires_in: u64,
        scope: Option<String>,
        token_type: Option<String>,
    }

    let refresh_res = res.json::<TokenRefreshResponse>()
        .await
        .map_err(|e| format!("Gagal mem-parsing token refresh: {}", e))?;

    tokens.access_token = Some(refresh_res.access_token.clone());
    tokens.expiry_date = Some(now_ms + (refresh_res.expires_in * 1000));
    if refresh_res.scope.is_some() {
        tokens.scope = refresh_res.scope;
    }
    if refresh_res.token_type.is_some() {
        tokens.token_type = refresh_res.token_type;
    }

    let _ = save_tokens(&tokens);
    Ok(refresh_res.access_token)
}

#[tauri::command]
pub fn auth_status() -> AuthStatus {
    let has_creds = paths::get_credentials_path().is_some();
    let is_auth = match load_tokens() {
        Some(t) => t.access_token.is_some() || t.refresh_token.is_some(),
        None => false,
    };
    AuthStatus {
        authenticated: is_auth,
        has_credentials: has_creds,
    }
}

#[tauri::command]
pub async fn auth_logout() -> Result<bool, String> {
    let token_path = paths::get_tokens_path();
    if token_path.exists() {
        let _ = fs::remove_file(token_path);
    }
    let cache_path = paths::get_calendar_cache_path();
    if cache_path.exists() {
        let _ = fs::remove_file(cache_path);
    }
    Ok(true)
}

#[tauri::command]
pub async fn auth_login() -> Result<AuthLoginResult, String> {
    let creds = match load_client_credentials() {
        Ok(c) => c,
        Err(e) => return Ok(AuthLoginResult { success: false, error: Some(e) }),
    };

    let server = match tiny_http::Server::http("127.0.0.1:54321") {
        Ok(s) => s,
        Err(e) => return Ok(AuthLoginResult {
            success: false,
            error: Some(format!("Gagal membuka port login 54321: {}", e)),
        }),
    };

    let scopes = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
    let encoded_scopes = urlencoding::encode(scopes);
    let redirect_uri = "http://127.0.0.1:54321";
    let encoded_redirect = urlencoding::encode(redirect_uri);

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&response_type=code&client_id={}&redirect_uri={}&scope={}",
        creds.client_id, encoded_redirect, encoded_scopes
    );

    // Open URL in default browser
    let _ = tauri_plugin_opener::open_url(&auth_url, None::<&str>);

    // Listen for code with a timeout in a blocking thread
    let creds_clone = creds.clone();
    let auth_result = tokio::task::spawn_blocking(move || -> Result<String, String> {
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(300);

        while std::time::Instant::now() < deadline {
            if let Ok(Some(request)) = server.recv_timeout(std::time::Duration::from_millis(500)) {
                let url_str = request.url().to_string();
                
                if let Ok(parsed_url) = url::Url::parse(&format!("http://127.0.0.1:54321{}", url_str)) {
                    let code_opt = parsed_url.query_pairs().find(|(k, _)| k == "code").map(|(_, v)| v.to_string());
                    
                    if let Some(code) = code_opt {
                        let response_html = "<!DOCTYPE html><html><body style='font-family:sans-serif;text-align:center;padding:40px;background:#111;color:#eee;'><h2 style='color:#4ade80;'>Login Berhasil!</h2><p>Widget Google Calendar telah terhubung. Kamu dapat menutup tab ini sekarang.</p></body></html>";
                        let response = tiny_http::Response::from_string(response_html)
                            .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap());
                        let _ = request.respond(response);
                        return Ok(code);
                    }
                }

                let response = tiny_http::Response::from_string("Waiting for Google authorization...");
                let _ = request.respond(response);
            }
        }

        Err("Waktu login Google habis (batas waktu 5 menit).".into())
    }).await.map_err(|e| e.to_string())?;

    let code = match auth_result {
        Ok(c) => c,
        Err(e) => return Ok(AuthLoginResult { success: false, error: Some(e) }),
    };

    // Trade code for token
    let client = get_client();
    let params = [
        ("code", code.as_str()),
        ("client_id", creds_clone.client_id.as_str()),
        ("client_secret", creds_clone.client_secret.as_str()),
        ("redirect_uri", redirect_uri),
        ("grant_type", "authorization_code"),
    ];

    let res = match client.post("https://oauth2.googleapis.com/token").form(&params).send().await {
        Ok(r) => r,
        Err(e) => return Ok(AuthLoginResult { success: false, error: Some(format!("Gagal menghubungi OAuth endpoint: {}", e)) }),
    };

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Ok(AuthLoginResult { success: false, error: Some(format!("Gagal mendapatkan token: {}", err_text)) });
    }

    #[derive(Deserialize)]
    struct TokenExchangeResponse {
        access_token: String,
        refresh_token: Option<String>,
        expires_in: u64,
        scope: Option<String>,
        token_type: Option<String>,
    }

    let token_data: TokenExchangeResponse = match res.json().await {
        Ok(t) => t,
        Err(e) => return Ok(AuthLoginResult { success: false, error: Some(format!("Gagal mem-parsing token: {}", e)) }),
    };

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let mut saved_tokens = load_tokens().unwrap_or_default();
    saved_tokens.access_token = Some(token_data.access_token);
    if token_data.refresh_token.is_some() {
        saved_tokens.refresh_token = token_data.refresh_token;
    }
    saved_tokens.expiry_date = Some(now_ms + (token_data.expires_in * 1000));
    saved_tokens.scope = token_data.scope;
    saved_tokens.token_type = token_data.token_type;

    if let Err(e) = save_tokens(&saved_tokens) {
        return Ok(AuthLoginResult { success: false, error: Some(format!("Gagal menyimpan token: {}", e)) });
    }

    Ok(AuthLoginResult { success: true, error: None })
}
