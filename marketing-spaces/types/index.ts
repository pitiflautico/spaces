export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ModuleStatus = 'idle' | 'running' | 'done' | 'error';

export type ModuleType =
  | 'local-project-analysis'
  | 'reader-engine'
  | 'naming-engine'
  | 'icon-generator'
  | 'marketing-pack';

export interface ModulePort {
  id: string;
  type: 'input' | 'output';
  label: string;
  connected: boolean;
}

export interface ModuleConnection {
  id: string;
  sourceModuleId: string;
  sourcePortId: string;
  targetModuleId: string;
  targetPortId: string;
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
