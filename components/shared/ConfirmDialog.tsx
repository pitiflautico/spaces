'use client';

import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const style = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-start gap-3">
          <div className={`${style.bg} ${style.border} border rounded-lg p-2`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${style.icon}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[#2A2A2A] rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#2A2A2A] flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel(); // Close dialog after confirm
            }}
            className={`px-4 py-2 ${style.button} text-white rounded-lg text-sm font-medium transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
