'use client';
import { createContext, useContext, useRef, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = '') => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + (t.type || '')}>
          {t.message}
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
