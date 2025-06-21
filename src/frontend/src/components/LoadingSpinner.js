import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    default: 'spinner-default',
    large: 'spinner-large'
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]}`}>
      <Loader2 className="spinner-icon" />
      {size !== 'small' && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;