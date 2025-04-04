const { app, BrowserWindow, ipcMain, screen, desktopCapturer } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const si = require('systeminformation'); // Using systeminformation for processes and network
const fs = require('fs');

// Initialize store variable and psList - will be set after dynamic import
let store;
let psList; // Still needed for screen sharing check

// Immediately invoke an async function to set up the store and psList
(async () => {
  try {
    // Dynamic import for electron-store (ES Module)
    console.log('Importing electron-store...');
    const Store = await import('electron-store');
    store = new Store.default();
    console.log('electron-store imported successfully.');

    // Dynamic import for ps-list (ES Module)
    console.log('Importing ps-list...');
    psList = (await import('ps-list')).default;
    console.log('ps-list imported successfully, type:', typeof psList);
     if (typeof psList !== 'function') {
        console.error('Error: psList failed to import correctly!');
        // Handle this error appropriately - maybe quit the app or disable the check
        psList = null; // Ensure it's null if import failed detection
     }
  } catch (error) {
    console.error('Failed during dynamic import:', error);
    // Optionally quit the app or show an error dialog
    app.quit();
  }

})();

let mainWindow;
let monitoringIntervalId = null; // ID for the monitoring interval
const MONITORING_INTERVAL = 5000; // Check every 5 seconds
const MEMORY_THRESHOLD_KB = 50000; // 50,000 KB = 50 MB

function createWindow() {
  // Create the browser window
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Check if icon exists, otherwise don't include icon option
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const hasIcon = fs.existsSync(iconPath);

  const windowOptions = {
    width: 800,
    height: 650, // Slightly increased height for potentially longer lists
    minWidth: 800,
    minHeight: 650,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // enableRemoteModule: true, // Deprecated and generally unsafe
    },
    show: false
  };

  // Add icon only if it exists
  if (hasIcon) {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    // Stop monitoring if the window is closed
    if (monitoringIntervalId) {
      clearInterval(monitoringIntervalId);
      monitoringIntervalId = null;
    }
    mainWindow = null;
  });
}

// --- Helper Functions for Checks ---

async function checkDisplays() {
  try {
    const displays = await si.graphics();
    const displayCount = displays.displays ? displays.displays.length : 0;
    return {
      success: true,
      multipleDisplays: displayCount > 1,
      displayCount
    };
  } catch (error) {
    // Enhanced Logging
    console.error('Error checking displays:', error.message);
    console.error('Stack trace (checkDisplays):', error.stack);
    return {
      success: false,
      error: `Display check failed: ${error.message}` // Pass clearer error message
    };
  }
}

async function checkScreenSharing() {
  try {
    // Make sure psList is loaded before using it
    if (typeof psList !== 'function') {
       console.error('psList is not available for screen sharing check.');
       throw new Error('ps-list module not loaded correctly.');
    }

    // Get all running processes using ps-list
    const processes = await psList();

    // Define known screen sharing applications
    const knownScreenSharingApps = [
         { name: 'Zoom', processNames: ['zoom', 'zoomshare', 'caphost'] },
         { name: 'Microsoft Teams', processNames: ['teams', 'teams.exe'] },
         { name: 'Discord', processNames: ['discord', 'discord.exe'] },
         { name: 'Skype', processNames: ['skype', 'skype.exe'] },
         { name: 'Google Meet', processNames: ['meet.google.com'] },
         { name: 'WebEx', processNames: ['webex', 'webexmta', 'webexhost'] },
         { name: 'OBS Studio', processNames: ['obs', 'obs-studio', 'obs64', 'obs.exe'] },
         { name: 'TeamViewer', processNames: ['teamviewer', 'teamviewer.exe'] },
         { name: 'AnyDesk', processNames: ['anydesk', 'anydesk.exe'] },
         { name: 'Chrome Remote Desktop', processNames: ['chrome-remote-desktop', 'remoting_host'] },
         { name: 'VLC', processNames: ['vlc', 'vlc.exe'] },
         { name: 'QuickTime Player', processNames: ['quicktimeplayer'] },
         { name: 'Slack', processNames: ['slack', 'slack.exe'] }
    ];

    // macOS specific checks
    const macOSScreenRecordingUtils = [
         { name: 'QuickTime Player Screen Recording', processNames: ['com.apple.screencapture', 'QuickTimePlayerX'] },
         { name: 'Screenshot App', processNames: ['Screenshot', 'screencaptureui'] },
         { name: 'ScreenFlow', processNames: ['screenflow'] },
         { name: 'Loom', processNames: ['loom'] },
         { name: 'Snagit', processNames: ['snagit', 'snagiteditor'] }
    ];

    const allAppsToCheck = [...knownScreenSharingApps];
    if (process.platform === 'darwin') {
      allAppsToCheck.push(...macOSScreenRecordingUtils);
    }

    const detectedApps = new Set();

    for (const app of allAppsToCheck) {
      const found = processes.some(proc => {
        const name = (proc.name || '').toLowerCase();
        const cmd = (proc.cmd || '').toLowerCase();
        return app.processNames.some(processName =>
          name.includes(processName.toLowerCase()) ||
          cmd.includes(processName.toLowerCase())
        );
      });
      if (found) {
        detectedApps.add(app.name);
      }
    }

    // Browser check
    const browserProcessPatterns = ['chrome', 'firefox', 'safari', 'msedge', 'brave'];
    let browserDetected = false;
    for (const browserPattern of browserProcessPatterns) {
      if (processes.some(proc => (proc.name || '').toLowerCase().includes(browserPattern) || (proc.cmd || '').toLowerCase().includes(browserPattern))) {
        browserDetected = true;
        break;
      }
    }

    const detectedAppList = Array.from(detectedApps);

    return {
      success: true,
      multipleShareTargets: detectedAppList.length > 1,
      isScreenBeingShared: detectedAppList.length > 0,
      sharingApps: detectedAppList,
      browserDetected: browserDetected
    };
  } catch (error) {
    // Enhanced Logging
    console.error('Error checking screen sharing:', error.message);
     console.error('Stack trace (checkScreenSharing):', error.stack); // Log stack trace
    return {
      success: false,
      error: `Screen sharing check failed: ${error.message}`
    };
  }
}


async function checkKeyboards() {
  try {
    const devices = await si.usb();
    const keyboardDevices = devices.filter(device => {
      const name = (device.name || '').toLowerCase();
      const type = (device.type || '').toLowerCase();
      return name.includes('keyboard') || type.includes('keyboard') || name.includes('hid');
    });

    return {
      success: true,
      multipleKeyboards: keyboardDevices.length > 1,
      keyboardCount: keyboardDevices.length,
      keyboards: keyboardDevices.map(k => k.name || k.type || 'Unknown Keyboard/HID')
    };
  } catch (error) {
    // Enhanced Logging
    console.error('Error checking keyboards:', error.message);
    console.error('Stack trace (checkKeyboards):', error.stack);
    return {
      success: false,
      error: `Keyboard check failed: ${error.message}`
    };
  }
}

async function checkResourceHogs() {
  // Modified to detect any user-initiated process consuming >50MB memory and making network calls.
  let processesData, networkData;
  try {
    const results = await Promise.allSettled([
      si.processes(),
      si.networkConnections('tcp')
    ]);
    if (results[0].status === 'rejected') {
      console.error('Failed to get process list:', results[0].reason);
      throw new Error(`Failed to get process list: ${results[0].reason?.message || results[0].reason}`);
    }
    processesData = results[0].value;
    if (results[1].status === 'rejected') {
      console.warn('Failed to get network connections:', results[1].reason);
      networkData = [];
    } else {
      networkData = results[1].value;
    }
    const processes = processesData.list;
    const pidsWithNetwork = new Set();
    if (Array.isArray(networkData)) {
      networkData.forEach(conn => {
        if (conn.pid && (conn.state === 'ESTABLISHED' || conn.state === 'LISTEN')) {
          pidsWithNetwork.add(conn.pid);
        }
      });
    } else {
      console.warn('Network data was not an array, skipping network check in resource hogs.');
    }
    // Filter for processes using >50MB and having an active network connection.
    const resourceHogs = processes.filter(proc => {
      const pid = proc.pid;
      const memoryKB = proc.memRss / 1024;
      const user = proc.user || '';
      const name = proc.name || 'Unknown';

      // Exclude typical system processes based on user and known names
      const isSystemProcess = ['root', 'system', '_windowserver', 'windowserver', 'dfrgui', 'das host service', 'system idle process', ''].includes(user.toLowerCase()) ||
                              name.toLowerCase().includes('svchost') ||
                              name.toLowerCase().includes('kernel_task') ||
                              pid === 0;
      if (isSystemProcess) return false;
      const highMemory = memoryKB > MEMORY_THRESHOLD_KB;
      const hasNetworkActivity = pidsWithNetwork.has(pid);
      return highMemory && hasNetworkActivity;
    });
    return {
      success: true,
      resourceHogsDetected: resourceHogs.length > 0,
      processes: resourceHogs.map(p => ({
        pid: p.pid,
        name: p.name || 'Unknown Process',
        memoryUsageKB: Math.round(p.memRss / 1024)
      }))
    };
  } catch (error) {
    console.error('Error checking resource hogs:', error.message);
    console.error('Stack trace (checkResourceHogs):', error.stack);
    if (processesData) console.error('Processes data (partial):', processesData.list?.length);
    if (networkData) console.error('Network data (partial):', networkData?.length);
    return {
      success: false,
      error: `Resource hog check failed: ${error.message}`,
      resourceHogsDetected: false,
      processes: []
    };
  }
}


// --- Main Check Runner (called periodically) ---

async function runAllChecks() {
  try {
    console.log(`[${new Date().toISOString()}] Running all checks...`);
    // Run checks in parallel using Promise.allSettled to get all results even if one fails
    const results = await Promise.allSettled([
      checkDisplays(),
      checkScreenSharing(),
      checkKeyboards(),
      checkResourceHogs()
    ]);

     console.log(`[${new Date().toISOString()}] Checks finished.`);

     // Process results from Promise.allSettled
     const finalResults = {
         displays: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason?.message || 'Unknown error', multipleDisplays: false },
         screenSharing: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason?.message || 'Unknown error', isScreenBeingShared: false, sharingApps: [], browserDetected: false },
         keyboards: results[2].status === 'fulfilled' ? results[2].value : { success: false, error: results[2].reason?.message || 'Unknown error', multipleKeyboards: false, keyboardCount: 0, keyboards: [] },
         resourceHogs: results[3].status === 'fulfilled' ? results[3].value : { success: false, error: results[3].reason?.message || 'Unknown error', resourceHogsDetected: false, processes: [] }
     };


     // Log if any individual check failed internally
      Object.entries(finalResults).forEach(([key, result]) => {
        if (!result.success) {
          console.warn(`Check '${key}' failed internally:`, result.error);
        }
      });


    return {
      success: true, // Overall success of *attempting* to run the checks
      results: finalResults
    };
  } catch (error) {
     // This catch block might not be reached if using Promise.allSettled correctly above
    console.error(`[${new Date().toISOString()}] Critical error running all checks:`, error.message);
    console.error('Stack trace (runAllChecks):', error.stack);
     return {
       success: false,
       error: `Failed to run all checks cycle: ${error.message}`,
       results: { // Provide default/error states for each check
         displays: { success: false, error: 'Parent check cycle failed' },
         screenSharing: { success: false, error: 'Parent check cycle failed' },
         keyboards: { success: false, error: 'Parent check cycle failed' },
         resourceHogs: { success: false, error: 'Parent check cycle failed', resourceHogsDetected: false, processes: [] }
       }
     };
  }
}


// --- App Lifecycle ---

app.whenReady().then(() => {
    // Ensure dynamic imports complete *before* creating the window and registering IPC handlers that depend on them
    // The IIFE for imports runs early, this should be safe.
     console.log('App ready, creating window...');
     createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers for Monitoring Control ---

ipcMain.handle('start-monitoring', async () => {
  if (monitoringIntervalId) {
    console.log('Monitoring is already active.');
    return { success: false, message: 'Monitoring already active' };
  }
    if (!mainWindow || mainWindow.isDestroyed()) {
       console.error('Cannot start monitoring, main window not available.');
        return { success: false, message: 'Main window not available' };
    }

  console.log('Starting monitoring...');
  try {
      // Run checks immediately once
      const initialResults = await runAllChecks();
       if (mainWindow && !mainWindow.isDestroyed()) {
           mainWindow.webContents.send('monitoring-update', initialResults);
       }

      // Then set interval for subsequent checks
      monitoringIntervalId = setInterval(async () => {
        // console.log('Running periodic checks...'); // Reduce log noise
        const results = await runAllChecks();
         if (mainWindow && !mainWindow.isDestroyed()) {
           mainWindow.webContents.send('monitoring-update', results);
         } else {
           console.log('Main window closed or destroyed, stopping monitoring interval.');
           if (monitoringIntervalId) {
             clearInterval(monitoringIntervalId);
             monitoringIntervalId = null;
           }
         }
      }, MONITORING_INTERVAL);

      return { success: true, message: 'Monitoring started' };

  } catch (error) {
      console.error('Error during initial check run on start:', error);
      return { success: false, message: `Failed to start: ${error.message}` };
  }
});

ipcMain.handle('stop-monitoring', () => {
  if (!monitoringIntervalId) {
    console.log('Monitoring is not active.');
    return { success: false, message: 'Monitoring not active' };
  }

  console.log('Stopping monitoring...');
  clearInterval(monitoringIntervalId);
  monitoringIntervalId = null;
  return { success: true, message: 'Monitoring stopped' };
});


// --- IPC Handlers for Individual Checks (optional, kept for debugging) ---
ipcMain.handle('check-displays', checkDisplays);
ipcMain.handle('check-screen-sharing', checkScreenSharing);
ipcMain.handle('check-keyboards', checkKeyboards);
ipcMain.handle('check-resource-hogs', checkResourceHogs); // Added handle for individual check if needed