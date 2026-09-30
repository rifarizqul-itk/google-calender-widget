**Read this in other languages:**
[English](README.md) | [Indonesian](README.id-ID.md)

# Google Calendar Desktop Widget

An ambient desktop calendar widget for Windows, macOS, and Linux built on Tauri v2 & Rust. It connects directly to the Google Calendar API v3 to display your daily schedule with real-time countdowns, dual views, offline caching, and desktop integration.

[![GitHub Release](https://img.shields.io/github/v/release/rifarizqul-itk/google-calender-widget?style=flat-square)](https://github.com/rifarizqul-itk/google-calender-widget/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](#tech-stack)
[![Tauri Version](https://img.shields.io/badge/tauri-2.x-brightgreen?style=flat-square)](https://tauri.app)
[![Rust](https://img.shields.io/badge/rust-2021%20edition-orange?style=flat-square)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

---

## Overview

This widget provides an ambient desktop overlay that keeps your schedule visible without needing an open browser tab. It supports both embedded desktop mode (Rainmeter style) and an always-on-top mode, with full background synchronization and offline fallback.

### Key Capabilities

- **Triple View Modes**: Switch seamlessly between a chronological **Agenda** timeline, an interactive **Month Calendar**, and a dedicated **Academic Semester** week tracker.
- **Academic Semester Week Tracker**: Automatically detects active semester calendars (e.g. `SEMESTER 5 - 2026/2027`), calculates current semester weeks (Week 1–16/17), highlights the active week, and displays a glanceable week chip directly in the header banner with manual start date and week count overrides in Settings.
- **Full In-App Event Editing & Instant Modal**: Create or edit event titles, timing, all-day status, locations, and descriptions with 0ms instant modal launch and in-app Google Calendar API v3 updates.
- **Ultra-Low Memory Footprint**: Powered by Tauri v2 and Rust, consuming only ~30–40 MB RAM (an 80%+ drop from Electron) with ~10 MB binary size.
- **Historical Schedule Viewing**: Browse past events seamlessly on the Calendar tab with color indicator dots and subtle hover states without visual clutter.
- **Smart Color & Contrast Engine**: Preserves your Google Calendar badge colors while applying ITU-R BT.709 relative luminance adjustments for crisp contrast across light and dark themes.
- **Auto-Expanding Description Field**: Multi-line editor that auto-expands with content up to 180px with sleek custom scrollbars and automatic HTML-to-plain text conversion.
- **Intelligent URL & Name Truncation**: Prevents wide calendar titles and webcal feed URLs from breaking native dropdown bounds.
- **Multilingual Support (EN / ID)**: Instant language switching between English and Bahasa Indonesia with a single header click or via the Settings menu, complete with localized date/time formatting and persistent preferences.
- **Live Next-Event Ticker**: Header banner with live countdown timers and dynamic "UPCOMING / RUNNING" status badges.
- **Direct Google Meet Launcher**: One-click join buttons for video conferences and meeting links extracted directly from Google Calendar event payloads.
- **Multi-Calendar Filtering**: Toggle visibility for individual Google calendars (primary, work, shared, holiday feeds) with real-time preference persistence.
- **Fluid Resizing & State Persistence**: 8-directional window resizing with bounds saved across app restarts.
- **Full Account Lifecycle**: OAuth 2.0 loopback login with a 5-minute timeout guard and a clean disconnect option that clears cached tokens and events from disk.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Tauri v2 (Rust 2021) |
| **API Client** | Native Rust `reqwest` (with `rustls-tls`) |
| **Authentication** | OAuth 2.0 with local ephemeral loopback |
| **UI Structure** | Semantic HTML5 & Vanilla JavaScript |
| **Styling** | Custom CSS3 Design System with Glassmorphism & GPU Compositor Animations |
| **Packaging** | Tauri CLI / Cargo Release |

---

## Prerequisites

- **Rust & Cargo**: Install via [rustup.rs](https://rustup.rs/)
- **Tauri v2 CLI**: `cargo install tauri-cli --version '^2'` (or via `npm i @tauri-apps/cli`)
- **WebView2 Runtime** *(Windows)*: Pre-installed on Windows 10+. If missing, download from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
- **Google Account & Google Cloud Project**: Used to generate your own `client_secret.json` credential (BYOK - Bring Your Own Key mode).

---

## Google Cloud Console Setup Guide (BYOK Mode)

This widget uses a **Bring Your Own Key (BYOK)** architecture for maximum privacy and security. You maintain full ownership and control of your Google API credentials without third-party intermediate servers.

Follow these steps to generate your free `client_secret.json` in the Google Cloud Console:

### 1. Create a New Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the project dropdown and select **New Project**.
3. Name your project (e.g., `My Calendar Widget`), then click **Create**.

### 2. Enable the Google Calendar API
1. Open the left sidebar menu: **APIs & Services > Library**.
2. Type `Google Calendar API` in the search bar.
3. Select **Google Calendar API** and click the blue **Enable** button.

### 3. Configure the OAuth Consent Screen
1. Open the menu: **APIs & Services > OAuth consent screen**.
2. Select User Type: **External**, then click **Create**.
3. Fill in the required fields:
   - **App name**: `Google Calendar Desktop Widget`
   - **User support email**: Select your Google email.
   - **Developer contact information**: Enter your email address.
4. Click **Save and Continue** past the Scopes page.
5. On the **Test Users** page, click **+ ADD USERS**, and add the Google email address you will use to log into the widget.
6. Click **Save and Continue** until complete (*Back to Dashboard*).

### 4. Create OAuth 2.0 Client ID (Desktop App)
1. Open the menu: **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top, and choose **OAuth client ID**.
3. In the **Application type** dropdown, select **Desktop app**.
4. Give it a name (e.g., `Calendar Desktop Client`), then click **Create**.
5. A confirmation dialog will appear. Click **DOWNLOAD JSON** to download your credentials file.

### 5. Place `client_secret.json` in the Widget
1. Rename the downloaded JSON file to **`client_secret.json`**.
2. Place the file in one of the following locations:
   - **Windows Installer Users**: Press `Win + R`, type `%APPDATA%\google-calender-widget`, and paste `client_secret.json` into this folder (or click the **Credentials Folder** button in the widget).
   - **Developers / Git Clone**: Place `client_secret.json` directly in the project root directory `google-calender-widget/`.

### 6. Sign In & Sync
Launch the widget, click **Sign in with Google**, and grant authorization in your browser. Your daily agenda will immediately sync to your desktop!

---

## Getting Started (Development)

### 1. Clone the Repository

```bash
git clone https://github.com/rifarizqul-itk/google-calender-widget.git
cd google-calender-widget
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Place Credentials

Ensure your `client_secret.json` file from the setup steps above is placed in the project root folder.

> The `.gitignore` file automatically excludes `client_secret*.json` and `google_tokens.json` to prevent accidental credential commits.

### 4. Run the Widget

```bash
npm run dev
# or directly:
cargo tauri dev
```

---

## Architecture

The project follows a Tauri v2 architecture with an isolated Rust backend and a WebView2 frontend renderer.

```
google-calender-widget/
├── package.json                 # JS tooling and Tauri CLI scripts
├── src-tauri/                   # Native Rust backend
│   ├── Cargo.toml               # Rust crate manifest and dependencies
│   ├── tauri.conf.json          # Tauri app, window, and bundle configuration
│   ├── build.rs                 # Tauri build script
│   ├── capabilities/
│   │   └── default.json         # Tauri capability permissions
│   ├── icons/                   # Application icon assets
│   └── src/
│       ├── main.rs              # Entry point: single-instance enforcement, mutex guard
│       ├── lib.rs               # Tauri app setup, tray init, window restore, auto-sync
│       ├── tray.rs              # System tray menu and event handlers
│       ├── paths.rs             # Cross-platform app data directory resolver
│       └── commands/
│           ├── auth.rs          # OAuth2 loopback server, token storage & refresh
│           ├── calendar.rs      # Google Calendar API v3 client, event caching
│           ├── academic.rs      # Semester week tracker logic
│           ├── window.rs        # Window dragging, resizing, pinning IPC commands
│           ├── system.rs        # Auto-launch, log & credential folder openers
│           └── http_client.rs   # Shared async reqwest HTTP client
└── src/renderer/                # Frontend (HTML/CSS/JS rendered in WebView2)
    ├── index.html               # App entry point loaded by Tauri
    ├── widget.html              # Semantic HTML structure for widget and modals
    ├── widget.css               # Glassmorphism design tokens, themes, layout rules
    ├── widget.js                # DOM controller, animations, event listeners, state
    └── tauri-bridge.js          # Tauri JS API bridge and IPC command wrappers
```

### Data Flow

```
+-------------------------------------------------------------+
|                     WebView2 Renderer                       |
|  (widget.js -> DOM, CSS, Glassmorphism UI, State Machine)   |
+-------------------------------------------------------------+
                              |
                   Tauri IPC (invoke / emit)
                              |
+-------------------------------------------------------------+
|                   Rust Backend (lib.rs)                     |
|                                                             |
|   +-------------------+              +-------------------+  |
|   |   auth.rs         |              |  calendar.rs      |  |
|   | (OAuth2 Loopback) |              | (Google API v3)   |  |
|   +-------------------+              +-------------------+  |
|             |                                  |            |
|             v                                  v            |
|   [ google_tokens.json ]             [ calendar_cache.json ]|
+-------------------------------------------------------------+
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches the widget in development mode (hot reload) |
| `npm run build` | Compiles the production release binary and installers |
| `cargo tauri dev` | Alternative: run dev mode directly via Cargo |

---

## Building the Production Installer

To compile the Windows installer and portable executable:

```bash
npm run build
# or:
cargo tauri build
```

Build outputs are saved to `src-tauri/target/release/bundle/`:
- `nsis/google-calender-widget_x.x.x_x64-setup.exe` (NSIS Installer)
- `msi/google-calender-widget_x.x.x_x64_en-US.msi` (MSI Package)
- `target/release/app.exe` (Portable Executable)

---

## Troubleshooting

### "File client_secret.json not found"
Ensure your OAuth credentials file from Google Cloud Console is placed in `%APPDATA%\google-calender-widget\` or the project root directory, and named `client_secret.json`.

### Window position appears off-screen after display changes
Right-click the system tray icon and select **Reset Window Size (360x580)** to restore the widget to the center of your active screen.

### "Error: Google OAuth authorization timed out"
The OAuth login server includes a 5-minute timeout for security. If the login process in your browser takes longer than 5 minutes, click **Sign in with Google** again in the widget.

### Viewing Application Logs
Click the settings icon in the widget header, then click **Open Logs Folder** to inspect activity logs and diagnostics in Windows Explorer.

---

## Contributing

1. Fork the repository: `https://github.com/rifarizqul-itk/google-calender-widget`
2. Create your feature branch: `git checkout -b feat/your-feature-name`
3. Build and verify: `npm run build`
4. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add feature summary"`
5. Push to your fork: `git push origin feat/your-feature-name`
6. Open a Pull Request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
