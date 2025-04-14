export interface DisplayCheckResult {
  success: boolean;
  multipleDisplays?: boolean;
  displayCount?: number;
  error?: string;
}

export interface ScreenSharingCheckResult {
  success: boolean;
  multipleShareTargets?: boolean;
  isScreenBeingShared?: boolean;
  sharingApps?: string[];
  browserDetected?: boolean;
  error?: string;
}

export interface KeyboardCheckResult {
  success: boolean;
  multipleKeyboards?: boolean;
  keyboardCount?: number;
  keyboards?: string[];
  error?: string;
}

export interface InterviewCoderCheckResult {
  success: boolean;
  interviewCoderDetected?: boolean;
  processCount?: number;
  error?: string;
}

export interface NetworkActivityInfo {
  detectedTimes: number;
  totalSamples: number;
  lastSeenAt: Date;
}

export interface SuspiciousProcess {
  pid: number;
  name: string;
  command: string;
  memoryMB: number;
  cpuPercent: number;
  networkActivity?: NetworkActivityInfo | null;
}

export interface HighMemoryProcessResult {
  success: boolean;
  highMemoryProcesses?: SuspiciousProcess[];
  totalCount?: number;
  error?: string;
}

export interface NetworkProcess {
  pid: number;
  name: string;
  command?: string;
  lastSeenAt: Date;
  connectionCount: number;
  detectedTimes: number;
}

export interface NetworkActivityResult {
  success: boolean;
  connections?: string[];
  networkProcessPids?: number[];
  networkProcesses?: NetworkProcess[];
  totalSamples?: number;
  error?: string;
}

export interface MonitoringUpdate {
  timestamp: string;
  highMemoryCount: number;
  networkActivityCount: number;
  suspiciousCount: number;
  suspiciousProcesses: SuspiciousProcess[];
  monitoringSince?: Date;
  networkSamples?: number;
}

export interface AppState {
  displays: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: DisplayCheckResult | null;
    error: string | null;
  };
  networkActivity: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: NetworkActivityResult | null;
    error: string | null;
  };
}

export interface IpcApi {
  on: (channel: string, listener: (...args: any[]) => void) => void;
  off: (channel: string, listener: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}