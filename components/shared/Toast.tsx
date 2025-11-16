'use client';

import React, { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      title: 'text-green-300',
      IconComponent: CheckCircleIcon,
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      title: 'text-red-300',
      IconComponent: ExclamationTriangleIcon,
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      title: 'text-yellow-300',
      IconComponent: ExclamationTriangleIcon,
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      title: 'text-blue-300',
      IconComponent: InformationCircleIcon,
    },
  };

  const style = styles[type];
  const Icon = style.IconComponent;

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 shadow-xl backdrop-blur-sm min-w-[300px] max-w-[400px] animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${style.title}`}>{title}</h4>
          {message && (
            <p className="text-xs text-gray-400 mt-1 break-words">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
        >
          <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
