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

// Data types for connections (v1.1)
export enum DataType {
  IMAGE = 'image',
  TEXT = 'text',
  JSON = 'json',
  AUDIO = 'audio',
  VIDEO = 'video',
  MIXED = 'mixed'
}

export interface ModulePort {
  id: string;
  type: 'input' | 'output';
  label: string;
  connected: boolean;
  dataType?: DataType; // For output ports
  acceptedTypes?: DataType[]; // For input ports
}

export interface ModuleConnection {
  id: string;
  sourceModuleId: string;
  sourcePortId: string;
  targetModuleId: string;
  targetPortId: string;
  dataType?: DataType; // Type of data flowing through connection
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
}

export interface Space {
  id: string;
  name: string;
  modules: Module[];
  connections: ModuleConnection[];
  createdAt: Date;
  updatedAt: Date;
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

// Connection validation errors (v1.1)
export enum ConnectionErrorType {
  MODULE_NOT_DONE = 'CONNECTION_ERROR_01',
  EMPTY_OUTPUT = 'CONNECTION_ERROR_02',
  TYPE_MISMATCH = 'CONNECTION_ERROR_03',
  CIRCULAR_DEPENDENCY = 'CONNECTION_ERROR_04',
  MODULE_IN_ERROR = 'CONNECTION_ERROR_05'
}

export interface ConnectionError {
  type: ConnectionErrorType;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: ConnectionError;
}

// Drag state for connection creation (v1.1)
export interface ConnectionDragState {
  isDragging: boolean;
  sourceModuleId: string | null;
  sourcePortId: string | null;
  sourceDataType: DataType | null;
  cursorPosition: Position | null;
}
