import { useEffect } from 'react';
import '../styles/Toast.css';

export function Toast({ isVisible, message, type = 'success', duration = 4000, onClose }) {
  // Auto-close after duration
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast-container toast-${type}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}

export default Toast;
