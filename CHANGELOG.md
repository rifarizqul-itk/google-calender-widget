# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-09-30

### Added
- **Tauri v2 Native Rust Backend**:
  - Replaced the Electron runtime with a high-performance, lightweight Tauri v2 and Rust architecture.
  - Native asynchronous HTTP client powered by `reqwest` and `rustls-tls` with direct connection pooling.
  - Lightweight Win32 native system tray and window lifecycle manager.
- **Ultra-Low Memory Footprint & Resource Optimization**:
  - Reduced idle memory consumption from ~150–200 MB (Electron) to ~30–40 MB RAM (~80% reduction).
  - Production binary size optimized to ~10 MB with Rust release optimizations (`opt-level = "z"`, LTO, strip symbols).
  - Background memory trimming hooks integrating `ICoreWebView2_19::SetMemoryUsageTargetLevel(TargetLow)`.
  - Minimal browser arguments configured in `tauri.conf.json` to strip unused Chromium services (speech API, print preview, translate, spellcheck, cast).
- **Native Single-Instance Enforcement & Zombie Process Recovery**:
  - Implemented Win32 named Mutex (`Global\io.github.rifarizqul-itk.google-calender-widget`) to guarantee only one widget instance runs.
  - Automatic zombie process detection: if a background process holds the mutex without a valid window, it is terminated and restarted cleanly.
  - Window focus restoration: launching from a shortcut or secondary instance brings the existing running widget to the foreground.
- **Offline & Network Startup Resilience**:
  - Implemented graceful offline fallback during widget startup when internet connectivity is unavailable, preventing false "All events ended" or blank screens.
  - Automatic retry and background resync once internet connection is restored.

### Fixed
- **Upcoming Agenda Recurrence & Year Boundary Stuck Bug**:
  - Fixed an issue where recurring or upcoming year-end events (e.g. Christmas / Natal) remained stuck in the Upcoming section due to UTC / local date boundary parsing.
- **WebView2 Process Cleanup on Exit**:
  - Fixed dangling WebView2 background processes when exiting via the system tray by explicitly destroying the native window handle prior to app shutdown.

---

## [2.1.5] - 2026-09-01

### Added
- **Academic Semester Week Tracker**:
  - Automatic detection of active semester calendars matching the pattern `"SEMESTER <N> - <AcademicYear>"`.
  - Dedicated **Semester Tab** displaying the current week number, academic year, and a structured list of all 16 (or custom N) semester weeks with active-week highlights.
  - Glanceable **Semester Week Chip** in the header banner for instant ambient week tracking.
  - Configurable settings for manual **Week 1 Start Date override** and **Total Semester Weeks** (defaulting to 16, supporting custom values such as 17 for specific rector/academic decrees).
  - 10-minute in-memory caching with graceful fallbacks.
- **Instant (0ms) Add/Edit Event Modal Launch**:
  - Eliminated synchronous network blocking on modal open by caching Google Calendar list in main and renderer processes.
- **Clean Timeline & Enhanced Hover UX**:
  - Removed repetitive past chips and transparency dots from event cards to prevent visual clutter.
  - Streamlined recurring event indicator to a clean icon-only pill with native hover tooltip (`"Acara Berulang"` / `"Recurring Event"`).
  - Added native hover tooltip to past event cards (`"Acara telah selesai"` / `"Event has ended"`).

### Fixed
- **Local Date Serialization Bug**: Fixed UTC timezone offset drift in ISO string serialization (`.toISOString()`), ensuring semester start dates and week boundaries accurately reflect local timezone calendar dates (WIB/WITA/WIT).

---

## [2.0.0] - 2026-08-26

### Major Architectural Overhaul & First Official Next-Gen Release
- **Native Google Calendar API v3 Integration**: Completely replaced legacy webview wrappers with direct REST API integration, atomic event creation, and in-app event deletion.
- **Pure Bring Your Own Key (BYOK) Architecture**: Private, zero-telemetry credential model where users supply their own Google Cloud OAuth 2.0 Client ID without reliance on third-party backend servers.
- **Modern Ambient Glassmorphism Design System**: Complete visual overhaul featuring ambient slate dark theme, light mode support, hairline vector icons, and ITU-R BT.709 contrast compensation.
- **Bilingual Engine (English & Bahasa Indonesia)**: Instant language switching with persistent user preferences, full date/time localization, and bilingual documentation.
- **Offline First & Background Sync**: Local caching with automatic exponential backoff, zero CPU idle ticker, and offline recovery.
- **Smart Window Management**: 8-directional window resizing, screen constraint clamping, state keeper persistence, and Windows system tray integration.
- **Security Hardening**: Strict Electron process isolation (`contextIsolation: true`, `nodeIntegration: false`), comprehensive HTML description sanitization, and dual-port OAuth loopback server (54321 + ephemeral fallback).

---

## [1.5.4] - 2026-08-25

### Added
- **Modern Ambient Glassmorphism Design System**: Complete UI overhaul with hairline borders, slate dark theme, and Apple/Linear-inspired styling.
- **Multi-Calendar Filter Checklist**: Modal allowing users to toggle which Google calendars sync to the widget.
- **In-App Quick Add Modal**: Form to add events directly without opening a web browser.
- **In-App Event Details Sheet**: Rich description support with sanitized HTML rendering, attendee status badges, and Google Meet integration.
- **8-Directional Window Resize Handles**: Edge and corner drag handles with minimum bounds enforcement and position persistence.
- **Windows Startup Toggle**: Built-in checkbox and tray item for running on Windows startup via `app.setLoginItemSettings`.
- **System Diagnostics**: Dedicated structured logging module with one-click log folder access.
- **Automated Test Suite**: 17 comprehensive unit tests with `node:test`.

### Changed
- Refactored monolith code into modular services (`src/app.js`, `src/services/`, `src/renderer/`, `src/utils/`).
- Updated Electron to version 38.x.

---

## [1.0.0] - 2023-07-15

### Added
- Initial Electron desktop widget wrapper for Google Calendar.
- Basic agenda timeline and system tray menu.
