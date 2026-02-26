import { useState } from 'react';

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    singleButton: false,
  });

  const showAlert = (title, message, type = 'info', callback = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: callback,
      confirmText: 'OK',
      cancelText: '',
      singleButton: true,
    });
  };

  const showConfirm = (title, message, onYes, onNo = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: onYes,
      confirmText: 'Yes',
      cancelText: 'No',
      singleButton: false,
    });
  };

  const showSuccess = (title, message, callback = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'success',
      onConfirm: callback,
      confirmText: 'OK',
      cancelText: '',
      singleButton: true,
    });
  };

  const showError = (title, message, callback = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'error',
      onConfirm: callback,
      confirmText: 'OK',
      cancelText: '',
      singleButton: true,
    });
  };

  const showWarning = (title, message, onYes, onNo = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      onConfirm: onYes,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      singleButton: false,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

  return {
    modal,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    closeModal,
    handleConfirm,
  };
};

export default useModal;
