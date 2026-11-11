'use client';
import { useEffect } from 'react';
import { ToastProvider } from './ToastProvider';
import { SheetProvider } from './SheetProvider';
import { usePreventZoom } from '@/lib/auth';

export default function Providers({ children }) {
  useEffect(() => {
    usePreventZoom();
  }, []);
  return (
    <ToastProvider>
      <SheetProvider>{children}</SheetProvider>
    </ToastProvider>
  );
}
