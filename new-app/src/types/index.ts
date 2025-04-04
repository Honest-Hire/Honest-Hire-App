// Define types for our application

// Check results
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

// Application state
export interface AppState {
  displays: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: DisplayCheckResult | null;
    error: string | null;
  };
  screenSharing: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: ScreenSharingCheckResult | null;
    error: string | null;
  };
  keyboards: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: KeyboardCheckResult | null;
    error: string | null;
  };
  interviewCoder: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: InterviewCoderCheckResult | null;
    error: string | null;
  };
}

// IPC API types - we'll use this for type checking but not for extending Window
export interface IpcApi {
  on: (channel: string, listener: (...args: any[]) => void) => void;
  off: (channel: string, listener: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

// No need to redeclare Window interface as it's already defined in electron-env.d.ts
// The existing definition is:
// interface Window {
//   ipcRenderer: import('electron').IpcRenderer
// }
