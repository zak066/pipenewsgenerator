import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className={`
        relative bg-white rounded-lg shadow-xl w-full ${sizeStyles[size]} mx-4
        animate-scale-in
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t bg-gray-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: { confirm: 'bg-red-600 hover:bg-red-700', icon: '⚠️' },
    warning: { confirm: 'bg-orange-600 hover:bg-orange-700', icon: '⚡' },
    info: { confirm: 'bg-blue-600 hover:bg-blue-700', icon: 'ℹ️' },
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <span className="text-4xl mb-4">{styles.icon}</span>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2 ${styles.confirm} text-white rounded transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}