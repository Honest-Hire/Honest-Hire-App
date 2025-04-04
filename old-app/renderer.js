const { ipcRenderer } = require('electron');

// Icons as SVG paths
const ICONS = {
  display: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  sharing: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  keyboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M6 8h.01"></path><path d="M10 8h.01"></path><path d="M14 8h.01"></path><path d="M18 8h.01"></path><path d="M8 12h.01"></path><path d="M12 12h.01"></path><path d="M16 12h.01"></path><path d="M7 16h10"></path></svg>`,
  loader: `<div class="spinner"></div>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  pending: `<div class="spinner"></div>`,
  restart: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
};

// Main application state
const state = {
  displays: {
    status: 'idle', // idle, pending, success, error
    result: null,
    error: null
  },
  screenSharing: {
    status: 'idle',
    result: null,
    error: null
  },
  keyboards: {
    status: 'idle',
    result: null,
    error: null
  },
  interviewCoder: {
    status: 'idle',
    result: null,
    error: null
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});

function renderApp() {
  const appElement = document.getElementById('app');
  
  appElement.innerHTML = `
    <header class="app-header">
      <div clarest not a day passes, when I have met you and did not offend me at some way or other. Aaj yeh ss="container">
        <div class="logo">
          <span>${ICONS.info}</span>
          <h1>Interview Integrity Scanner</h1>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="container">
        <div class="card animate-fade-in">
          <h2 class="card-title">Interview Integrity Check</h2>
          <p class="card-description">
            This tool helps ensure the integrity of online interviews by checking for common cheating methods.
            Click the button below to start the scan.
          </p>
          
          <div class="checks-container">
            ${renderCheckItem('displays', 'Display Configuration', ICONS.display, 'Checks if multiple displays are being used.')}
            ${renderCheckItem('screenSharing', 'Screen Sharing Check', ICONS.sharing, 'Verifies if the screen is being shared to multiple applications.')}
            ${renderCheckItem('keyboards', 'Keyboard Device Check', ICONS.keyboard, 'Detects if multiple keyboard devices are connected.')}
            ${renderCheckItem('interviewCoder', 'Interview Coder Check', ICONS.code, 'Detects if any "Interview Coder" processes are running.')}
          </div>
          
          <div class="actions">
            <button id="startBtn" class="btn btn-primary">
              ${state.displays.status === 'pending' || state.screenSharing.status === 'pending' || 
                state.keyboards.status === 'pending' || state.interviewCoder.status === 'pending'
                ? ICONS.loader + ' Scanning...' 
                : ICONS.info + ' Start Scan'}
            </button>
            <button id="resetBtn" class="btn btn-secondary">
              ${ICONS.restart} Reset
            </button>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="container">
        <p>Interview Integrity Scanner v1.0.0 | &copy; ${new Date().getFullYear()}</p>
      </div>
    </footer>
  `;
  
  // Add event listeners
  document.getElementById('startBtn').addEventListener('click', runChecks);
  document.getElementById('resetBtn').addEventListener('click', resetChecks);
}

function renderCheckItem(key, title, icon, description) {
  const checkState = state[key];
  
  // Determine status class and icon
  let statusClass = 'status-pending';
  let statusIcon = ICONS.pending;
  let statusText = 'Waiting to start';
  let detailsText = '';
  
  if (checkState.status === 'pending') {
    statusText = 'Checking...';
  } else if (checkState.status === 'success') {
    if (key === 'displays' && checkState.result.multipleDisplays) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Multiple displays detected';
      detailsText = `Found ${checkState.result.displayCount} displays. Only a single display is allowed during interviews.`;
    } else if (key === 'screenSharing' && checkState.result.isScreenBeingShared) {
      if (checkState.result.multipleShareTargets) {
        statusClass = 'status-error';
        statusIcon = ICONS.error;
        statusText = 'Multiple sharing apps detected';
        detailsText = `Screen sharing apps detected: ${checkState.result.sharingApps.join(', ')}`;
      } else {
        statusClass = 'status-warning';
        statusIcon = ICONS.warning;
        statusText = 'Screen sharing detected';
        detailsText = `Screen sharing app detected: ${checkState.result.sharingApps.join(', ')}`;
      }
    } else if (key === 'keyboards' && checkState.result.multipleKeyboards) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Multiple keyboards detected';
      detailsText = `Found ${checkState.result.keyboardCount} keyboards: ${checkState.result.keyboards.join(', ')}`;
    } else if (key === 'interviewCoder' && checkState.result.interviewCoderDetected) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Interview Coder detected';
      detailsText = `Found ${checkState.result.processCount} Interview Coder process(es). This may indicate cheating.`;
    } else {
      statusClass = 'status-success';
      statusIcon = ICONS.success;
      statusText = 'Check passed';
      
      if (key === 'displays') {
        detailsText = 'Single display configuration detected.';
      } else if (key === 'screenSharing') {
        if (checkState.result.browserDetected) {
          detailsText = 'No screen sharing apps detected. Browser is running, but no sharing activity confirmed.';
        } else {
          detailsText = 'No screen sharing apps or activity detected.';
        }
      } else if (key === 'keyboards') {
        detailsText = `Detected ${checkState.result.keyboardCount} keyboard device(s).`;
      } else if (key === 'interviewCoder') {
        detailsText = 'No Interview Coder processes detected.';
      }
    }
  } else if (checkState.status === 'error') {
    statusClass = 'status-warning';
    statusIcon = ICONS.warning;
    statusText = 'Error checking';
    detailsText = checkState.error || 'Unknown error occurred';
  }
  
  return `
    <div class="check-item animate-fade-in" id="${key}-check">
      <div class="check-header">
        <div class="check-icon">${icon}</div>
        <h3 class="check-title">${title}</h3>
      </div>
      <p>${description}</p>
      <div class="check-status">
        <span class="${statusClass}">${statusIcon} ${statusText}</span>
      </div>
      ${detailsText ? `<div class="check-details">${detailsText}</div>` : ''}
    </div>
  `;
}

async function runChecks() {
  // Update state to pending
  Object.keys(state).forEach(key => {
    state[key].status = 'pending';
    state[key].result = null;
    state[key].error = null;
  });
  
  // Re-render with pending state
  renderApp();
  
  try {
    // Check displays
    await checkDisplays();
    
    // Check screen sharing
    await checkScreenSharing();
    
    // Check keyboards
    await checkKeyboards();
    
    // Check Interview Coder processes
    await checkInterviewCoder();
  } catch (error) {
    console.error('Error running checks:', error);
  }
}

async function checkDisplays() {
  try {
    const response = await ipcRenderer.invoke('check-displays');
    state.displays.status = 'success';
    state.displays.result = response;
    renderApp();
  } catch (error) {
    state.displays.status = 'error';
    state.displays.error = error.message;
    renderApp();
  }
}

async function checkScreenSharing() {
  try {
    const response = await ipcRenderer.invoke('check-screen-sharing');
    state.screenSharing.status = 'success';
    state.screenSharing.result = response;
    renderApp();
  } catch (error) {
    state.screenSharing.status = 'error';
    state.screenSharing.error = error.message;
    renderApp();
  }
}

async function checkKeyboards() {
  try {
    const response = await ipcRenderer.invoke('check-keyboards');
    state.keyboards.status = 'success';
    state.keyboards.result = response;
    renderApp();
  } catch (error) {
    state.keyboards.status = 'error';
    state.keyboards.error = error.message;
    renderApp();
  }
}

async function checkInterviewCoder() {
  try {
    const response = await ipcRenderer.invoke('check-interview-coder');
    state.interviewCoder.status = 'success';
    state.interviewCoder.result = response;
    renderApp();
  } catch (error) {
    state.interviewCoder.status = 'error';
    state.interviewCoder.error = error.message;
    renderApp();
  }
}

function resetChecks() {
  // Reset state to idle
  Object.keys(state).forEach(key => {
    state[key].status = 'idle';
    state[key].result = null;
    state[key].error = null;
  });
  
  // Re-render with idle state
  renderApp();
}