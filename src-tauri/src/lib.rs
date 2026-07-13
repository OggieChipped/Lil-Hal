use serde_json::Value;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn is_developer_machine() -> bool {
    std::env::var("USERNAME")
        .map(|username| username.eq_ignore_ascii_case("stell"))
        .unwrap_or(false)
}

#[tauri::command]
async fn ollama_chat(payload: Value) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://127.0.0.1:11434/api/chat")
        .json(&payload)
        .send()
        .await
        .map_err(|error| format!("I could not reach Ollama: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("I could not read Ollama's reply: {error}"))?;

    if !status.is_success() {
        return Err(format!("Ollama answered with {status}: {body}"));
    }

    serde_json::from_str(&body).map_err(|error| format!("Ollama returned invalid JSON: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            is_developer_machine,
            ollama_chat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
