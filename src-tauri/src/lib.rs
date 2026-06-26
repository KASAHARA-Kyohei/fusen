use std::{fs, path::Path};

mod input_method;

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let path = validate_markdown_path(&path)?;
    fs::read_to_string(path).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    let path = validate_markdown_path(&path)?;
    fs::write(path, content).map_err(|error| error.to_string())
}

#[tauri::command]
fn switch_to_alphanumeric_input() -> Result<(), String> {
    input_method::switch_to_alphanumeric_input()
}

fn validate_markdown_path(path: &str) -> Result<&Path, String> {
    let path = Path::new(path);
    if !is_markdown_file(path) {
        return Err("Only .md files can be opened".to_string());
    }
    Ok(path)
}

fn is_markdown_file(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("md"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            switch_to_alphanumeric_input
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
