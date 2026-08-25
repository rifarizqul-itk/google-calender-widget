# Google Calendar Desktop Widget

An ambient desktop calendar widget for Windows, macOS, and Linux built on Electron. It connects directly to the Google Calendar API v3 to display your daily schedule with real-time countdowns, dual views, offline caching, and desktop integration.

[![GitHub Release](https://img.shields.io/github/v/release/rifarizqul-itk/google-calender-widget?style=flat-square)](https://github.com/rifarizqul-itk/google-calender-widget/releases)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![Electron Version](https://img.shields.io/badge/electron-38.x-blue?style=flat-square)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Overview

This widget provides an ambient desktop overlay that keeps your schedule visible without needing an open browser tab. It supports both embedded desktop mode (Rainmeter style) and an always-on-top mode, with full background synchronization and offline fallback.

### Key Capabilities

- **Dual View Modes**: Switch between a chronological Agenda timeline with relative day groupings and a Mini Month interactive grid.
- **Smart Color & Contrast Engine**: Preserves your Google Calendar badge colors while applying ITU-R BT.709 relative luminance adjustments for crisp contrast across light and dark themes.
- **Multilingual Support (EN / ID)**: Instant language switching between English and Bahasa Indonesia with a single header click or via the Settings menu, complete with localized date/time formatting and persistent preferences.
- **Live Next-Event Ticker**: Header banner with live countdown timers that automatically pauses when the widget is minimized or hidden to maintain zero background CPU usage.
- **Direct Google Meet Launcher**: One-click join buttons for video conferences and meeting links extracted directly from Google Calendar event payloads.
- **In-App Quick Event Management**: Create new timed or all-day events and delete existing entries with in-app confirmation dialogs.
- **Multi-Calendar Filtering**: Toggle visibility for individual Google calendars (primary, work, shared, holiday feeds) with real-time preference persistence.
- **Dynamic Domain Formatting**: Extracts and displays clean hostnames for long calendar names or organizer URLs, complete with one-click copy buttons for raw links.
- **Zero AI Slop Iconography**: Pure hairline SVG vector icons with no emoji decorations.
- **Fluid Resizing & State Persistence**: 8-directional window resizing with bounds saved across app restarts.
- **Full Account Lifecycle**: OAuth 2.0 loopback login with a 5-minute timeout guard and a clean disconnect option that clears cached tokens and events from disk.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Electron 38.x / Node.js 20+ |
| **API Client** | Google APIs Node.js Client (`googleapis` v176+) |
| **Authentication** | OAuth 2.0 (`google-auth-library`) with local ephemeral loopback |
| **UI Structure** | Semantic HTML5 & Vanilla JavaScript |
| **Styling** | Custom CSS3 Design System with Glassmorphism & GPU Compositor Animations |
| **Test Runner** | Native Node.js Test Runner (`node:test`) |
| **Packaging** | `electron-builder` 25.x (NSIS & Portable Windows Targets) |

---

## Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **npm** or **yarn**
- **Google Cloud Console Project**: A project with the Google Calendar API enabled and an OAuth 2.0 Client ID configured (Desktop application type).

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/rifarizqul-itk/google-calender-widget.git
cd google-calender-widget
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Calendar API**.
3. Under **APIs & Services > Credentials**, create an **OAuth 2.0 Client ID** with application type set to **Desktop App**.
4. Download the client secret JSON file.
5. Place the file in the root directory of the project named `client_secret.json` (or matching `client_secret*.json`).

> The `.gitignore` file is configured to exclude `client_secret*.json` and `google_tokens.json` to prevent accidental credential commits.

### 4. Run the Development Server

```bash
npm start
```

---

## Architecture

The project follows an isolated multi-process Electron architecture adhering to context isolation and least-privilege IPC patterns.

```
google-calender-widget/
├── index.js                     # Electron main entry wrapper
├── package.json                 # Project configuration and build scripts
├── src/
│   ├── app.js                   # Main process: lifecycle, IPC handlers, background sync
│   ├── preload.js               # Secure context bridge exposing calendarWidgetAPI
│   ├── config/
│   │   └── constants.js         # View constants and default configurations
│   ├── services/
│   │   ├── authService.js       # OAuth2 client, browser login loopback, token storage
│   │   ├── calendarService.js   # Google Calendar API wrapper, caching, event parsing
│   │   ├── preferences.js       # Local view and user preferences persistence
│   │   ├── trayManager.js       # Windows system tray integration and context menu
│   │   └── windowState.js       # Window bounds tracker and screen constraint manager
│   ├── utils/
│   │   ├── dateHelper.js        # Date formatting, countdowns, relative day labels
│   │   ├── debounce.js          # Generic debounce utility
│   │   ├── logger.js            # Structured logging and crash reporting
│   │   └── paths.js             # Cross-platform asset and resource resolver
│   └── renderer/
│       ├── widget.html          # Semantic HTML structure for widget and modals
│       ├── widget.css           # Glassmorphism design tokens, themes, layout rules
│       └── widget.js            # DOM controller, animations, event listeners, state
├── test/                        # Automated unit tests using node:test
│   ├── constants.test.js
│   ├── dateHelper.test.js
│   ├── debounce.test.js
│   ├── logger.test.js
│   ├── paths.test.js
│   ├── preferences.test.js
│   └── windowState.test.js
└── resources/                   # Application icons and assets
```

### IPC Data Flow

```
+-------------------------------------------------------------+
|                       Renderer Process                      |
| (widget.js -> Pure DOM & CSS, Context-Isolated, Sandbox Safe)|
+-------------------------------------------------------------+
                              |
                     window.calendarWidgetAPI
                              |
+-------------------------------------------------------------+
|                      Preload Bridge                         |
|   (src/preload.js: Whitelisted invocations & subscriptions) |
+-------------------------------------------------------------+
                              |
                          IPC Events
                              |
+-------------------------------------------------------------+
|                        Main Process                         |
|   (src/app.js: Window Manager, Background Sync, Tray Menu)  |
|                                                             |
|   +-------------------+              +-------------------+  |
|   |   authService     |              |  calendarService  |  |
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
| `npm start` | Launches the widget in development mode |
| `npm test` | Runs the full automated unit test suite (`node:test`) |
| `npm run pack` | Packages the application directory without creating installers |
| `npm run dist:win` | Compiles the production Windows NSIS installer and portable `.exe` |
| `npm run dist:linux` | Compiles Linux distribution packages (AppImage) |
| `npm run dist:mac` | Compiles macOS application bundle |

---

## Testing

Run all unit tests:

```bash
npm test
```

The test suite covers:
- Calendar view constants and URL detection
- All-day and timed event formatting
- Relative day calculation (today, tomorrow, past, future)
- Event countdowns and active ongoing states
- Debounce timers and cancellation
- Window bounds persistence and screen boundary clamping
- Corrupted JSON recovery in preferences

---

## Building the Production Installer

To compile the Windows installer and portable executable:

```bash
npm run dist:win
```

Build outputs are saved to the `dist/` directory:
- `google-calender-widget Setup 1.5.5.exe` (NSIS Installer)
- `google-calender-widget 1.5.5.exe` (Portable Executable)

---

## Troubleshooting

### "File client_secret.json tidak ditemukan"
Ensure your OAuth credentials file from Google Cloud Console is placed in the project root directory and named `client_secret.json`.

### Window position appears off-screen after display changes
Right-click the system tray icon and select **Reset Ukuran Standar (360x580)** to reset the window bounds to the center of the active monitor.

### "Error: Waktu otorisasi Google login habis"
The OAuth login server includes a 5-minute timeout for security. If the login process in your browser takes longer than 5 minutes, click **Masuk dengan Google** again in the widget.

### Viewing Application Logs
Click the settings icon in the widget header, then select **Buka Folder Log** to open the logs directory in Windows Explorer.

---

## Contributing

1. Fork the repository: `https://github.com/rifarizqul-itk/google-calender-widget`
2. Create your feature branch: `git checkout -b feat/your-feature-name`
3. Ensure all tests pass: `npm test`
4. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add feature summary"`
5. Push to your fork: `git push origin feat/your-feature-name`
6. Open a Pull Request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
