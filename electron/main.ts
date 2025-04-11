import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { ProcessDescriptor } from "ps-list";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Console log formatting utilities
const logColors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
  },
  
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m"
  }
};

const logFormatters = {
  header: (text: string) => {
    console.log(`\n${logColors.bright}${logColors.fg.cyan}======== ${text} ========${logColors.reset}\n`);
  },
  
  subheader: (text: string) => {
    console.log(`${logColors.bright}${logColors.fg.blue}---- ${text} ----${logColors.reset}`);
  },
  
  info: (text: string) => {
    console.log(`${logColors.fg.green}INFO: ${text}${logColors.reset}`);
  },
  
  warn: (text: string) => {
    console.log(`${logColors.fg.yellow}WARN: ${text}${logColors.reset}`);
  },
  
  error: (text: string) => {
    console.log(`${logColors.fg.red}ERROR: ${text}${logColors.reset}`);
  },
  
  critical: (text: string) => {
    console.log(`${logColors.bright}${logColors.fg.red}CRITICAL: ${text}${logColors.reset}`);
  },
  
  success: (text: string) => {
    console.log(`${logColors.fg.green}SUCCESS: ${text}${logColors.reset}`);
  },
  
  detail: (text: string) => {
    console.log(`  ${logColors.dim}${text}${logColors.reset}`);
  }
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let psList: () => Promise<ProcessDescriptor[]>;
let monitoringInterval: NodeJS.Timeout | null = null;
let systemStatsInterval: NodeJS.Timeout | null = null;
let networkSamplingInterval: NodeJS.Timeout | null = null;
const MEMORY_THRESHOLD_MB = 50;
const MONITORING_INTERVAL_MS = 10000; // 1 minute
const NETWORK_SAMPLING_INTERVAL_MS = 2000; // 5 seconds

// Structure to track network activity during the monitoring interval
interface NetworkActivityTracker {
  startTime: Date;
  processesWithNetworkActivity: Map<number, {
    pid: number;
    name: string;
    command?: string;
    lastSeenAt: Date;
    connectionCount: number;
    detectedTimes: number;
  }>;
  totalSamples: number;
  connections: string[];
}

let networkActivityTracker: NetworkActivityTracker = {
  startTime: new Date(),
  processesWithNetworkActivity: new Map(),
  totalSamples: 0,
  connections: []
};

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
  logFormatters.header("Initializing Honest Hire Application");
  logFormatters.info(`Platform: ${process.platform}`);
  logFormatters.info(`Node version: ${process.versions.node}`);
  logFormatters.info(`Electron version: ${process.versions.electron}`);
  logFormatters.info(`Chrome version: ${process.versions.chrome}`);
  
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
    stopMonitoring();
    win = null;
  });
  
  logFormatters.success("Application window created successfully");
  logFormatters.info("System monitoring tools loaded:");
  logFormatters.detail(`- Process monitoring (threshold: ${MEMORY_THRESHOLD_MB}MB)`);
  logFormatters.detail("- Network activity detection");
  logFormatters.detail("- Display configuration check");
  logFormatters.detail("- Continuous monitoring capability");
  
  // Register event handlers for renderer processes
  logFormatters.info("Registering IPC handlers for renderer communication");
}

app.on("window-all-closed", () => {
  stopMonitoring();
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

ipcMain.handle("start-process-monitoring", async () => {
  return await startMonitoring();
});

ipcMain.handle("stop-process-monitoring", async () => {
  return stopMonitoring();
});

ipcMain.handle("check-high-memory-processes", async () => {
  return await checkHighMemoryProcesses();
});

ipcMain.handle("check-network-activity", async () => {
  return await checkNetworkActivity();
});

async function checkDisplays() {
  try {
    logFormatters.subheader("Display Configuration Check");
    const si = await import("systeminformation");
    const displays = await si.graphics();
    const displayCount = displays.displays ? displays.displays.length : 0;

    logFormatters.info(`Detected ${displayCount} displays`);
    if (displayCount > 0) {
      logFormatters.info("Display details:");
      displays.displays.forEach((display, index) => {
        logFormatters.detail(`Display ${index + 1}:`);
        logFormatters.detail(`  Connection: ${display.connection || 'Unknown'}`);
        logFormatters.detail(`  Resolution: ${display.resolutionX}x${display.resolutionY}`);
        logFormatters.detail(`  Main: ${display.main ? 'Yes' : 'No'}`);
        logFormatters.detail(`  Builtin: ${display.builtin ? 'Yes' : 'No'}`);
      });
    }

    if (displayCount > 1) {
      logFormatters.warn(`Multiple displays detected (${displayCount})`);
    } else {
      logFormatters.success("Single display detected");
    }

    return {
      success: true,
      multipleDisplays: displayCount > 1,
      displayCount,
    };
  } catch (error) {
    logFormatters.error(`Error checking displays: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkInterviewCoder() {
  try {
    logFormatters.subheader("Interview Coder Process Check");
    if (!psList) {
      const initialized = await initPsList();
      if (!initialized) {
        throw new Error("Failed to initialize process list module");
      }
    }

    const processes = await psList();
    logFormatters.info(`Total processes analyzed: ${processes.length}`);

    const interviewCoderApps = [
      /interview\s*coder/i,
    ];

    const interviewCoderProcesses = processes.filter((process) => {
      const name = (process.name || "").toLowerCase();
      const cmd = (process.cmd || "").toLowerCase();
      return interviewCoderApps.some((app) => app.test(name) || app.test(cmd));
    });

    if (interviewCoderProcesses.length > 0) {
      logFormatters.critical("!!! INTERVIEW CODER DETECTED !!!");
      interviewCoderProcesses.forEach((proc, index) => {
        logFormatters.detail(`${index + 1}. Name: ${proc.name}, PID: ${proc.pid}, Command: ${proc.cmd || 'N/A'}`);
      });
    } else {
      logFormatters.success("No interview coder processes detected");
    }

    return {
      success: true,
      interviewCoderDetected: interviewCoderProcesses.length > 0,
      processCount: interviewCoderProcesses.length,
    };
  } catch (error) {
    logFormatters.error(`Error checking for interview coder: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkHighMemoryProcesses() {
  try {
    logFormatters.subheader("High Memory Process Check");
    const si = await import("systeminformation");
    const processData = await si.processes();
    
    logFormatters.info(`Total processes found: ${processData.list.length}`);
    
    // Filter for processes using more than MEMORY_THRESHOLD_MB
    const highMemoryProcesses = processData.list
      .filter(proc => {
        // Memory in bytes, convert to MB
        logFormatters.info(`memory of the process ${proc.name} is:  ${proc.memRss}`);
        const memoryMB = proc.memRss / (1024);
        return memoryMB > MEMORY_THRESHOLD_MB;
      })
      .map(proc => ({
        pid: proc.pid,
        name: proc.name,
        command: proc.command,
        memoryMB: Math.round(proc.memRss / (1024)),
        cpuPercent: proc.cpu
      }));

    const percentHighMem = ((highMemoryProcesses.length / processData.list.length) * 100).toFixed(1);
    logFormatters.info(`Processes using more than ${MEMORY_THRESHOLD_MB}MB memory: ${highMemoryProcesses.length} (${percentHighMem}% of total)`);
    
    if (highMemoryProcesses.length > 0) {
      logFormatters.info("Top 5 memory intensive processes:");
      highMemoryProcesses
        .sort((a, b) => b.memoryMB - a.memoryMB)
        .slice(0, 5)
        .forEach((proc, i) => {
          logFormatters.detail(`${i+1}. ${proc.name} (PID: ${proc.pid}): ${proc.memoryMB}MB, CPU: ${proc.cpuPercent.toFixed(1)}%`);
        });
    }

    return {
      success: true,
      highMemoryProcesses,
      totalCount: highMemoryProcesses.length
    };
  } catch (error) {
    logFormatters.error(`Error checking high memory processes: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function sampleNetworkActivity() {
  try {
    logFormatters.detail(`Taking network activity snapshot (sample #${networkActivityTracker.totalSamples + 1})`);
    
    // Different command based on OS
    let command = '';
    if (process.platform === 'darwin') { // macOS
      command = "lsof -i -n -P | grep ESTABLISHED";
    } else if (process.platform === 'win32') { // Windows
      command = "netstat -anob | findstr ESTABLISHED";
    } else { // Linux
      command = "ss -tuanp | grep ESTAB";
    }
    
    const { stdout } = await execAsync(command);
    
    // Process the network connections from stdout
    const connections = stdout.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.trim());
    
    // Store most recent connections for reference
    networkActivityTracker.connections = connections;
    
    // For macOS/Linux, extract PIDs from the connections
    if (process.platform === 'darwin') {
      connections.forEach(line => {
        const match = line.match(/\s+(\d+)\s+/);
        if (match && match[1]) {
          const pid = parseInt(match[1]);
          updateNetworkActivityForProcess(pid, line);
        }
      });
    } else if (process.platform === 'win32') {
      // For Windows, PIDs are on separate lines, more complex parsing required
      let currentPid: number | null = null;
      connections.forEach(line => {
        const pidMatch = line.match(/\[(\d+)\]/);
        if (pidMatch && pidMatch[1]) {
          currentPid = parseInt(pidMatch[1]);
          updateNetworkActivityForProcess(currentPid, line);
        }
      });
    } else {
      // Linux
      connections.forEach(line => {
        const pidMatch = line.match(/pid=(\d+)/);
        if (pidMatch && pidMatch[1]) {
          const pid = parseInt(pidMatch[1]);
          updateNetworkActivityForProcess(pid, line);
        }
      });
    }
    
    networkActivityTracker.totalSamples++;
    
    // Log summary of this sample
    const activePids = Array.from(networkActivityTracker.processesWithNetworkActivity.keys());
    logFormatters.detail(`Network sample complete. Found ${connections.length} connections across ${activePids.length} processes`);
    
    return true;
  } catch (error) {
    logFormatters.error(`Error sampling network activity: ${error}`);
    return false;
  }
}

async function updateNetworkActivityForProcess(pid: number, connectionLine: string) {
  try {
    // If we haven't seen this process before, get its info
    if (!networkActivityTracker.processesWithNetworkActivity.has(pid)) {
      // Get process name if possible
      let processName = "Unknown";
      let processCommand = "";
      
      try {
        if (psList) {
          const processes = await psList();
          const process = processes.find(p => p.pid === pid);
          if (process) {
            processName = process.name || "Unknown";
            processCommand = process.cmd || "";
          }
        }
      } catch (error) {
        logFormatters.error(`Failed to get name for process ${pid}: ${error}`);
      }
      
      networkActivityTracker.processesWithNetworkActivity.set(pid, {
        pid,
        name: processName,
        command: processCommand,
        lastSeenAt: new Date(),
        connectionCount: 1,
        detectedTimes: 1
      });
    } else {
      // Update existing process data
      const processData = networkActivityTracker.processesWithNetworkActivity.get(pid)!;
      processData.lastSeenAt = new Date();
      processData.connectionCount += 1;
      processData.detectedTimes += 1;
      networkActivityTracker.processesWithNetworkActivity.set(pid, processData);
    }
  } catch (error) {
    logFormatters.error(`Error updating network activity for process ${pid}: ${error}`);
  }
}

async function checkNetworkActivity() {
  try {
    logFormatters.subheader("Network Activity Check");
    
    // For an on-demand check, use the ongoing network tracking data
    // if available, otherwise do a one-time sample
    if (networkSamplingInterval === null || networkActivityTracker.totalSamples === 0) {
      await sampleNetworkActivity();
    }
    
    const processesWithNetwork = Array.from(networkActivityTracker.processesWithNetworkActivity.values());
    
    logFormatters.info(`Processes with network activity: ${processesWithNetwork.length}`);
    logFormatters.info(`Network samples taken: ${networkActivityTracker.totalSamples}`);
    logFormatters.info(`Current active connections: ${networkActivityTracker.connections.length}`);
    
    // List all processes with network activity
    if (processesWithNetwork.length > 0) {
      logFormatters.info("Top processes with network activity:");
      
      // Sort by most active (detected in most samples)
      processesWithNetwork
        .sort((a, b) => b.detectedTimes - a.detectedTimes)
        .slice(0, 10)
        .forEach((proc, i) => {
          const activationPercent = ((proc.detectedTimes / networkActivityTracker.totalSamples) * 100).toFixed(0);
          const activeText = networkActivityTracker.totalSamples > 1 
            ? ` (active in ${activationPercent}% of samples)` 
            : '';
          
          logFormatters.detail(`${i+1}. ${proc.name} (PID: ${proc.pid})${activeText}`);
        });
    }
    
    return {
      success: true,
      connections: networkActivityTracker.connections,
      networkProcessPids: Array.from(networkActivityTracker.processesWithNetworkActivity.keys()),
      networkProcesses: processesWithNetwork,
      totalSamples: networkActivityTracker.totalSamples
    };
  } catch (error) {
    logFormatters.error(`Error checking network activity: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runCombinedCheck() {
  try {
    logFormatters.header("Running Process and Network Monitoring");
    logFormatters.info(`Timestamp: ${new Date().toISOString()}`);
    
    // First get high memory processes
    const memoryResult = await checkHighMemoryProcesses();
    if (!memoryResult.success) {
      logFormatters.error(`Failed to get high memory processes: ${memoryResult.error}`);
      return memoryResult;
    }
    
    // Then check network activity
    const networkResult = await checkNetworkActivity();
    if (!networkResult.success) {
      logFormatters.error(`Failed to get network activity: ${networkResult.error}`);
      return networkResult;
    }
    
    // Ensure we have the array properties, even if empty
    const highMemoryProcesses = memoryResult.highMemoryProcesses || [];
    const networkPids = networkResult.networkProcessPids || [];
    
    // Create a set of PIDs with network activity
    const networkPidsSet = new Set(networkPids);
    
    // Filter high memory processes that also have network activity
    const suspiciousProcesses = highMemoryProcesses.filter(proc => 
      networkPidsSet.has(proc.pid)
    );
    
    logFormatters.subheader("Combined Analysis Results");
    logFormatters.info(`Suspicious processes (high memory + network): ${suspiciousProcesses.length}`);
    
    if (suspiciousProcesses.length > 0) {
      logFormatters.warn("*** Detected suspicious processes (high memory + network activity) ***");
      suspiciousProcesses.forEach((proc, index) => {
        // Get network activity data for this process if available
        const networkActivity = networkActivityTracker.processesWithNetworkActivity.get(proc.pid);
        const networkInfo = networkActivity 
          ? ` | Network: ${networkActivity.detectedTimes}/${networkActivityTracker.totalSamples} samples` 
          : '';
        
        logFormatters.detail(`${index + 1}. ${proc.name} (PID: ${proc.pid}) | Memory: ${proc.memoryMB}MB | CPU: ${proc.cpuPercent.toFixed(1)}%${networkInfo}`);
      });
    } else {
      logFormatters.success("No suspicious processes detected");
    }
    
    // If there's a frontend window, send the update
    if (win) {
      logFormatters.info("Sending monitoring update to UI");
      
      // Enrich suspicious processes with network activity data
      const enrichedSuspiciousProcesses = suspiciousProcesses.map(proc => {
        const networkActivity = networkActivityTracker.processesWithNetworkActivity.get(proc.pid);
        return {
          ...proc,
          networkActivity: networkActivity ? {
            detectedTimes: networkActivity.detectedTimes,
            totalSamples: networkActivityTracker.totalSamples,
            lastSeenAt: networkActivity.lastSeenAt
          } : null
        };
      });
      
      win.webContents.send('monitoring-update', {
        timestamp: new Date().toISOString(),
        highMemoryCount: highMemoryProcesses.length,
        networkActivityCount: networkPids.length,
        suspiciousCount: suspiciousProcesses.length,
        suspiciousProcesses: enrichedSuspiciousProcesses,
        monitoringSince: networkActivityTracker.startTime,
        networkSamples: networkActivityTracker.totalSamples
      });
    }
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      highMemoryProcesses,
      networkProcesses: networkResult.networkProcesses || [],
      suspiciousProcesses,
      suspiciousCount: suspiciousProcesses.length,
      networkSamples: networkActivityTracker.totalSamples
    };
  } catch (error) {
    logFormatters.error(`Error in combined check: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function logSystemStats() {
  try {
    const si = await import("systeminformation");
    
    // Get CPU usage
    const cpuData = await si.currentLoad();
    
    // Get memory usage
    const memData = await si.mem();
    const totalMemGB = (memData.total / (1024 * 1024 )).toFixed(2);
    const usedMemGB = (memData.used / (1024 * 1024 )).toFixed(2);
    const memPercentage = ((memData.used / memData.total) * 100).toFixed(1);
    
    // Get active network interfaces
    const netData = await si.networkStats();
    const activeInterfaces = netData.filter(net => net.tx_sec > 0 || net.rx_sec > 0);
    
    logFormatters.subheader("System Resource Usage");
    logFormatters.info(`CPU Load: ${cpuData.currentLoad.toFixed(1)}%`);
    logFormatters.info(`Memory: ${usedMemGB}GB / ${totalMemGB}GB (${memPercentage}%)`);
    logFormatters.info(`Network Interfaces: ${activeInterfaces.length} active of ${netData.length} total`);
    
    activeInterfaces.forEach(net => {
      const rxMB = (net.rx_sec / (1024 )).toFixed(2);
      const txMB = (net.tx_sec / (1024)).toFixed(2);
      logFormatters.detail(`${net.iface}: Down ${rxMB} MB/s, Up ${txMB} MB/s`);
    });
  } catch (error) {
    logFormatters.error(`Error getting system stats: ${error}`);
  }
}

function resetNetworkActivityTracker() {
  // Create a new tracker, resetting all data
  networkActivityTracker = {
    startTime: new Date(),
    processesWithNetworkActivity: new Map(),
    totalSamples: 0,
    connections: []
  };
  
  logFormatters.info("Network activity tracker reset");
}

function startMonitoring() {
  // Stop any existing monitoring
  stopMonitoring();
  
  logFormatters.header("Starting Continuous Monitoring");
  logFormatters.info(`Main check interval: ${MONITORING_INTERVAL_MS / 1000} seconds`);
  logFormatters.info(`Network sampling interval: ${NETWORK_SAMPLING_INTERVAL_MS / 1000} seconds`);
  
  // Reset network activity tracker
  resetNetworkActivityTracker();
  
  // Start network sampling at regular intervals
  logFormatters.info("Starting continuous network activity monitoring");
  networkSamplingInterval = setInterval(() => {
    sampleNetworkActivity();
  }, NETWORK_SAMPLING_INTERVAL_MS);
  
  // Run immediately
  sampleNetworkActivity().then(() => {
    runCombinedCheck();
  });
  
  logSystemStats();
  
  // Then run every minute
  monitoringInterval = setInterval(() => {
    logFormatters.info("Running scheduled monitoring check...");
    runCombinedCheck();
  }, MONITORING_INTERVAL_MS);
  
  // Log system stats every 5 minutes
  systemStatsInterval = setInterval(() => {
    logSystemStats();
  }, 5 * 60 * 1000);
  
  return {
    success: true,
    message: `Monitoring started, checking every ${MONITORING_INTERVAL_MS / 1000} seconds`
  };
}

function stopMonitoring() {
  if (monitoringInterval) {
    logFormatters.info("Stopping continuous monitoring");
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  if (systemStatsInterval) {
    clearInterval(systemStatsInterval);
    systemStatsInterval = null;
  }
  
  if (networkSamplingInterval) {
    logFormatters.info("Stopping network sampling");
    clearInterval(networkSamplingInterval);
    networkSamplingInterval = null;
  }
  
  return {
    success: true,
    message: "Monitoring stopped"
  };
}
