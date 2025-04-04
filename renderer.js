const { ipcRenderer } = require('electron');

// Icons (no changes needed here unless you want a new icon for resource hogs)
const ICONS = {
  display: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  sharing: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  keyboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M6 8h.01"></path><path d="M10 8h.01"></path><path d="M14 8h.01"></path><path d="M18 8h.01"></path><path d="M8 12h.01"></path><path d="M12 12h.01"></path><path d="M16 12h.01"></path><path d="M7 16h10"></path></svg>`,
  // Using 'zap' icon for resource usage check - add if you like, or keep using 'code'
  // zap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`, // Keep using code for now
  loader: `<div class="spinner"></div>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  pending: `<div class="spinner-small"></div>`, // Use a smaller spinner for pending status within items
  restart: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>`, // Will reuse for Stop button
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`
};


// Main application state
let state = {
  monitoring: false, // Track if monitoring is active
  displays: {
    status: 'idle', // idle, pending, success, error, warning
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
  resourceHogs: { // Renamed from interviewCoder
    status: 'idle',
    result: null,
    error: null
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  renderApp(); // Initial render
  setupIPCListeners(); // Setup listener for updates from main process
});

function setupIPCListeners() {
  ipcRenderer.on('monitoring-update', (event, response) => {
    console.log('Received monitoring update:', response);
    if (response.success && response.results) {
        // Update state for each check based on received results
        Object.keys(response.results).forEach(key => {
            if (state.hasOwnProperty(key)) { // Check if the key exists in our state
                const checkResult = response.results[key];
                if (checkResult.success) {
                    state[key].status = 'success'; // Base status, will be refined in renderCheckItem
                    state[key].result = checkResult;
                    state[key].error = null;
                } else {
                    state[key].status = 'error'; // Mark as error if the check itself failed
                    state[key].result = checkResult.result || null; // Keep partial results if available
                    state[key].error = checkResult.error || 'Check failed';
                }
            }
        });
    } else if (!response.success) {
        // Handle the case where the entire runAllChecks failed
        console.error("Error during monitoring cycle:", response.error);
        Object.keys(state).forEach(key => {
            if (key !== 'monitoring') {
                state[key].status = 'error';
                state[key].error = response.error || 'Monitoring cycle failed';
            }
        });
    }

    state.monitoring = true; // Ensure monitoring state is true if we receive updates
    renderApp(); // Re-render UI with updated state
  });
}

function renderApp() {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  appElement.innerHTML = `
    <header class="app-header">
      <div class="container">
        <div class="logo">
          <span>${ICONS.info}</span>
          <h1>Interview Integrity Scanner</h1>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <div class="card animate-fade-in">
          <h2 class="card-title">System Monitoring</h2>
          <p class="card-description">
            This tool continuously monitors your system for potential integrity concerns during the interview.
            ${state.monitoring ? 'Monitoring is active.' : 'Click "Start Monitoring" to begin.'}
          </p>

          <div class="checks-container">
            ${renderCheckItem('displays', 'Display Configuration', ICONS.display, 'Checks for multiple displays.')}
            ${renderCheckItem('screenSharing', 'Screen Sharing Check', ICONS.sharing, 'Checks for active screen sharing applications.')}
            ${renderCheckItem('keyboards', 'Keyboard Device Check', ICONS.keyboard, 'Checks for multiple connected keyboards.')}
            ${renderCheckItem('resourceHogs', 'Resource Usage Check', ICONS.code, 'Detects non-system processes with high memory usage (>50MB) and network activity.')}
          </div>

          <div class="actions">
            <button id="startMonitorBtn" class="btn btn-primary" ${state.monitoring ? 'disabled' : ''}>
              ${state.monitoring ? ICONS.loader + ' Monitoring...' : ICONS.play + ' Start Monitoring'}
            </button>
            <button id="stopMonitorBtn" class="btn btn-secondary" ${!state.monitoring ? 'disabled' : ''}>
              ${ICONS.stop} Stop Monitoring
            </button>
          </div>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <div class="container">
        <p>Interview Integrity Scanner v1.1.0 | &copy; ${new Date().getFullYear()}</p>
      </div>
    </footer>
  `;

  // Add event listeners (ensure they are added only once or appropriately managed)
   const startBtn = document.getElementById('startMonitorBtn');
   const stopBtn = document.getElementById('stopMonitorBtn');

   if (startBtn) {
       // Remove existing listener before adding a new one to prevent duplicates if renderApp is called multiple times
       startBtn.replaceWith(startBtn.cloneNode(true)); // Clone to remove listeners
       document.getElementById('startMonitorBtn').addEventListener('click', startMonitoring);
   }
   if (stopBtn) {
       stopBtn.replaceWith(stopBtn.cloneNode(true)); // Clone to remove listeners
       document.getElementById('stopMonitorBtn').addEventListener('click', stopMonitoring);
   }
   // Re-apply disabled states after cloning
    if (document.getElementById('startMonitorBtn')) document.getElementById('startMonitorBtn').disabled = state.monitoring;
    if (document.getElementById('stopMonitorBtn')) document.getElementById('stopMonitorBtn').disabled = !state.monitoring;

}


function renderCheckItem(key, title, icon, description) {
  const checkState = state[key];
  let statusClass = 'status-idle';
  let statusIcon = ICONS.info;
  let statusText = 'Idle';
  let detailsText = '';
  if (checkState.status === 'idle') {
    statusIcon = `<span class="idle-icon">${icon}</span>`;
    statusText = 'Waiting';
  } else if (checkState.status === 'pending') {
    statusClass = 'status-pending';
    statusIcon = ICONS.pending;
    statusText = 'Checking...';
  } else if (checkState.status === 'error') {
    statusClass = 'status-warning';
    statusIcon = ICONS.warning;
    statusText = 'Check Error';
    detailsText = checkState.error || 'Could not perform check.';
  } else if (checkState.status === 'success') {
    statusClass = 'status-success';
    statusIcon = ICONS.success;
    statusText = 'Passed';
    if (key === 'displays' && checkState.result?.multipleDisplays) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Failed';
      detailsText = `Multiple displays detected (${checkState.result.displayCount}). Only one display is permitted.`;
    } else if (key === 'displays') {
      detailsText = `Single display detected (${checkState.result?.displayCount || 1}).`;
    }
    if (key === 'screenSharing' && checkState.result?.isScreenBeingShared) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Failed';
      detailsText = `Screen sharing application(s) detected: ${checkState.result.sharingApps.join(', ')}. Please close them.`;
    } else if (key === 'screenSharing') {
      detailsText = checkState.result?.browserDetected
        ? 'No dedicated screen sharing apps detected. Note: Browser is running.'
        : 'No screen sharing activity detected.';
    }
    if (key === 'keyboards' && checkState.result?.multipleKeyboards) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Failed';
      detailsText = `Multiple keyboards/HID devices detected (${checkState.result.keyboardCount}): ${checkState.result.keyboards.join(', ')}.`;
    } else if (key === 'keyboards') {
      detailsText = `Single keyboard/HID device detected (${checkState.result?.keyboardCount || 1}).`;
    }
    if (key === 'resourceHogs' && checkState.result?.resourceHogsDetected) {
      statusClass = 'status-error';
      statusIcon = ICONS.error;
      statusText = 'Failed';
      const processList = checkState.result.processes.map(p => `${p.name} (PID: ${p.pid}, Mem: ${p.memoryUsageKB}KB)`);
      detailsText = `High memory/network usage detected in: ${processList.join('; ')}. Please close these processes to pass the test.`;
    } else if (key === 'resourceHogs' && checkState.status !== 'error') {
      detailsText = 'No non-system processes found with high memory and network usage.';
      if (checkState.result && checkState.result.success === false && checkState.result.error) {
        statusClass = 'status-warning';
        statusIcon = ICONS.warning;
        statusText = 'Check Warning';
        detailsText = `Check completed with issues: ${checkState.result.error}`;
      }
    }
  }
  return `
    <div class="check-item animate-fade-in" id="${key}-check">
      <div class="check-header">
        <div class="check-icon">${icon}</div>
        <h3 class="check-title">${title}</h3>
        <div class="check-status ${statusClass}">
            ${statusIcon} <span class="status-text">${statusText}</span>
        </div>
      </div>
      <p class="check-description">${description}</p>
      ${detailsText ? `<div class="check-details">${detailsText}</div>` : ''}
    </div>
  `;
}

async function startMonitoring() {
  console.log('Requesting to start monitoring...');
  // Update UI immediately to show pending state? Or wait for first update?
   // Let's disable start button immediately and show loader text
    state.monitoring = true; // Tentatively set monitoring to true
    Object.keys(state).forEach(key => {
        if(key !== 'monitoring') state[key].status = 'pending'; // Set checks to pending
    });
    renderApp(); // Re-render to show pending and disable start button

  try {
    const response = await ipcRenderer.invoke('start-monitoring');
    if (!response.success) {
        console.error('Failed to start monitoring:', response.message);
        // Revert state if starting failed
        state.monitoring = false;
        resetChecksToIdle(); // Reset status back to idle
        renderApp(); // Render again to reflect failure
    } else {
        console.log('Monitoring started successfully.');
        // UI will be updated via the 'monitoring-update' event listener
    }

  } catch (error) {
    console.error('Error invoking start-monitoring:', error);
    state.monitoring = false; // Revert state on error
    resetChecksToIdle();
    renderApp(); // Render again to reflect failure
  }
}

async function stopMonitoring() {
  console.log('Requesting to stop monitoring...');
  try {
    const response = await ipcRenderer.invoke('stop-monitoring');
     if (response.success) {
       console.log('Monitoring stopped successfully.');
       state.monitoring = false;
       resetChecksToIdle(); // Reset status to idle when stopped
       renderApp(); // Re-render to update button states and statuses
     } else {
         console.error('Failed to stop monitoring:', response.message);
         // Maybe keep UI as is, or force stop state?
         state.monitoring = false; // Assume stopped even if main process reported failure
         resetChecksToIdle();
         renderApp();
     }
  } catch (error) {
    console.error('Error invoking stop-monitoring:', error);
     // Assume stopped on error?
      state.monitoring = false;
      resetChecksToIdle();
      renderApp();
  }
}

// Helper to reset check statuses to idle
function resetChecksToIdle() {
  Object.keys(state).forEach(key => {
    if (key !== 'monitoring' && state[key] && typeof state[key] === 'object') {
      state[key].status = 'idle';
      state[key].result = null;
      state[key].error = null;
    }
  });
}