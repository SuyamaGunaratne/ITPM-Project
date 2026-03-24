import { useState, useRef, useCallback } from 'react';

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

export default function useNotification() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, out: true } : t))
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 420);
  }, []);

  const showNotification = useCallback(
    (type = 'info', title = '', message = '') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [{ id, type, title, message, out: false }, ...prev]);
      timers.current[id] = setTimeout(() => dismiss(id), 3200);
      return id;
    },
    [dismiss]
  );

  const pauseTimer = useCallback((id) => {
    clearTimeout(timers.current[id]);
  }, []);

  const resumeTimer = useCallback(
    (id) => {
      timers.current[id] = setTimeout(() => dismiss(id), 1800);
    },
    [dismiss]
  );

  const NotificationPortal = useCallback(
    () => (
      <div id="toast-stack" aria-live="polite" className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto flex items-start gap-3 p-4 w-80 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform
              ${toast.out ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
              ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 dark:bg-green-900/30 dark:border-green-800' : ''}
              ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 dark:bg-red-900/30 dark:border-red-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-50/90 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800' : ''}
            `}
            onClick={() => dismiss(toast.id)}
            onMouseEnter={() => pauseTimer(toast.id)}
            onMouseLeave={() => resumeTimer(toast.id)}
          >
            <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold
              ${toast.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-800/50 dark:text-green-400' : ''}
              ${toast.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-800/50 dark:text-red-400' : ''}
              ${toast.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800/50 dark:text-yellow-400' : ''}
            `} aria-hidden="true">
              {ICONS[toast.type]}
            </span>
            <div className="flex-1 min-w-0">
              {toast.title && <div className={`font-semibold text-sm ${
                toast.type === 'success' ? 'text-green-800 dark:text-green-300' :
                toast.type === 'error' ? 'text-red-800 dark:text-red-300' :
                toast.type === 'info' ? 'text-blue-800 dark:text-blue-300' :
                'text-yellow-800 dark:text-yellow-300'
              }`}>{toast.title}</div>}
              {toast.message && <div className={`text-xs mt-0.5 ${
                toast.type === 'success' ? 'text-green-600 dark:text-green-400/80' :
                toast.type === 'error' ? 'text-red-600 dark:text-red-400/80' :
                toast.type === 'info' ? 'text-blue-600 dark:text-blue-400/80' :
                'text-yellow-600 dark:text-yellow-400/80'
              }`}>{toast.message}</div>}
            </div>
            <button className="flex-shrink-0 ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    ),
    [toasts, dismiss, pauseTimer, resumeTimer]
  );

  return { showNotification, NotificationPortal };
}
