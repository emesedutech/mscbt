
import React, { useState, createContext, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="text-emerald-500" size={20} />,
  error: <AlertCircle className="text-red-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
};

const Toast: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="bg-white rounded-sm shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 flex items-start animate-in slide-in-from-top-10 duration-300">
      <div className="p-4">{ICONS[toast.type]}</div>
      <div className="flex-1 py-4 pr-10">
        <p className="text-xs font-black uppercase text-gray-800">{toast.message}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700">
        <X size={14} />
      </button>
    </div>
  );
};


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [{ id, message, type }, ...prev]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-24 right-6 z-[9999] w-full max-w-sm space-y-3">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
