'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module } from '@/types';
import {
  DocumentTextIcon,
  CubeIcon,
  SparklesIcon,
  PhotoIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import ModuleWrapper from './ModuleWrapper';
import LocalProjectAnalysisModule from '@/components/modules/LocalProjectAnalysisModule';

interface ModuleBlockProps {
  module: Module;
}

/**
 * ModuleBlock - Router de módulos
 *
 * Este componente decide qué módulo específico renderizar
 * basándose en module.type y lo envuelve en ModuleWrapper.
 *
 * Para añadir un nuevo módulo:
 * 1. Crear componente en /components/modules/NuevoModulo.tsx
 * 2. Importarlo aquí
 * 3. Añadir case en renderModuleContent()
 * 4. Definir icon en getModuleIcon()
 */
export default function ModuleBlock({ module }: ModuleBlockProps) {
  const { updateModule } = useSpaceStore();

  // Icono según tipo de módulo
  const getModuleIcon = () => {
    switch (module.type) {
      case 'local-project-analysis':
        return <DocumentTextIcon className="w-5 h-5 text-blue-400" />;
      case 'reader-engine':
        return <CubeIcon className="w-5 h-5 text-purple-400" />;
      case 'naming-engine':
        return <SparklesIcon className="w-5 h-5 text-yellow-400" />;
      case 'icon-generator':
        return <PhotoIcon className="w-5 h-5 text-pink-400" />;
      case 'marketing-pack':
        return <MegaphoneIcon className="w-5 h-5 text-green-400" />;
      default:
        return <CubeIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Handler de ejecución
  const handleRun = async () => {
    try {
      updateModule(module.id, { status: 'running' });

      // Ejecutar según tipo de módulo
      if (module.type === 'local-project-analysis') {
        const inputs = module.inputs as any;

        const response = await fetch('/api/local-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectPath: inputs.localProjectPath || '',
            includeHiddenFiles: inputs.includeHiddenFiles || false,
            includeNodeModules: inputs.includeNodeModules || false,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        updateModule(module.id, {
          status: 'done',
          outputs: {
            repositoryMetadata: data.repositoryMetadata,
            fileContents: data.fileContents,
            repoStructure: data.repoStructure,
            analysisLog: data.analysisLog,
          },
        });
      } else {
        // Otros módulos: simulación
        setTimeout(() => {
          updateModule(module.id, {
            status: 'done',
            outputs: {
              result: 'Módulo ejecutado correctamente (placeholder)',
            },
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Module execution error:', error);
      updateModule(module.id, { status: 'error' });
      alert(`Error: ${error.message}`);
    }
  };

  // Renderizar contenido específico del módulo
  const renderModuleContent = () => {
    switch (module.type) {
      case 'local-project-analysis':
        return <LocalProjectAnalysisModule module={module} />;

      case 'reader-engine':
        return (
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-3">Reader Engine</p>
            <p className="text-gray-500 text-xs">
              Procesa metadatos del proyecto y genera estructura legible.
            </p>
            <div className="mt-3 p-3 bg-dark-card rounded-lg">
              <p className="text-gray-600 text-xs">Módulo pendiente de implementación</p>
            </div>
          </div>
        );

      case 'naming-engine':
        return (
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-3">Naming Engine</p>
            <p className="text-gray-500 text-xs">
              Genera sugerencias de nombres basadas en el análisis del proyecto.
            </p>
            <div className="mt-3 p-3 bg-dark-card rounded-lg">
              <p className="text-gray-600 text-xs">Módulo pendiente de implementación</p>
            </div>
          </div>
        );

      case 'icon-generator':
        return (
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-3">Icon Generator</p>
            <p className="text-gray-500 text-xs">
              Genera iconos y logos basados en datos del proyecto.
            </p>
            <div className="mt-3 p-3 bg-dark-card rounded-lg">
              <p className="text-gray-600 text-xs">Módulo pendiente de implementación</p>
            </div>
          </div>
        );

      case 'marketing-pack':
        return (
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-3">Marketing Pack</p>
            <p className="text-gray-500 text-xs">
              Genera materiales de marketing completos (banners, descripciones, etc.).
            </p>
            <div className="mt-3 p-3 bg-dark-card rounded-lg">
              <p className="text-gray-600 text-xs">Módulo pendiente de implementación</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-4">
            <p className="text-gray-400 text-sm">Módulo desconocido: {module.type}</p>
          </div>
        );
    }
  };

  return (
    <ModuleWrapper module={module} onRun={handleRun} icon={getModuleIcon()}>
      {renderModuleContent()}
    </ModuleWrapper>
  );
}
