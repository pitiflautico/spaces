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
import AIEEngineModule from '@/components/modules/AIEEngineModule';
import NamingEngineModule from '@/components/modules/NamingEngineModule';
import LogoGeneratorModule from '@/components/modules/LogoGeneratorModule';

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
  const { updateModule, addLog } = useSpaceStore();

  // Icono según tipo de módulo
  const getModuleIcon = () => {
    switch (module.type) {
      case 'local-project-analysis':
        return <DocumentTextIcon className="w-5 h-5 text-blue-400" />;
      case 'reader-engine':
        return <SparklesIcon className="w-5 h-5 text-orange-400" />;
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
      addLog('info', `Ejecutando ${module.name}...`, module.id);

      // Ejecutar según tipo de módulo
      if (module.type === 'local-project-analysis') {
        const inputs = module.inputs as any;

        console.log('[ModuleBlock] handleRun - module.inputs:', module.inputs);

        // Check if we have a folder handle stored
        const { getFolderHandle } = await import('@/lib/folder-permissions');
        const { analyzeProjectFromHandle } = await import('@/lib/browser-file-scanner');

        let folderHandle: FileSystemDirectoryHandle | null = null;

        // If folderId is set, get the handle from IndexedDB
        if (inputs.folderId) {
          console.log('[ModuleBlock] Getting folder handle for ID:', inputs.folderId);
          folderHandle = await getFolderHandle(inputs.folderId);
        }

        // If no handle, try to pick a folder
        if (!folderHandle) {
          if ('showDirectoryPicker' in window) {
            try {
              // @ts-ignore - File System Access API
              const selectedHandle = await window.showDirectoryPicker({ mode: 'read' });
              folderHandle = selectedHandle;
              console.log('[ModuleBlock] User selected folder:', selectedHandle.name);
            } catch (error: any) {
              if (error.name === 'AbortError') {
                throw new Error('Selección de carpeta cancelada. Por favor selecciona una carpeta para analizar.');
              }
              throw error;
            }
          } else {
            throw new Error(
              'Tu navegador no soporta la selección de carpetas.\n\n' +
              'Por favor usa Chrome, Edge o un navegador compatible.'
            );
          }
        }

        if (!folderHandle) {
          throw new Error('No se pudo obtener acceso a la carpeta. Intenta nuevamente.');
        }

        // Request permission if needed
        const { requestPermission } = await import('@/lib/folder-permissions');
        const hasPermission = await requestPermission(folderHandle);

        if (!hasPermission) {
          throw new Error('Permiso denegado para acceder a la carpeta. Por favor concede acceso cuando el navegador lo solicite.');
        }

        console.log('[ModuleBlock] Analyzing project from browser...');
        addLog('info', 'Escaneando archivos del proyecto...', module.id);

        // Analyze project using browser-based scanner
        const data = await analyzeProjectFromHandle(folderHandle, {
          includeHiddenFiles: inputs.includeHiddenFiles || false,
          includeNodeModules: inputs.includeNodeModules || false,
        });

        // Combine all outputs into single JSON object
        updateModule(module.id, {
          status: 'done',
          outputs: {
            projectAnalysis: {
              repositoryMetadata: data.repositoryMetadata,
              fileContents: data.fileContents,
              repoStructure: data.repoStructure,
              analysisLog: data.analysisLog,
            },
          },
        });

        addLog('success', `${module.name} completado exitosamente`, module.id);
      } else if (module.type === 'reader-engine') {
        // AIE Engine Module - trigger the component's internal handleRun via event
        const event = new CustomEvent('aie-engine-run', { detail: { moduleId: module.id } });
        window.dispatchEvent(event);
        return;
      } else if (module.type === 'naming-engine') {
        // Naming Engine Module - trigger the component's internal handleRun via event
        const event = new CustomEvent('naming-engine-run', { detail: { moduleId: module.id } });
        window.dispatchEvent(event);
        return;
      } else if (module.type === 'icon-generator') {
        // Logo Generator Module - trigger the component's internal handleRun via event
        const event = new CustomEvent('logo-generator-run', { detail: { moduleId: module.id } });
        window.dispatchEvent(event);
        return;
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
      updateModule(module.id, { status: 'error', errorMessage: error.message });
      addLog('error', error.message, module.id);
    }
  };

  // Renderizar contenido específico del módulo
  const renderModuleContent = () => {
    switch (module.type) {
      case 'local-project-analysis':
        return <LocalProjectAnalysisModule module={module} />;

      case 'reader-engine':
        return <AIEEngineModule module={module} />;

      case 'naming-engine':
        return <NamingEngineModule module={module} />;

      case 'icon-generator':
        return <LogoGeneratorModule module={module} />;

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

  // Determinar si el módulo tiene settings
  const hasSettings = module.type === 'local-project-analysis';

  return (
    <ModuleWrapper module={module} onRun={handleRun} icon={getModuleIcon()} hasSettings={hasSettings}>
      {renderModuleContent()}
    </ModuleWrapper>
  );
}
