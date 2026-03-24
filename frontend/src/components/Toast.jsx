import { useEffect } from 'react';

export function Toast({ isVisible, message, type = 'success', duration = 4000, onClose }) {
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
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  const getToastColors = () => {
    switch (type) {
      case 'success': return 'bg-green-50/90 border-green-200 dark:bg-green-900/40 dark:border-green-800 text-green-800 dark:text-green-100';
      case 'error': return 'bg-red-50/90 border-red-200 dark:bg-red-900/40 dark:border-red-800 text-red-800 dark:text-red-100';
      case 'warning': return 'bg-yellow-50/90 border-yellow-200 dark:bg-yellow-900/40 dark:border-yellow-800 text-yellow-800 dark:text-yellow-100';
      default: return 'bg-blue-50/90 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 text-blue-800 dark:text-blue-100';
    }
  };

  const getIconColors = () => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600 dark:bg-green-800/50 dark:text-green-400';
      case 'error': return 'bg-red-100 text-red-600 dark:bg-red-800/50 dark:text-red-400';
      case 'warning': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800/50 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-3 p-4 w-80 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform ${getToastColors()}`}>
      <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold ${getIconColors()}`}>
        {getIcon()}
      </span>
      <div className="flex-1 min-w-0 font-medium text-sm">
        {message}
      </div>
      <button 
        className="flex-shrink-0 ml-4 text-current opacity-50 hover:opacity-100 transition-opacity" 
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

export default Toast;
