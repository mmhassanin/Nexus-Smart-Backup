const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const Store = require('electron-store');

// Initialize store with defaults
const store = new Store({
  defaults: {
    source: '',
    destination: '',
    excludes: 'node_modules, .git, temp',
    interval: 60, // minutes
    maxBackups: 10,
    smartStreak: 3,
    autoStart: false
  }
});

let settingsWindow = null;
let tray = null;
let backupIntervalId = null;
let isBackingUp = false;
let consecutiveSameSizeCount = 0;
let lastBackupSize = -1;

// Helper to send logs to renderer
function sendLog(message) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('log-message', `[${new Date().toLocaleTimeString()}] ${message}`);
  }
  console.log(message);
}

// Helper to update status
function sendStatus(isRunning) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('status-update', isRunning);
  }
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 800,
    height: 700,
    show: false, // Hidden by default
    frame: false, // Frameless for custom clean UI
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile('index.html');

  // Prevent closing, hide instead
  settingsWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      settingsWindow.hide();
    }
    return false;
  });
}

function createTray() {
  // Use a default icon or placeholder. In production, check for icon file.
  const iconPath = path.join(__dirname, 'icon.png'); 
  // If no icon, tray might fail or show empty. For boilerplate, we'll try to use a simple approach or log warning if missing.
  // Electron requires a valid image. 
  
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Settings', click: () => settingsWindow.show() },
    { type: 'separator' },
    { label: 'Exit', click: () => {
        app.isQuiting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Nexus Smart Backup System');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (settingsWindow.isVisible()) {
      settingsWindow.hide();
    } else {
      settingsWindow.show();
    }
  });
}

// Recursive size calculation
async function getDirSize(dir) {
  let size = 0;
  try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          size += await getDirSize(filePath);
        } else {
          size += stats.size;
        }
      }
  } catch (err) {
      console.error('Error calculating size:', err);
  }
  return size;
}

async function performBackup() {
  if (isBackingUp) return;
  isBackingUp = true;
  sendStatus(true);
  sendLog('Starting backup...');

  const source = store.get('source');
  const destination = store.get('destination');
  const rawExcludes = store.get('excludes') || '';
  const excludes = rawExcludes.split(',').map(s => s.trim()).filter(s => s);
  const maxBackups = store.get('maxBackups');
  const smartStreak = store.get('smartStreak');

  if (!source || !destination) {
    sendLog('Error: Source or Destination not set.');
    isBackingUp = false;
    sendStatus(!!backupIntervalId);
    return;
  }
  
  // Verify paths exist
  if (!fs.existsSync(source)) {
      sendLog('Error: Source path does not exist.');
      isBackingUp = false;
      return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolderName = `backup-${timestamp}`;
    const backupPath = path.join(destination, backupFolderName);

    // Copy with filter
    await fs.copy(source, backupPath, {
      filter: (src) => {
        const relative = path.relative(source, src);
        if (!relative) return true; // root
        return !excludes.some(exclude => relative.includes(exclude));
      }
    });

    sendLog(`Backup created at: ${backupPath}`);

    // Smart Check
    const currentSize = await getDirSize(backupPath);
    sendLog(`Backup size: ${currentSize} bytes`);

    if (currentSize === lastBackupSize) {
      consecutiveSameSizeCount++;
      sendLog(`Same size streak: ${consecutiveSameSizeCount}/${smartStreak}`);
      if (consecutiveSameSizeCount >= smartStreak) {
        sendLog('Smart Check Triggered: Stopping auto-backups.');
        stopBackupLoop();
        
        if (Notification.isSupported()) {
          new Notification({ title: 'Nexus Backup', body: 'Backup stopped due to inactivity (Smart Check).' }).show();
        }
      }
    } else {
      consecutiveSameSizeCount = 0;
      lastBackupSize = currentSize;
    }

    // Prune old backups
    await pruneBackups(destination, maxBackups);

  } catch (err) {
    sendLog(`Backup failed: ${err.message}`);
    console.error(err);
  } finally {
    isBackingUp = false;
    // status is only 'Running' if the loop is active
  }
}

async function pruneBackups(destDir, max) {
  try {
    const files = await fs.readdir(destDir);
    // Filter for backup folders and sort by creation time (name)
    // Assuming backup-YYYY-MM-DD... format sort works chronologically
    const backupFolders = files.filter(f => f.startsWith('backup-')).sort(); 

    if (backupFolders.length > max) {
      const toDelete = backupFolders.slice(0, backupFolders.length - max);
      for (const folder of toDelete) {
        const deletePath = path.join(destDir, folder);
        await fs.remove(deletePath);
        sendLog(`Pruned old backup: ${folder}`);
      }
    }
  } catch (err) {
    sendLog(`Pruning failed: ${err.message}`);
  }
}

function startBackupLoop() {
  if (backupIntervalId) clearInterval(backupIntervalId);
  
  const intervalMins = store.get('interval') || 60;
  sendLog(`Starting auto-backup. Interval: ${intervalMins} mins.`);
  
  backupIntervalId = setInterval(() => {
    performBackup();
  }, intervalMins * 60 * 1000);
  
  sendStatus(true);
}

function stopBackupLoop() {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
    backupIntervalId = null;
    sendLog('Auto-backup stopped.');
    sendStatus(false);
  }
}

// IPC Handlers
ipcMain.handle('get-settings', () => store.store);
ipcMain.handle('save-settings', (event, settings) => {
  store.set(settings);
  sendLog('Settings saved.');
  
  // If running, restart loop with new interval logic
  if (backupIntervalId) {
    startBackupLoop();
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(settingsWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
  }
  return null;
});

ipcMain.on('start-backup', () => startBackupLoop());
ipcMain.on('stop-backup', () => stopBackupLoop());
ipcMain.on('force-backup', () => performBackup());
ipcMain.on('minimize-window', () => settingsWindow.hide());

app.whenReady().then(() => {
  createSettingsWindow();
  createTray();

  if (store.get('autoStart')) {
    startBackupLoop();
  }
});

app.on('window-all-closed', () => {
  // Do nothing, keep running in tray
});
