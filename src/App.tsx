import { useState, useEffect } from 'react';
import CheckItem from './components/CheckItem';
import { 
  DisplayIcon,
  CodeIcon, 
  InfoIcon, 
  RestartIcon, 
  Spinner,
  NetworkIcon,
  MemoryIcon,
  MonitorIcon
} from './components/Icons';
import { AppState, MonitoringUpdate, SuspiciousProcess } from './types';
import './App.css';

function App() {
  const [state, setState] = useState<AppState>({
    displays: {
      status: 'idle',
      result: null,
      error: null
    },
    interviewCoder: {
      status: 'idle',
      result: null,
      error: null
    },
    highMemoryProcesses: {
      status: 'idle',
      result: null,
      error: null
    },
    networkActivity: {
      status: 'idle',
      result: null,
      error: null
    }
  });
  
  const [monitoring, setMonitoring] = useState({
    active: false,
    lastUpdate: null as MonitoringUpdate | null,
    suspiciousProcesses: [] as SuspiciousProcess[]
  });

  useEffect(() => {
    // Set up listener for monitoring updates
    const handleMonitoringUpdate = (_event: any, data: MonitoringUpdate) => {
      setMonitoring(prev => ({
        ...prev,
        lastUpdate: data,
        suspiciousProcesses: data.suspiciousProcesses
      }));
    };
    
    window.ipcRenderer.on('monitoring-update', handleMonitoringUpdate);
    
    return () => {
      window.ipcRenderer.off('monitoring-update', handleMonitoringUpdate);
    };
  }, []);

  const runChecks = async () => {
    setState(prevState => ({
      displays: {
        ...prevState.displays,
        status: 'pending',
        result: null,
        error: null
      },
      interviewCoder: {
        ...prevState.interviewCoder,
        status: 'pending',
        result: null,
        error: null
      },
      highMemoryProcesses: {
        ...prevState.highMemoryProcesses,
        status: 'pending',
        result: null,
        error: null
      },
      networkActivity: {
        ...prevState.networkActivity,
        status: 'pending',
        result: null,
        error: null
      }
    }));
    
    try {
      await checkDisplays();
      await checkInterviewCoder();
      await checkHighMemoryProcesses();
      await checkNetworkActivity();
    } catch (error) {
      console.error('Error running checks:', error);
    }
  };

  const resetChecks = () => {
    setState({
      displays: {
        status: 'idle',
        result: null,
        error: null
      },
      interviewCoder: {
        status: 'idle',
        result: null,
        error: null
      },
      highMemoryProcesses: {
        status: 'idle',
        result: null,
        error: null
      },
      networkActivity: {
        status: 'idle',
        result: null,
        error: null
      }
    });
    
    // Also stop monitoring
    if (monitoring.active) {
      toggleMonitoring();
    }
  };

  const checkDisplays = async () => {
    try {
      const result = await window.ipcRenderer.invoke('check-displays');
      setState(prevState => ({
        ...prevState,
        displays: {
          status: 'success',
          result,
          error: null
        }
      }));
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        displays: {
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const checkInterviewCoder = async () => {
    try {
      const result = await window.ipcRenderer.invoke('check-interview-coder');
      setState(prevState => ({
        ...prevState,
        interviewCoder: {
          status: 'success',
          result,
          error: null
        }
      }));
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        interviewCoder: {
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };
  
  const checkHighMemoryProcesses = async () => {
    try {
      const result = await window.ipcRenderer.invoke('check-high-memory-processes');
      setState(prevState => ({
        ...prevState,
        highMemoryProcesses: {
          status: 'success',
          result,
          error: null
        }
      }));
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        highMemoryProcesses: {
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };
  
  const checkNetworkActivity = async () => {
    try {
      const result = await window.ipcRenderer.invoke('check-network-activity');
      setState(prevState => ({
        ...prevState,
        networkActivity: {
          status: 'success',
          result,
          error: null
        }
      }));
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        networkActivity: {
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };
  
  const toggleMonitoring = async () => {
    if (monitoring.active) {
      // Stop monitoring
      await window.ipcRenderer.invoke('stop-process-monitoring');
      setMonitoring(prev => ({
        ...prev,
        active: false
      }));
    } else {
      // Start monitoring
      await window.ipcRenderer.invoke('start-process-monitoring');
      setMonitoring(prev => ({
        ...prev,
        active: true
      }));
    }
  };

  return (
    <div id="app">
      <header className="app-header">
        <div className="container">
          <div className="logo">
            <span><InfoIcon /></span>
            <h1>Honest Hire Integrity Check</h1>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <div className="card animate-fade-in">
            <h2 className="card-title">Honest Hire Integrity Check</h2>
            <p className="card-description">
              This tool helps ensure the integrity of online interviews by monitoring system resources and network activity.
              Click the button below to start the scan.
            </p>
            
            <div className="checks-container">
              <CheckItem
                id="displays"
                title="Display Configuration"
                icon={<DisplayIcon />}
                description="Checks if multiple displays are being used."
                status={state.displays.status}
                result={state.displays.result}
                error={state.displays.error}
              />
              <CheckItem
                id="interviewCoder"
                title="Interview Coder Check"
                icon={<CodeIcon />}
                description="Detects if any 'Interview Coder' processes are running."
                status={state.interviewCoder.status}
                result={state.interviewCoder.result}
                error={state.interviewCoder.error}
              />
              <CheckItem
                id="highMemoryProcesses"
                title="High Memory Usage Processes"
                icon={<MemoryIcon />}
                description="Identifies processes using more than 50MB of memory."
                status={state.highMemoryProcesses.status}
                result={state.highMemoryProcesses.result}
                error={state.highMemoryProcesses.error}
              />
              <CheckItem
                id="networkActivity"
                title="Network Activity"
                icon={<NetworkIcon />}
                description="Checks for processes with active network connections."
                status={state.networkActivity.status}
                result={state.networkActivity.result}
                error={state.networkActivity.error}
              />
            </div>
            
            {monitoring.active && monitoring.lastUpdate && (
              <div className="monitoring-panel">
                <h3>
                  <MonitorIcon /> Live Monitoring <span className="monitoring-active-badge">Active</span>
                </h3>
                <p className="last-update">
                  Last updated: {new Date(monitoring.lastUpdate.timestamp).toLocaleTimeString()}
                  {monitoring.lastUpdate.monitoringSince && (
                    <span> | Monitoring since: {new Date(monitoring.lastUpdate.monitoringSince).toLocaleTimeString()}</span>
                  )}
                  {monitoring.lastUpdate.networkSamples && (
                    <span> | Network samples: {monitoring.lastUpdate.networkSamples}</span>
                  )}
                </p>
                
                <div className="monitoring-stats">
                  <div className="stat">
                    <span className="label">High memory processes:</span>
                    <span className="value">{monitoring.lastUpdate.highMemoryCount}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Network processes:</span>
                    <span className="value">{monitoring.lastUpdate.networkActivityCount}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Suspicious processes:</span>
                    <span className={`value ${monitoring.lastUpdate.suspiciousCount > 0 ? 'alert' : ''}`}>
                      {monitoring.lastUpdate.suspiciousCount}
                    </span>
                  </div>
                </div>
                
                {monitoring.suspiciousProcesses.length > 0 && (
                  <div className="suspicious-processes">
                    <h4>Suspicious Processes (High Memory + Network Activity)</h4>
                    <ul>
                      {monitoring.suspiciousProcesses.map((proc) => {
                        const networkDetails = proc.networkActivity 
                          ? ` | Network: ${proc.networkActivity.detectedTimes}/${proc.networkActivity.totalSamples} samples (${
                              Math.round((proc.networkActivity.detectedTimes / proc.networkActivity.totalSamples) * 100)
                            }%)` 
                          : '';
                        
                        return (
                          <li key={proc.pid} className="suspicious-process-item">
                            <div className="process-name">
                              <strong>{proc.name}</strong> (PID: {proc.pid})
                            </div>
                            <div className="process-details">
                              Memory: {proc.memoryMB}MB | CPU: {proc.cpuPercent.toFixed(1)}%{networkDetails}
                            </div>
                            {proc.networkActivity && (
                              <div className="timestamp">
                                Last network activity: {new Date(proc.networkActivity.lastSeenAt).toLocaleTimeString()}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="actions">
              <button 
                onClick={runChecks} 
                className="btn btn-primary"
                disabled={
                  state.displays.status === 'pending' || 
                  state.interviewCoder.status === 'pending' ||
                  state.highMemoryProcesses.status === 'pending' ||
                  state.networkActivity.status === 'pending'
                }
              >
                {(state.displays.status === 'pending' || 
                  state.interviewCoder.status === 'pending' ||
                  state.highMemoryProcesses.status === 'pending' ||
                  state.networkActivity.status === 'pending') 
                  ? <><Spinner /> Scanning...</> 
                  : <><InfoIcon /> Start Scan</>
                }
              </button>
              <button 
                onClick={toggleMonitoring} 
                className={`btn ${monitoring.active ? 'btn-warning' : 'btn-secondary'}`}
              >
                <MonitorIcon /> {monitoring.active ? 'Stop Monitoring' : 'Start Continuous Monitoring'}
              </button>
              <button onClick={resetChecks} className="btn btn-secondary">
                <RestartIcon /> Reset
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <p>Honest Hire Integrity Scanner v1.0.0 | &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
