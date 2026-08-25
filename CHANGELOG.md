# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
