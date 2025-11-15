import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Space, Module, ModuleConnection, CanvasState, Position, ModuleType } from '@/types';

interface SpaceStore {
  spaces: Space[];
  currentSpaceId: string | null;
  canvasState: CanvasState;
  selectedModuleId: string | null;

  // Space actions
  createSpace: (name: string) => void;
  deleteSpace: (id: string) => void;
  setCurrentSpace: (id: string) => void;

  // Module actions
  addModule: (type: ModuleType, position: Position) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  setSelectedModule: (id: string | null) => void;

  // Connection actions
  addConnection: (connection: Omit<ModuleConnection, 'id'>) => void;
  deleteConnection: (id: string) => void;
  validateConnection: (
    sourceModuleId: string,
    sourcePortId: string,
    targetModuleId: string,
    targetPortId: string
  ) => { isValid: boolean; errorCode?: string; errorMessage?: string };

  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  resetCanvas: () => void;

  // Flow execution
  executeFlow: () => Promise<void>;
  pauseFlow: () => void;
  resetFlow: () => void;
  resetModule: (id: string) => void;
  resetFromModule: (id: string) => void;

  // Utility
  getCurrentSpace: () => Space | null;
  addLog: (moduleId: string, level: 'info' | 'warning' | 'error', message: string, details?: any) => void;
}

export const useSpaceStore = create<SpaceStore>()(
  persist(
    (set, get) => ({
  spaces: [],
  currentSpaceId: null,
  canvasState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
  },
  selectedModuleId: null,

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

  addModule: (type: ModuleType, position: Position) => {
    const moduleDefaults: Record<ModuleType, Partial<Module>> = {
      'local-project-analysis': {
        name: 'Local Project Analysis Agent',
        size: { width: 450, height: 520 },
        ports: {
          input: [],
          output: [
            { id: 'out-1', type: 'output', label: 'Repository Metadata', connected: false, dataType: 'json' },
            { id: 'out-2', type: 'output', label: 'File Contents', connected: false, dataType: 'json' },
            { id: 'out-3', type: 'output', label: 'Repo Structure', connected: false, dataType: 'json' },
          ],
        },
      },
      'reader-engine': {
        name: 'Reader Engine',
        size: { width: 400, height: 400 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Project Path', connected: false, dataType: 'text', acceptedTypes: ['text', 'json'] }],
          output: [{ id: 'out-1', type: 'output', label: 'Processed Data', connected: false, dataType: 'json' }],
        },
      },
      'naming-engine': {
        name: 'Naming Engine',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Data', connected: false, dataType: 'json', acceptedTypes: ['json'] }],
          output: [{ id: 'out-1', type: 'output', label: 'Names', connected: false, dataType: 'text' }],
        },
      },
      'icon-generator': {
        name: 'Icon Generator',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Data', connected: false, dataType: 'json', acceptedTypes: ['json', 'text'] }],
          output: [{ id: 'out-1', type: 'output', label: 'Icons', connected: false, dataType: 'image' }],
        },
      },
      'marketing-pack': {
        name: 'Marketing Pack',
        size: { width: 400, height: 400 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Data', connected: false, dataType: 'mixed', acceptedTypes: ['json', 'text', 'image'] }],
          output: [{ id: 'out-1', type: 'output', label: 'Marketing Materials', connected: false, dataType: 'mixed' }],
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
      logs: [],
      needsReRun: false,
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

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) =>
                  m.id === id ? { ...m, ...updates } : m
                ),
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

  getCurrentSpace: () => {
    const state = get();
    return state.spaces.find((s) => s.id === state.currentSpaceId) || null;
  },

  validateConnection: (sourceModuleId, sourcePortId, targetModuleId, targetPortId) => {
    const state = get();
    const currentSpace = state.getCurrentSpace();
    if (!currentSpace) return { isValid: false, errorCode: 'NO_SPACE', errorMessage: 'No space selected' };

    const sourceModule = currentSpace.modules.find((m) => m.id === sourceModuleId);
    const targetModule = currentSpace.modules.find((m) => m.id === targetModuleId);

    if (!sourceModule || !targetModule) {
      return { isValid: false, errorCode: 'MODULE_NOT_FOUND', errorMessage: 'Module not found' };
    }

    // Check if source module is done
    if (sourceModule.status !== 'done') {
      return {
        isValid: false,
        errorCode: 'MODULE_NOT_DONE',
        errorMessage: 'El módulo previo aún no ha terminado. Ejecútalo primero.',
      };
    }

    // Check if source has output
    if (!sourceModule.outputs || Object.keys(sourceModule.outputs).length === 0) {
      return {
        isValid: false,
        errorCode: 'EMPTY_OUTPUT',
        errorMessage: 'No hay datos disponibles para conectar desde este módulo.',
      };
    }

    // Check if source module is in error
    if (sourceModule.status === 'error' || sourceModule.status === 'fatal_error') {
      return {
        isValid: false,
        errorCode: 'MODULE_IN_ERROR',
        errorMessage: 'Resuelve el error del módulo anterior antes de conectarlo.',
      };
    }

    // Check if target module is running
    if (targetModule.status === 'running') {
      return {
        isValid: false,
        errorCode: 'MODULE_RUNNING',
        errorMessage: 'No se puede conectar a un módulo en ejecución.',
      };
    }

    // Get port data types
    const sourcePort = sourceModule.ports.output.find((p) => p.id === sourcePortId);
    const targetPort = targetModule.ports.input.find((p) => p.id === targetPortId);

    if (!sourcePort || !targetPort) {
      return { isValid: false, errorCode: 'PORT_NOT_FOUND', errorMessage: 'Puerto no encontrado' };
    }

    // Check type compatibility
    const acceptedTypes = targetPort.acceptedTypes || [targetPort.dataType];
    if (!acceptedTypes.includes(sourcePort.dataType)) {
      return {
        isValid: false,
        errorCode: 'TYPE_MISMATCH',
        errorMessage: 'Este módulo no acepta el tipo de datos que estás conectando.',
      };
    }

    // Check for circular dependencies
    const wouldCreateCycle = (startId: string, endId: string): boolean => {
      if (startId === endId) return true;

      const visited = new Set<string>();
      const queue = [endId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const outgoingConnections = currentSpace.connections.filter(
          (c) => c.sourceModuleId === currentId
        );

        for (const conn of outgoingConnections) {
          if (conn.targetModuleId === startId) return true;
          queue.push(conn.targetModuleId);
        }
      }

      return false;
    };

    if (wouldCreateCycle(sourceModuleId, targetModuleId)) {
      return {
        isValid: false,
        errorCode: 'CIRCULAR_DEPENDENCY',
        errorMessage: 'No se pueden crear bucles entre módulos.',
      };
    }

    return { isValid: true };
  },

  addLog: (moduleId, level, message, details) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) =>
                  m.id === moduleId
                    ? {
                        ...m,
                        logs: [
                          ...m.logs,
                          {
                            timestamp: new Date(),
                            level,
                            message,
                            details,
                          },
                        ],
                      }
                    : m
                ),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  executeFlow: async () => {
    const state = get();
    const currentSpace = state.getCurrentSpace();
    if (!currentSpace) return;

    // Topological sort to get execution order
    const modules = currentSpace.modules;
    const connections = currentSpace.connections;

    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};

    // Initialize
    modules.forEach((m) => {
      inDegree[m.id] = 0;
      adjList[m.id] = [];
    });

    // Build graph
    connections.forEach((conn) => {
      adjList[conn.sourceModuleId].push(conn.targetModuleId);
      inDegree[conn.targetModuleId]++;
    });

    // Find nodes with no incoming edges
    const queue: string[] = [];
    modules.forEach((m) => {
      if (inDegree[m.id] === 0) {
        queue.push(m.id);
      }
    });

    const executionOrder: string[] = [];

    while (queue.length > 0) {
      const moduleId = queue.shift()!;
      executionOrder.push(moduleId);

      adjList[moduleId].forEach((neighborId) => {
        inDegree[neighborId]--;
        if (inDegree[neighborId] === 0) {
          queue.push(neighborId);
        }
      });
    }

    // Execute modules in order
    for (const moduleId of executionOrder) {
      const module = modules.find((m) => m.id === moduleId);
      if (!module) continue;

      // Skip if already done and doesn't need re-run
      if (module.status === 'done' && !module.needsReRun) continue;

      // Execute module (this would call the actual execution logic)
      // For now, just update status
      get().updateModule(moduleId, { status: 'running' });

      // Simulate execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      get().updateModule(moduleId, { status: 'done', needsReRun: false });
    }
  },

  pauseFlow: () => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                flowExecutionState: {
                  ...space.flowExecutionState!,
                  isPaused: true,
                },
              }
            : space
        ),
      };
    });
  },

  resetFlow: () => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) => ({
                  ...m,
                  status: 'idle' as const,
                  outputs: {},
                  logs: [],
                  error: undefined,
                  needsReRun: false,
                })),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  resetModule: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      // Find all dependent modules
      const dependentModules = new Set<string>();
      const findDependents = (moduleId: string) => {
        currentSpace.connections.forEach((conn) => {
          if (conn.sourceModuleId === moduleId && !dependentModules.has(conn.targetModuleId)) {
            dependentModules.add(conn.targetModuleId);
            findDependents(conn.targetModuleId);
          }
        });
      };
      findDependents(id);

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) =>
                  m.id === id
                    ? {
                        ...m,
                        status: 'idle' as const,
                        outputs: {},
                        logs: [],
                        error: undefined,
                        needsReRun: false,
                      }
                    : dependentModules.has(m.id)
                    ? {
                        ...m,
                        status: 'invalid' as const,
                        needsReRun: true,
                      }
                    : m
                ),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  resetFromModule: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      // Find all dependent modules
      const modulesToReset = new Set<string>([id]);
      const findDependents = (moduleId: string) => {
        currentSpace.connections.forEach((conn) => {
          if (conn.sourceModuleId === moduleId && !modulesToReset.has(conn.targetModuleId)) {
            modulesToReset.add(conn.targetModuleId);
            findDependents(conn.targetModuleId);
          }
        });
      };
      findDependents(id);

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) =>
                  modulesToReset.has(m.id)
                    ? {
                        ...m,
                        status: 'idle' as const,
                        outputs: {},
                        logs: [],
                        error: undefined,
                        needsReRun: false,
                      }
                    : m
                ),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },
    }),
    {
      name: 'marketing-spaces-storage',
      version: 1,
    }
  )
);
