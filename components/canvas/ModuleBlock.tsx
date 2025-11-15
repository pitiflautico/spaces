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
        console.log('[ModuleBlock] handleRun - inputs.localProjectPath:', inputs.localProjectPath);

        // Validate that project path is configured
        if (!inputs.localProjectPath || inputs.localProjectPath.trim() === '') {
          console.error('[ModuleBlock] Validation failed - localProjectPath is empty or missing');
          throw new Error(
            'No has configurado la ruta del proyecto.\n\n' +
            'Por favor:\n' +
            '1. Haz clic en el botón "Select Folder" dentro del módulo\n' +
            '2. O escribe manualmente la ruta completa del proyecto\n' +
            '3. Luego ejecuta el módulo con el botón Play ▶'
          );
        }

        console.log('[ModuleBlock] Validation passed - calling API with path:', inputs.localProjectPath);

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
          // Try to get error message from server
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

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
        // AIE Engine Module execution
        const { getCurrentSpace } = useSpaceStore.getState();
        const space = getCurrentSpace();

        // Get AI configuration
        const aiConfig = space?.configuration?.aiConfig;
        if (!aiConfig || !aiConfig.provider) {
          throw new Error('AI Provider not configured. Please configure in Settings.');
        }

        // Get input from connected module
        const connections = space?.connections || [];
        const incomingConnection = connections.find(
          (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
        );

        if (!incomingConnection) {
          throw new Error('No input connected. Connect output from Local Project Analysis module.');
        }

        // Get the source module
        const sourceModule = space?.modules.find((m) => m.id === incomingConnection.sourceModuleId);
        if (!sourceModule || !sourceModule.outputs.projectAnalysis) {
          throw new Error('Source module has no output data. Run Local Project Analysis first.');
        }

        // Get the data from source module output
        const projectData = sourceModule.outputs.projectAnalysis;
        const { repositoryMetadata, fileContents, repoStructure } = projectData;

        // Build prompt for AI
        const prompt = `You are an expert app intelligence analyzer. Analyze the following project information and extract comprehensive app intelligence.

PROJECT METADATA:
${JSON.stringify(repositoryMetadata, null, 2)}

FILE CONTENTS:
${JSON.stringify(fileContents, null, 2)}

REPOSITORY STRUCTURE:
${JSON.stringify(repoStructure, null, 2)}

Based on this information, provide a comprehensive app intelligence analysis in the following JSON format:

{
  "summary": "A concise 1-2 sentence summary of the app",
  "category": "Main category (e.g., Developer Tools, E-commerce, Social Media)",
  "subcategories": ["Array of subcategories"],
  "features": ["Array of key features"],
  "targetAudience": "Description of target audience",
  "tone": "Description of tone and voice",
  "designStyle": "Description of design style",
  "keywords": ["Array of relevant keywords"],
  "problemsSolved": ["Array of problems this app solves"],
  "competitiveAngle": "What makes this app unique",
  "brandColorsSuggested": ["Array of hex colors like #3B82F6"],
  "iconStyleRecommendation": "Recommendation for icon style"
}

Respond ONLY with the JSON object, no additional text.`;

        // Get API key from space configuration
        const getAPIKeyForProvider = (provider: any, apiKeys: Record<string, string | undefined>) => {
          switch (provider) {
            case 'openai': return apiKeys.openai;
            case 'anthropic': return apiKeys.anthropic;
            case 'replicate': return apiKeys.replicate;
            case 'together': return apiKeys.together;
            case 'local': return undefined;
            default: return undefined;
          }
        };

        const apiKey = getAPIKeyForProvider(aiConfig.provider, space.configuration?.apiKeys || {});

        // Dynamic import for AI provider
        import('@/lib/ai-provider').then(async ({ aiProvider }) => {
          const response = await aiProvider.run(prompt, {
            ...aiConfig,
            apiKey
          });

          // Parse response
          let appIntelligence;
          try {
            appIntelligence = JSON.parse(response.outputText);
          } catch (e) {
            const jsonMatch = response.outputText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              appIntelligence = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('AI response is not valid JSON');
            }
          }

          // Update module
          updateModule(module.id, {
            status: 'done',
            outputs: {
              appIntelligence,
              aieLog: `Analysis completed using ${response.providerUsed} (${response.model})\n` +
                      `Tokens used: ${response.tokensUsed || 'N/A'}\n` +
                      `Timestamp: ${new Date().toISOString()}`
            }
          });
        }).catch((err: any) => {
          console.error('AIE Engine error:', err);
          updateModule(module.id, { status: 'error' });
          alert(`AIE Engine error: ${err.message}`);
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

  // Determinar si el módulo tiene settings
  const hasSettings = module.type === 'local-project-analysis';

  return (
    <ModuleWrapper module={module} onRun={handleRun} icon={getModuleIcon()} hasSettings={hasSettings}>
      {renderModuleContent()}
    </ModuleWrapper>
  );
}
