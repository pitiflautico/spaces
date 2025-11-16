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
  | 'app-icon-generator'
  | 'app-icon-variant'
  | 'metadata-generator'
  | 'appstore-connect'
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

// Naming Engine types (V3.0 - Module 3 with Complete Branding)
export interface BrandingIdentity {
  // Visual Style
  design_style: string; // e.g., "modern minimalist", "vintage elegant", "bold futuristic"
  color_palette: string[]; // Array of hex colors (3-5 colors)
  color_meanings: string[]; // What each color represents

  // Typography
  primary_font_family: string; // Main font recommendation
  secondary_font_family: string; // Complementary font
  font_style: string; // e.g., "sans-serif modern", "serif classic"

  // Brand Personality
  brand_tone: string; // e.g., "professional", "playful", "elegant", "bold"
  brand_values: string[]; // Core values (3-5)
  target_emotion: string; // Emotion to evoke

  // Visual Elements
  shape_style: string; // e.g., "rounded soft", "sharp angular", "geometric"
  icon_style: string; // e.g., "minimalist line", "detailed illustration", "abstract"

  // Concept
  branding_concept: string; // Overall concept explanation
  visual_direction: string; // How the brand should look/feel
}

export interface NamingPackage {
  // Naming
  recommended_name: string;
  alternatives: string[];
  slogan: string;
  naming_keywords: string[];
  short_descriptions: string[];
  domain_suggestions: string[];

  // Complete Branding Identity
  branding: BrandingIdentity;

  // Metadata
  creative_rationale: string;
  style: string; // Deprecated - use branding.design_style
  tone: string; // Deprecated - use branding.brand_tone
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

  // Complete Branding Information (V3.0)
  visual_direction?: string; // CRITICAL - detailed context about app purpose, users, features, mood
  branding_concept?: string; // WHY behind the visual choices
  icon_style?: string; // Icon approach (minimalist, detailed, abstract, etc.)
  brand_tone?: string; // Overall personality (professional, playful, etc.)
  target_emotion?: string; // Main emotion to evoke
  color_meanings?: string[]; // What each color represents
  primary_font_family?: string; // Main font recommendation
  secondary_font_family?: string; // Complementary font
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

// App Icon Generator types (V1.0 - Module 4B)
export interface IconBrief {
  brand_name: string;
  style: string;
  color_palette: string[];
  background_preference?: string; // 'solid', 'gradient', 'transparent'
  shape?: string; // 'square', 'rounded-square', 'circle'
  icon_variants: number;
  include_symbol?: boolean;
  tagline_in_icon?: boolean;
  source_logo_url?: string;
  category?: string;

  // Complete Branding Information (V3.0)
  visual_direction?: string; // CRITICAL - detailed context about app purpose, users, features, mood
  branding_concept?: string; // WHY behind the visual choices
  icon_style?: string; // Icon approach (minimalist, detailed, abstract, etc.)
  brand_tone?: string; // Overall personality (professional, playful, etc.)
  target_emotion?: string; // Main emotion to evoke
  color_meanings?: string[]; // What each color represents
}

export interface IconSizeSet {
  // iOS
  ios_1024: string; // App Store submission

  // Android
  android_512: string; // Google Play Store
  android_xxxhdpi: string; // 192×192
  android_xxhdpi: string; // 144×144
  android_xhdpi: string; // 96×96
  android_hdpi: string; // 72×72
  android_mdpi: string; // 48×48

  // Optional
  favicon_32?: string;
}

export interface AppIconVariant {
  id: number;
  preview_image: string; // Main preview (512x512 or 1024x1024)
  sizes: IconSizeSet;
  style_summary: string;
  background_type: string;
  prompt_used: string;
}

export interface AppIconOptionsPackage {
  brand_name: string;
  num_variants: number;
  variants: AppIconVariant[];
}

export interface ChosenAppIcon {
  brand_name: string;
  final_icon_id: number;
  final_ios_icon: string; // 1024×1024
  final_android_icon: string; // 512×512
  chosen_at: string;
  source_module: string;
}

export interface AppIconGeneratorOutputs {
  iconOptions?: AppIconOptionsPackage;
  chosenIcon?: ChosenAppIcon;
  iconLog?: string;
  flowContext?: FlowContext;
}

// App Icon Variant types (V1.0 - Module 4B individual variants)
export interface AppIconVariantInputs {
  variantId: number;
  generatorModuleId: string; // ID of parent App Icon Generator module
}

export interface AppIconVariantOutputs {
  iconData: {
    preview_image: string;
    brand_name: string;
    style_summary: string;
    background_type: string;
    sizes: IconSizeSet;
    ai_prompt_used: string;
  };
  flowContext?: FlowContext;
}

// ============================================================
// MÓDULO 5 - METADATA GENERATOR (V3.0)
// ============================================================

// Metadata for App Store (iOS)
export interface AppStoreMetadata {
  title: string;                           // ≤ 30 chars
  subtitle: string;                        // ≤ 30 chars
  promotional_text: string;                // ≤ 170 chars
  description: string;                     // No strict limit
  keywords: string;                        // ≤ 100 chars (comma-separated)
}

// Metadata for Google Play (Android)
export interface GooglePlayMetadata {
  title: string;                           // ≤ 30 chars
  short_description: string;               // ≤ 80 chars
  full_description: string;                // ≤ 4,000 chars
  tags: string[];                          // Array of tags
}

// One complete metadata variant (App Store + Google Play)
export interface MetadataVariant {
  id: number;
  app_store: AppStoreMetadata;
  google_play: GooglePlayMetadata;

  // Variant metadata
  variant_name: string;                    // e.g., "Professional Focus", "Student Friendly"
  target_persona: string;                  // Who this variant targets
  tone: string;                            // Tone used (friendly, professional, technical)
  emphasis: string;                        // What aspects it emphasizes

  // AI info
  ai_prompt_used: string;
  generated_at: string;
}

// Complete package with all variants
export interface MetadataPackage {
  brand_name: string;
  num_variants: number;
  variants: MetadataVariant[];

  // Package metadata
  category: string;
  language: string;                        // 'en', 'es', 'fr', etc.
  generated_at: string;
  validation_passed: boolean;              // All variants pass limits
  validation_warnings?: string[];          // Validation warnings
}

// Final metadata chosen by user
export interface ChosenMetadata {
  variant_id: number;
  app_store: AppStoreMetadata;
  google_play: GooglePlayMetadata;
  chosen_at: string;
  source_module: string;
  engine_version: string;
}

// Input for Metadata Generator module (combined from M2 + M3 + M4B)
export interface MetadataGeneratorInputs {
  // Module configuration
  numVariants?: number;                    // Number of variants to generate (default: 3)
  targetMarket?: string;                   // 'US', 'EU', 'LATAM', 'ASIA', 'Global'
  emphasizeFeatures?: string[];            // Specific features to emphasize
  style?: 'conservative' | 'creative' | 'balanced';  // Default: 'balanced'

  // AI Provider settings (module-level override)
  aiProvider?: AIProvider;
  aiModel?: string;
  temperature?: number;                    // Default: 0.7
}

// Outputs of Metadata Generator module
export interface MetadataGeneratorOutputs {
  metadataPackage?: MetadataPackage;       // All variants
  chosenMetadata?: ChosenMetadata;         // Final selected variant
  metadataLog?: string;                    // Generation log
  flowContext?: FlowContext;               // Propagated context
}

// ============================================================================
// MODULE 7: APP STORE CONNECT AUTOMATION
// ============================================================================

/**
 * Build configuration for App Store Connect
 */
export interface BuildConfig {
  bundle_id: string;                       // com.company.app
  version: string;                         // 1.0.0
  build_number: string;                    // 1
  team_id: string;                         // Apple Team ID
  localizations: string[];                 // ["en-US", "es-ES"]
  privacy_policy_url?: string;             // Privacy policy URL
  support_url?: string;                    // Support URL
  marketing_url?: string;                  // Marketing URL
  uses_encryption?: boolean;               // Encryption declaration
  release_notes?: string;                  // What's new in this version
}

/**
 * Screenshot set organized by device size
 */
export interface ScreenshotSet {
  screenshots_by_device: {
    [deviceSize: string]: Array<{           // "6.7", "6.5", "5.5"
      path: string;                         // File path
      resolution: string;                   // "1290x2796"
      order: number;                        // Display order (1-10)
    }>;
  };
  chosen_set: string;                       // Selected variant name
}

/**
 * Validation error from App Store Connect
 */
export interface ValidationError {
  code: string;                             // Error code (e.g., "MISSING_PRIVACY_POLICY")
  message: string;                          // Human-readable message
  severity: 'error' | 'warning';           // Error severity
  field: string;                            // Affected field
}

/**
 * Validation warning from App Store Connect
 */
export interface ValidationWarning {
  code: string;                             // Warning code
  message: string;                          // Human-readable message
  severity: 'warning';                      // Always warning
  field: string;                            // Affected field
}

/**
 * Validation result from App Store Connect
 */
export interface ValidationResult {
  passed: boolean;                          // True if no errors
  errors: ValidationError[];                // Validation errors
  warnings: ValidationWarning[];            // Validation warnings
  timestamp: string;                        // ISO 8601 timestamp
}

/**
 * Result of App Store Connect automation
 */
export interface AppStoreConnectResult {
  status: 'success' | 'partial' | 'failed'; // Overall status
  app_created: boolean;                     // App was created (or found)
  metadata_uploaded: boolean;               // Metadata uploaded successfully
  icon_uploaded: boolean;                   // Icon uploaded successfully
  screenshots_uploaded: boolean;            // Screenshots uploaded
  build_selected: boolean;                  // Build associated with version
  privacy_configured: boolean;              // Privacy settings configured
  validation_passed: boolean;               // App Store validation passed
  errors: string[];                         // Error messages
  warnings: string[];                       // Warning messages
  execution_time_ms: number;                // Total execution time
  timestamp: string;                        // ISO 8601 timestamp
}

/**
 * Inputs for App Store Connect Module
 */
export interface AppStoreConnectInputs {
  buildConfig?: BuildConfig;                // Build configuration
  autoSubmit?: boolean;                     // Auto-submit for review
  skipScreenshots?: boolean;                // Skip screenshot upload
}

/**
 * Outputs from App Store Connect Module
 */
export interface AppStoreConnectOutputs {
  automationResult?: AppStoreConnectResult; // Automation result
  connectLog?: string;                      // Detailed log
  validationReport?: ValidationResult;      // Validation report
  appStoreUrl?: string;                     // URL to app in App Store Connect
}
