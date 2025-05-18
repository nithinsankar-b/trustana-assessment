import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const getLoaderSize = () => {
    switch (size) {
      case 'small': return 'w-4 h-4';
      case 'large': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  return (
    <div className="loader-container">
      <div className={`loader ${getLoaderSize()}`}></div>
      {message && <p className="mt-2 text-muted">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;