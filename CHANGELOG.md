# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.5] - 2026-08-26

### Added
- **Internationalization (i18n) Engine**: Added seamless multilingual support with real-time switching between English (`EN`) and Bahasa Indonesia (`ID`) via the header toggle or Settings modal, with persistent user preferences.
- **Account Disconnect (Logout)**: Added an explicit account disconnection action in the Calendar Settings modal with an in-app confirmation dialog, clearing OAuth tokens and local cache files.
- **Dynamic Domain Parsing**: Automatic hostname extraction for long calendar names and creator/organizer URLs, paired with clipboard copy action buttons.
- **Exclusive All-Day Event Handling**: Corrected all-day event creation logic to use exclusive end dates (`+1 day`) matching the Google Calendar API v3 specification.
- **OAuth Server Timeout**: Added a 5-minute safety timeout and automatic socket cleanup to the local loopback server during authentication.
- **System Tray Window Sync**: Dynamic window instance tracking to prevent stale references when restoring minimized or hidden instances.

### Changed
- **Header Aesthetics**: Removed redundant version tags for a cleaner minimalist header.
- **Motion & Performance**: Replaced CPU-heavy CSS background-position animations with GPU compositor-accelerated layer transforms (`translate3d`).
- **Scroll Containment**: Resolved input autofocus shifts during modal transitions on frameless transparent windows.
- **Dark & Light Contrast**: Applied ITU-R BT.709 relative luminance color correction to ensure Google Calendar badges maintain readable contrast across both themes.

### Fixed
- Fixed an unhandled `ReferenceError` on fallback token paths when `app.getPath('userData')` is inaccessible.
- Fixed an issue where all-day events created in the quick add modal could be saved with zero duration.

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
