
import { useContext } from 'react';
import { ToastContext } from '../components/ToastProvider.tsx';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    success: (message: string) => context.addToast(message, 'success'),
    error: (message: string) => context.addToast(message, 'error'),
    info: (message: string) => context.addToast(message, 'info'),
  };
};
