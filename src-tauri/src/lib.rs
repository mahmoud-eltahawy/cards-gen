use serde::{Deserialize, Serialize};
use specta::Type;
use specta_typescript::Typescript;
use tauri::generate_handler;
use tauri_specta::{Builder, collect_commands};

#[derive(Serialize, Type)]
struct GreetReturn {
    inner: String,
}

#[derive(Deserialize, Type)]
struct GreetArgs {
    name: String,
}

#[tauri::command]
#[specta::specta]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
#[specta::specta]
fn other_greet(args: GreetArgs) -> GreetReturn {
    let GreetArgs { name } = args;
    GreetReturn {
        inner: format!("Hello, {}! You've been greeted from Rust!", name),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![greet, other_greet]);

    if !cfg!(target_os = "android") {
        #[cfg(debug_assertions)]
        {
            builder
                .export(
                    Typescript::default()
                        .formatter(specta_typescript::formatter::prettier)
                        .header("/* eslint-disable */"),
                    "../src/tauri_bindings.ts",
                )
                .expect("Failed to export typescript bindings");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(builder.invoke_handler())
        .invoke_handler(generate_handler![greet])
        // .setup(move |app| {
        //     builder.mount_events(app);
        //     Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
