'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        success: {
          iconTheme: {
            primary: '#00ff88',
            secondary: '#1a1a2e',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff4444',
            secondary: '#1a1a2e',
          },
        },
      }}
    />
  );
}
