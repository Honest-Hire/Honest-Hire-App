const { app, BrowserWindow, ipcMain, screen, desktopCapturer } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const si = require('systeminformation');
const fs = require('fs');

// Initialize store variable and psList - will be set after dynamic import
let store;
let psList;

// Immediately invoke an async function to set up the store and psList
(async () => {
  // Dynamic import for electron-store (ES Module)
  const Store = await import('electron-store');
  store = new Store.default();
  
  // Dynamic import for ps-list (ES Module)
  psList = (await import('ps-list')).default;
})();

let mainWindow;

function createWindow() {
  // Create the browser window
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Check if icon exists, otherwise don't include icon option
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const hasIcon = fs.existsSync(iconPath);
  
  const windowOptions = {
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
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
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
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

// IPC communication handlers
ipcMain.handle('check-displays', async () => {
  try {
    const displays = await si.graphics();
    const displayCount = displays.displays ? displays.displays.length : 0;
    return {
      success: true,
      multipleDisplays: displayCount > 1,
      displayCount
    };
  } catch (error) {
    console.error('Error checking displays:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('check-screen-sharing', async () => {
  try {
    // Make sure psList is loaded before using it
    if (!psList) {
      psList = (await import('ps-list')).default;
    }
    
    // Get all running processes
    const processes = await psList();
    
    // Define known screen sharing applications with their process names
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
    
    // Check for common screen recording utilities on macOS
    const macOSScreenRecordingUtils = [
      { name: 'QuickTime Player Screen Recording', processNames: ['com.apple.screencapture', 'QuickTimePlayerX'] },
      { name: 'Screenshot App', processNames: ['Screenshot', 'screencaptureui'] },
      { name: 'ScreenFlow', processNames: ['screenflow'] },
      { name: 'Loom', processNames: ['loom'] },
      { name: 'Snagit', processNames: ['snagit', 'snagiteditor'] }
    ];
    
    // Combine all apps to check
    const allAppsToCheck = [...knownScreenSharingApps];
    if (process.platform === 'darwin') {
      allAppsToCheck.push(...macOSScreenRecordingUtils);
    }
    
    // Find all running screen sharing applications
    const detectedApps = [];
    
    // Check process names
    for (const app of allAppsToCheck) {
      const found = processes.some(process => {
        const name = (process.name || '').toLowerCase();
        const cmd = (process.cmd || '').toLowerCase();
        
        return app.processNames.some(processName => 
          name.includes(processName.toLowerCase()) || 
          cmd.includes(processName.toLowerCase())
        );
      });
      
      if (found) {
        detectedApps.push(app.name);
      }
    }
    
    // Browser-based screen sharing check (Chrome, Firefox, Edge, Safari)
    // Simplified approach - just detect browsers and note they MIGHT be used for sharing
    const browserProcessPatterns = ['chrome', 'firefox', 'safari', 'msedge'];
    let browserDetected = false;
    
    for (const browserPattern of browserProcessPatterns) {
      const hasBrowser = processes.some(process => {
        const name = (process.name || '').toLowerCase();
        const cmd = (process.cmd || '').toLowerCase();
        return name.includes(browserPattern) || cmd.includes(browserPattern);
      });
      
      if (hasBrowser) {
        browserDetected = true;
        break;
      }
    }
    
    if (browserDetected && detectedApps.length > 0) {
      // If we find both browsers and sharing apps, there might be browser-based sharing too
      if (!detectedApps.includes('Browser-based screen sharing')) {
        detectedApps.push('Browser-based screen sharing (possible)');
      }
    }
    
    return {
      success: true,
      multipleShareTargets: detectedApps.length > 1,
      isScreenBeingShared: detectedApps.length > 0,
      sharingApps: detectedApps,
      browserDetected: browserDetected
    };
  } catch (error) {
    console.error('Error checking screen sharing:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('check-interview-coder', async () => {
  try {
    // Make sure psList is loaded before using it
    if (!psList) {
      psList = (await import('ps-list')).default;
    }
    
    // Get all running processes
    const processes = await psList();
    
    // Define the pattern to search for 'interview coder' in process names
    const interviewCoderPattern = /interview\s*coder/i;
    
    // Find processes matching the pattern
    const matchingProcesses = processes.filter(proc => {
      const name = (proc.name || '').toLowerCase();
      const cmd = (proc.cmd || '').toLowerCase();
      
      return interviewCoderPattern.test(name) || interviewCoderPattern.test(cmd);
    });
    
    return {
      success: true,
      interviewCoderDetected: matchingProcesses.length > 0,
      processCount: matchingProcesses.length,
      processes: matchingProcesses.map(p => ({
        pid: p.pid,
        name: p.name || 'Unknown Process',
        cmd: p.cmd || 'Unknown Command'
      }))
    };
  } catch (error) {
    console.error('Error checking for Interview Coder processes:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('check-keyboards', async () => {
  try {
    // Get USB devices
    const devices = await si.usb();
    const keyboardDevices = devices.filter(device => {
      const description = (device.name || '').toLowerCase();
      return description.includes('keyboard') || description.includes('input');
    });
    
    return {
      success: true,
      multipleKeyboards: keyboardDevices.length > 1,
      keyboardCount: keyboardDevices.length,
      keyboards: keyboardDevices.map(k => k.name || 'Unknown Keyboard')
    };
  } catch (error) {
    console.error('Error checking keyboards:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Fix for run-all-checks handler - implement with direct function calls
ipcMain.handle('run-all-checks', async () => {
  try {
    // Define helper functions that implement the same checks
    const checkDisplays = async () => {
      try {
        const displays = await si.graphics();
        const displayCount = displays.displays ? displays.displays.length : 0;
        return {
          success: true,
          multipleDisplays: displayCount > 1,
          displayCount
        };
      } catch (error) {
        console.error('Error checking displays:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };

    const checkScreenSharing = async () => {
      try {
        // Make sure psList is loaded before using it
        if (!psList) {
          psList = (await import('ps-list')).default;
        }
        
        // Get all running processes
        const processes = await psList();
        
        // Define known screen sharing applications with their process names
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
        
        // Check for common screen recording utilities on macOS
        const macOSScreenRecordingUtils = [
          { name: 'QuickTime Player Screen Recording', processNames: ['com.apple.screencapture', 'QuickTimePlayerX'] },
          { name: 'Screenshot App', processNames: ['Screenshot', 'screencaptureui'] },
          { name: 'ScreenFlow', processNames: ['screenflow'] },
          { name: 'Loom', processNames: ['loom'] },
          { name: 'Snagit', processNames: ['snagit', 'snagiteditor'] }
        ];
        
        // Combine all apps to check
        const allAppsToCheck = [...knownScreenSharingApps];
        if (process.platform === 'darwin') {
          allAppsToCheck.push(...macOSScreenRecordingUtils);
        }
        
        // Find all running screen sharing applications
        const detectedApps = [];
        
        // Check process names
        for (const app of allAppsToCheck) {
          const found = processes.some(process => {
            const name = (process.name || '').toLowerCase();
            const cmd = (process.cmd || '').toLowerCase();
            
            return app.processNames.some(processName => 
              name.includes(processName.toLowerCase()) || 
              cmd.includes(processName.toLowerCase())
            );
          });
          
          if (found) {
            detectedApps.push(app.name);
          }
        }
        
        // Browser-based screen sharing check (Chrome, Firefox, Edge, Safari)
        // Simplified approach - just detect browsers and note they MIGHT be used for sharing
        const browserProcessPatterns = ['chrome', 'firefox', 'safari', 'msedge'];
        let browserDetected = false;
        
        for (const browserPattern of browserProcessPatterns) {
          const hasBrowser = processes.some(process => {
            const name = (process.name || '').toLowerCase();
            const cmd = (process.cmd || '').toLowerCase();
            return name.includes(browserPattern) || cmd.includes(browserPattern);
          });
          
          if (hasBrowser) {
            browserDetected = true;
            break;
          }
        }
        
        if (browserDetected && detectedApps.length > 0) {
          // If we find both browsers and sharing apps, there might be browser-based sharing too
          if (!detectedApps.includes('Browser-based screen sharing')) {
            detectedApps.push('Browser-based screen sharing (possible)');
          }
        }
        
        return {
          success: true,
          multipleShareTargets: detectedApps.length > 1,
          isScreenBeingShared: detectedApps.length > 0,
          sharingApps: detectedApps,
          browserDetected: browserDetected
        };
      } catch (error) {
        console.error('Error checking screen sharing:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };

    const checkKeyboards = async () => {
      try {
        const devices = await si.usb();
        const keyboardDevices = devices.filter(device => {
          const description = (device.name || '').toLowerCase();
          return description.includes('keyboard') || description.includes('input');
        });
        
        return {
          success: true,
          multipleKeyboards: keyboardDevices.length > 1,
          keyboardCount: keyboardDevices.length,
          keyboards: keyboardDevices.map(k => k.name || 'Unknown Keyboard')
        };
      } catch (error) {
        console.error('Error checking keyboards:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };

    const checkInterviewCoder = async () => {
      try {
        // Make sure psList is loaded before using it
        if (!psList) {
          psList = (await import('ps-list')).default;
        }
        
        // Get all running processes
        const processes = await psList();
        
        // Define the pattern to search for 'interview coder' in process names
        const interviewCoderPattern = /interview\s*coder/i;
        
        // Find processes matching the pattern
        const matchingProcesses = processes.filter(proc => {
          const name = (proc.name || '').toLowerCase();
          const cmd = (proc.cmd || '').toLowerCase();
          
          return interviewCoderPattern.test(name) || interviewCoderPattern.test(cmd);
        });
        
        return {
          success: true,
          interviewCoderDetected: matchingProcesses.length > 0,
          processCount: matchingProcesses.length,
          processes: matchingProcesses.map(p => ({
            pid: p.pid,
            name: p.name || 'Unknown Process',
            cmd: p.cmd || 'Unknown Command'
          }))
        };
      } catch (error) {
        console.error('Error checking for Interview Coder processes:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };

    // Call the functions directly
    const displayCheck = await checkDisplays();
    const sharingCheck = await checkScreenSharing();
    const keyboardCheck = await checkKeyboards();
    const interviewCoderCheck = await checkInterviewCoder();
    
    return {
      displays: displayCheck,
      screenSharing: sharingCheck,
      keyboards: keyboardCheck,
      interviewCoder: interviewCoderCheck
    };
  } catch (error) {
    console.error('Error running all checks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}); 