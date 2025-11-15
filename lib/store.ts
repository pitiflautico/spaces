import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Space, Module, ModuleConnection, CanvasState, Position, ModuleType, ConnectionDragState, ValidationResult, ConnectionError, SpaceConfiguration, LogEntry, LogType } from '@/types';
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

  // Flow execution actions (V2.0)
  executeFlow: () => Promise<void>;
  resetAll: () => void;
  resetModule: (id: string) => void;
  resetFrom: (id: string) => void;

  // Log actions
  addLog: (type: LogType, message: string, moduleId?: string) => void;
  clearLogs: () => void;

  // Utility
  getCurrentSpace: () => Space | null;
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
            { id: 'out-1', type: 'output', label: 'Project Analysis', connected: false, dataType: DataType.JSON },
          ],
        },
      },
      'reader-engine': {
        name: 'AIE Engine (Reader Engine)',
        size: { width: 450, height: 480 },
        ports: {
          input: [
            { id: 'in-1', type: 'input', label: 'Project Data', connected: false, acceptedTypes: [DataType.JSON] },
          ],
          output: [
            { id: 'out-1', type: 'output', label: 'App Intelligence', connected: false, dataType: DataType.JSON },
          ],
        },
      },
      'naming-engine': {
        name: 'Naming Engine',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'App Intelligence', connected: false, acceptedTypes: [DataType.JSON] }],
          output: [
            { id: 'out-1', type: 'output', label: 'Naming Package', connected: false, dataType: DataType.JSON },
            { id: 'out-2', type: 'output', label: 'Chosen Name', connected: false, dataType: DataType.JSON }
          ],
        },
      },
      'icon-generator': {
        name: 'Logo Generator (Module 4A)',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Naming Package', connected: false, acceptedTypes: [DataType.JSON] }],
          output: [
            { id: 'out-1', type: 'output', label: 'Generation Trigger', connected: false, dataType: DataType.JSON },
          ],
        },
      },
      'logo-variant': {
        name: 'Logo Variant',
        size: { width: 320, height: 450 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'From Generator', connected: false, acceptedTypes: [DataType.JSON] }],
          output: [
            { id: 'out-1', type: 'output', label: 'Logo + Context', connected: false, dataType: DataType.IMAGE }
          ],
        },
      },
      'app-icon-generator': {
        name: 'App Icon Generator (Module 4B)',
        size: { width: 400, height: 450 },
        ports: {
          input: [
            { id: 'in-1', type: 'input', label: 'Logo Input (optional)', connected: false, acceptedTypes: [DataType.IMAGE, DataType.JSON] },
            { id: 'in-2', type: 'input', label: 'Branding Input (optional)', connected: false, acceptedTypes: [DataType.JSON] }
          ],
          output: [
            { id: 'out-1', type: 'output', label: 'Icon Variants', connected: false, dataType: DataType.JSON }
          ],
        },
      },
      'app-icon-variant': {
        name: 'App Icon Variant',
        size: { width: 320, height: 500 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'From Generator', connected: false, acceptedTypes: [DataType.JSON] }],
          output: [
            { id: 'out-1', type: 'output', label: 'Icon Set + Context', connected: false, dataType: DataType.IMAGE }
          ],
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

  // V2.0: Flow execution with topological sort
  executeFlow: async () => {
    const state = get();
    const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
    if (!currentSpace) return;

    // Calculate execution order using topological sort
    const executionOrder = calculateTopologicalOrder(currentSpace.modules, currentSpace.connections);

    // Execute modules in order
    for (const moduleId of executionOrder) {
      const module = currentSpace.modules.find((m) => m.id === moduleId);
      if (!module) continue;

      // Skip if already done and inputs haven't changed
      if (module.status === 'done') continue;

      // Skip if in error state
      if (module.status === 'error' || module.status === 'fatal_error') continue;

      // Execute module (this will be handled by the module's run handler)
      // The actual execution happens in ModuleBlock's handleRun
      // Here we just update status to trigger execution
      const { updateModule } = get();
      updateModule(moduleId, { status: 'idle' }); // Reset to allow re-run
    }
  },

  // V2.0: Reset all modules
  resetAll: () => {
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
                })),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  // V2.0: Reset specific module
  resetModule: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      // Find dependent modules
      const dependentIds = findDependentModules(id, currentSpace.connections);

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) => {
                  if (m.id === id) {
                    return { ...m, status: 'idle' as const, outputs: {} };
                  }
                  if (dependentIds.includes(m.id)) {
                    return { ...m, status: 'invalid' as const };
                  }
                  return m;
                }),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

  // V2.0: Reset from this module onwards
  resetFrom: (id: string) => {
    set((state) => {
      const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
      if (!currentSpace) return state;

      // Find this module and all dependent modules
      const affectedIds = [id, ...findDependentModules(id, currentSpace.connections)];

      return {
        spaces: state.spaces.map((space) =>
          space.id === state.currentSpaceId
            ? {
                ...space,
                modules: space.modules.map((m) =>
                  affectedIds.includes(m.id)
                    ? { ...m, status: 'idle' as const, outputs: {} }
                    : m
                ),
                updatedAt: new Date(),
              }
            : space
        ),
      };
    });
  },

      // Log actions
      addLog: (type: LogType, message: string, moduleId?: string) => {
        set((state) => {
          const currentSpace = state.spaces.find((s) => s.id === state.currentSpaceId);
          if (!currentSpace) return state;

          const module = moduleId ? currentSpace.modules.find((m) => m.id === moduleId) : null;

          const newLog: LogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: Date.now(),
            type,
            moduleId,
            moduleName: module?.name,
            message,
          };

          return {
            ...state,
            spaces: state.spaces.map((s) =>
              s.id === state.currentSpaceId
                ? { ...s, logs: [...(s.logs || []), newLog] }
                : s
            ),
          };
        });
      },

      clearLogs: () => {
        set((state) => ({
          ...state,
          spaces: state.spaces.map((s) =>
            s.id === state.currentSpaceId
              ? { ...s, logs: [] }
              : s
          ),
        }));
      },

      getCurrentSpace: () => {
        const state = get();
        return state.spaces.find((s) => s.id === state.currentSpaceId) || null;
      },
    }),
    {
      name: 'marketing-spaces-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        spaces: state.spaces,
        currentSpaceId: state.currentSpaceId,
      }),
    }
  )
);

/**
 * V2.0: Calculate topological order for module execution
 * Uses Kahn's algorithm for topological sorting
 */
function calculateTopologicalOrder(modules: Module[], connections: ModuleConnection[]): string[] {
  // Build adjacency list and in-degree map
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  modules.forEach((m) => {
    adjList.set(m.id, []);
    inDegree.set(m.id, 0);
  });

  // Build graph from connections
  connections.forEach((conn) => {
    const from = conn.sourceModuleId;
    const to = conn.targetModuleId;

    adjList.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  });

  // Find all nodes with in-degree 0 (no dependencies)
  const queue: string[] = [];
  modules.forEach((m) => {
    if (inDegree.get(m.id) === 0) {
      queue.push(m.id);
    }
  });

  // Topological sort
  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = adjList.get(current) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}

/**
 * V2.0: Find all modules that depend on a given module
 */
function findDependentModules(moduleId: string, connections: ModuleConnection[]): string[] {
  const dependents = new Set<string>();
  const queue = [moduleId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // Find all modules that have current as a source
    connections
      .filter((c) => c.sourceModuleId === current)
      .forEach((c) => {
        if (!dependents.has(c.targetModuleId) && c.targetModuleId !== moduleId) {
          dependents.add(c.targetModuleId);
          queue.push(c.targetModuleId);
        }
      });
  }

  return Array.from(dependents);
}
