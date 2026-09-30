// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(windows)]
fn check_single_instance() -> Option<windows::Win32::Foundation::HANDLE> {
    use windows::core::w;
    use windows::Win32::Foundation::{CloseHandle, GetLastError, ERROR_ALREADY_EXISTS};
    use windows::Win32::System::Threading::{
        CreateMutexW, GetCurrentProcessId, OpenProcess, TerminateProcess,
        PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_TERMINATE,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        FindWindowW, SetForegroundWindow, ShowWindow, SW_RESTORE, SW_SHOW,
    };

    unsafe {
        let mutex_name = w!("Global\\io.github.rifarizqul-itk.google-calender-widget");

        // Create probe (without ownership) to check if mutex already exists
        let probe = CreateMutexW(None, false, mutex_name).ok();
        let already_exists = GetLastError() == ERROR_ALREADY_EXISTS;

        if already_exists {
            // Another instance may be running — check if it has a visible window
            let title = w!("Google Calendar Widget");
            let has_window = FindWindowW(None, title)
                .ok()
                .map(|h| !h.is_invalid())
                .unwrap_or(false);

            if has_window {
                // Real instance with window — focus it and exit
                if let Ok(hwnd) = FindWindowW(None, title) {
                    let _ = ShowWindow(hwnd, SW_RESTORE);
                    let _ = ShowWindow(hwnd, SW_SHOW);
                    let _ = SetForegroundWindow(hwnd);
                }
                if let Some(h) = probe {
                    let _ = CloseHandle(h);
                }
                std::process::exit(0);
            } else {
                // Zombie process: mutex held but no window — kill it and continue
                if let Some(h) = probe {
                    let _ = CloseHandle(h);
                }

                use windows::Win32::System::Diagnostics::ToolHelp::{
                    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW,
                    PROCESSENTRY32W, TH32CS_SNAPPROCESS,
                };

                let current_pid = GetCurrentProcessId();
                if let Ok(snap) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
                    let mut entry = PROCESSENTRY32W {
                        dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
                        ..Default::default()
                    };
                    if Process32FirstW(snap, &mut entry).is_ok() {
                        loop {
                            let exe_len = entry
                                .szExeFile
                                .iter()
                                .position(|&c| c == 0)
                                .unwrap_or(entry.szExeFile.len());
                            let exe_name = String::from_utf16_lossy(&entry.szExeFile[..exe_len]);
                            if exe_name.eq_ignore_ascii_case("app.exe")
                                && entry.th32ProcessID != current_pid
                            {
                                if let Ok(proc_handle) = OpenProcess(
                                    PROCESS_TERMINATE | PROCESS_QUERY_LIMITED_INFORMATION,
                                    false,
                                    entry.th32ProcessID,
                                ) {
                                    let _ = TerminateProcess(proc_handle, 1);
                                    let _ = CloseHandle(proc_handle);
                                }
                            }
                            if Process32NextW(snap, &mut entry).is_err() {
                                break;
                            }
                        }
                    }
                    let _ = CloseHandle(snap);
                }

                // Wait for OS to release the mutex after the kill
                std::thread::sleep(std::time::Duration::from_millis(500));

                // Claim the mutex now that zombie is gone
                return CreateMutexW(None, true, mutex_name).ok();
            }
        }

        // First instance — release probe and claim with ownership
        if let Some(h) = probe {
            let _ = CloseHandle(h);
        }
        CreateMutexW(None, true, mutex_name).ok()
    }
}

fn main() {
    #[cfg(windows)]
    let _mutex = check_single_instance();

    app_lib::run();
}
