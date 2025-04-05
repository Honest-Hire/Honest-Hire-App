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

export interface AppState {
  displays: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: DisplayCheckResult | null;
    error: string | null;
  };
  interviewCoder: {
    status: 'idle' | 'pending' | 'success' | 'error';
    result: InterviewCoderCheckResult | null;
    error: string | null;
  };
}

export interface IpcApi {
  on: (channel: string, listener: (...args: any[]) => void) => void;
  off: (channel: string, listener: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}