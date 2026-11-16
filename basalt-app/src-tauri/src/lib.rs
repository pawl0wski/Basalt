use std::path::{Path, PathBuf};
use tauri_plugin_fs::FsExt;

/// Reject any path that is not inside the runtime workspace fs scope before
/// handing it to the trash. The scope is the second authorization layer after
/// `WorkspacePath`; the command never trusts the frontend.
fn ensure_within_scope<F>(paths: &[PathBuf], is_allowed: F) -> Result<(), String>
where
    F: Fn(&Path) -> bool,
{
    for path in paths {
        if !is_allowed(path) {
            return Err(format!(
                "The path is outside the workspace: {}",
                path.display()
            ));
        }
    }
    Ok(())
}

/// Move the given workspace files to the operating system trash.
///
/// There is no official Tauri plugin for the trash (plugin-fs has `remove`
/// only, which deletes permanently), so this is the one narrow custom command
/// the E01-S04 spec (C-1) allows. It validates every path against the runtime
/// workspace fs scope and never falls back to a permanent delete.
#[tauri::command]
fn move_to_trash(app: tauri::AppHandle, paths: Vec<PathBuf>) -> Result<(), String> {
    let scope = app.fs_scope();
    ensure_within_scope(&paths, |path| scope.is_allowed(path))?;
    for path in &paths {
        trash::delete(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![move_to_trash])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_paths_inside_the_scope() {
        let paths = vec![PathBuf::from("/ws/a.md"), PathBuf::from("/ws/d/b.md")];

        let result = ensure_within_scope(&paths, |path| path.starts_with("/ws"));

        assert!(result.is_ok());
    }

    #[test]
    fn rejects_a_path_outside_the_scope() {
        let paths = vec![PathBuf::from("/ws/a.md"), PathBuf::from("/etc/passwd")];

        let result = ensure_within_scope(&paths, |path| path.starts_with("/ws"));

        assert!(result.is_err());
    }

    #[test]
    fn accepts_an_empty_list() {
        let paths: Vec<PathBuf> = Vec::new();

        assert!(ensure_within_scope(&paths, |_| false).is_ok());
    }
}
