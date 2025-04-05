import React from 'react';
import { 
  SuccessIcon, 
  ErrorIcon, 
  WarningIcon, 
  Spinner 
} from './Icons';

interface CheckItemProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  result: any;
  error: string | null;
}

const CheckItem: React.FC<CheckItemProps> = ({
  id,
  title,
  icon,
  description,
  status,
  result,
  error
}) => {
  let statusClass = 'status-pending';
  let statusIcon = <Spinner />;
  let statusText = 'Waiting to start';
  let detailsText = '';
  
  if (status === 'pending') {
    statusText = 'Checking...';
  } else if (status === 'success') {
    if (id === 'displays' && result?.multipleDisplays) {
      statusClass = 'status-error';
      statusIcon = <ErrorIcon />;
      statusText = 'Multiple displays detected';
      detailsText = `Found ${result.displayCount} displays. Only a single display is allowed during interviews.`;
    } else if (id === 'screenSharing' && result?.isScreenBeingShared) {
      if (result.multipleShareTargets) {
        statusClass = 'status-error';
        statusIcon = <ErrorIcon />;
        statusText = 'Multiple sharing apps detected';
        detailsText = `Screen sharing apps detected: ${result.sharingApps.join(', ')}`;
      } else {
        statusClass = 'status-warning';
        statusIcon = <WarningIcon />;
        statusText = 'Screen sharing detected';
        detailsText = `Screen sharing app detected: ${result.sharingApps.join(', ')}`;
      }
    } else if (id === 'keyboards' && result?.multipleKeyboards) {
      statusClass = 'status-error';
      statusIcon = <ErrorIcon />;
      statusText = 'Multiple keyboards detected';
      detailsText = `Found ${result.keyboardCount} keyboards: ${result.keyboards.join(', ')}`;
    } else if (id === 'interviewCoder' && result?.interviewCoderDetected) {
      statusClass = 'status-error';
      statusIcon = <ErrorIcon />;
      statusText = 'Interview Coder detected';
      detailsText = `Found ${result.processCount} Interview Coder process(es). This may indicate cheating.`;
    } else {
      statusClass = 'status-success';
      statusIcon = <SuccessIcon />;
      statusText = 'Check passed';
      
      if (id === 'displays') {
        detailsText = 'Single display configuration detected.';
      } else if (id === 'screenSharing') {
        if (result?.browserDetected) {
          detailsText = 'No screen sharing apps detected. Browser is running, but no sharing activity confirmed.';
        } else {
          detailsText = 'No screen sharing apps or activity detected.';
        }
      } else if (id === 'keyboards') {
        detailsText = `Detected ${result?.keyboardCount} keyboard device(s).`;
      } else if (id === 'interviewCoder') {
        detailsText = 'No Interview Coder processes detected.';
      }
    }
  } else if (status === 'error') {
    statusClass = 'status-warning';
    statusIcon = <WarningIcon />;
    statusText = 'Error checking';
    detailsText = error || 'Unknown error occurred';
  }
  
  return (
    <div className={`check-item animate-fade-in`} id={`${id}-check`}>
      <div className="check-header">
        <div className="check-icon">{icon}</div>
        <h3 className="check-title">{title}</h3>
      </div>
      <p>{description}</p>
      <div className="check-status">
        <span className={statusClass}>
          {statusIcon} {statusText}
        </span>
      </div>
      {detailsText && <div className="check-details">{detailsText}</div>}
    </div>
  );
};

export default CheckItem;
