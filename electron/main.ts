import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { ProcessDescriptor } from "ps-list";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let psList: () => Promise<ProcessDescriptor[]>;

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

initPsList();

let win: BrowserWindow | null;

function createWindow() {
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

  if (hasIcon) {
    windowOptions.icon = iconPath;
  }

  win = new BrowserWindow(windowOptions);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

ipcMain.handle("check-displays", async () => {
  return await checkDisplays();
});

ipcMain.handle("check-interview-coder", async () => {
  return await checkInterviewCoder();
});

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

async function checkInterviewCoder() {
  try {
    if (!psList) {
      const initialized = await initPsList();
      if (!initialized) {
        throw new Error("Failed to initialize process list module");
      }
    }

    const processes = await psList();

    const interviewCoderApps = [
      /interview\s*coder/i,
    ];

    const interviewCoderProcesses = processes.filter((process) => {
      const name = (process.name || "").toLowerCase();
      const cmd = (process.cmd || "").toLowerCase();
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
