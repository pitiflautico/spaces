'use client';

import React from 'react';
import type { ModuleType, DataType } from '@/types';
import { MODULE_INFO } from '@/lib/moduleInfo';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModuleInfoPanelProps {
  moduleType: ModuleType;
  onClose: () => void;
}

const getDataTypeIcon = (type: DataType): string => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'text':
      return '📄';
    case 'json':
      return '{ }';
    case 'audio':
      return '🔊';
    case 'video':
      return '🎬';
    case 'mixed':
      return '🔗';
    default:
      return '📦';
  }
};

export default function ModuleInfoPanel({ moduleType, onClose }: ModuleInfoPanelProps) {
  const info = MODULE_INFO[moduleType];

  if (!info) return null;

  return (
    <div className="absolute left-full top-0 ml-4 w-96 bg-[#1A1A1A] border-2 border-blue-500/50 rounded-xl shadow-2xl z-50 max-h-[600px] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-base">{info.name}</h3>
          <p className="text-blue-100 text-xs mt-0.5">{info.shortDescription}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-blue-100 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Extended Description */}
        <section>
          <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
            Descripción
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            {info.extendedDescription}
          </p>
        </section>

        {/* When to Use */}
        <section>
          <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
            ¿Cuándo usarlo?
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">{info.whenToUse}</p>
        </section>

        {/* Inputs */}
        {info.inputs.length > 0 && (
          <section>
            <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Inputs
            </h4>
            <div className="space-y-2">
              {info.inputs.map((input, idx) => (
                <div
                  key={idx}
                  className="bg-[#2A2A2A] rounded-lg p-3 border border-[#3A3A3A]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">
                      {input.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getDataTypeIcon(input.type)} {input.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{input.description}</p>
                  {input.required && (
                    <span className="inline-block mt-1 text-xs text-red-400">
                      * Requerido
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Outputs */}
        {info.outputs.length > 0 && (
          <section>
            <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Outputs
            </h4>
            <div className="space-y-2">
              {info.outputs.map((output, idx) => (
                <div
                  key={idx}
                  className="bg-[#2A2A2A] rounded-lg p-3 border border-[#3A3A3A]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">
                      {output.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getDataTypeIcon(output.type)} {output.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{output.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Compatible Modules */}
        {info.compatibleModules.length > 0 && (
          <section>
            <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Módulos compatibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {info.compatibleModules.map((mod, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30"
                >
                  {mod}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Dependencies */}
        {info.dependencies.length > 0 && (
          <section>
            <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Dependencias
            </h4>
            <div className="flex flex-wrap gap-2">
              {info.dependencies.map((dep, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded border border-yellow-500/30"
                >
                  {dep}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Common Errors */}
        {info.commonErrors.length > 0 && (
          <section>
            <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Errores comunes
            </h4>
            <div className="space-y-2">
              {info.commonErrors.map((error, idx) => (
                <div
                  key={idx}
                  className="bg-red-500/5 rounded-lg p-3 border border-red-500/20"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 text-xs font-mono bg-red-500/10 px-2 py-0.5 rounded">
                      {error.code}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs mt-1">{error.description}</p>
                  <p className="text-green-400 text-xs mt-1">
                    💡 {error.solution}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Usage Tips */}
        {info.usageTips.length > 0 && (
          <section>
            <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Consejos de uso
            </h4>
            <ul className="space-y-1">
              {info.usageTips.map((tip, idx) => (
                <li key={idx} className="text-gray-300 text-xs flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Example Flow */}
        <section>
          <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">
            Ejemplo de flujo
          </h4>
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/30">
            <p className="text-purple-300 text-sm font-mono">{info.exampleFlow}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
