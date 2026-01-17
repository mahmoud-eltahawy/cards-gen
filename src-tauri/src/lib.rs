use calamine::{Reader, Xlsx, XlsxError, open_workbook};
use serde::{Deserialize, Serialize};
use specta::Type;
use specta_typescript::Typescript;
use std::path::PathBuf;
use tauri_specta::{Builder, collect_commands};

#[derive(Debug, Serialize, Deserialize, Clone, Type)]
struct PathExisting {
    exists: Option<PathBuf>,
    parent_exists: Option<PathBuf>,
}

#[tauri::command]
#[specta::specta]
fn path_exists(path: PathBuf) -> PathExisting {
    if path.exists() {
        PathExisting {
            exists: Some(path),
            parent_exists: None,
        }
    } else if path.parent().is_some_and(|x| x.exists()) {
        PathExisting {
            exists: None,
            parent_exists: Some(path),
        }
    } else {
        PathExisting {
            exists: None,
            parent_exists: None,
        }
    }
}

#[tauri::command]
#[specta::specta]
async fn path_autocomplete(path: PathExisting) -> Result<Vec<PathBuf>, String> {
    match path {
        PathExisting {
            exists: Some(path),
            parent_exists: None,
        } => {
            let mut enteries = tokio::fs::read_dir(&path)
                .await
                .map_err(|x| x.to_string())?;
            let mut paths = Vec::new();
            while let Some(entry) = enteries.next_entry().await.map_err(|x| x.to_string())? {
                paths.push(entry.path());
            }
            Ok(paths)
        }
        PathExisting {
            exists: None,
            parent_exists: Some(path),
        } => {
            let parent = path.parent().unwrap();
            let name = path.file_name().unwrap().to_str().unwrap().to_lowercase();
            let mut enteries = tokio::fs::read_dir(&parent)
                .await
                .map_err(|x| x.to_string())?;
            let mut paths = Vec::new();
            while let Some(entry) = enteries.next_entry().await.map_err(|x| x.to_string())? {
                let epath = entry.path();
                if epath
                    .file_name()
                    .and_then(|x| x.to_str())
                    .is_some_and(|x| x.to_lowercase().starts_with(&name))
                {
                    paths.push(epath);
                }
            }
            Ok(paths)
        }
        _ => Ok(Vec::new()),
    }
}

#[tauri::command]
#[specta::specta]
fn sheets_names(path: Option<PathBuf>) -> Result<Vec<String>, String> {
    let Some(path) = path else {
        return Ok(Vec::new());
    };
    let workbook: Xlsx<_> = open_workbook(&path).map_err(|x: XlsxError| x.to_string())?;
    Ok(workbook.sheet_names())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        path_autocomplete,
        path_exists,
        sheets_names
    ]);

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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(builder.invoke_handler())
        .invoke_handler(builder.invoke_handler())
        // .setup(move |app| {
        //     builder.mount_events(app);
        //     Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
