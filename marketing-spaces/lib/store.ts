import { create } from 'zustand';
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
            { id: 'out-1', type: 'output', label: 'Repository Metadata', connected: false },
            { id: 'out-2', type: 'output', label: 'File Contents', connected: false },
            { id: 'out-3', type: 'output', label: 'Repo Structure', connected: false },
          ],
        },
      },
      'reader-engine': {
        name: 'Reader Engine',
        size: { width: 400, height: 400 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Project Path', connected: false }],
          output: [{ id: 'out-1', type: 'output', label: 'Processed Data', connected: false }],
        },
      },
      'naming-engine': {
        name: 'Naming Engine',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Data', connected: false }],
          output: [{ id: 'out-1', type: 'output', label: 'Names', connected: false }],
        },
      },
      'icon-generator': {
        name: 'Icon Generator',
        size: { width: 400, height: 350 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Data', connected: false }],
          output: [{ id: 'out-1', type: 'output', label: 'Icons', connected: false }],
        },
      },
      'marketing-pack': {
        name: 'Marketing Pack',
        size: { width: 400, height: 400 },
        ports: {
          input: [{ id: 'in-1', type: 'input', label: 'Data', connected: false }],
          output: [{ id: 'out-1', type: 'output', label: 'Marketing Materials', connected: false }],
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
}));
