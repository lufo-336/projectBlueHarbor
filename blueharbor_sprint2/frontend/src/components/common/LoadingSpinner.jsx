// frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Caricamento...', fullPage = false }) => {
  const sizes = {
    small: 'spinner-sm',
    medium: 'spinner-md',
    large: 'spinner-lg',
  };

  const content = (
    <div className="spinner-container">
      <div className={`spinner ${sizes[size]}`}></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="spinner-fullpage">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;