import { create } from 'zustand';
import type { Space, Module, ModuleConnection, CanvasState, Position, ModuleType, ConnectionDragState, ValidationResult, ConnectionError, SpaceConfiguration } from '@/types';
import { DataType, ConnectionErrorType } from '@/types';

interface SpaceStore {
  spaces: Space[];
  currentSpaceId: string | null;
  canvasState: CanvasState;
  selectedModuleId: string | null;
  connectionDragState: ConnectionDragState;

  // Space actions
  createSpace: (name: string) => void;
  deleteSpace: (id: string) => void;
  setCurrentSpace: (id: string) => void;
  updateSpaceConfiguration: (id: string, configuration: Partial<SpaceConfiguration>) => void;

  // Module actions
  addModule: (type: ModuleType, position: Position) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  duplicateModule: (id: string) => void;
  setSelectedModule: (id: string | null) => void;

  // Connection actions
  addConnection: (connection: Omit<ModuleConnection, 'id'>) => void;
  deleteConnection: (id: string) => void;
  validateConnection: (sourceModuleId: string, sourcePortId: string, targetModuleId: string, targetPortId: string) => ValidationResult;

  // Connection drag actions
  startConnectionDrag: (moduleId: string, portId: string, dataType: DataType, position: Position) => void;
  updateConnectionDrag: (position: Position) => void;
  endConnectionDrag: () => void;

  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  resetCanvas: () => void;

  // Utility
  getCurrentSpace: () => Space | null;
}

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  spaces: [],
  currentSpaceId: null,
  canvasState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
  },
  selectedModuleId: null,
  connectionDragState: {
    isDragging: false,
    sourceModuleId: null,
    sourcePortId: null,
    sourceDataType: null,
    cursorPosition: null,
  },

  createSpace: (name: string) => {
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name,
      modules: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      spaces: [...state.spaces, newSpace],
      currentSpaceId: newSpace.id,
    }));
  },

  deleteSpace: (id: string) => {
    set((state) => ({
      spaces: state.spaces.filter((s) => s.id !== id),
      currentSpaceId: state.currentSpaceId === id ? null : state.currentSpaceId,
    }));
  },

  setCurrentSpace: (id: string) => {
    set({ currentSpaceId: id });
  },

  updateSpaceConfiguration: (id: string, configuration: Partial<SpaceConfiguration>) => {
    set((state) => ({
      spaces: state.spaces.map((space) =>
        space.id === id
          ? {
              ...space,
              configuration: {
                ...space.configuration,
                ...configuration,
              },
              updatedAt: new Date(),
            }
          : space
      ),
    }));
  },

  addModule: (type: ModuleType, position: Position) => {
    const moduleDefaults: Record<ModuleType, Partial<Module>> = {
      'local-project-analysis': {
        name: 'Local Project Analysis Agent',
        size: { width: 450, height: 520 },
        ports: {
          input: [],
          output: [
            { id: 'out-1', type: 'output', label: 'Repository Metadata', connected: false, dataType: DataType.JSON },
            { id: 'out-2', type: 'output', label: 'File Contents', connected: false, dataType: DataType.JSON },
            { id: 'out-3', type: 'output', label: 'Repo Structure', connected: false, dataType: DataType.JSON },
          ],
        },
      },
      'reader-engine': {
        name: 'Reader Engine',
        size: { width: 400, height: 400 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Project Metadata', connected: false, acceptedTypes: [DataType.JSON] }],
          output: [{ id: 'out-1', type: 'output', label: 'Processed Data', connected: false, dataType: DataType.JSON }],
        },
      },
      'naming-engine': {
        name: 'Naming Engine',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Project Data', connected: false, acceptedTypes: [DataType.JSON] }],
          output: [{ id: 'out-1', type: 'output', label: 'Name Suggestions', connected: false, dataType: DataType.TEXT }],
        },
      },
      'icon-generator': {
        name: 'Icon Generator',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Project Data', connected: false, acceptedTypes: [DataType.JSON, DataType.TEXT] }],
          output: [{ id: 'out-1', type: 'output', label: 'Generated Icons', connected: false, dataType: DataType.IMAGE }],
        },
      },
      'marketing-pack': {
        name: 'Marketing Pack',
        size: { width: 400, height: 400 },
        ports: {
          input: [
            { id: 'in-1', type: 'input', label: 'Project Data', connected: false, acceptedTypes: [DataType.JSON] },
            { id: 'in-2', type: 'input', label: 'Icons', connected: false, acceptedTypes: [DataType.IMAGE] },
          ],
          output: [{ id: 'out-1', type: 'output', label: 'Marketing Materials', connected: false, dataType: DataType.MIXED }],
        },
      },
    };

    const defaults = moduleDefaults[type];
    const newModule: Module = {
      id: `module-${Date.now()}`,
      type,
      name: defaults.name || type,
      position,
      size: defaults.size || { width: 400, height: 400 },
      status: 'idle',
      inputs: {},
      outputs: {},
      ports: defaults.ports || { input: [], output: [] },
    };

    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? { ...space, modules: [...space.modules, newModule], updatedAt: new Date() }
            : space
        ),
      };
    });
  },

  updateModule: (id: string, updates: Partial<Module>) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      const module = currentSpace.modules.find((m) => m.id === id);
      if (!module) return state;

      // A4: Dynamic connection management
      let updatedModules = currentSpace.modules.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );

      // A4.1: If module is being reset to idle, mark dependent modules as invalid
      if (updates.status === 'idle' && module.status !== 'idle') {
        const dependentIds = currentSpace.connections
          .filter((c) => c.sourceModuleId === id)
          .map((c) => c.targetModuleId);

        updatedModules = updatedModules.map((m) =>
          dependentIds.includes(m.id) ? { ...m, status: 'invalid' as const } : m
        );
      }

      // A4.2: If module enters error state, mark dependent modules as invalid
      if ((updates.status === 'error' || updates.status === 'fatal_error') &&
          (module.status !== 'error' && module.status !== 'fatal_error')) {
        const dependentIds = currentSpace.connections
          .filter((c) => c.sourceModuleId === id)
          .map((c) => c.targetModuleId);

        updatedModules = updatedModules.map((m) =>
          dependentIds.includes(m.id) ? { ...m, status: 'invalid' as const } : m
        );
      }

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: updatedModules,
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  deleteModule: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.filter((m) => m.id !== id),
                connections: space.connections.filter(
                  (c) => c.sourceModuleId !== id && c.targetModuleId !== id
                ),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  duplicateModule: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      const originalModule = currentSpace.modules.find((m) => m.id === id);
      if (!originalModule) return state;

      // Create duplicate with offset position and new ID
      const duplicatedModule: Module = {
        ...originalModule,
        id: `module-${Date.now()}`,
        position: {
          x: originalModule.position.x + 50,
          y: originalModule.position.y + 50,
        },
        status: 'idle',
        outputs: {}, // Reset outputs
        ports: {
          input: originalModule.ports.input.map((p) => ({ ...p, connected: false })),
          output: originalModule.ports.output.map((p) => ({ ...p, connected: false })),
        },
      };

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: [...space.modules, duplicatedModule],
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  setSelectedModule: (id: string | null) => {
    set({ selectedModuleId: id });
  },

  addConnection: (connection: Omit<ModuleConnection, 'id'>) => {
    const newConnection: ModuleConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
    };

    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                connections: [...space.connections, newConnection],
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  deleteConnection: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                connections: space.connections.filter((c) => c.id !== id),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  setZoom: (zoom: number) => {
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        zoom: Math.max(0.2, Math.min(3, zoom)),
      },
    }));
  },

  setPan: (pan: Position) => {
    set((state) => ({
      canvasState: {
        ...state.canvasState,
        pan,
      },
    }));
  },

  resetCanvas: () => {
    set({
      canvasState: {
        zoom: 1,
        pan: { x: 0, y: 0 },
      },
    });
  },

  // Connection validation (A3)
  validateConnection: (sourceModuleId: string, sourcePortId: string, targetModuleId: string, targetPortId: string): ValidationResult => {
    const state = get();
    const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);

    if (!currentSpace) {
      return { valid: false, error: { type: ConnectionErrorType.MODULE_NOT_DONE, message: 'No space found' } };
    }

    const sourceModule = currentSpace.modules.find((m) => m.id === sourceModuleId);
    const targetModule = currentSpace.modules.find((m) => m.id === targetModuleId);

    if (!sourceModule || !targetModule) {
      return { valid: false, error: { type: ConnectionErrorType.MODULE_NOT_DONE, message: 'Module not found' } };
    }

    // A3.1: Check source module is done
    if (sourceModule.status !== 'done') {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.MODULE_NOT_DONE,
          message: 'El módulo previo aún no ha terminado. Ejecútalo primero.',
        },
      };
    }

    // A3.5: Check source module is not in error
    if (sourceModule.status === 'error' || sourceModule.status === 'fatal_error') {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.MODULE_IN_ERROR,
          message: 'Resuelve el error del módulo anterior antes de conectarlo.',
        },
      };
    }

    // A3.2: Check output exists
    const sourcePort = sourceModule.ports.output.find((p) => p.id === sourcePortId);
    if (!sourcePort || !sourcePort.dataType) {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.EMPTY_OUTPUT,
          message: 'No hay datos disponibles para conectar desde este módulo.',
        },
      };
    }

    // A3.3: Check type compatibility
    const targetPort = targetModule.ports.input.find((p) => p.id === targetPortId);
    if (!targetPort || !targetPort.acceptedTypes) {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.TYPE_MISMATCH,
          message: 'Puerto de entrada no válido.',
        },
      };
    }

    if (!targetPort.acceptedTypes.includes(sourcePort.dataType)) {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.TYPE_MISMATCH,
          message: 'Este módulo no acepta el tipo de datos que estás conectando.',
        },
      };
    }

    // A3.4: Check target module is not running
    if (targetModule.status === 'running') {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.MODULE_NOT_DONE,
          message: 'El módulo destino está en ejecución.',
        },
      };
    }

    // A3.5: Check for circular dependency
    const wouldCreateCycle = (fromId: string, toId: string): boolean => {
      if (fromId === toId) return true;

      const visited = new Set<string>();
      const queue = [toId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === fromId) return true;
        if (visited.has(current)) continue;
        visited.add(current);

        const outgoing = currentSpace.connections.filter((c) => c.sourceModuleId === current);
        queue.push(...outgoing.map((c) => c.targetModuleId));
      }

      return false;
    };

    if (wouldCreateCycle(sourceModuleId, targetModuleId)) {
      return {
        valid: false,
        error: {
          type: ConnectionErrorType.CIRCULAR_DEPENDENCY,
          message: 'No se pueden crear bucles entre módulos.',
        },
      };
    }

    return { valid: true };
  },

  // Connection drag actions (A2)
  startConnectionDrag: (moduleId: string, portId: string, dataType: DataType, position: Position) => {
    set({
      connectionDragState: {
        isDragging: true,
        sourceModuleId: moduleId,
        sourcePortId: portId,
        sourceDataType: dataType,
        cursorPosition: position,
      },
    });
  },

  updateConnectionDrag: (position: Position) => {
    set((state) => ({
      connectionDragState: {
        ...state.connectionDragState,
        cursorPosition: position,
      },
    }));
  },

  endConnectionDrag: () => {
    set({
      connectionDragState: {
        isDragging: false,
        sourceModuleId: null,
        sourcePortId: null,
        sourceDataType: null,
        cursorPosition: null,
      },
    });
  },

  getCurrentSpace: () => {
    const state = get();
    return state.spaces.find((s) => s.id === state.currentSpaceId) || null;
  },
}));
