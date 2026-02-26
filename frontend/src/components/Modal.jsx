import '../styles/Modal.css';

export function Modal({ isOpen, title, message, type = 'info', onClose, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', singleButton = false }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'confirm':
        return '?';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon modal-icon-${type}`}>
          {getIcon()}
        </div>
        
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        
        <div className="modal-actions">
          {!singleButton && (
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button 
            className={`modal-btn modal-btn-${type}`}
            onClick={onConfirm || onClose}
          >
            {singleButton ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
