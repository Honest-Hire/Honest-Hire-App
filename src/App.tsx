import { useState } from 'react';
import CheckItem from './components/CheckItem';
import { 
  DisplayIcon,
  CodeIcon, 
  InfoIcon, 
  RestartIcon, 
  Spinner 
} from './components/Icons';
import { AppState } from './types';
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
    }
  });

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
      }
    }));
    
    try {
      await checkDisplays();
      await checkInterviewCoder();
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
      }
    });
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
              This tool helps ensure the integrity of online interviews by checking for common cheating methods.
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
            </div>
            
            <div className="actions">
              <button 
                onClick={runChecks} 
                className="btn btn-primary"
                disabled={
                  state.displays.status === 'pending' || 
                  state.interviewCoder.status === 'pending'
                }
              >
                {(state.displays.status === 'pending' || 
                  state.interviewCoder.status === 'pending') 
                  ? <><Spinner /> Scanning...</> 
                  : <><InfoIcon /> Start Scan</>
                }
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
