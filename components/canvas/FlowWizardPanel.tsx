'use client';

import React, { useState, useEffect } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { ModuleType, Module } from '@/types';
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface FlowStep {
  id: number;
  moduleType: ModuleType;
  name: string;
  description: string;
  icon: string;
  requiredInputs?: string[];
  hasVariants?: boolean; // Si el módulo genera múltiples opciones
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    moduleType: 'local-project-analysis',
    name: 'Analyze Project',
    description: 'Scan your local project folder',
    icon: '🔍',
  },
  {
    id: 2,
    moduleType: 'reader-engine',
    name: 'AI Engine',
    description: 'Extract app intelligence',
    icon: '🧠',
    requiredInputs: ['local-project-analysis'],
  },
  {
    id: 3,
    moduleType: 'naming-engine',
    name: 'Generate Names',
    description: 'Create app name suggestions',
    icon: '💡',
    requiredInputs: ['reader-engine'],
    hasVariants: true,
  },
  {
    id: 4,
    moduleType: 'icon-generator',
    name: 'Generate Logos',
    description: 'Create logo variants',
    icon: '🎨',
    requiredInputs: ['naming-engine'],
    hasVariants: true,
  },
  {
    id: 5,
    moduleType: 'app-icon-generator',
    name: 'Generate App Icons',
    description: 'Create iOS & Android icons',
    icon: '📱',
    requiredInputs: ['icon-generator', 'naming-engine'],
    hasVariants: true,
  },
  {
    id: 6,
    moduleType: 'metadata-generator',
    name: 'Generate Metadata',
    description: 'App Store & Play Store descriptions',
    icon: '📝',
    requiredInputs: ['reader-engine', 'naming-engine', 'naming-engine'], // in-1: AppIntelligence, in-2: NamingPackage, in-3: ChosenName
    hasVariants: true,
  },
  {
    id: 7,
    moduleType: 'screenshot-generator',
    name: 'Generate Screenshots',
    description: 'iOS Simulator automation',
    icon: '📸',
    requiredInputs: ['metadata-generator'],
  },
  {
    id: 8,
    moduleType: 'appstore-connect',
    name: 'Upload to App Store',
    description: 'Automate App Store Connect',
    icon: '🚀',
    requiredInputs: ['metadata-generator', 'screenshot-generator'], // in-1: metadata, in-2: screenshots
  },
];

interface FlowWizardPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlowWizardPanel({ isOpen, onClose }: FlowWizardPanelProps) {
  const { getCurrentSpace, addModule, addConnection, canvasState } = useSpaceStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [flowModules, setFlowModules] = useState<Map<number, Module>>(new Map());
  const [isRunning, setIsRunning] = useState(false);

  const space = getCurrentSpace();

  // Monitor module status changes
  useEffect(() => {
    if (!isRunning || !space) return;

    const currentModule = flowModules.get(currentStep);
    if (!currentModule) return;

    const spaceModule = space.modules.find(m => m.id === currentModule.id);
    if (!spaceModule) return;

    // Check if module finished executing
    if (spaceModule.status === 'done') {
      const step = FLOW_STEPS[currentStep];

      // If module has variants, wait for user to select
      if (step.hasVariants) {
        // User needs to select a variant before continuing
        // We'll show a "Continue" button in the UI
        return;
      }

      // Auto-advance to next step
      handleNextStep();
    }
  }, [space?.modules, currentStep, flowModules, isRunning]);

  const handleStartFlow = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setFlowModules(new Map());

    // Add first module
    addStepModule(0);
  };

  const addStepModule = (stepIndex: number) => {
    const step = FLOW_STEPS[stepIndex];
    if (!step) return;

    // Calculate position in a vertical flow
    const x = 100;
    const y = 100 + (stepIndex * 200);

    const position = {
      x: (x - canvasState.pan.x) / canvasState.zoom,
      y: (y - canvasState.pan.y) / canvasState.zoom,
    };

    // Add module
    const moduleId = `flow-module-${Date.now()}-${stepIndex}`;
    addModule(step.moduleType, position);

    // Get the newly created module
    setTimeout(() => {
      const newSpace = getCurrentSpace();
      if (!newSpace) return;

      const newModule = newSpace.modules[newSpace.modules.length - 1];

      setFlowModules(prev => new Map(prev).set(stepIndex, newModule));

      // Connect to previous module if needed
      if (step.requiredInputs && stepIndex > 0) {
        connectToPreviousModule(newModule, stepIndex);
      }
    }, 100);
  };

  const connectToPreviousModule = (currentModule: Module, currentStepIndex: number) => {
    const step = FLOW_STEPS[currentStepIndex];
    if (!step.requiredInputs) return;

    // Track how many times we've seen each module type
    const moduleTypeCounts: Record<string, number> = {};

    // Find previous modules by type
    step.requiredInputs.forEach((requiredType, index) => {
      // Find the step that provides this input
      const prevStepIndex = FLOW_STEPS.findIndex(s => s.moduleType === requiredType as ModuleType);
      if (prevStepIndex === -1) return;

      const prevModule = flowModules.get(prevStepIndex);
      if (!prevModule) return;

      // Determine which output to use
      // If we've seen this module type before, use the next output
      const outputIndex = moduleTypeCounts[requiredType] || 0;
      moduleTypeCounts[requiredType] = outputIndex + 1;

      // Connect output of previous to input of current
      const sourcePort = prevModule.ports.output[outputIndex]; // Use appropriate output
      const targetPort = currentModule.ports.input[index]; // Use corresponding input

      if (sourcePort && targetPort) {
        addConnection({
          sourceModuleId: prevModule.id,
          sourcePortId: sourcePort.id,
          targetModuleId: currentModule.id,
          targetPortId: targetPort.id,
          dataType: sourcePort.dataType!,
        });
      }
    });
  };

  const handleNextStep = () => {
    // Mark current as completed
    setCompletedSteps(prev => new Set(prev).add(currentStep));

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < FLOW_STEPS.length) {
      setCurrentStep(nextStep);
      addStepModule(nextStep);
    } else {
      // Flow completed!
      setIsRunning(false);
      alert('🎉 Flow completed! All modules have been created and connected.');
      onClose();
    }
  };

  const handleContinueAfterVariantSelection = () => {
    // User selected a variant, continue to next step
    handleNextStep();
  };

  const handleStopFlow = () => {
    if (confirm('Stop the guided flow? Modules already created will remain.')) {
      setIsRunning(false);
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setFlowModules(new Map());
    }
  };

  if (!isOpen) return null;

  const currentFlowStep = FLOW_STEPS[currentStep];
  const currentModule = flowModules.get(currentStep);
  const moduleStatus = currentModule ? space?.modules.find(m => m.id === currentModule.id)?.status : null;

  return (
    <div className="relative">
      {/* Panel - Sin backdrop para no bloquear interacción */}
      <div className="fixed right-0 top-0 h-screen w-[450px] bg-[#1A1A1A] border-l border-[#2A2A2A] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">🎯 Guided Flow</h2>
            <p className="text-xs text-gray-400 mt-1">Build your app step by step</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!isRunning ? (
            // Start screen
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Complete App Flow</h3>
                <p className="text-sm text-gray-400">
                  This wizard will guide you through creating a complete app marketing flow from project analysis to App Store upload.
                </p>
              </div>

              {/* Steps preview */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Flow Steps ({FLOW_STEPS.length})</p>
                {FLOW_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{step.name}</div>
                      <div className="text-xs text-gray-400">{step.description}</div>
                    </div>
                    <div className="text-xs text-gray-600">Step {index + 1}</div>
                  </div>
                ))}
              </div>

              {/* Start button */}
              <button
                onClick={handleStartFlow}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Start Guided Flow
              </button>
            </div>
          ) : (
            // Running flow
            <div className="space-y-6">
              {/* Progress */}
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Progress</span>
                  <span className="text-sm text-gray-400">
                    Step {currentStep + 1} of {FLOW_STEPS.length}
                  </span>
                </div>
                <div className="w-full bg-[#2A2A2A] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / FLOW_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current step */}
              {currentFlowStep && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {currentFlowStep.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{currentFlowStep.name}</h3>
                      <p className="text-sm text-gray-300">{currentFlowStep.description}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    {!currentModule && (
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <ClockIcon className="w-4 h-4 animate-spin" />
                        Creating module...
                      </div>
                    )}

                    {currentModule && moduleStatus === 'idle' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-sm text-yellow-300 mb-3">
                          ⏳ Please click the Play button on the module to run it
                        </p>
                      </div>
                    )}

                    {currentModule && moduleStatus === 'running' && (
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <ClockIcon className="w-4 h-4 animate-spin" />
                        Module is running...
                      </div>
                    )}

                    {currentModule && moduleStatus === 'done' && currentFlowStep.hasVariants && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-green-300 mb-3">
                          <CheckCircleIcon className="w-5 h-5" />
                          Module completed! Please select your preferred option.
                        </div>
                        <button
                          onClick={handleContinueAfterVariantSelection}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm transition-all"
                        >
                          ✓ Continue to Next Step
                        </button>
                      </div>
                    )}

                    {currentModule && moduleStatus === 'done' && !currentFlowStep.hasVariants && (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircleIcon className="w-5 h-5" />
                        Completed! Moving to next step...
                      </div>
                    )}

                    {currentModule && moduleStatus === 'error' && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-sm text-red-300">
                          ❌ Error occurred. Please check the module and try running it again.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Steps list */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">All Steps</p>
                {FLOW_STEPS.map((step, index) => {
                  const isCompleted = completedSteps.has(index);
                  const isCurrent = index === currentStep;
                  const isPending = index > currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-blue-500/20 border-2 border-blue-500/50'
                          : isCompleted
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-[#0A0A0A] border border-[#2A2A2A] opacity-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-[#2A2A2A] text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </div>
                      </div>
                      {step.hasVariants && (
                        <div className="text-xs text-purple-400">Variants</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stop button */}
              <button
                onClick={handleStopFlow}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg font-medium text-sm transition-all"
              >
                Stop Flow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
