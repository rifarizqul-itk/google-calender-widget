use std::sync::OnceLock;
use std::time::Duration;

static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

/// Returns a shared, pooled `reqwest::Client` instance.
/// Reusing this client avoids creating new TLS sessions, socket descriptors,
/// and connection pools on every API call, significantly reducing memory and CPU overhead.
pub fn get_client() -> &'static reqwest::Client {
    HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .pool_idle_timeout(Duration::from_secs(90))
            .pool_max_idle_per_host(5)
            .build()
            .expect("Failed to create shared HTTP client")
    })
}
