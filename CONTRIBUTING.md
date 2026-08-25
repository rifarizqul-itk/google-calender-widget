# Contributing to Google Calendar Desktop Widget

Thank you for your interest in contributing to Google Calendar Desktop Widget! We welcome contributions from the community.

## Code of Conduct

Please be respectful, constructive, and collaborative in all interactions across issues, pull requests, and discussions.

## How to Contribute

### 1. Reporting Bugs
- Search existing [Issues](https://github.com/rifarizqul-itk/google-calender-widget/issues) to ensure the bug hasn't already been reported.
- If not, create a new issue with detailed reproduction steps, your OS version, and relevant log snippets (from the in-app log folder).

### 2. Suggesting Enhancements
- Open a feature request issue describing the motivation and proposed behavior.
- We prioritize lightweight ambient desktop features, user privacy, and high performance.

### 3. Submitting Pull Requests
1. Fork the repository and create your feature branch from `master`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies and start the app in development:
   ```bash
   npm install
   npm start
   ```
3. Ensure all automated tests pass before committing:
   ```bash
   npm test
   ```
4. Follow [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages:
   - `feat: add new feature`
   - `fix: resolve bug in auth flow`
   - `docs: update setup documentation`
   - `refactor: optimize rendering loop`
5. Push to your fork and submit a Pull Request describing your changes and testing evidence.

## Architecture Guidelines

- **Process Isolation**: Keep the Renderer process sandboxed and communicate with Node.js exclusively through `src/preload.js` and IPC handlers.
- **Privacy by Design (BYOK)**: Do not introduce third-party analytics, tracking, or proxy backends. Kinds of secrets must stay strictly local.
- **Zero AI Slop**: Maintain clean hairline SVG vector icons and polished glassmorphism design tokens.

---

Thank you for helping make Google Calendar Desktop Widget better for everyone!
