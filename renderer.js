// Elements
const el = (id) => document.getElementById(id);

const sourceInput = el('source');
const destInput = el('destination');
const excludesInput = el('excludes');
const intervalInput = el('interval');
const maxBackupsInput = el('maxBackups');
const smartStreakInput = el('smartStreak');
const autoStartCheckbox = el('autoStart');
const statusIndicator = el('statusIndicator');
const logsArea = el('logs');

// Load Settings
async function loadSettings() {
    const settings = await window.api.invoke('get-settings');
    sourceInput.value = settings.source || '';
    destInput.value = settings.destination || '';
    excludesInput.value = settings.excludes || '';
    intervalInput.value = settings.interval || 60;
    maxBackupsInput.value = settings.maxBackups || 10;
    smartStreakInput.value = settings.smartStreak || 3;
    autoStartCheckbox.checked = settings.autoStart || false;
}

// Save Settings
async function saveSettings() {
    const settings = {
        source: sourceInput.value,
        destination: destInput.value,
        excludes: excludesInput.value,
        interval: parseInt(intervalInput.value),
        maxBackups: parseInt(maxBackupsInput.value),
        smartStreak: parseInt(smartStreakInput.value),
        autoStart: autoStartCheckbox.checked
    };
    await window.api.invoke('save-settings', settings);
}

// Event Listeners
el('browseSource').addEventListener('click', async () => {
    const path = await window.api.invoke('select-folder');
    if (path) sourceInput.value = path;
});

el('browseDest').addEventListener('click', async () => {
    const path = await window.api.invoke('select-folder');
    if (path) destInput.value = path;
});

el('saveBtn').addEventListener('click', () => {
    saveSettings();
});

el('startBtn').addEventListener('click', () => {
    window.api.send('start-backup');
});

el('stopBtn').addEventListener('click', () => {
    window.api.send('stop-backup');
});

el('forceBtn').addEventListener('click', () => {
    window.api.send('force-backup');
});

el('closeBtn').addEventListener('click', () => {
    window.api.send('minimize-window');
});

// Logs & Status
window.api.receive('log-message', (msg) => {
    logsArea.value += msg + '\n';
    logsArea.scrollTop = logsArea.scrollHeight;
});

window.api.receive('status-update', (isRunning) => {
    if (isRunning) {
        statusIndicator.textContent = 'RUNNING';
        statusIndicator.className = 'status running';
    } else {
        statusIndicator.textContent = 'STOPPED';
        statusIndicator.className = 'status stopped';
    }
});

// Initial Load
loadSettings();
