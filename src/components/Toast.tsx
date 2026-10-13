import React, { createContext, useContext, useState } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-2 pointer-events-none">
        {toasts.map(toast => {
          const bg = toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-brand-red' : 'bg-brand-dark';
          return (
            <div
              key={toast.id}
              className={`${bg} text-white text-xs md:text-sm font-bold px-4 py-3 rounded shadow-xl flex items-center space-x-2 animate-slide-in pointer-events-auto max-w-sm`}
            >
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
