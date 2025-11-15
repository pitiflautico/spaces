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
  | 'logo-variant'
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
  errorMessage?: string; // Error message to display when status is 'error'
}

// Log system types
export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  moduleId?: string;
  moduleName?: string;
  message: string;
}

// AI Provider types (V2.0)
export enum AIProvider {
  REPLICATE = 'replicate',
  TOGETHER = 'together',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  LOCAL = 'local'
}

export interface AIConfiguration {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  mode?: 'streaming' | 'non-streaming';
}

export interface SpaceConfiguration {
  projectPath?: string;
  apiKeys?: {
    openai?: string;
    anthropic?: string;
    stability?: string;
    replicate?: string;
    together?: string;
    [key: string]: string | undefined;
  };
  aiConfig?: AIConfiguration; // V2.0: AI Provider configuration
  preferences?: {
    autoSave?: boolean;
    darkMode?: boolean;
    [key: string]: any;
  };
}

export interface Space {
  id: string;
  name: string;
  modules: Module[];
  connections: ModuleConnection[];
  configuration?: SpaceConfiguration;
  logs?: LogEntry[]; // Execution logs and errors
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasState {
  zoom: number;
  pan: Position;
}

export interface LocalProjectAnalysisInputs {
  localProjectPath: string;
  folderId?: string; // ID of the folder handle in IndexedDB
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

// AIE Engine / Reader Engine types (V2.0 - Module 2)
export interface AIEEngineInputs {
  repositoryMetadata?: any;
  fileContents?: any;
  repoStructure?: any;
}

export interface AppIntelligence {
  summary: string;
  category: string;
  subcategories: string[];
  features: string[];
  targetAudience: string;
  tone: string;
  designStyle: string;
  keywords: string[];
  problemsSolved: string[];
  competitiveAngle: string;
  brandColorsSuggested: string[];
  iconStyleRecommendation: string;
}

export interface AIEEngineOutputs {
  appIntelligence?: AppIntelligence;
  aieLog?: string;
  flowContext?: FlowContext; // Propagate language and preferences to downstream modules
}

// AI Provider response (V2.0)
export interface AIProviderResponse {
  outputText: string;
  rawResponse?: any;
  tokensUsed?: number;
  providerUsed: string;
  model: string;
}

// Flow Context (V2.0 - Global Pipeline Configuration)
// This context is propagated through all modules in the pipeline
// Each module can read from it and enrich it with new data
export interface FlowContext {
  // Language & Market (Set by Module 2 - AIE Engine)
  language?: string; // 'en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'zh', etc.
  targetMarket?: string; // 'US', 'EU', 'LATAM', 'ASIA', 'Global', etc.

  // Brand & Design (Set by Module 2 - AIE Engine)
  brandTone?: string; // Brand tone and voice
  brandColors?: string[]; // Array of hex colors like ['#3B82F6', '#10B981']
  designStyle?: string; // Design style description
  iconStyle?: string; // Recommended icon style

  // App Info (Set by Module 2 - AIE Engine)
  category?: string; // Main app category
  keywords?: string[]; // Key keywords for the app

  // Naming (Set by Module 3 - Naming Engine)
  appName?: string; // Final selected app name
  slogan?: string; // App slogan/tagline

  // Extensible for future modules
  customPreferences?: Record<string, any>;
}

// Naming Engine types (V2.0 - Module 3)
export interface NamingPackage {
  recommended_name: string;
  alternatives: string[];
  style: string;
  slogan: string;
  creative_rationale: string;
  naming_keywords: string[];
  tone: string;
  short_descriptions: string[];
  domain_suggestions: string[];
}

export interface ChosenName {
  final_name: string;
  chosen_at: string;
  source_module: string;
  engine_version: string;
}

export interface NamingEngineOutputs {
  namingPackage?: NamingPackage;
  chosenName?: ChosenName;
  namingLog?: string;
  flowContext?: FlowContext; // Propagate language and preferences to downstream modules
}

// Logo Generator types (V2.0 - Module 4A)
export interface LogoBrief {
  brand_name: string;
  final_name: string;
  tagline?: string;
  category: string;
  color_palette: string[];
  style: string;
  brand_keywords: string[];
  shape_preferences?: string;
  avoid_elements?: string[];
  num_variants?: number;
}

export interface LogoOption {
  id: number;
  image_url: string;
  style_summary: string;
  colors_used: string[];
  strengths?: string;
  weaknesses?: string;
  ai_prompt_used: string;
}

export interface LogoOptionsPackage {
  brand_name: string;
  num_variants: number;
  options: LogoOption[];
}

export interface ChosenLogo {
  brand_name: string;
  final_logo_option_id: number;
  final_logo_url: string;
  chosen_at: string;
  source_module: string;
}

export interface LogoGeneratorOutputs {
  logoOptions?: LogoOptionsPackage;
  chosenLogo?: ChosenLogo;
  logoLog?: string;
  flowContext?: FlowContext; // Propagate language and preferences to downstream modules
}

// Logo Variant types (V2.0 - Module 4A individual variants)
export interface LogoVariantInputs {
  variantId: number;
  generatorModuleId: string; // ID of parent Logo Generator module
}

export interface LogoVariantOutputs {
  logoData: {
    image_url: string;
    brand_name: string;
    style_summary: string;
    colors_used: string[];
    ai_prompt_used: string;
  };
  flowContext?: FlowContext; // Propagate language, colors, naming data
}
