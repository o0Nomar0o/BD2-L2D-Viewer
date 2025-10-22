use tauri::{Manager, Emitter};
use tauri::menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem};

pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let app_name = app
        .config()
        .product_name
        .clone()
        .unwrap_or_else(|| "App".into());

      // macOS App menu with About + Quit (Cmd+Q)
      let app_menu = SubmenuBuilder::new(app, &app_name)
        .text("app_about", "About")
        .item(&PredefinedMenuItem::quit(app, None)?) // Quit works
        .build()?;

      // File menu with Open File
      let file_menu = SubmenuBuilder::new(app, "File")
        .text("file_open", "Open File") // add the Open File action
        .build()?;

      // Combine menus
      let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &file_menu])
        .build()?;

      app.set_menu(menu)?;
      Ok(())
    })
    .on_menu_event(|app, event| {
      match event.id().as_ref() {
        "file_open" => {
          // Get the main window and emit an event
          if let Some(win) = app.get_webview_window("main") {
            let _ = win.emit("menu://file-open", ()); // frontend can listen for this
          }
        }
        // "quit" handled automatically by PredefinedMenuItem::quit
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
