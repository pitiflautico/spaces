'use client';

import React from 'react';
import type { Module } from '@/types';
import {
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface ModuleLogsPanelProps {
  module: Module;
  onClose: () => void;
}

export default function ModuleLogsPanel({ module, onClose }: ModuleLogsPanelProps) {
  const handleDownloadLogs = () => {
    const logsText = module.logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${log.message}${
            log.details ? '\n' + JSON.stringify(log.details, null, 2) : ''
          }`
      )
      .join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.name.replace(/\s+/g, '_')}_logs_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return <InformationCircleIcon className="w-4 h-4 text-blue-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-400" />;
    }
  };

  const getLogColor = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
    }
  };

  return (
    <div className="absolute left-0 top-full mt-2 w-full bg-[#1A1A1A] border-2 border-[#2A2A2A] rounded-xl shadow-2xl z-50 max-h-[400px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#222222] px-4 py-3 flex items-center justify-between border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-semibold text-sm">Logs</h3>
          <span className="text-gray-500 text-xs">
            ({module.logs.length} {module.logs.length === 1 ? 'entry' : 'entries'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLogs}
            disabled={module.logs.length === 0}
            className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Descargar logs"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {module.logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No hay logs disponibles</p>
            <p className="text-gray-600 text-xs mt-1">Los logs aparecerán aquí cuando el módulo se ejecute</p>
          </div>
        ) : (
          <>
            {module.logs.map((log, idx) => (
              <div key={idx} className={`rounded-lg p-3 border ${getLogColor(log.level)}`}>
                <div className="flex items-start gap-2">
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`text-xs font-semibold uppercase ${
                        log.level === 'info' ? 'text-blue-400' :
                        log.level === 'warning' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {log.level}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 text-xs text-gray-400 bg-black/30 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Error Display */}
      {module.error && (
        <div className="border-t border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-start gap-2">
            <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-semibold text-sm">Error</span>
                <span className="text-xs text-gray-500 font-mono bg-red-500/10 px-2 py-0.5 rounded">
                  {module.error.code}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{module.error.message}</p>
              <div className="flex flex-wrap gap-2">
                {module.error.recoveryActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded border border-red-500/30 transition-colors"
                  >
                    {action === 'retry' && 'Try Again'}
                    {action === 'reset' && 'Reset'}
                    {action === 'view_logs' && 'View Logs'}
                    {action === 'edit_inputs' && 'Edit Inputs'}
                    {action === 'contact_support' && 'Contact Support'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}
