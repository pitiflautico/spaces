# 📋 PROJECT STATUS — MARKETING SPACES v2.1
**Documento de Estado del Proyecto para Continuidad de Desarrollo con IA**

> **PROPÓSITO**: Este documento es la fuente de verdad para cualquier IA que trabaje en este proyecto.
> Contiene TODO lo necesario para entender el estado actual, evitar duplicación de código y continuar el desarrollo de forma coherente.

**Última actualización**: 2025-11-15 (Session 5 - Module 5 Metadata Generator + Local Automation Daemon)
**Versión del sistema**: v3.0 (complete marketing pipeline + local automation)
**Fase actual**: ✅ Session 5: Metadata Generator + iOS Simulator Automation

---

## 🆕 ÚLTIMOS CAMBIOS (2025-11-15)

### ✅ SESIÓN 5: Metadata Generator Module + Local Automation Daemon (NUEVO)

**MÓDULOS IMPLEMENTADOS**: 2 módulos completos + daemon de automatización

#### 1. ✅ **Módulo 5 - Metadata Generator (100% Completo)**

**Archivos NUEVOS**:
- ✅ `/components/modules/MetadataGeneratorModule.tsx` - Componente principal (900 líneas)
- ✅ `/components/modules/MetadataVariantsPanel.tsx` - Panel de selección de variantes (400 líneas)
- ✅ `/docs/MODULE_5_METADATA_GENERATOR.md` - Documentación completa (898 líneas)

**Archivos MODIFICADOS**:
- ✅ `/types/index.ts` - Añadidos 9 interfaces nuevas (90 líneas):
  - `AppStoreMetadata` - iOS App Store metadata (title, subtitle, promotional_text, description, keywords)
  - `GooglePlayMetadata` - Android Google Play metadata (title, short_description, full_description, tags)
  - `MetadataVariant` - Variante completa con metadata iOS + Android
  - `MetadataPackage` - Paquete con N variantes generadas
  - `ChosenMetadata` - Metadata final seleccionada por usuario
  - `MetadataGeneratorInputs` - Inputs del módulo (configuración + AI settings)
  - `MetadataGeneratorOutputs` - Outputs del módulo (package + chosen + log + context)
- ✅ `/lib/store.ts` - Añadido moduleDefaults para 'metadata-generator':
  - 4 Input Ports: App Intelligence, Naming Package, Chosen Name, Icon Options
  - 4 Output Ports: Metadata Package, Chosen Metadata, Log, Flow Context
- ✅ `/components/canvas/ModuleBlock.tsx` - Integrado Metadata Generator
- ✅ `/components/canvas/AddModulePanel.tsx` - Añadido a categoría Marketing

**Funcionalidades Implementadas**:

**A. Generación de Metadata con IA**:
- ✅ N variantes configurables (1, 3, 5)
- ✅ Multi-idioma via FlowContext (en, es, fr, de, pt, it, ja, zh)
- ✅ Multi-mercado (Global, US, EU, LATAM, ASIA)
- ✅ 3 estilos de escritura (balanced, creative, conservative)
- ✅ AI Provider configurable por módulo (Together, Replicate, OpenAI, Anthropic, Local)
- ✅ Prompt engineering con guidelines oficiales de App Store y Google Play

**B. Validación Automática**:
- ✅ App Store requirements:
  - Title ≤ 30 caracteres
  - Subtitle ≤ 30 caracteres
  - Promotional Text ≤ 170 caracteres
  - Keywords ≤ 100 caracteres (sin repetir palabras del título)
  - Description (sin límite estricto)
- ✅ Google Play requirements:
  - Title ≤ 30 caracteres
  - Short Description ≤ 80 caracteres
  - Full Description ≤ 4,000 caracteres
  - Tags array
- ✅ Detección de palabras prohibidas (#1, best, download now, free forever)
- ✅ Character count con color coding (verde OK, amarillo warning, rojo error)

**C. Panel de Variantes Interactivo**:
- ✅ Modal full-screen elegante (90vw x 85vh)
- ✅ Tarjetas por variante con preview completo
- ✅ Expand/collapse para ver descripciones completas
- ✅ Sistema de selección de variante final
- ✅ Indicadores visuales de validación
- ✅ Vista previa iOS + Android lado a lado

**D. Integración con Pipeline**:
- ✅ Conecta con Módulo 2 (AIE Engine) - App Intelligence
- ✅ Conecta con Módulo 3 (Naming Engine) - Naming Package + Chosen Name
- ✅ Conecta con Módulo 4B (App Icon) - Icon Options (opcional)
- ✅ Propaga FlowContext a módulos downstream

**Código de referencia**:
```typescript
// Generación de 3 variantes con diferentes tonos
const metadataPackage: MetadataPackage = {
  brand_name: "FoxTimer",
  num_variants: 3,
  variants: [
    { id: 1, variant_name: "Professional Focus", target_persona: "Professionals", ... },
    { id: 2, variant_name: "Student Friendly", target_persona: "Students", ... },
    { id: 3, variant_name: "Creative Minimalist", target_persona: "Creators", ... }
  ],
  language: "en",
  category: "Productivity",
  validation_passed: true
};

// Cada variante incluye metadata completa iOS + Android
interface MetadataVariant {
  app_store: {
    title: string;              // ≤ 30 chars
    subtitle: string;           // ≤ 30 chars
    promotional_text: string;   // ≤ 170 chars
    description: string;        // Full description
    keywords: string;           // ≤ 100 chars
  };
  google_play: {
    title: string;              // ≤ 30 chars
    short_description: string;  // ≤ 80 chars
    full_description: string;   // ≤ 4000 chars
    tags: string[];
  };
}
```

---

#### 2. ✅ **Local Automation Daemon (100% Completo)**

**Archivos NUEVOS**:
- ✅ `/local-automation-daemon/bin/daemon.js` - Servidor Express.js (700 líneas)
- ✅ `/local-automation-daemon/package.json` - Dependencias y scripts
- ✅ `/local-automation-daemon/.env.example` - Variables de entorno
- ✅ `/local-automation-daemon/README.md` - Quick start guide
- ✅ `/local-automation-daemon/config/devices.json` - Simuladores predefinidos
- ✅ `/local-automation-daemon/config/settings.json` - Configuración del daemon
- ✅ `/local-automation-daemon/scripts/navigation/onboarding-example.json` - Script de navegación ejemplo
- ✅ `/local-automation-daemon/scripts/navigation/main-features-example.json` - Otro ejemplo
- ✅ `/local-automation-daemon/test/test-endpoints.sh` - Suite de tests
- ✅ `/local-automation-daemon/.gitignore` - Archivos a ignorar
- ✅ `/docs/LOCAL_AUTOMATION_DAEMON.md` - Documentación completa (1244 líneas)

**Arquitectura del Sistema**:
```
┌─────────────────────────────┐
│  Web Interface (Browser)   │
│  http://localhost:3000      │
└──────────┬──────────────────┘
           │ REST API
           ▼
┌─────────────────────────────┐
│  Local Automation Daemon    │
│  http://localhost:5050      │
│  Node.js Express Server     │
└──────────┬──────────────────┘
           │ Child Process
           ▼
┌─────────────────────────────┐
│  macOS Native Commands      │
│  - xcrun simctl             │
│  - cliclick                 │
│  - sips                     │
│  - osascript                │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  iOS Simulator + App        │
└─────────────────────────────┘
```

**13 Endpoints REST Implementados**:

1. **GET /health** - Health check del daemon
2. **GET /list-simulators** - Lista simuladores iOS disponibles
3. **POST /boot-simulator** - Bootea simulador específico
4. **POST /install-app** - Instala .app en simulador booteado
5. **POST /launch-app** - Lanza app instalada
6. **POST /tap** - Simula tap en coordenadas (x, y)
7. **POST /move** - Mueve cursor a coordenadas
8. **POST /scroll** - Simula scroll (up/down)
9. **POST /screenshot** - Captura screenshot del simulador
10. **POST /run-script** - Ejecuta script de navegación completo
11. **POST /resize-images** - Redimensiona a tamaños oficiales App Store/Google Play
12. **POST /kill-app** - Termina app en simulador
13. **POST /shutdown-simulator** - Apaga simulador

**Comandos Nativos Ejecutados**:
```bash
# Simulador
xcrun simctl boot "iPhone 15 Pro"
xcrun simctl install booted "/path/to/app.app"
xcrun simctl launch booted com.company.myapp
xcrun simctl io booted screenshot "output.png"
xcrun simctl shutdown booted

# Mouse automation
cliclick c:300,800  # Click
cliclick m:300,800  # Move

# Image processing
sips -z 2796 1290 input.png --out output.png

# AppleScript (scroll)
osascript -e 'tell application "Simulator" to activate'
```

**Seguridad Implementada**:
- ✅ Solo localhost (no accesible desde red)
- ✅ CORS restringido a http://localhost:3000
- ✅ Path validation (previene directory traversal)
- ✅ Command whitelisting (no eval() ni ejecución arbitraria)
- ✅ Timeout en comandos (30s default, configurable)

**Logging con Winston**:
```javascript
[2025-11-15T19:10:00.123Z] [INFO] Daemon started on http://localhost:5050
[2025-11-15T19:10:15.456Z] [INFO] POST /boot-simulator - device: iPhone 15 Pro
[2025-11-15T19:10:19.789Z] [INFO] Simulator booted successfully
[2025-11-15T19:10:22.012Z] [INFO] POST /run-script - variant_id: 1, steps: 7
[2025-11-15T19:10:30.901Z] [INFO] Script execution completed - 5 screenshots
```

**Ejemplo de Script de Navegación**:
```json
{
  "navigation_script": [
    {"action": "wait", "seconds": 2},
    {"action": "tap", "x": 375, "y": 750},
    {"action": "screenshot", "name": "01_welcome.png"},
    {"action": "scroll", "direction": "down", "amount": 200},
    {"action": "screenshot", "name": "02_features.png"}
  ],
  "variant_id": 1,
  "app_bundle_id": "com.company.myapp"
}
```

**Integración con Módulo 6 (Screenshot Generator)**:
```typescript
// En Screenshot Generator Module
async function generateScreenshots() {
  // 1. Boot simulator
  await fetch('http://localhost:5050/boot-simulator', {
    method: 'POST',
    body: JSON.stringify({ device: 'iPhone 15 Pro' })
  });

  // 2. Install + Launch app
  await fetch('http://localhost:5050/install-app', { ... });
  await fetch('http://localhost:5050/launch-app', { ... });

  // 3. Run navigation script
  const result = await fetch('http://localhost:5050/run-script', {
    method: 'POST',
    body: JSON.stringify({ navigation_script, variant_id: 1 })
  });

  // 4. Returns: { screenshots: [...paths], execution_time_ms: 8500 }
}
```

**Requisitos del Sistema**:
- macOS 13.0+ (Ventura o superior)
- Xcode 14.0+ con Command Line Tools
- Node.js 18.0+
- cliclick: `brew install cliclick`
- iOS Simulators configurados

**Instalación**:
```bash
cd local-automation-daemon
npm install
cp .env.example .env
npm start  # Daemon running on http://localhost:5050
```

---

### Métricas de la Sesión 5

**Código Nuevo**:
- Módulo 5: ~1,400 líneas TypeScript
- Daemon: ~900 líneas JavaScript/JSON
- Tipos: ~90 líneas TypeScript
- **Total**: ~2,400 líneas de código

**Documentación Nueva**:
- MODULE_5_METADATA_GENERATOR.md: 898 líneas
- LOCAL_AUTOMATION_DAEMON.md: 1,244 líneas
- READMEs y configs: ~200 líneas
- **Total**: ~2,342 líneas de documentación

**Archivos Creados**: 17 archivos nuevos
**Archivos Modificados**: 4 archivos existentes

---

## 🆕 CAMBIOS SESIÓN 4 (2025-11-15)

### ✅ SESIÓN 4: Browser-Based File Scanning + Embedded AI Configuration

**PROBLEMA SOLUCIONADO**: Múltiples problemas críticos:
1. **Local path no se leía**: Path genérico `/Users/user/Projects/...` causaba error
2. **CORS blocking AI providers**: Fetch directo desde navegador a Replicate/Together bloqueado
3. **Missing AI model**: Campo model no estaba configurado
4. **Errores no visibles**: Alerts del sistema en lugar de UI de la plataforma

**Archivos NUEVOS**:
- ✅ `/lib/browser-file-scanner.ts` - Scanner de archivos 100% en navegador
- ✅ `/types/file-system.d.ts` - Definiciones TypeScript para File System Access API
- ✅ `/app/api/ai-inference/route.ts` - Proxy API para evitar CORS

**Archivos MODIFICADOS**:
- ✅ `/components/canvas/ModuleBlock.tsx` - Usa browser scanner + mejores errores
- ✅ `/components/modules/LocalProjectAnalysisModule.tsx` - Guarda folder handles
- ✅ `/components/modules/AIEEngineModule.tsx` - Selector AI embebido en módulo
- ✅ `/components/canvas/ModuleWrapper.tsx` - Display de errores en módulo
- ✅ `/components/configuration/ConfigurationPanel.tsx` - Modelo marcado requerido
- ✅ `/lib/adapters/*.ts` - Todos los adapters usan proxy API
- ✅ `/types/index.ts` - Añadido `folderId` a LocalProjectAnalysisInputs

#### 1. ✅ **Browser-Based File Scanning (Sin backend filesystem)**

**Arquitectura anterior** (❌ Fallaba):
```
Browser → Backend API → fs.readdir() → ❌ Path incorrecto
```

**Nueva arquitectura** (✅ Funciona):
```
Browser → FileSystemDirectoryHandle → IndexedDB → Browser-based scanner
```

**Características**:
- ✅ File System Access API para acceso a carpetas
- ✅ Handles persistentes en IndexedDB
- ✅ Permisos se mantienen entre sesiones
- ✅ Scanning recursivo desde el navegador
- ✅ No necesita paths del filesystem (solo handles)
- ✅ Funciona con carpetas guardadas en configuración

**Código de referencia**:
```typescript
// Guardar handle con ID único
const folderId = `folder-${Date.now()}-${folderName}`;
await saveFolderHandle(folderId, folderName, displayPath, dirHandle);

// Recuperar y usar handle
const folderHandle = await getFolderHandle(folderId);
const data = await analyzeProjectFromHandle(folderHandle, options);
```

#### 2. ✅ **API Proxy para AI Providers (CORS resuelto)**

**Problema anterior**:
```
Browser → https://api.replicate.com → ❌ CORS blocked
```

**Solución**:
```
Browser → /api/ai-inference → Replicate API → ✅ Success
```

**Características**:
- ✅ Proxy unificado para todos los providers (Replicate, Together, OpenAI, Anthropic)
- ✅ Maneja polling asíncrono de Replicate
- ✅ Normaliza respuestas de diferentes APIs
- ✅ API keys seguras (nunca expuestas en navegador)
- ✅ Errores HTTP traducidos a mensajes claros

**Código de referencia**:
```typescript
// Adapter llama al proxy
const response = await fetch('/api/ai-inference', {
  body: JSON.stringify({
    provider: 'replicate',
    model: 'meta/meta-llama-3-70b-instruct',
    prompt: '...',
    apiKey: '...',
  })
});

// Proxy hace polling y retorna respuesta normalizada
return { outputText, tokensUsed, provider, model };
```

#### 3. ✅ **Configuración AI Embebida en Módulo AIE Engine**

**Antes**: Configuración global en Settings (confuso)
**Ahora**: Selector de IA directamente en el módulo

**Características**:
- ✅ Selector de provider en el módulo (Together, Replicate, OpenAI, Anthropic)
- ✅ Combo de modelos predefinidos por provider
- ✅ Modelo por defecto: "Llama 3.3 70B Turbo" (Together)
- ✅ Indicador de API key status
- ✅ Links a documentación según provider
- ✅ Configuración independiente por módulo

**Modelos predefinidos**:
```typescript
const AI_MODELS = {
  [AIProvider.TOGETHER]: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', description: 'Recommended' },
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B Turbo', description: 'Most powerful' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', description: 'Fast and efficient' },
  ],
  [AIProvider.REPLICATE]: [
    { id: 'meta/meta-llama-3-70b-instruct', name: 'Meta Llama 3 70B', description: 'Fast and powerful' },
    { id: 'meta/meta-llama-3.1-405b-instruct', name: 'Meta Llama 3.1 405B', description: 'Most powerful' },
  ],
  // ... OpenAI, Anthropic
};
```

**UI del módulo**:
```tsx
<select onChange={(e) => handleProviderChange(e.target.value)}>
  <option value="together">Together AI (Recommended)</option>
  <option value="replicate">Replicate</option>
  <option value="openai">OpenAI</option>
  <option value="anthropic">Anthropic</option>
</select>

<select onChange={(e) => handleModelChange(e.target.value)}>
  {AI_MODELS[selectedProvider].map(model => (
    <option value={model.id}>{model.name} - {model.description}</option>
  ))}
</select>
```

#### 4. ✅ **Sistema de Errores Mejorado**

**Antes**: `alert()` del sistema
**Ahora**: Errores integrados en la plataforma

**Características**:
- ✅ Errores se muestran en el módulo (caja roja con ícono)
- ✅ Errores en logs del sistema (trazables)
- ✅ Mensajes de error específicos por código HTTP
- ✅ Módulo cambia a estado 'error' con borde rojo
- ✅ Ya NO usa `alert()` nativo

**Mensajes mejorados**:
```typescript
// HTTP 401 → "Authentication failed: Invalid API key for replicate. Please check your API key in Settings."
// HTTP 429 → "Rate limit exceeded for together. Please try again later."
// HTTP 500 → "replicate server error. Please try again later."
// Missing model → "AI Model not configured. Please select a model in Settings."
```

**Display en módulo**:
```tsx
{module.status === 'error' && module.errorMessage && (
  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
    <div className="flex items-start gap-2">
      <svg className="w-5 h-5 text-red-400">...</svg>
      <div>
        <h4 className="text-sm font-semibold text-red-400">Error</h4>
        <p className="text-xs text-red-300">{module.errorMessage}</p>
      </div>
    </div>
  </div>
)}
```

#### 5. ✅ **Mejoras en Configuración Global**

**Configuration Panel**:
- ✅ Campo "Model" marcado como requerido (*)
- ✅ Placeholders actualizados con modelos reales
- ✅ Enlaces a documentación por provider:
  - Replicate → replicate.com/explore
  - Together → api.together.xyz/models
  - OpenAI → Ejemplos: gpt-4, gpt-3.5-turbo
  - Anthropic → Ejemplos: claude-3-opus-20240229

**Validación mejorada**:
```typescript
if (!aiConfig.model) {
  throw new Error('AI Model not configured. Please select a model in Settings.');
}
```

---

## 🆕 ÚLTIMOS CAMBIOS (2025-11-15 - Sesión Anterior)

### ✅ SESIÓN 3: UX Improvements - Port Visibility & Configuration Panel

**Archivos MODIFICADOS**:
- ✅ `/components/canvas/ModuleWrapper.tsx` - Improved port visualization
- ✅ `/components/configuration/ConfigurationPanel.tsx` - Tab-based layout restructuring

**Mejoras implementadas**:

#### 1. ✅ **Port Visibility Improvements**
   - Input ports now render on LEFT side (output ports on right)
   - Ports positioned OUTSIDE module boundaries (-left-3, -right-3) for better visibility
   - Increased port size from 6x6 to 8x8 pixels
   - Icon size increased to 4x4 pixels
   - Added shadow-lg for depth and z-50 for layering
   - Bright blue border (#3B82F6) on selected modules
   - overflow: visible on module container
   - Visual feedback: hover effects, compatibility highlighting, green ring when dragging

**Código de referencia**:
```tsx
// Input ports (LEFT side)
<div
  className="port absolute -left-3 z-50"
  style={{ top: portTop, transform: 'translateY(-50%)' }}
>
  <div className={`w-8 h-8 ${colorClass} rounded-full border-2 border-dark-bg
    transition-all cursor-pointer flex items-center justify-center shadow-lg
    ${isCompatible ? 'ring-4 ring-green-400/50 scale-125' : ''}
    ${isHovered ? 'scale-110' : 'hover:scale-105'}`}
  >
    <Icon className="w-4 h-4 text-white" />
  </div>
</div>
```

#### 2. ✅ **Configuration Panel Restructuring**
   - Tab-based navigation: General, AI Provider, API Keys
   - Larger panel size (max-w-3xl, 85vh)
   - "AI Provider" tab: Provider selection → Model → Temperature → Max Tokens
   - Link from AI tab to API Keys tab when non-local provider selected
   - "API Keys" tab: Shows all providers with "(Currently selected)" indicator
   - Info banners explaining each section
   - Better visual hierarchy and organization

**Código de referencia**:
```tsx
// Tab-based layout
const [activeTab, setActiveTab] = useState<Tab>('general');

{/* Tabs */}
<div className="flex gap-1 px-6 pt-4 border-b border-[#2A2A2A]">
  <button onClick={() => setActiveTab('general')}>General</button>
  <button onClick={() => setActiveTab('ai')}>AI Provider</button>
  <button onClick={() => setActiveTab('apikeys')}>API Keys</button>
</div>

{/* Conditional content */}
{activeTab === 'ai' && (
  <div className="space-y-6">
    {/* Provider selection first */}
    <select value={config.aiConfig?.provider}>...</select>

    {/* Link to API Keys tab if needed */}
    {config.aiConfig?.provider !== AIProvider.LOCAL && (
      <div className="bg-yellow-500/10">
        <button onClick={() => setActiveTab('apikeys')}>
          Add your {provider} API key
        </button>
      </div>
    )}
  </div>
)}
```

**User feedback addressed**:
- "el modulo 2 no tiene conectro" → Input ports now visible
- "estructuralo mejor o hacelo mas grande o por tabs para que se vea bien ahora en un chorizo" → Tab-based layout with better organization

---

### ✅ SESIÓN V2.0: AI Provider Layer + AIE Engine + Flow Execution

**NUEVO SISTEMA COMPLETO**: AI Provider abstraction layer con soporte multi-provider

**Archivos NUEVOS**:
- ✅ `/lib/ai-provider.ts` - Provider manager con error handling
- ✅ `/lib/adapters/index.ts` - Auto-initialization de adapters
- ✅ `/lib/adapters/together-adapter.ts` - Together AI adapter
- ✅ `/lib/adapters/replicate-adapter.ts` - Replicate adapter con polling
- ✅ `/lib/adapters/openai-adapter.ts` - OpenAI Chat Completions adapter
- ✅ `/lib/adapters/anthropic-adapter.ts` - Anthropic Messages adapter
- ✅ `/lib/adapters/mock-adapter.ts` - Mock adapter para testing
- ✅ `/components/modules/AIEEngineModule.tsx` - Módulo 2 funcional con IA

**Archivos MODIFICADOS**:
- ✅ `/types/index.ts` - Añadidos tipos de IA (AIProvider, AIConfiguration, AppIntelligence)
- ✅ `/lib/store.ts` - Añadidos executeFlow(), resetAll(), resetModule(), resetFrom()
- ✅ `/components/configuration/ConfigurationPanel.tsx` - Panel de configuración AI Provider
- ✅ `/components/canvas/ModuleBlock.tsx` - Integración de AIEEngineModule
- ✅ `/components/canvas/FloatingToolbar.tsx` - Conectado Play Flow y Restart Flow
- ✅ `/components/canvas/Canvas.tsx` - Fix spacebar en inputs (no interceptar en INPUT/TEXTAREA)

**Funcionalidad implementada**:

#### 1. ✅ **AI Provider Layer** (Abstracción multi-provider)
   - Manager central con `aiProvider.run()` y `aiProvider.testConnection()`
   - 7 códigos de error específicos (IA_ERROR_01 a IA_ERROR_07)
   - Sistema de adapters con patrón Strategy
   - Soporte para 5 providers: Together, Replicate, OpenAI, Anthropic, Mock
   - Auto-registro de adapters en import

**Código de referencia**:
```typescript
// AI Provider Manager
export const aiProvider = new AIProviderManager();
await aiProvider.run(prompt, {
  provider: AIProvider.OPENAI,
  apiKey: 'sk-...',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4096
});
```

#### 2. ✅ **Adapters implementados** (5/5)
   - **TogetherAdapter**: https://api.together.xyz/v1/completions
   - **ReplicateAdapter**: Polling async para modelos LLaMA
   - **OpenAIAdapter**: Chat Completions API con streaming support
   - **AnthropicAdapter**: Messages API con Claude models
   - **MockAdapter**: Testing sin API keys, genera AppIntelligence mock

#### 3. ✅ **AIE Engine Module** (Module 2 - Reader Engine)
   - 3 inputs JSON: Repository Metadata, File Contents, Repo Structure
   - 1 output JSON: App Intelligence
   - Integración completa con AI Provider Layer
   - Prompt builder automático
   - Parser JSON con fallback regex
   - Display de: summary, category, keywords, brand colors
   - Estado visual: idle → running → done/error

**Código de referencia**:
```tsx
// AIEEngineModule.tsx - Flow completo
const handleRun = async () => {
  // 1. Get AI config from space
  const aiConfig = space?.configuration?.aiConfig;

  // 2. Get inputs from connected modules
  const { repositoryMetadata, fileContents, repoStructure } = module.inputs;

  // 3. Build prompt
  const prompt = buildPrompt(repositoryMetadata, fileContents, repoStructure);

  // 4. Call AI provider
  const response = await aiProvider.run(prompt, {
    ...aiConfig,
    apiKey: getAPIKeyForProvider(aiConfig.provider, space.configuration.apiKeys)
  });

  // 5. Parse AppIntelligence JSON
  const appIntelligence = JSON.parse(response.outputText);

  // 6. Update module outputs
  updateModule(module.id, { status: 'done', outputs: { appIntelligence } });
};
```

#### 4. ✅ **Configuration Panel Updates**
   - Sección "AI Provider (V2.0)" con dropdown de providers
   - Inputs para API keys: Replicate y Together (además de OpenAI/Anthropic)
   - Selector de modelo con placeholders dinámicos
   - Slider de temperatura (0-2)
   - Input de max tokens
   - SparklesIcon para sección de IA

#### 5. ✅ **Play Flow - Ejecución topológica**
   - Algoritmo de Kahn para ordenamiento topológico
   - `executeFlow()` en store con cálculo de dependencias
   - FloatingToolbar conectado a executeFlow()
   - Error handling con try/catch
   - Console logs de progreso

**Código de referencia**:
```typescript
// Topological sort implementation
function calculateTopologicalOrder(modules: Module[], connections: ModuleConnection[]): string[] {
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Build graph
  modules.forEach(m => {
    adjList.set(m.id, []);
    inDegree.set(m.id, 0);
  });

  connections.forEach(c => {
    adjList.get(c.sourceModuleId)!.push(c.targetModuleId);
    inDegree.set(c.targetModuleId, inDegree.get(c.targetModuleId)! + 1);
  });

  // Kahn's algorithm
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    adjList.get(current)!.forEach(neighbor => {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }

  return result;
}
```

#### 6. ✅ **Restart Flow - Reset completo**
   - `resetAll()` implementado en store
   - Reset de todos los módulos a 'idle'
   - Limpieza de outputs
   - Confirmación de usuario
   - FloatingToolbar conectado a resetAll()

**Código de referencia**:
```typescript
// FloatingToolbar.tsx - Restart Flow
const handleRestartFlow = () => {
  if (confirm('¿Resetear todos los módulos? Esto borrará todos los outputs y estados.')) {
    resetAll();
    console.log('✓ Restart Flow - All modules reset to idle');
  }
};
```

#### 7. ✅ **Sistema de reinicio avanzado**
   - `resetModule(id)`: Reset individual + marcar dependientes como invalid
   - `resetFrom(id)`: Reset en cascada desde un módulo
   - BFS para encontrar módulos dependientes
   - Propagación de estado 'invalid' a dependencias

**Código de referencia**:
```typescript
// Find dependent modules using BFS
function findDependentModules(moduleId: string, connections: ModuleConnection[]): string[] {
  const dependents = new Set<string>();
  const queue = [moduleId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    connections
      .filter(c => c.sourceModuleId === current)
      .forEach(c => {
        if (!dependents.has(c.targetModuleId)) {
          dependents.add(c.targetModuleId);
          queue.push(c.targetModuleId);
        }
      });
  }

  return Array.from(dependents);
}
```

#### 8. ✅ **Bug fixes**
   - Canvas spacebar no bloquea inputs (check de INPUT/TEXTAREA/contentEditable)
   - Hydration mismatch fixed con isHydrated state

**Tipos nuevos agregados (V2.0)**:
```typescript
// types/index.ts
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

export interface AIProviderResponse {
  outputText: string;
  rawResponse?: any;
  tokensUsed?: number;
  providerUsed: string;
  model: string;
}
```

**Store actions nuevas (V2.0)**:
```typescript
// lib/store.ts
interface SpaceStore {
  // V2.0 Flow execution
  executeFlow: () => Promise<void>;          // Topological execution
  resetAll: () => void;                      // Reset all to idle
  resetModule: (id: string) => void;         // Reset one + mark dependents invalid
  resetFrom: (id: string) => void;           // Reset from this onwards
}
```

**Archivos críticos V2.0**:
- `/lib/ai-provider.ts` - Provider manager (218L)
- `/lib/adapters/` - 6 archivos de adapters (~500L total)
- `/components/modules/AIEEngineModule.tsx` - AIE Engine (253L)
- `/types/index.ts` - Tipos extendidos con IA

---

## 🆕 CAMBIOS V1.1 (Sesiones anteriores)

### ✅ SESIÓN 3 (Parte 2): UX Final Refinements

**Archivos MODIFICADOS**:
- ✅ `/components/canvas/ModuleWrapper.tsx` - Play button oculto cuando módulo está "done"
- ✅ `/components/modules/LocalProjectAnalysisModule.tsx` - Dialog personalizado de permisos
- ✅ `/components/sidebar/Sidebar.tsx` - Input de espacio acepta espacios (onKeyDown)

**Funcionalidad implementada**:
1. ✅ **Custom Permission Dialog**: Dialog personalizado antes de abrir folder selector
   - Reemplaza el alert del sistema con UI elegante
   - Mensaje claro: "Solo lectura, no upload de archivos"
   - Botones Cancel/Allow Access
   - z-index alto para overlay completo
2. ✅ **Play button inteligente**: Se oculta completamente cuando módulo está "done"
   - Antes: Deshabilitado (confuso)
   - Ahora: Oculto (más claro)
   - Solo visible cuando módulo está idle o puede ejecutarse
3. ✅ **Settings button condicional**: Solo aparece en módulos que lo necesitan
   - hasSettings prop en ModuleWrapper
   - Solo LocalProjectAnalysis muestra settings
   - Otros módulos: espaciador vacío
4. ✅ **Input de nombre de espacio arreglado**:
   - Cambiado onKeyPress → onKeyDown
   - Ahora acepta espacios correctamente
   - Mejora compatibilidad con navegadores

**Código de referencia**:
```tsx
// ModuleWrapper.tsx - Play button oculto
{onRun && module.status !== 'done' && (
  <button onClick={onRun} disabled={module.status === 'running'}>
    <PlayIcon />
  </button>
)}

// LocalProjectAnalysisModule.tsx - Dialog personalizado
{showPermissionDialog && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center">
    <div className="bg-[#1A1A1A] rounded-2xl p-6">
      <h3>Folder Access Permission</h3>
      <p>This will only read folder information...</p>
      <button onClick={handleConfirmFolderSelection}>Allow Access</button>
    </div>
  </div>
)}

// Sidebar.tsx - onKeyDown en lugar de onKeyPress
<input
  value={newSpaceName}
  onChange={(e) => setNewSpaceName(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
/>
```

### ✅ SESIÓN 3 (Parte 1): UX Improvements + Configuration System

**Archivos NUEVOS**:
- ✅ `/components/configuration/ConfigurationPanel.tsx` - Panel de configuración completo

**Archivos MODIFICADOS**:
- ✅ `/components/canvas/FloatingToolbar.tsx` - Reposicionado y reducido de tamaño
- ✅ `/components/modules/LocalProjectAnalysisModule.tsx` - Mejora UX folder selection + outputs
- ✅ `/components/sidebar/Sidebar.tsx` - Limpieza de items no usados + botón Configuration
- ✅ `/types/index.ts` - Añadido SpaceConfiguration interface
- ✅ `/lib/store.ts` - Añadido updateSpaceConfiguration() + persist middleware

**Funcionalidad implementada**:
1. ✅ **FloatingToolbar reposicionado**: Ahora está a la derecha del sidebar (left: 272px)
2. ✅ **FloatingToolbar compacto**: Reducido de w-12/h-12 a w-9/h-9 (botones más pequeños)
3. ✅ **Toolbar simplificado**: Removidos History y Templates (7 botones → 6 botones)
4. ✅ **LocalProjectAnalysis UX mejorado**:
   - Al seleccionar carpeta, automáticamente detecta path y genera outputs
   - Dialog personalizado reemplaza alert del sistema
   - Outputs ahora muestran información formateada (no botones de descarga)
   - Estado automático a "done" con metadata mock
5. ✅ **Sidebar limpio**: Removidas secciones no usadas (Home, AI Suite, Stock, Community, Pinned, History, Get a plan)
6. ✅ **Configuration Panel**: Sistema completo de configuración
   - API Keys (OpenAI, Anthropic, Stability AI)
   - Project Path por space
   - Preferences (Auto Save)
   - Modal elegante con save/cancel
7. ✅ **SpaceConfiguration**: Tipo nuevo para configuración persistente por space
8. ✅ **Persistence con Zustand**: Auto-save a localStorage implementado
   - Middleware persist configurado
   - Guarda spaces y currentSpaceId automáticamente
   - Recarga estado al iniciar aplicación

**Mejoras de UX**:
```tsx
// Antes: Alert pidiendo copiar path manualmente
// Ahora: Detección automática + outputs inmediatos

handleFolderSelect() {
  // Detecta path automáticamente
  // Genera outputs mock
  // Marca módulo como "done"
}
```

---

### ✅ SESIÓN 2: Toolbar Flotante + Sistema Modular Base

**Archivos NUEVOS**:
- ✅ `/components/canvas/FloatingToolbar.tsx` - Toolbar vertical lateral con 8 botones
- ✅ `/components/canvas/ModuleWrapper.tsx` - Componente base reutilizable para módulos

**Archivos MODIFICADOS**:
- ✅ `/components/canvas/ModuleBlock.tsx` - Refactorizado completamente (ahora usa ModuleWrapper)
- ✅ `/components/canvas/Canvas.tsx` - Añadido FloatingToolbar
- ✅ `/components/canvas/AddModuleButton.tsx` - Añadido data-attribute para toolbar
- ✅ `/lib/store.ts` - Añadido duplicateModule()

**Funcionalidad implementada**:
1. ✅ **FloatingToolbar**: Barra vertical izquierda con 8 botones (Play, Restart, Undo, Redo, etc.)
2. ✅ **ModuleWrapper**: Sistema base para TODOS los módulos (elimina duplicación de código)
3. ✅ **Duplicate Module**: Funcionalidad completa para duplicar módulos
4. ✅ **Nuevo diseño de módulos**: Título simple + icono + duplicate button + play esquina
5. ✅ **Puertos mejorados**: Outputs a la derecha, inputs a la izquierda, iconos visuales

**Patrón de reutilización**:
```tsx
// Antes: 300+ líneas por módulo (duplicación)
// Ahora: ModuleWrapper (reutilizable) + contenido específico

<ModuleWrapper module={module} onRun={handleRun} icon={<Icon />}>
  {contenido específico del módulo}
</ModuleWrapper>
```

---

### ✅ SESIÓN 1: Tarea A - Conectores Tipados (18/18 tareas - 100% COMPLETO)

**Archivos modificados**:
- ✅ `/types/index.ts` - Añadidos DataType enum, ConnectionError, ValidationResult
- ✅ `/lib/store.ts` - Añadido validateConnection, drag state, gestión dinámica
- ✅ `/lib/data-type-icons.tsx` - NUEVO archivo con iconos y colores por tipo
- ✅ `/components/canvas/ModuleBlock.tsx` - Drag & drop de puertos, iconos de tipo
- ✅ `/components/canvas/ConnectionLines.tsx` - Conexión provisional, colores por tipo
- ✅ `/components/canvas/Canvas.tsx` - Handlers de mousemove para drag

**Funcionalidad implementada**:
1. ✅ **Tipos de datos**: 6 tipos (image, text, json, audio, video, mixed)
2. ✅ **Iconos y colores**: Cada tipo tiene icono y color único
3. ✅ **Drag & drop**: Arrastrar desde puerto OUTPUT → soltar en INPUT
4. ✅ **Validación completa**: 5 validaciones (estado done, output existe, tipo compatible, no ciclos, no running)
5. ✅ **Conexión provisional**: Cable visual durante el drag
6. ✅ **Resaltar compatibles**: INPUT compatible se resalta en verde
7. ✅ **Gestión dinámica**: Reset/error propagan estado `invalid` a dependientes

**Estados nuevos agregados**: warning, fatal_error, invalid

---

## 📊 RESUMEN EJECUTIVO

### Estado General V2.0
- ✅ **Infraestructura base**: Canvas, módulos, conexiones visuales, sidebar
- ✅ **Módulos funcionales**: Local Project Analysis + AIE Engine (2/5 operativos)
- ✅ **Conectores tipados**: COMPLETO (drag/drop + validación + gestión dinámica)
- ✅ **Estados extendidos**: 7 estados (idle, running, done, error, warning, fatal_error, invalid)
- ✅ **Toolbar flotante**: UI + LÓGICA COMPLETA (Play Flow + Restart Flow)
- ✅ **Sistema modular base**: ModuleWrapper implementado (evita duplicación)
- ✅ **AI Provider Layer**: Abstracción multi-provider COMPLETA (5 adapters)
- ✅ **Play Flow**: Ejecución topológica con Kahn's algorithm
- ✅ **Restart Flow**: Reset all + reset individual + reset cascade
- ✅ **Sistema de guardado**: Zustand persist middleware (localStorage)
- ✅ **Configuration Panel**: AI config + API keys + preferences

### Métricas del Proyecto V2.0
- **Total de archivos TS**: 26 archivos (+8 nuevos en V2.0)
- **Líneas de código**: ~5,200 líneas TypeScript (+1,600 en V2.0)
- **Componentes React**: 15 componentes (+1: AIEEngineModule)
- **Adapters de IA**: 5 (Together, Replicate, OpenAI, Anthropic, Mock)
- **Helpers**: 2 (`data-type-icons.tsx`, `ai-provider.ts`)
- **APIs Backend**: 1 endpoint (`/api/local-analysis`)
- **Módulos disponibles**: 5 (2 funcionales: LocalProjectAnalysis, AIE Engine)
- **Estado management**: Zustand con persist middleware (auto-save a localStorage)

---

## 🗺️ MAPA DE ARQUITECTURA

### Estructura de Carpetas V2.0
```
/home/user/spaces/
│
├── app/                                    # Next.js App Router
│   ├── api/
│   │   └── local-analysis/
│   │       └── route.ts                    # [397L] API análisis de proyectos locales
│   ├── layout.tsx                          # [19L] Root layout
│   ├── page.tsx                            # [40L] Página principal + hydration fix
│   └── globals.css                         # Estilos globales Tailwind
│
├── components/
│   ├── canvas/                             # Sistema de canvas principal
│   │   ├── Canvas.tsx                      # [185L] ⭐ Container principal (zoom/pan/keyboard + spacebar fix)
│   │   ├── ModuleBlock.tsx                 # [245L] ⭐ Bloque de módulo + AIE Engine integration
│   │   ├── ConnectionLines.tsx             # [86L] Renderizado de conexiones SVG
│   │   ├── CanvasControls.tsx              # [62L] Controles de zoom
│   │   ├── AddModuleButton.tsx             # [25L] Botón flotante para añadir
│   │   ├── AddModulePanel.tsx              # [190L] Panel selector de módulos
│   │   ├── DotGrid.tsx                     # [54L] Grid de fondo
│   │   ├── FloatingToolbar.tsx             # [120L] ⭐ V2.0 Toolbar con Play/Restart Flow
│   │   └── ModuleWrapper.tsx               # [150L] Wrapper base reutilizable
│   │
│   ├── modules/                            # Módulos específicos
│   │   ├── LocalProjectAnalysisModule.tsx  # [219L] ✅ Módulo 1 funcional
│   │   └── AIEEngineModule.tsx             # [253L] ✅ V2.0 Módulo 2 funcional (AI-powered)
│   │
│   ├── configuration/                      # V2.0 Configuration
│   │   └── ConfigurationPanel.tsx          # [320L] ⭐ AI config + API keys
│   │
│   └── sidebar/
│       └── Sidebar.tsx                     # [185L] Panel lateral (spaces + config button)
│
├── lib/
│   ├── store.ts                            # [580L] ⭐ V2.0 Zustand store + persist + flow execution
│   ├── ai-provider.ts                      # [218L] ⭐ V2.0 AI Provider manager
│   ├── adapters/                           # V2.0 AI Adapters
│   │   ├── index.ts                        # [34L] Auto-initialization
│   │   ├── together-adapter.ts             # [67L] Together AI
│   │   ├── replicate-adapter.ts            # [89L] Replicate (polling)
│   │   ├── openai-adapter.ts               # [68L] OpenAI Chat Completions
│   │   ├── anthropic-adapter.ts            # [68L] Anthropic Messages
│   │   └── mock-adapter.ts                 # [90L] Mock adapter para testing
│   └── data-type-icons.tsx                 # [45L] Iconos y colores por tipo
│
├── types/
│   └── index.ts                            # [185L] ⭐ V2.0 Tipos + AI interfaces
│
├── design_interface/                       # Imágenes de referencia UI
├── tailwind.config.js                      # Configuración Tailwind
├── tsconfig.json                           # Configuración TypeScript
├── next.config.js                          # Configuración Next.js
└── package.json                            # Dependencias
```

### Archivos Críticos V2.0 (⭐ LEER SIEMPRE ANTES DE MODIFICAR)

| Archivo | Líneas | Responsabilidad | Cuándo modificar |
|---------|--------|-----------------|------------------|
| `/types/index.ts` | 185 | **Tipos globales + AI** | Al añadir nuevos tipos, interfaces, enums |
| `/lib/store.ts` | 580 | **Estado global + Flow execution** | Al añadir actions, estados, o modificar espacios |
| `/lib/ai-provider.ts` | 218 | **V2.0 AI Provider manager** | Al añadir nuevos providers o cambiar error handling |
| `/components/canvas/Canvas.tsx` | 185 | **Sistema de canvas** | Al cambiar zoom, pan, teclado, rendering |
| `/components/canvas/ModuleBlock.tsx` | 245 | **UI de módulos** | Al cambiar apariencia, dragging, estados |
| `/components/canvas/FloatingToolbar.tsx` | 120 | **V2.0 Flow controls** | Al cambiar Play/Restart/Undo/Redo logic |
| `/components/modules/AIEEngineModule.tsx` | 253 | **V2.0 AI Module** | Referencia para módulos con IA |
| `/components/modules/LocalProjectAnalysisModule.tsx` | 219 | **Módulo de referencia** | Como plantilla para nuevos módulos |
| `/components/configuration/ConfigurationPanel.tsx` | 320 | **V2.0 Config panel** | Al añadir nuevos settings o API keys |

---

## ✅ FEATURES IMPLEMENTADAS V2.0 (Lo que YA existe)

### V2.0 NEW FEATURES

#### 8. AI Provider Layer (V2.0)
**Ubicación**: `/lib/ai-provider.ts` + `/lib/adapters/`

**Implementado**:
- ✅ Manager central con patrón Strategy
- ✅ 5 adapters funcionales (Together, Replicate, OpenAI, Anthropic, Mock)
- ✅ Error handling con 7 códigos específicos
- ✅ Test connection por provider
- ✅ Auto-registration en import
- ✅ TypeScript interfaces para AIConfiguration y AIProviderResponse

**Cómo funciona**:
```typescript
// Registrar adapter
aiProvider.registerAdapter(AIProvider.OPENAI, new OpenAIAdapter());

// Ejecutar con cualquier provider
const response = await aiProvider.run(prompt, {
  provider: AIProvider.OPENAI,
  apiKey: 'sk-...',
  model: 'gpt-4',
  temperature: 0.7
});
```

---

#### 9. AIE Engine Module (V2.0)
**Ubicación**: `/components/modules/AIEEngineModule.tsx`

**Implementado**:
- ✅ Módulo funcional con IA
- ✅ 3 inputs JSON (metadata, contents, structure)
- ✅ 1 output JSON (AppIntelligence)
- ✅ Prompt builder automático
- ✅ Parser JSON con regex fallback
- ✅ Display de summary, category, keywords, brand colors
- ✅ Estado visual (idle → running → done/error)
- ✅ Error handling con mensajes descriptivos

**AppIntelligence structure**:
```typescript
interface AppIntelligence {
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
```

---

#### 10. Play Flow - Topological Execution (V2.0)
**Ubicación**: `/lib/store.ts` (executeFlow action) + `/components/canvas/FloatingToolbar.tsx`

**Implementado**:
- ✅ Cálculo de orden topológico (Kahn's algorithm)
- ✅ Detección de dependencias con grafo dirigido
- ✅ Ejecución en orden correcto
- ✅ Handler en FloatingToolbar
- ✅ Error handling con alerts

**Algoritmo**:
```typescript
function calculateTopologicalOrder(modules, connections) {
  // 1. Build adjacency list and in-degree map
  // 2. Find nodes with in-degree 0
  // 3. Kahn's algorithm (BFS topological sort)
  // 4. Return ordered array of module IDs
}
```

---

#### 11. Restart Flow - Reset System (V2.0)
**Ubicación**: `/lib/store.ts` (resetAll, resetModule, resetFrom)

**Implementado**:
- ✅ Reset All: Todos los módulos a idle
- ✅ Reset Module: Individual + mark dependents invalid
- ✅ Reset From: Cascade desde un módulo
- ✅ BFS para encontrar dependientes
- ✅ Handler en FloatingToolbar con confirmación

**Funciones**:
```typescript
resetAll(): void                 // Reset all to idle
resetModule(id: string): void    // Reset one + dependents invalid
resetFrom(id: string): void      // Reset from this onwards
```

---

#### 12. Configuration Panel (V2.0)
**Ubicación**: `/components/configuration/ConfigurationPanel.tsx`

**Implementado**:
- ✅ Sección AI Provider con dropdown
- ✅ API Keys (OpenAI, Anthropic, Replicate, Together)
- ✅ Model input con placeholders dinámicos
- ✅ Temperature slider (0-2)
- ✅ Max tokens input
- ✅ Project path por space
- ✅ Auto-save preferences
- ✅ Modal elegante con save/cancel

---

### V1.1 FEATURES

### 1. Sistema de Canvas
**Ubicación**: `/components/canvas/Canvas.tsx`

**Implementado**:
- ✅ Zoom (rueda del ratón, 20%-300%)
- ✅ Pan (spacebar + drag, middle mouse)
- ✅ Keyboard navigation (arrows, +/-, 0 para reset)
- ✅ Grid de fondo con dots
- ✅ Transform matrix (translate + scale)
- ✅ Controles de zoom en UI (botones +/-, reset)

**Cómo funciona**:
```typescript
// Canvas usa transform CSS
<div style={{
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
  transformOrigin: '0 0'
}}>
```

**Estado en store**:
```typescript
canvasState: {
  zoom: number,      // 0.2 - 3.0
  pan: { x, y }      // pixels
}
```

---

### 2. Sistema de Módulos
**Ubicación**: `/components/canvas/ModuleBlock.tsx`

**Implementado**:
- ✅ Bloques draggables (posición x,y almacenada)
- ✅ Tamaño configurable (width, height)
- ✅ Estados visuales (idle, running, done, error)
- ✅ Puertos de entrada (azul) y salida (púrpura)
- ✅ Header con nombre, icono, estado
- ✅ Footer con botón Run y Delete
- ✅ Renderizado condicional según tipo de módulo
- ✅ Selección (borde azul al hacer click)

**Estados soportados** (en `/types/index.ts`):
```typescript
type ModuleStatus = 'idle' | 'running' | 'done' | 'error'
```

**Colores de estado** (ModuleBlock.tsx líneas 123-134):
```typescript
idle    → text-gray-500 bg-gray-500/10
running → text-blue-500 bg-blue-500/10
done    → text-green-500 bg-green-500/10
error   → text-red-500 bg-red-500/10
```

**Tipos de módulos disponibles**:
```typescript
type ModuleType =
  | 'local-project-analysis'    // ✅ Implementado
  | 'reader-engine'              // ❌ Placeholder
  | 'naming-engine'              // ❌ Placeholder
  | 'icon-generator'             // ❌ Placeholder
  | 'marketing-pack'             // ❌ Placeholder
```

**Patrón de creación** (en store.ts líneas 71-143):
```typescript
// 1. Define defaults por tipo en moduleDefaults
const moduleDefaults: Record<ModuleType, Partial<Module>> = {
  'local-project-analysis': {
    name: 'Local Project Analysis Agent',
    size: { width: 450, height: 520 },
    ports: {
      input: [],
      output: [
        { id: 'out-1', type: 'output', label: 'Repository Metadata', connected: false },
        { id: 'out-2', type: 'output', label: 'File Contents', connected: false },
        { id: 'out-3', type: 'output', label: 'Repository Structure', connected: false },
        { id: 'out-4', type: 'output', label: 'Analysis Log', connected: false },
      ],
    },
  },
  // ...
}

// 2. addModule() usa estos defaults
addModule: (type: ModuleType, position: Position) => {
  const newModule: Module = {
    id: `module-${Date.now()}`,
    type,
    position,
    ...moduleDefaults[type],
    status: 'idle',
    data: {},
  }
  // ...
}
```

---

### 3. Módulo Funcional: Local Project Analysis
**Ubicación**: `/components/modules/LocalProjectAnalysisModule.tsx`

**Implementado**:
- ✅ Input: Ruta de proyecto local (text input)
- ✅ Input: Incluir archivos ocultos (checkbox)
- ✅ Input: Incluir node_modules (checkbox)
- ✅ Botón "Run Analysis"
- ✅ Outputs descargables:
  - `repository_metadata.json`
  - `file_contents.json`
  - `repository_structure.json`
  - `analysis_log.txt`
- ✅ Estados visuales (idle → running → done/error)
- ✅ Mensajes de error con alert

**API Backend**: `/app/api/local-analysis/route.ts`

**Funcionalidad**:
1. Valida path de proyecto
2. Lee estructura de archivos (recursivo)
3. Detecta framework (React, Next.js, Vue, etc.)
4. Lee archivos principales (package.json, README, etc.)
5. Genera metadata completo
6. Retorna JSON + log con timestamps

**Patrón de ejecución**:
```typescript
// En LocalProjectAnalysisModule.tsx líneas 70-115
const handleRun = async () => {
  try {
    updateModule(module.id, { status: 'running' })

    const response = await fetch('/api/local-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
    })

    const result = await response.json()

    updateModule(module.id, {
      status: 'done',
      data: { outputs: result }
    })
  } catch (error) {
    updateModule(module.id, { status: 'error' })
    alert('Error: ' + error.message)
  }
}
```

**⚠️ IMPORTANTE**: Este módulo es la **plantilla de referencia** para crear nuevos módulos.

---

### 4. Sistema de Conexiones (Visual)
**Ubicación**: `/components/canvas/ConnectionLines.tsx`

**Implementado**:
- ✅ Renderizado SVG con Bezier curves
- ✅ Animación de dashes (movimiento)
- ✅ Efecto glow (blur)
- ✅ Cálculo automático de puntos según posición de módulos
- ✅ Ajuste según zoom del canvas
- ✅ Almacenamiento en store

**Estructura de conexión** (en `/types/index.ts`):
```typescript
interface ModuleConnection {
  id: string
  sourceModuleId: string
  sourcePortId: string
  targetModuleId: string
  targetPortId: string
}
```

**Renderizado**:
```typescript
// Bezier curve path
const curvature = Math.min(Math.abs(endX - startX) / 2, 100)
const path = `M ${startX},${startY} C ${startX + curvature},${startY} ${endX - curvature},${endY} ${endX},${endY}`
```

**❌ NO IMPLEMENTADO**:
- Drag & drop para crear conexiones
- Validación de tipos de datos
- Iconos de tipo en cables
- Errores visuales de conexión

---

### 5. Gestión de Spaces
**Ubicación**: `/components/sidebar/Sidebar.tsx` + `/lib/store.ts`

**Implementado**:
- ✅ Crear nuevo space
- ✅ Cambiar entre spaces
- ✅ Eliminar space (con confirmación)
- ✅ Mostrar fecha de creación
- ✅ Pin spaces (favoritos)
- ✅ Cada space contiene módulos + conexiones independientes

**Estructura** (en `/types/index.ts`):
```typescript
interface Space {
  id: string
  name: string
  modules: Module[]
  connections: ModuleConnection[]
  createdAt: Date
  updatedAt: Date
}
```

**⚠️ LIMITACIÓN**: Todo en memoria (se pierde al recargar página).

---

### 6. Sistema de Estado Global (Zustand)
**Ubicación**: `/lib/store.ts`

**Implementado**:
- ✅ Múltiples spaces
- ✅ CRUD de módulos
- ✅ CRUD de conexiones
- ✅ Estado de canvas (zoom, pan)
- ✅ Selección de módulo
- ✅ Helper `getCurrentSpace()`

**Actions disponibles**:
```typescript
// Spaces
createSpace(name: string): void
deleteSpace(id: string): void
setCurrentSpace(id: string): void

// Modules
addModule(type: ModuleType, position: Position): void
updateModule(id: string, updates: Partial<Module>): void
deleteModule(id: string): void
setSelectedModule(id: string | null): void

// Connections
addConnection(connection: Omit<ModuleConnection, 'id'>): void
deleteConnection(id: string): void

// Canvas
setZoom(zoom: number): void
setPan(pan: Position): void
resetCanvas(): void

// Helper
getCurrentSpace(): Space | undefined
```

**Patrón de actualización inmutable**:
```typescript
updateModule: (id: string, updates: Partial<Module>) => {
  set((state) => {
    const currentSpace = state.spaces.find(s => s.id === state.currentSpaceId)
    if (!currentSpace) return state

    return {
      spaces: state.spaces.map(space =>
        space.id === state.currentSpaceId
          ? {
              ...space,
              modules: space.modules.map(m =>
                m.id === id ? { ...m, ...updates } : m
              ),
              updatedAt: new Date(),
            }
          : space
      ),
    }
  })
}
```

---

### 7. UI Components
**Ubicación**: Varios en `/components/`

**Implementado**:
- ✅ **DotGrid** (fondo con puntos): `/components/canvas/DotGrid.tsx`
- ✅ **CanvasControls** (zoom buttons): `/components/canvas/CanvasControls.tsx`
- ✅ **AddModuleButton** (botón flotante +): `/components/canvas/AddModuleButton.tsx`
- ✅ **AddModulePanel** (selector de módulos): `/components/canvas/AddModulePanel.tsx`
  - Búsqueda por nombre
  - Filtrado por categoría
  - 3 categorías: Project Initialization, Branding, Marketing

---

## ❌ FEATURES PENDIENTES (Lo que FALTA según v1.1)

### PRIORIDAD ALTA (Requeridas para v1.1)

#### A. Conectores Tipados
**Estado**: 0% implementado

**Tareas pendientes**:
- [ ] **A1.1**: Definir enum de tipos (image, text, json, audio, video, mixed)
- [ ] **A1.2**: Asignar tipo a cada OUTPUT de cada módulo
- [ ] **A1.3**: Definir expected_types por INPUT de módulo
- [ ] **A2.1-A2.5**: Interacción drag & drop desde puerto OUTPUT
- [ ] **A3.1-A3.7**: Sistema de validación de conexión
- [ ] **A4.1-A4.3**: Gestión dinámica (reset/error/delete cascade)

**Archivos a modificar**:
- `/types/index.ts` → Añadir tipos de datos
- `/components/canvas/ModuleBlock.tsx` → Drag & drop de puertos
- `/components/canvas/ConnectionLines.tsx` → Iconos de tipo
- `/lib/store.ts` → Validación en addConnection

**Ejemplo esperado**:
```typescript
// types/index.ts
enum DataType {
  IMAGE = 'image',
  TEXT = 'text',
  JSON = 'json',
  AUDIO = 'audio',
  VIDEO = 'video',
  MIXED = 'mixed'
}

interface ModulePort {
  id: string
  type: 'input' | 'output'
  label: string
  dataType: DataType        // ← NUEVO
  connected: boolean
}

interface ModuleConnection {
  id: string
  sourceModuleId: string
  sourcePortId: string
  targetModuleId: string
  targetPortId: string
  dataType: DataType        // ← NUEVO
}
```

---

#### B. Estados Extendidos
**Estado**: 40% implementado (solo 4 de 7 estados)

**Estados faltantes**:
- [ ] `warning` → Borde amarillo
- [ ] `fatal_error` → Relleno rojizo + casi deshabilitado
- [ ] `invalid` → Borde gris punteado + icono ⚠️

**Tareas pendientes**:
- [ ] **B1.1**: Añadir estados a tipo `ModuleStatus`
- [ ] **B1.2**: Mapear colores en ModuleBlock.tsx
- [ ] **B2.5**: Desactivar botones cuando está running
- [ ] **B3.4**: Actualizar outputs y logs tras ejecución

**Archivos a modificar**:
- `/types/index.ts` → Ampliar tipo ModuleStatus
- `/components/canvas/ModuleBlock.tsx` → Añadir colores y lógica

---

#### C. Toolbar Flotante
**Estado**: 0% implementado

**Funcionalidad requerida**:
- [ ] **C1.1-C1.2**: Renderizar toolbar flotante con iconos ▶, ⟲, ⏸
- [ ] **C2.1-C2.5**: Play Flow (ejecución en cadena topológica)
- [ ] **C3.1-C3.4**: Restart Flow (reset all con confirmación)
- [ ] **C4.1-C4.3**: Pause Flow (opcional)

**Componente a crear**:
- `/components/canvas/FloatingToolbar.tsx` (nuevo archivo)

**Ejemplo esperado**:
```tsx
// FloatingToolbar.tsx
export function FloatingToolbar() {
  const { modules, connections } = useSpaceStore()

  const handlePlayFlow = () => {
    // Topological sort de módulos
    const executionOrder = calculateExecutionOrder(modules, connections)

    // Ejecutar en secuencia
    for (const moduleId of executionOrder) {
      await executeModule(moduleId)
    }
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-dark-sidebar rounded-lg p-2">
      <button onClick={handlePlayFlow}>▶ Play</button>
      <button onClick={handleRestartFlow}>⟲ Restart</button>
    </div>
  )
}
```

**Algoritmo de ejecución topológica**:
```typescript
function calculateExecutionOrder(modules, connections) {
  // 1. Construir grafo de dependencias
  // 2. Topological sort (DFS)
  // 3. Retornar array ordenado de module IDs
}
```

---

#### D. Sistema de Guardado
**Estado**: 0% implementado (solo memoria)

**Tareas pendientes**:
- [ ] **D1.1-D1.3**: Autosave (detectar cambios, guardar snapshot)
- [ ] **D2.1-D2.3**: Load Space (reconstruir desde snapshot)
- [ ] **D3.1-D3.3**: Validación tras carga

**Opciones de implementación**:
1. **localStorage** (simple, límite 5MB)
2. **IndexedDB** (complejo, sin límite)
3. **API + Database** (PostgreSQL/MongoDB)

**Archivos a crear/modificar**:
- `/lib/persistence.ts` (nuevo) → Funciones save/load
- `/lib/store.ts` → Llamar a save en cada acción

**Ejemplo con localStorage**:
```typescript
// lib/persistence.ts
export function saveSpace(space: Space) {
  const snapshot = {
    version: '1.1',
    timestamp: new Date().toISOString(),
    space: {
      ...space,
      modules: space.modules.map(m => ({
        ...m,
        // Solo guardar referencias a outputs grandes
        data: compressData(m.data)
      }))
    }
  }

  localStorage.setItem(`space-${space.id}`, JSON.stringify(snapshot))
}

export function loadSpace(id: string): Space | null {
  const data = localStorage.getItem(`space-${id}`)
  if (!data) return null

  const snapshot = JSON.parse(data)
  return snapshot.space
}
```

---

#### E. Sistema de Reinicio
**Estado**: 0% implementado

**Tareas pendientes**:
- [ ] **E1.1-E1.4**: Reset All (limpiar todos los módulos)
- [ ] **E2.1-E2.4**: Reset Module (solo uno + marcar dependientes invalid)
- [ ] **E3.1-E3.2**: Reset From This (cascada hacia adelante)
- [ ] **E4.1-E4.2**: Re-evaluación de needs_re_run

**Archivos a modificar**:
- `/lib/store.ts` → Añadir actions resetAll, resetModule, resetFromThis
- `/components/canvas/ModuleBlock.tsx` → Botón de reset en menú

**Ejemplo**:
```typescript
// En store.ts
resetModule: (id: string) => {
  set((state) => {
    const currentSpace = getCurrentSpace()
    if (!currentSpace) return state

    // 1. Resetear módulo
    const updatedModules = currentSpace.modules.map(m =>
      m.id === id
        ? { ...m, status: 'idle', data: {} }
        : m
    )

    // 2. Marcar dependientes como invalid
    const dependentIds = findDependentModules(id, currentSpace.connections)
    const finalModules = updatedModules.map(m =>
      dependentIds.includes(m.id)
        ? { ...m, status: 'invalid' }
        : m
    )

    return {
      spaces: state.spaces.map(s =>
        s.id === state.currentSpaceId
          ? { ...s, modules: finalModules, updatedAt: new Date() }
          : s
      )
    }
  })
}
```

---

#### F. Panel INFO de Módulo
**Estado**: 0% implementado

**Tareas pendientes**:
- [ ] Crear componente `ModuleInfoPanel.tsx`
- [ ] Diseñar plantilla de info por módulo
- [ ] Añadir botón ℹ en header de ModuleBlock
- [ ] Modal o panel lateral con información

**Contenido del panel**:
1. Nombre del módulo
2. Descripción corta
3. Descripción extendida
4. ¿Cuándo usarlo?
5. Inputs que acepta (tipo + descripción)
6. Outputs que genera (tipo + icono)
7. Conectores compatibles
8. Dependencias de otros módulos
9. Errores más comunes
10. Consejos de uso
11. Ejemplo de flujo

**Archivo a crear**:
- `/components/canvas/ModuleInfoPanel.tsx`

---

### PRIORIDAD MEDIA (Mejoras de UX)

#### G. Logs Mejorados
**Estado**: 30% implementado (solo texto básico)

**Pendiente**:
- [ ] **F3.1**: Escribir logs en archivos separados
- [ ] **F3.2**: Panel de logs dentro del bloque (colapsable)
- [ ] **F3.3**: Descarga de logs
- [ ] Syntax highlighting para logs
- [ ] Filtrado por nivel (info, warning, error)

---

#### H. Otros Módulos
**Estado**: 0% implementado (solo LocalProjectAnalysis)

**Módulos pendientes**:
- [ ] Reader Engine
- [ ] Naming Engine
- [ ] Icon Generator
- [ ] Marketing Pack

**Patrón a seguir**: Copiar estructura de `LocalProjectAnalysisModule.tsx`

---

### PRIORIDAD BAJA (Futuras mejoras)

- [ ] Undo/Redo
- [ ] Duplicar módulos
- [ ] Grupos de módulos
- [ ] Comentarios en canvas
- [ ] Export/Import de flujos
- [ ] Templates de flujos

---

## 🔧 METODOLOGÍA DE DESARROLLO

### ⚠️ REGLA DE ORO: NUNCA DUPLICAR CÓDIGO

Antes de crear cualquier componente, función o sistema:

#### 1. BUSCAR PRIMERO
```bash
# Buscar componentes similares
grep -r "export function" components/
grep -r "export const" components/

# Buscar tipos existentes
cat types/index.ts

# Buscar en store
cat lib/store.ts | grep -A 5 "function\|const"
```

#### 2. REUTILIZAR O EXTENDER
Si existe algo similar:
- ✅ **Reutilizar**: Usar el componente/función existente
- ✅ **Extender**: Añadir props opcionales
- ✅ **Refactorizar**: Extraer lógica común a un helper
- ❌ **NO crear duplicado**: Nunca copiar-pegar código similar

#### 3. PATRÓN DE CREACIÓN
Solo crear nuevo archivo si:
- No existe nada similar en el proyecto
- La funcionalidad es completamente nueva
- Sigue el patrón de naming del proyecto

### Patrón de Naming
```
Componentes:   PascalCase.tsx        → Canvas.tsx, ModuleBlock.tsx
Tipos:         PascalCase            → Module, Space, ModuleConnection
Functions:     camelCase             → addModule, updateModule
Constants:     UPPER_SNAKE_CASE      → DEFAULT_ZOOM, MAX_ZOOM
Archivos util: kebab-case.ts         → module-helpers.ts
```

### Estructura de Componente
```tsx
'use client'

import { useState } from 'react'
import { useSpaceStore } from '@/lib/store'
import { Module } from '@/types'

interface Props {
  // Props aquí
}

export function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks de store
  const { modules, updateModule } = useSpaceStore()

  // 2. State local
  const [localState, setLocalState] = useState()

  // 3. Handlers
  const handleAction = () => {
    // Lógica
  }

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

## 📋 CHECKLIST COMPLETO v1.1

### A. CONECTORES TIPADOS (18/18 tareas) ✅

#### A1. Implementar tipos de datos (3/3) ✅
- [x] A1.1 Definir enum de tipos (image, text, json, audio, video, mixed)
- [x] A1.2 Asignar tipo a cada OUTPUT de cada módulo
- [x] A1.3 Definir expected_types por INPUT de módulo

#### A2. Interacción de conexión (5/5) ✅
- [x] A2.1 Detectar drag desde puerto OUTPUT
- [x] A2.2 Dibujar cable provisional
- [x] A2.3 Detectar hover sobre INPUT compatible
- [x] A2.4 Resaltar INPUT compatible
- [x] A2.5 Finalizar conexión al soltar

#### A3. Validación de conexión (7/7) ✅
- [x] A3.1 Comprobar estado DONE del módulo A
- [x] A3.2 Comprobar presencia de output
- [x] A3.3 Comprobar compatibilidad de tipo
- [x] A3.4 Comprobar que B no está running
- [x] A3.5 Comprobar que no hay ciclo
- [x] A3.6 Mostrar error visual si falla
- [x] A3.7 Guardar la conexión si es válida

#### A4. Gestión dinámica (3/3) ✅
- [x] A4.1 Si módulo A se resetea → marcar B como invalid
- [x] A4.2 Si módulo A entra en error → marcar B como invalid
- [x] A4.3 Si módulo A se elimina → eliminar conexiones

---

### B. ESTADOS DE BLOQUE (5/11 tareas)

#### B1. Estados visuales (4/4) ✅
- [x] B1.1 Mapear estados a colores de borde/fondo (7 estados: idle, running, done, error, warning, fatal_error, invalid)
- [x] B1.2 Mostrar estado textual en header

#### B2. Botones del bloque (2/5)
- [x] B2.1 Implementar ▶ local (run solo este módulo)
- [x] B2.2 Implementar 🗑 eliminar módulo
- [ ] B2.3 Implementar ℹ info del módulo
- [ ] B2.4 Implementar "Logs" y "Settings" en footer
- [ ] B2.5 Desactivar botones cuando está running

#### B3. Ejecución local (2/4)
- [x] B3.1 Ejecutar módulo con sus inputs
- [x] B3.2 Cambiar estado → running
- [ ] B3.3 Al terminar: done o error (mejorar)
- [ ] B3.4 Actualizar outputs y logs

---

### C. TOOLBAR FLOTANTE (0/13 tareas)

#### C1. Renderizar toolbar (0/2)
- [ ] C1.1 Posicionar toolbar sobre selección/centro
- [ ] C1.2 Mostrar iconos ▶, ⟲, ⏸

#### C2. Play Flow (0/5)
- [ ] C2.1 Calcular orden de ejecución (topological sort)
- [ ] C2.2 Ejecutar módulos sin dependencias primero
- [ ] C2.3 Ejecutar el resto en orden
- [ ] C2.4 Saltar módulos ya done sin cambios
- [ ] C2.5 Actualizar estados y autosave

#### C3. Restart Flow (0/4)
- [ ] C3.1 Mostrar confirmación
- [ ] C3.2 Llamar a Reset All
- [ ] C3.3 Mantener inputs manuales
- [ ] C3.4 Dejar todos en idle

#### C4. Pause (0/3) - OPCIONAL
- [ ] C4.1 Establecer flag global "paused"
- [ ] C4.2 No disparar nuevos módulos
- [ ] C4.3 Permitir terminar los running

---

### D. GUARDADO / HISTORIAL (0/9 tareas)

#### D1. Autosave (0/3)
- [ ] D1.1 Detectar cambios (módulos, conexiones, estados)
- [ ] D1.2 Guardar snapshot en disco/BD
- [ ] D1.3 Añadir timestamp

#### D2. Load Space (0/3)
- [ ] D2.1 Leer snapshot
- [ ] D2.2 Reconstruir módulos y posiciones
- [ ] D2.3 Reconstruir conexiones

#### D3. Validación tras carga (0/3)
- [ ] D3.1 Recalcular dependencias
- [ ] D3.2 Marcar módulos con inputs rotos como invalid
- [ ] D3.3 Marcar módulos listos como done

---

### E. REINICIO DEL FLUJO (0/12 tareas)

#### E1. Reset All (0/4)
- [ ] E1.1 Limpiar estados de todos los módulos
- [ ] E1.2 Borrar outputs y logs
- [ ] E1.3 Mantener conexiones
- [ ] E1.4 Guardar nuevo snapshot

#### E2. Reset Module (0/4)
- [ ] E2.1 Borrar outputs del módulo
- [ ] E2.2 Borrar logs del módulo
- [ ] E2.3 Estado → idle
- [ ] E2.4 Marcar dependientes como invalid

#### E3. Reset From This (0/2)
- [ ] E3.1 Identificar módulos posteriores
- [ ] E3.2 Ejecutar Reset Module en cadena

#### E4. Re-evaluar (0/2)
- [ ] E4.1 Marcar módulos que necesitan re-run
- [ ] E4.2 Mostrar indicador visual "Needs re-run"

---

### F. ERRORES Y LOGS (1/9 tareas)

#### F1. Captura de errores (1/3)
- [x] F1.1 Capturar exceptions durante run
- [ ] F1.2 Asignar categoría (input/system/processing/connection/fatal)
- [ ] F1.3 Mostrar mensaje corto en el bloque

#### F2. Acciones de recuperación (0/3)
- [ ] F2.1 Implementar TRY AGAIN
- [ ] F2.2 Implementar RESET
- [ ] F2.3 Implementar VIEW LOGS

#### F3. Logs (0/3)
- [ ] F3.1 Escribir analysis_log.txt por módulo
- [ ] F3.2 Mostrar panel de logs dentro del bloque
- [ ] F3.3 Permitir descarga de logs

---

## 🎯 GUÍA PARA CONTINUAR EL DESARROLLO

### Para una IA que continúe este proyecto:

#### 1. ANTES DE EMPEZAR CUALQUIER TAREA

```
1. Leer este documento completo (PROJECT_STATUS.md)
2. Identificar la tarea en el checklist v1.1
3. Verificar archivos relacionados:
   - ¿Ya existe algo similar?
   - ¿Qué componentes puedo reutilizar?
4. Planificar sin duplicar código
```

#### 2. PATRÓN DE TRABAJO

```
PASO 1: Analizar
  → Leer archivos clave (types/index.ts, lib/store.ts)
  → Entender qué existe actualmente

PASO 2: Diseñar
  → Definir qué necesito crear/modificar
  → Identificar reutilizables

PASO 3: Implementar
  → Modificar archivos existentes primero
  → Crear nuevos solo si es necesario

PASO 4: Actualizar documentación
  → Marcar tarea como completada en checklist
  → Actualizar sección "FEATURES IMPLEMENTADAS"
  → Añadir referencias de archivos
```

#### 3. CUANDO CREAR UN NUEVO COMPONENTE

Solo si cumple **TODOS** estos criterios:
- ✅ No existe componente similar
- ✅ No se puede extender uno existente
- ✅ Tiene responsabilidad única y clara
- ✅ Sigue el patrón de naming
- ✅ Se puede probar de forma aislada

#### 4. CUANDO MODIFICAR ARCHIVOS CLAVE

**types/index.ts**:
- Añadir nuevos tipos/interfaces
- Extender tipos existentes (NUNCA reemplazar)

**lib/store.ts**:
- Añadir nuevas actions
- Extender estado (NUNCA eliminar campos)

**ModuleBlock.tsx**:
- Cambios visuales generales de módulos
- Lógica común a todos los módulos

**Canvas.tsx**:
- Cambios en zoom/pan/keyboard
- Renderizado del canvas

#### 5. ERRORES COMUNES A EVITAR

❌ **NO hacer**:
```tsx
// Crear nuevo componente cuando ya existe similar
export function MyModuleBlock() { ... }  // Ya existe ModuleBlock.tsx

// Duplicar tipos
interface MyModule { ... }  // Ya existe Module en types/index.ts

// Hardcodear valores
const BLUE = '#3b82f6'  // Usar Tailwind classes

// Crear store paralelo
const [modules, setModules] = useState()  // Usar useSpaceStore()
```

✅ **SÍ hacer**:
```tsx
// Reutilizar componente existente
import { ModuleBlock } from './ModuleBlock'

// Extender tipo existente
import { Module } from '@/types'

// Usar Tailwind
className="bg-blue-500"

// Usar store global
const { modules, updateModule } = useSpaceStore()
```

---

## 📖 REFERENCIAS RÁPIDAS

### Tipos Importantes
```typescript
// types/index.ts

type ModuleStatus = 'idle' | 'running' | 'done' | 'error'

type ModuleType =
  | 'local-project-analysis'
  | 'reader-engine'
  | 'naming-engine'
  | 'icon-generator'
  | 'marketing-pack'

interface Module {
  id: string
  type: ModuleType
  name: string
  position: Position
  size: Size
  status: ModuleStatus
  ports: {
    input: ModulePort[]
    output: ModulePort[]
  }
  data: ModuleData
}

interface Space {
  id: string
  name: string
  modules: Module[]
  connections: ModuleConnection[]
  createdAt: Date
  updatedAt: Date
}
```

### Store Actions
```typescript
// lib/store.ts

// Spaces
createSpace(name: string)
deleteSpace(id: string)
setCurrentSpace(id: string)

// Modules
addModule(type: ModuleType, position: Position)
updateModule(id: string, updates: Partial<Module>)
deleteModule(id: string)

// Connections
addConnection(connection: Omit<ModuleConnection, 'id'>)
deleteConnection(id: string)

// Canvas
setZoom(zoom: number)
setPan(pan: Position)
resetCanvas()

// Helper
getCurrentSpace(): Space | undefined
```

### Colores del Tema
```javascript
// tailwind.config.js

colors: {
  dark: {
    bg: '#0A0A0A',
    sidebar: '#1A1A1A',
    card: '#2A2A2A',
    border: '#3A3A3A',
    hover: '#2F2F2F',
  },
  grid: {
    dot: '#3E3E3E',
  }
}
```

---

## 🔄 PROCESO DE ACTUALIZACIÓN DE ESTE DOCUMENTO

Cada vez que se complete una tarea:

1. **Actualizar checklist**: Marcar tarea como [x]
2. **Actualizar "FEATURES IMPLEMENTADAS"**: Añadir sección si es nueva
3. **Actualizar "FEATURES PENDIENTES"**: Mover a implementadas
4. **Añadir referencias**: Archivos modificados/creados
5. **Actualizar métricas**: Líneas de código, archivos
6. **Commit**: `git commit -m "docs: update PROJECT_STATUS after [task]"`

---

## 📞 CONTACTO Y DOCUMENTACIÓN EXTERNA

- **Especificación completa**: Ver documento "APP MARKETING SPACES - SISTEMA GLOBAL V1.1"
- **Diseño de referencia**: `/design_interface/` (capturas de Freepik Spaces)
- **Tech stack**:
  - Next.js 16: https://nextjs.org/docs
  - React 19: https://react.dev
  - Zustand: https://docs.pmnd.rs/zustand
  - Tailwind CSS: https://tailwindcss.com/docs

---

**ÚLTIMA ACTUALIZACIÓN**: 2025-11-15
**VERSIÓN**: v1.1-alpha
**PROGRESO GLOBAL**: ~20% del sistema v1.1 completado
**PRÓXIMA TAREA PRIORITARIA**: Implementar conectores tipados (Tarea A)
