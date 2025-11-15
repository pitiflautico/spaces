export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ModuleStatus = 'idle' | 'running' | 'done' | 'error' | 'warning' | 'fatal_error' | 'invalid';

export type ModuleType =
  | 'local-project-analysis'
  | 'reader-engine'
  | 'naming-engine'
  | 'icon-generator'
  | 'marketing-pack';

// Data types for connectors
export type DataType = 'image' | 'text' | 'json' | 'audio' | 'video' | 'mixed';

export interface ModulePort {
  id: string;
  type: 'input' | 'output';
  label: string;
  connected: boolean;
  dataType: DataType;
  acceptedTypes?: DataType[]; // For input ports
}

export interface ModuleConnection {
  id: string;
  sourceModuleId: string;
  sourcePortId: string;
  targetModuleId: string;
  targetPortId: string;
  dataType: DataType;
  isValid?: boolean;
}

export interface ModuleData {
  [key: string]: any;
}

export interface Module {
  id: string;
  type: ModuleType;
  name: string;
  position: Position;
  size: Size;
  status: ModuleStatus;
  inputs: ModuleData;
  outputs: ModuleData;
  ports: {
    input: ModulePort[];
    output: ModulePort[];
  };
  error?: ModuleError;
  logs: ModuleLog[];
  needsReRun?: boolean;
}

export interface Space {
  id: string;
  name: string;
  modules: Module[];
  connections: ModuleConnection[];
  createdAt: Date;
  updatedAt: Date;
  flowExecutionState?: FlowExecutionState;
  version?: number;
}

export interface CanvasState {
  zoom: number;
  pan: Position;
}

export interface LocalProjectAnalysisInputs {
  localProjectPath: string;
  includeHiddenFiles: boolean;
  includeNodeModules: boolean;
}

export interface LocalProjectAnalysisOutputs {
  repositoryMetadata?: any;
  fileContents?: any;
  repoStructure?: any;
  analysisLog?: string;
}

// Error handling
export type ErrorCategory = 'input' | 'system' | 'processing' | 'connection' | 'fatal';

export interface ModuleError {
  category: ErrorCategory;
  code: string;
  message: string;
  shortMessage: string;
  timestamp: Date;
  recoveryActions: RecoveryAction[];
}

export type RecoveryAction = 'retry' | 'reset' | 'view_logs' | 'edit_inputs' | 'contact_support';

// Connection errors
export type ConnectionErrorCode =
  | 'MODULE_NOT_DONE'
  | 'EMPTY_OUTPUT'
  | 'TYPE_MISMATCH'
  | 'CIRCULAR_DEPENDENCY'
  | 'MODULE_IN_ERROR';

// Logs
export interface ModuleLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

// Flow execution
export interface FlowExecutionState {
  isRunning: boolean;
  isPaused: boolean;
  currentModuleId: string | null;
  executionOrder: string[];
}

// Module info (for info panel)
export interface ModuleInfo {
  name: string;
  shortDescription: string;
  extendedDescription: string;
  whenToUse: string;
  inputs: Array<{
    name: string;
    type: DataType;
    description: string;
    required: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: DataType;
    description: string;
  }>;
  compatibleModules: ModuleType[];
  dependencies: ModuleType[];
  commonErrors: Array<{
    code: string;
    description: string;
    solution: string;
  }>;
  usageTips: string[];
  exampleFlow: string;
}
