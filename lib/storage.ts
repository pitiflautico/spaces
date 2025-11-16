/**
 * Storage Service
 * Handles persistent storage of spaces, modules, and connections
 */

import prisma from './db';
import type { Space, Module, ModuleConnection } from '@/types';

// ============================================================================
// SPACE OPERATIONS
// ============================================================================

/**
 * Save a complete space to database
 */
export async function saveSpace(space: Space): Promise<void> {
  try {
    // Upsert space
    await prisma.space.upsert({
      where: { id: space.id },
      update: {
        name: space.name,
        zoom: space.zoom,
        panX: space.panX,
        panY: space.panY,
        configuration: space.configuration as any,
        updatedAt: new Date(),
      },
      create: {
        id: space.id,
        name: space.name,
        zoom: space.zoom,
        panX: space.panX,
        panY: space.panY,
        configuration: space.configuration as any,
      },
    });

    // Save modules
    for (const module of space.modules) {
      await saveModule(space.id, module);
    }

    // Save connections
    await saveConnections(space.id, space.connections);

    console.log(`[Storage] Space "${space.name}" saved successfully`);
  } catch (error) {
    console.error('[Storage] Error saving space:', error);
    throw new Error('Failed to save space');
  }
}

/**
 * Load a space from database
 */
export async function loadSpace(spaceId: string): Promise<Space | null> {
  try {
    const spaceData = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        modules: true,
        connections: true,
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 100, // Last 100 logs
        },
      },
    });

    if (!spaceData) {
      return null;
    }

    // Transform database format to app format
    const space: Space = {
      id: spaceData.id,
      name: spaceData.name,
      zoom: spaceData.zoom,
      panX: spaceData.panX,
      panY: spaceData.panY,
      configuration: spaceData.configuration as any,
      modules: spaceData.modules.map(transformModule),
      connections: spaceData.connections.map(transformConnection),
      logs: spaceData.logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        level: log.level as 'info' | 'warning' | 'error' | 'success',
        message: log.message,
        moduleId: log.moduleId || undefined,
      })),
    };

    console.log(`[Storage] Space "${space.name}" loaded successfully`);
    return space;
  } catch (error) {
    console.error('[Storage] Error loading space:', error);
    throw new Error('Failed to load space');
  }
}

/**
 * Get all spaces (minimal data for list view)
 */
export async function getAllSpaces(): Promise<Array<{ id: string; name: string; updatedAt: Date }>> {
  try {
    const spaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return spaces;
  } catch (error) {
    console.error('[Storage] Error getting all spaces:', error);
    return [];
  }
}

/**
 * Delete a space
 */
export async function deleteSpace(spaceId: string): Promise<void> {
  try {
    await prisma.space.delete({
      where: { id: spaceId },
    });

    console.log(`[Storage] Space ${spaceId} deleted successfully`);
  } catch (error) {
    console.error('[Storage] Error deleting space:', error);
    throw new Error('Failed to delete space');
  }
}

// ============================================================================
// MODULE OPERATIONS
// ============================================================================

/**
 * Save a single module
 */
async function saveModule(spaceId: string, module: Module): Promise<void> {
  await prisma.module.upsert({
    where: { id: module.id },
    update: {
      name: module.name,
      type: module.type,
      positionX: module.position.x,
      positionY: module.position.y,
      status: module.status,
      inputs: module.inputs as any,
      outputs: module.outputs as any,
      ports: module.ports as any,
      errorMessage: module.errorMessage,
      updatedAt: new Date(),
    },
    create: {
      id: module.id,
      spaceId,
      name: module.name,
      type: module.type,
      positionX: module.position.x,
      positionY: module.position.y,
      status: module.status,
      inputs: module.inputs as any,
      outputs: module.outputs as any,
      ports: module.ports as any,
      errorMessage: module.errorMessage,
    },
  });
}

/**
 * Transform database module to app module
 */
function transformModule(dbModule: any): Module {
  return {
    id: dbModule.id,
    name: dbModule.name,
    type: dbModule.type,
    position: {
      x: dbModule.positionX,
      y: dbModule.positionY,
    },
    size: { width: 400, height: 300 }, // Default, will be overridden by store defaults
    status: dbModule.status,
    inputs: dbModule.inputs,
    outputs: dbModule.outputs,
    ports: dbModule.ports,
    errorMessage: dbModule.errorMessage,
  };
}

// ============================================================================
// CONNECTION OPERATIONS
// ============================================================================

/**
 * Save connections for a space
 */
async function saveConnections(spaceId: string, connections: ModuleConnection[]): Promise<void> {
  // Delete existing connections
  await prisma.connection.deleteMany({
    where: { spaceId },
  });

  // Create new connections
  for (const conn of connections) {
    await prisma.connection.create({
      data: {
        id: conn.id,
        spaceId,
        sourceModuleId: conn.sourceModuleId,
        sourcePortId: conn.sourcePortId,
        targetModuleId: conn.targetModuleId,
        targetPortId: conn.targetPortId,
        isValid: true,
        dataType: null, // Will be inferred from ports
      },
    });
  }
}

/**
 * Transform database connection to app connection
 */
function transformConnection(dbConn: any): ModuleConnection {
  return {
    id: dbConn.id,
    sourceModuleId: dbConn.sourceModuleId,
    sourcePortId: dbConn.sourcePortId,
    targetModuleId: dbConn.targetModuleId,
    targetPortId: dbConn.targetPortId,
  };
}

// ============================================================================
// AUTO-SAVE
// ============================================================================

let autoSaveTimer: NodeJS.Timeout | null = null;

/**
 * Start auto-save for a space
 */
export function startAutoSave(space: Space, intervalMs: number = 30000): void {
  stopAutoSave();

  autoSaveTimer = setInterval(async () => {
    try {
      await saveSpace(space);
      console.log(`[AutoSave] Space "${space.name}" auto-saved`);
    } catch (error) {
      console.error('[AutoSave] Error during auto-save:', error);
    }
  }, intervalMs);

  console.log(`[AutoSave] Started for space "${space.name}" (interval: ${intervalMs}ms)`);
}

/**
 * Stop auto-save
 */
export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log('[AutoSave] Stopped');
  }
}

// ============================================================================
// LOGS
// ============================================================================

/**
 * Add a log entry
 */
export async function addLog(
  spaceId: string,
  level: 'info' | 'warning' | 'error' | 'success',
  message: string,
  moduleId?: string
): Promise<void> {
  try {
    await prisma.logEntry.create({
      data: {
        spaceId,
        level,
        message,
        moduleId,
      },
    });
  } catch (error) {
    console.error('[Storage] Error adding log:', error);
  }
}

// ============================================================================
// EXECUTION HISTORY
// ============================================================================

/**
 * Record module execution
 */
export async function recordExecution(data: {
  moduleId: string;
  moduleType: string;
  status: 'success' | 'error' | 'cancelled';
  duration?: number;
  inputData?: any;
  outputData?: any;
  errorData?: any;
  aiProvider?: string;
  aiModel?: string;
  tokensUsed?: number;
}): Promise<void> {
  try {
    await prisma.executionHistory.create({
      data: {
        moduleId: data.moduleId,
        moduleType: data.moduleType,
        status: data.status,
        completedAt: new Date(),
        duration: data.duration,
        inputData: data.inputData as any,
        outputData: data.outputData as any,
        errorData: data.errorData as any,
        aiProvider: data.aiProvider,
        aiModel: data.aiModel,
        tokensUsed: data.tokensUsed,
      },
    });
  } catch (error) {
    console.error('[Storage] Error recording execution:', error);
  }
}
