export function Modal({ isOpen, title, message, type = 'info', onClose, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', singleButton = false }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'confirm': return '?';
      default: return 'ℹ';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-400';
      default: return 'text-primary-600 bg-primary-100 dark:bg-primary-900/50 dark:text-primary-400';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30';
      case 'error': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/30';
      default: return 'btn-primary';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-slate-200 dark:border-dark-border p-6 transform transition-all scale-100 opacity-100 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ${getColors()}`}>
            {getIcon()}
          </div>
          
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{message}</p>
          
          <div className="flex gap-3 w-full">
            {!singleButton && (
              <button 
                className="flex-1 py-3 px-4 rounded-xl font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
            <button 
              className={`flex-1 flex justify-center py-3 px-4 rounded-xl font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 ${getButtonClass()}`}
              onClick={onConfirm || onClose}
            >
              {singleButton ? 'OK' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
