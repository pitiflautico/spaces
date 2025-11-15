'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import {
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { LogEntry } from '@/types';

interface LogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogPanel({ isOpen, onClose }: LogPanelProps) {
  const { getCurrentSpace, clearLogs } = useSpaceStore();
  const currentSpace = getCurrentSpace();
  const logs = currentSpace?.logs || [];

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  const getLogBgColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Logs & Notificaciones</h2>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">
              {logs.length} {logs.length === 1 ? 'entrada' : 'entradas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('¿Borrar todos los logs?')) {
                  clearLogs();
                }
              }}
              className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Clear all logs"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <InformationCircleIcon className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No hay logs todavía</h3>
              <p className="text-sm text-gray-500">
                Los errores, warnings y eventos del sistema aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Reverse to show newest first */}
              {[...logs].reverse().map((log) => (
                <div
                  key={log.id}
                  className={`px-4 py-3 border rounded-lg ${getLogBgColor(log.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-mono">
                          {formatTime(log.timestamp)}
                        </span>
                        {log.moduleName && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-300 font-medium">
                              {log.moduleName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {log.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2A2A]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
