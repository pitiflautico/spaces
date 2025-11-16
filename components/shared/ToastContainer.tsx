'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useSpaceStore();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}
