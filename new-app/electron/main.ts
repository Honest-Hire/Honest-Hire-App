import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { ProcessDescriptor } from "ps-list";

// For TypeScript
type UsbDevice = {
  name?: string;
  manufacturer?: string;
  [key: string]: any;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Initialize store and psList
// const store = new Store()
let psList: () => Promise<ProcessDescriptor[]>;

// Dynamically import ps-list (ES Module)
const initPsList = async () => {
  try {
    const psListModule = await import("ps-list");
    psList = psListModule.default;
    return true;
  } catch (error) {
    console.error("Failed to initialize ps-list:", error);
    return false;
  }
};

// Initialize psList
initPsList();

let win: BrowserWindow | null;

function createWindow() {
  // Create the browser window
  // const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // Check if icon exists, otherwise don't include icon option
  // const iconPath = path.join(process.env.VITE_PUBLIC, 'electron-vite.svg')
  const iconPath = path.join(__dirname, "assets", "icon.png");
  const hasIcon = fs.existsSync(iconPath);

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  };

  // Add icon only if it exists
  if (hasIcon) {
    windowOptions.icon = iconPath;
  }

  win = new BrowserWindow(windowOptions);

  // Load the index.html file
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  // Open DevTools in development mode
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  win.once("ready-to-show", () => {
    win?.show();
  });

  win.on("closed", () => {
    win = null;
  });
}

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// IPC communication handlers
ipcMain.handle("check-displays", async () => {
  return await checkDisplays();
});

ipcMain.handle("check-screen-sharing", async () => {
  return await checkScreenSharing();
});

ipcMain.handle("check-keyboards", async () => {
  return await checkKeyboards();
});

ipcMain.handle("check-interview-coder", async () => {
  return await checkInterviewCoder();
});

// Define helper functions that implement the checks
async function checkDisplays() {
  try {
    const si = await import("systeminformation");
    const displays = await si.graphics();
    const displayCount = displays.displays ? displays.displays.length : 0;

    return {
      success: true,
      multipleDisplays: displayCount > 1,
      displayCount,
    };
  } catch (error) {
    console.error("Error checking displays:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkScreenSharing() {
  try {
    // Make sure psList is loaded before using it
    if (!psList) {
      const psListModule = await import("ps-list");
      psList = psListModule.default;
    }

    // Get all running processes
    const processes = await psList();

    // Define known screen sharing applications with their process names
    const knownScreenSharingApps = [
      { name: "Zoom", processNames: ["zoom", "zoomshare", "caphost"] },
      { name: "Microsoft Teams", processNames: ["teams", "teams.exe"] },
      { name: "Discord", processNames: ["discord", "discord.exe"] },
      { name: "Skype", processNames: ["skype", "skype.exe"] },
      { name: "Google Meet", processNames: ["meet.google.com"] },
      { name: "WebEx", processNames: ["webex", "webexmta", "webexhost"] },
      {
        name: "OBS Studio",
        processNames: ["obs", "obs-studio", "obs64", "obs.exe"],
      },
      { name: "TeamViewer", processNames: ["teamviewer", "teamviewer.exe"] },
      { name: "AnyDesk", processNames: ["anydesk", "anydesk.exe"] },
      {
        name: "Chrome Remote Desktop",
        processNames: ["chrome-remote-desktop", "remoting_host"],
      },
      { name: "VLC", processNames: ["vlc", "vlc.exe"] },
      { name: "QuickTime Player", processNames: ["quicktimeplayer"] },
      { name: "Slack", processNames: ["slack", "slack.exe"] },
    ];

    // Check for common screen recording utilities on macOS
    const macOSScreenRecordingUtils = [
      {
        name: "QuickTime Player Screen Recording",
        processNames: ["com.apple.screencapture", "QuickTimePlayerX"],
      },
      {
        name: "Screenshot App",
        processNames: ["Screenshot", "screencaptureui"],
      },
      { name: "ScreenFlow", processNames: ["screenflow"] },
      { name: "Loom", processNames: ["loom"] },
      { name: "Snagit", processNames: ["snagit", "snagiteditor"] },
    ];

    // Combine all apps to check
    const allAppsToCheck = [...knownScreenSharingApps];
    if (process.platform === "darwin") {
      allAppsToCheck.push(...macOSScreenRecordingUtils);
    }

    // Find all running screen sharing applications
    const detectedApps: string[] = [];

    // Check process names
    for (const app of allAppsToCheck) {
      const found = processes.some((process) => {
        const name = (process.name || "").toLowerCase();
        const cmd = (process.cmd || "").toLowerCase();

        return app.processNames.some(
          (processName) =>
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
    const browserProcessPatterns = ["chrome", "firefox", "safari", "msedge"];
    let browserDetected = false;

    for (const browserPattern of browserProcessPatterns) {
      const hasBrowser = processes.some((process) => {
        const name = (process.name || "").toLowerCase();
        const cmd = (process.cmd || "").toLowerCase();
        return name.includes(browserPattern) || cmd.includes(browserPattern);
      });

      if (hasBrowser) {
        browserDetected = true;
        break;
      }
    }

    if (browserDetected && detectedApps.length > 0) {
      // If we find both browsers and sharing apps, there might be browser-based sharing too
      if (!detectedApps.includes("Browser-based screen sharing")) {
        detectedApps.push("Browser-based screen sharing (possible)");
      }
    }

    return {
      success: true,
      multipleShareTargets: detectedApps.length > 1,
      isScreenBeingShared: detectedApps.length > 0,
      sharingApps: detectedApps,
      browserDetected: browserDetected,
    };
  } catch (error) {
    console.error("Error checking screen sharing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkKeyboards() {
  try {
    // Use systeminformation to get USB devices
    const si = await import("systeminformation");
    const usbData = (await si.usb()) as UsbDevice[];

    // Filter for keyboard devices
    const keyboards = usbData.filter((device: UsbDevice) => {
      const name = (device.name || "").toLowerCase();
      const manufacturer = (device.manufacturer || "").toLowerCase();

      // Common keywords for keyboard devices
      return (
        name.includes("keyboard") ||
        name.includes("kbd") ||
        manufacturer.includes("keyboard") ||
        name.includes("input device") ||
        name.includes("hid")
      );
    });

    return {
      success: true,
      multipleKeyboards: keyboards.length > 1,
      keyboardCount: keyboards.length,
      keyboards: keyboards.map(
        (kb: UsbDevice) => kb.name || "Unknown Keyboard"
      ),
    };
  } catch (error) {
    console.error("Error checking keyboards:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkInterviewCoder() {
  try {
    // Make sure psList is loaded before using it
    if (!psList) {
      const initialized = await initPsList();
      if (!initialized) {
        throw new Error("Failed to initialize process list module");
      }
    }

    // Get all running processes
    const processes = await psList();

    const interviewCoderApps = [
      /interview\s*coder/i,
      /interview/i,
      /cheat/i,
      /hack/i,
      /Interview\s*Helper/i,
      /Code\s*Assist/i,
      /Interview\s*Buddy/i,
      /Code\s*Helper/i,
      /Interview\s*Assistant/i,
      /Code\s*Whisperer/i,
      /Interview\s*Whisperer/i,
    ];

    // Find all processes that match interview coder patterns
    const interviewCoderProcesses = processes.filter((process) => {
      const name = (process.name || "").toLowerCase();
      const cmd = (process.cmd || "").toLowerCase();
      console.log(name + "\n");
      return interviewCoderApps.some((app) => app.test(name) || app.test(cmd));
    });

    console.log("Process check complete:", {
      processCount: processes.length,
      interviewCoderDetected: interviewCoderProcesses.length > 0,
      matchedProcesses: interviewCoderProcesses,
    });

    return {
      success: true,
      interviewCoderDetected: interviewCoderProcesses.length > 0,
      processCount: interviewCoderProcesses.length,
    };
  } catch (error) {
    console.error("Error checking for interview coder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
