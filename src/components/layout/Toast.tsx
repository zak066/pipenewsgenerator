import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error', 6000), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);
  const warning = useCallback((message: string) => addToast(message, 'warning'), [addToast]);

  useEffect(() => {
    const handleToastEvent = (e: CustomEvent) => {
      const { message, type } = e.detail;
      addToast(message, type || 'info');
    };
    window.addEventListener('toast', handleToastEvent as EventListener);
    return () => window.removeEventListener('toast', handleToastEvent as EventListener);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'bg-green-50', border: 'border-green-500', icon: '✓' },
  error: { bg: 'bg-red-50', border: 'border-red-500', icon: '✕' },
  info: { bg: 'bg-blue-50', border: 'border-blue-500', icon: 'ℹ' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', icon: '⚠' },
};

const typeTextStyles: Record<ToastType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
  warning: 'text-yellow-800',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const styles = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`${styles.bg} ${styles.border} border-l-4 p-4 rounded shadow-lg flex items-start gap-3 animate-slide-in`}
          >
            <span className={`${typeTextStyles[toast.type]} text-lg`}>{styles.icon}</span>
            <p className={`flex-1 ${typeTextStyles[toast.type]} text-sm`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}