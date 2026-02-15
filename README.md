# Nexus Smart Backup System

Nexus Smart Backup System is a robust, standalone desktop application designed for seamless background backups. Built with Electron and Node.js, it operates silently from the system tray, ensuring your data is secure without interrupting your workflow.

## 🚀 Core Features

- **Tray-Only Architecture**: Runs unobtrusively in the background with a system tray icon for quick access and control.
- **Smart Size Checking**: Intelligently monitors file sizes to optimize backup storage and performance.
- **Auto-Rotation**: Automatically manages backup versions, rotating out old backups to save space.
- **Native Notifications**: Keeps you informed of backup status and critical events via native OS notifications.
- **Hidden Settings Dashboard**: Access advanced configuration options through a secure, hidden dashboard.

## 🛠️ Tech Stack

- **[Electron](https://www.electronjs.org/)**: Framework for building cross-platform desktop apps with web technologies.
- **[Node.js](https://nodejs.org/)**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **[fs-extra](https://github.com/jprichardson/node-fs-extra)**: Extended file system methods for robust file operations.
- **[electron-builder](https://www.electron.build/)**: Complete solution to package and build a ready for distribution Electron app.

## 📦 Setup & Installation

To set up the project locally, follow these steps:

1.  **Clone the repository** (if applicable) or navigate to the project directory.
2.  **Install dependencies**:
    ```bash
    npm install
    ```

## 🏗️ Build Instructions

To build the application for production, you can use the provided build script or npm command.

### Using the Batch Script (Recommended for Windows)

We have created a dedicated build tool for Windows:

```cmd
Build-Backup.bat
```

### Using NPM

Alternatively, you can run the standard build command:

```bash
npm run build
```

---

*Private Repository - Nexus Smart Backup System*
