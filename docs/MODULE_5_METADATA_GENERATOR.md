# 📝 MÓDULO 5 — APP STORE METADATA GENERATOR

**Versión**: 3.0
**Última actualización**: 2025-11-15
**Estado**: 📋 Planificado - Pendiente de implementación

---

## 🎯 PROPÓSITO

Genera automáticamente TODOS los textos de marketing necesarios para publicar una aplicación en App Store (iOS) y Google Play Store (Android), cumpliendo con todos los requisitos oficiales de caracteres y guidelines.

---

## 📊 POSICIÓN EN EL PIPELINE

```
┌─────────────────┐
│   MÓDULO 1      │
│ Local Project   │
│   Analysis      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MÓDULO 2      │
│  AIE Engine     │  outputs.appIntelligence
└────────┬────────┘  outputs.flowContext
         │
         ▼
┌─────────────────┐
│   MÓDULO 3      │
│ Naming Engine   │  outputs.namingPackage
└────────┬────────┘  outputs.chosenName
         │           outputs.flowContext
         ▼
┌─────────────────┐
│   MÓDULO 4B     │
│ App Icon Gen    │  outputs.iconOptions (opcional)
└────────┬────────┘  outputs.chosenIcon
         │
         ▼
┌─────────────────────────────────────┐
│         MÓDULO 5                    │
│  METADATA GENERATOR                 │
│                                     │
│  inputs:                            │
│  - appIntelligence (de M2)         │
│  - namingPackage (de M3)           │
│  - chosenName (de M3)              │
│  - iconOptions (de M4B - opcional) │
│  - flowContext (propagado)         │
│                                     │
│  outputs:                           │
│  - metadataPackage (N variantes)   │
│  - chosenMetadata                  │
│  - metadataLog                     │
│  - flowContext                     │
└─────────────────────────────────────┘
```

---

## 🔌 PUERTOS DE CONEXIÓN

### Input Ports (4)

| Puerto | Label | Tipo | Obligatorio | Fuente Típica | Descripción |
|--------|-------|------|-------------|---------------|-------------|
| `in-1` | App Intelligence | JSON | ✅ Sí | Módulo 2 (AIE Engine) | Categoría, keywords, target audience, features |
| `in-2` | Naming Package | JSON | ✅ Sí | Módulo 3 (Naming Engine) | Nombre de app, slogan, branding identity |
| `in-3` | Chosen Name | JSON | ✅ Sí | Módulo 3 (Naming Engine) | Nombre final seleccionado |
| `in-4` | Icon Options | JSON | ⚪ No | Módulo 4B (App Icon) | URLs de iconos para enriquecer el contexto visual |

### Output Ports (4)

| Puerto | Label | Tipo | Descripción |
|--------|-------|------|-------------|
| `out-1` | Metadata Package | JSON | N variantes completas de metadata (App Store + Google Play) |
| `out-2` | Chosen Metadata | JSON | Variante final seleccionada por el usuario |
| `out-3` | Metadata Log | TEXT | Log de generación con prompts y validaciones |
| `out-4` | Flow Context | JSON | Contexto propagado a módulos futuros |

---

## 📋 REQUISITOS OFICIALES

### App Store (iOS)

| Campo | Límite | Reglas |
|-------|--------|--------|
| **App Name** | 30 caracteres | Sin claims (#1, best), incluir marca |
| **Subtitle** | 30 caracteres | Resumir funcionalidad, no repetir título |
| **Promotional Text** | 170 caracteres | Actualizable sin nueva versión |
| **Description** | Sin límite | Párrafos cortos, beneficios claros, CTA |
| **Keywords** | 100 caracteres | Separadas por comas, NO repetir palabras del título/subtítulo |

### Google Play (Android)

| Campo | Límite | Reglas |
|-------|--------|--------|
| **Title** | 30 caracteres | Claro, sin spam |
| **Short Description** | 80 caracteres | Orientada a beneficios |
| **Full Description** | 4,000 caracteres | Evitar símbolos excesivos, NO claims (#1, best, download now) |
| **Tags** | Variable | Coincidir con categoría funcional |

---

## 📦 TIPOS DE DATOS (TypeScript)

### Interfaces Principales

```typescript
// Input del módulo (combinación de datos de M2 + M3 + M4B)
export interface MetadataGeneratorInputs {
  appIntelligence: AppIntelligence;        // De Módulo 2
  namingPackage: NamingPackage;            // De Módulo 3
  chosenName: ChosenName;                  // De Módulo 3
  iconOptions?: AppIconOptionsPackage;     // De Módulo 4B (opcional)
  flowContext?: FlowContext;               // Contexto propagado

  // Configuración del módulo
  numVariants?: number;                    // Número de variantes a generar (default: 3)
  targetMarket?: string;                   // 'US', 'EU', 'LATAM', 'Global', etc.
  emphasizeFeatures?: string[];            // Features específicos a enfatizar
}

// Metadata para App Store (iOS)
export interface AppStoreMetadata {
  title: string;                           // ≤ 30 chars
  subtitle: string;                        // ≤ 30 chars
  promotional_text: string;                // ≤ 170 chars
  description: string;                     // Sin límite estricto
  keywords: string;                        // ≤ 100 chars (separadas por comas)
}

// Metadata para Google Play (Android)
export interface GooglePlayMetadata {
  title: string;                           // ≤ 30 chars
  short_description: string;               // ≤ 80 chars
  full_description: string;                // ≤ 4,000 chars
  tags: string[];                          // Array de tags
}

// Una variante completa de metadata (App Store + Google Play)
export interface MetadataVariant {
  id: number;
  app_store: AppStoreMetadata;
  google_play: GooglePlayMetadata;

  // Metadatos de la variante
  variant_name: string;                    // e.g., "Professional Focus", "Student Friendly"
  target_persona: string;                  // A quién apunta esta variante
  tone: string;                            // Tono usado (friendly, professional, technical)
  emphasis: string;                        // Qué aspectos enfatiza

  // AI info
  ai_prompt_used: string;
  generated_at: string;
}

// Paquete completo con todas las variantes
export interface MetadataPackage {
  brand_name: string;
  num_variants: number;
  variants: MetadataVariant[];

  // Metadata del paquete
  category: string;
  language: string;                        // 'en', 'es', 'fr', etc.
  generated_at: string;
  validation_passed: boolean;              // Todas las variantes cumplen límites
  validation_warnings?: string[];          // Advertencias de validación
}

// Metadata final elegida por el usuario
export interface ChosenMetadata {
  variant_id: number;
  app_store: AppStoreMetadata;
  google_play: GooglePlayMetadata;
  chosen_at: string;
  source_module: string;
  engine_version: string;
}

// Outputs del módulo
export interface MetadataGeneratorOutputs {
  metadataPackage?: MetadataPackage;       // Todas las variantes
  chosenMetadata?: ChosenMetadata;         // Variante final seleccionada
  metadataLog?: string;                    // Log de generación
  flowContext?: FlowContext;               // Contexto propagado
}
```

---

## 🎨 UI DEL MÓDULO

### Header
```
┌─────────────────────────────────────────────────┐
│ 📝 Metadata Generator                  [🟢]     │
│                                                  │
│ ▶ Run  ⟲ Re-Run  ℹ Info  ⋮ Menu               │
└─────────────────────────────────────────────────┘
```

### Cuerpo (Estado Idle)

```
┌─────────────────────────────────────────────────┐
│ Configuration                                    │
│                                                  │
│ Brand: FoxTimer                                 │
│ Category: Productivity                          │
│ Language: English (en) 🌍                       │
│                                                  │
│ Features (from AIE):                            │
│  • Focus timer with pomodoro                    │
│  • Daily goal tracking                          │
│  • Analytics & insights                         │
│                                                  │
│ Number of variants: [3 ▼]                      │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │         ▶ Generate Metadata             │    │
│ └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Cuerpo (Estado Done - Con variantes)

```
┌─────────────────────────────────────────────────┐
│ ✓ 3 variants generated                          │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │      📋 Open Variants Panel             │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ Selected: Variant #1 - "Professional Focus"    │
│                                                  │
│ 📊 Logs  📄 Export JSON                         │
└─────────────────────────────────────────────────┘
```

### Panel de Variantes (Modal lateral)

```
┌─────────────────────────────────────────────────────────────┐
│ Metadata Variants                                   [✕]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌───────────────────────────────────────────────┐          │
│ │ VARIANT #1 - Professional Focus        [✓]    │          │
│ │                                                │          │
│ │ iOS App Store:                                 │          │
│ │ Title: FoxTimer: Master Focus (29 chars) ✓    │          │
│ │ Subtitle: Track goals every day (23 chars) ✓  │          │
│ │ Keywords: focus,timer,productivity... (95) ✓  │          │
│ │                                                │          │
│ │ Google Play:                                   │          │
│ │ Title: FoxTimer (8 chars) ✓                    │          │
│ │ Short: Stay focused. Achieve more. (30) ✓     │          │
│ │                                                │          │
│ │ Tone: Professional, benefit-driven             │          │
│ │ Target: Professionals & entrepreneurs          │          │
│ │                                                │          │
│ │ ┌─────────────┐  ┌─────────────┐             │          │
│ │ │ View Full   │  │ SELECT ✓    │             │          │
│ │ └─────────────┘  └─────────────┘             │          │
│ └───────────────────────────────────────────────┘          │
│                                                              │
│ ┌───────────────────────────────────────────────┐          │
│ │ VARIANT #2 - Student Friendly          [ ]    │          │
│ │ ...                                            │          │
│ └───────────────────────────────────────────────┘          │
│                                                              │
│ ┌───────────────────────────────────────────────┐          │
│ │ VARIANT #3 - Creative Focus            [ ]    │          │
│ │ ...                                            │          │
│ └───────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 PROCESO DE EJECUCIÓN

### Flujo Completo

```
1. VALIDATE_INPUTS
   ├─ ✓ appIntelligence presente (de M2)
   ├─ ✓ namingPackage presente (de M3)
   ├─ ✓ chosenName presente (de M3)
   └─ ⚠ iconOptions opcional (de M4B)

2. BUILD_METADATA_BRIEF
   ├─ Combinar datos de todos los inputs
   ├─ Extraer: brand_name, features, category, tone
   ├─ Preparar contexto para AI
   └─ Definir num_variants

3. BUILD_AI_PROMPT
   ├─ Incluir guidelines oficiales (App Store + Google Play)
   ├─ Incluir límites de caracteres
   ├─ Incluir palabras prohibidas (#1, best, download now)
   ├─ Incluir tono y estilo de marca
   ├─ Especificar idioma (de flowContext)
   └─ Solicitar N variantes diferentes

4. CALL_AI_PROVIDER
   ├─ Usar AI config del módulo o del space
   ├─ Enviar prompt estructurado
   ├─ Parsear respuesta JSON
   └─ Retry en caso de error

5. VALIDATE_VARIANTS
   ├─ Para cada variante:
   │  ├─ Verificar App Store title ≤ 30 chars
   │  ├─ Verificar App Store subtitle ≤ 30 chars
   │  ├─ Verificar App Store keywords ≤ 100 chars
   │  ├─ Verificar Google Play title ≤ 30 chars
   │  ├─ Verificar Google Play short_desc ≤ 80 chars
   │  ├─ Verificar Google Play full_desc ≤ 4000 chars
   │  └─ Truncar o rechazar si excede
   └─ Marcar validation_passed = true/false

6. CREATE_METADATA_PACKAGE
   ├─ Empaquetar todas las variantes
   ├─ Añadir metadatos del paquete
   └─ Generar metadata_log.txt

7. UPDATE_MODULE_STATUS
   ├─ status: 'warning' si ninguna variante válida
   ├─ status: 'done' si todo OK
   └─ Guardar metadataPackage en outputs

8. RENDER_VARIANTS_PANEL
   └─ Mostrar tarjetas interactivas para selección

9. USER_SELECTION
   ├─ Usuario hace clic en "SELECT" en una variante
   ├─ Crear ChosenMetadata con esa variante
   └─ Actualizar outputs.chosenMetadata

10. PROPAGATE_FLOW_CONTEXT
    └─ Pasar flowContext a módulos downstream
```

---

## 🤖 PROMPT ENGINEERING

### Prompt Base (Template)

```markdown
You are a professional app marketing copywriter specializing in App Store
and Google Play Store metadata that drives downloads and conversions.

# TASK
Generate {num_variants} complete metadata variants for the following app:

# APP INFORMATION
- Brand Name: {brand_name}
- Category: {category}
- Slogan: {slogan}
- Target Audience: {target_audience}
- Key Features:
  {features_list}
- Tone: {brand_tone}
- Keywords: {keywords}
- Design Style: {design_style}

# LANGUAGE
ALL metadata must be in: {language}

# OFFICIAL REQUIREMENTS

## App Store (iOS)
- App Name: MAX 30 characters (STRICT)
- Subtitle: MAX 30 characters (STRICT)
- Promotional Text: MAX 170 characters
- Description: Unlimited (but keep concise)
- Keywords: MAX 100 characters, comma-separated
  * DO NOT repeat words from App Name or Subtitle
  * NO spaces after commas
  * Focus on discovery keywords

## Google Play (Android)
- Title: MAX 30 characters (STRICT)
- Short Description: MAX 80 characters (STRICT)
- Full Description: MAX 4,000 characters
  * Avoid excessive symbols or capitalization
  * NO claims like "#1", "best app", "download now"
  * Focus on benefits, not just features

# FORBIDDEN WORDS/PHRASES
- "#1", "Best", "Top", "Download now", "Free forever"
- Excessive emojis or special characters
- Spam-like repetition

# OUTPUT FORMAT
Return a JSON array with {num_variants} variants, each with this structure:

{
  "variants": [
    {
      "id": 1,
      "variant_name": "Professional Focus",
      "target_persona": "Professionals seeking productivity",
      "tone": "Professional, benefit-driven",
      "emphasis": "Time management and analytics",
      "app_store": {
        "title": "FoxTimer: Master Focus",
        "subtitle": "Track goals every day",
        "promotional_text": "Stay focused and achieve more with intelligent time tracking.",
        "description": "FoxTimer is the smart, elegant timer...",
        "keywords": "focus,timer,productivity,goals,tracking"
      },
      "google_play": {
        "title": "FoxTimer",
        "short_description": "Stay focused. Achieve more.",
        "full_description": "Boost your productivity...",
        "tags": ["productivity", "time-management", "focus"]
      }
    },
    // ... more variants
  ]
}

# VARIANT DIVERSITY
Each variant should target a different persona or use case:
- Variant 1: Professional/Business focus
- Variant 2: Student/Academic focus
- Variant 3: Creative/Personal focus
(Adjust based on app category)

Generate the metadata now.
```

---

## 📝 EJEMPLO DE OUTPUT

### MetadataPackage (JSON)

```json
{
  "brand_name": "FoxTimer",
  "num_variants": 3,
  "category": "Productivity",
  "language": "en",
  "generated_at": "2025-11-15T14:30:00Z",
  "validation_passed": true,
  "variants": [
    {
      "id": 1,
      "variant_name": "Professional Focus",
      "target_persona": "Professionals & entrepreneurs",
      "tone": "Professional, benefit-driven",
      "emphasis": "Time management, productivity, ROI",
      "app_store": {
        "title": "FoxTimer: Master Focus",
        "subtitle": "Track goals every day",
        "promotional_text": "Stay focused and achieve more with intelligent time tracking designed for professionals.",
        "description": "FoxTimer is the smart, elegant timer built for people who value their time.\n\nBOOST PRODUCTIVITY\n• Focus sessions with intelligent breaks\n• Daily goal tracking with progress insights\n• Analytics to understand your work patterns\n\nSTAY ON TRACK\n• Scheduled focus sessions\n• Customizable timer intervals\n• Notifications that respect your flow\n\nYOUR TIME, OPTIMIZED\nJoin thousands of professionals who've transformed their productivity with FoxTimer.\n\nDownload now and start achieving more.",
        "keywords": "focus,timer,productivity,time,management,goals,tracking,work,professional,pomodoro"
      },
      "google_play": {
        "title": "FoxTimer",
        "short_description": "Stay focused. Achieve more. Track your time with purpose.",
        "full_description": "FoxTimer helps professionals, students, and creators maximize their productivity through intelligent time tracking.\n\nKEY FEATURES:\n\n⏱️ FOCUS SESSIONS\nSet custom focus intervals with smart break reminders. Our intelligent timer adapts to your work rhythm.\n\n📊 GOAL TRACKING\nSet daily productivity goals and track your progress. See exactly how you spend your time.\n\n📈 INSIGHTS & ANALYTICS\nUnderstand your productivity patterns with detailed analytics. Identify your peak focus hours.\n\n⚡ SIMPLE & ELEGANT\nClean interface that gets out of your way. Focus on your work, not the app.\n\nPERFECT FOR:\n• Professionals managing multiple projects\n• Students preparing for exams\n• Freelancers tracking billable hours\n• Anyone seeking better time management\n\nWHY FOXTIMER?\nUnlike other timer apps, FoxTimer combines simplicity with powerful insights. Track your time, understand your patterns, and achieve your goals.\n\nStart your productivity journey today.",
        "tags": ["productivity", "time-management", "focus", "timer", "goals"]
      },
      "ai_prompt_used": "...",
      "generated_at": "2025-11-15T14:30:00Z"
    },
    {
      "id": 2,
      "variant_name": "Student Friendly",
      "target_persona": "Students & academics",
      "tone": "Friendly, encouraging",
      "emphasis": "Study sessions, exam prep, learning",
      "app_store": {
        "title": "FoxTimer: Study Smarter",
        "subtitle": "Focus timer for students",
        "promotional_text": "Ace your exams with focused study sessions. Track your progress and stay motivated every day.",
        "description": "...",
        "keywords": "study,timer,student,focus,exam,learning,pomodoro,goals,productivity,school"
      },
      "google_play": {
        "title": "FoxTimer - Study Timer",
        "short_description": "Study smarter with focused sessions. Track your learning progress.",
        "full_description": "...",
        "tags": ["education", "study", "timer", "students", "focus"]
      },
      "ai_prompt_used": "...",
      "generated_at": "2025-11-15T14:30:01Z"
    },
    {
      "id": 3,
      "variant_name": "Creative Minimalist",
      "target_persona": "Creators & artists",
      "tone": "Inspiring, minimalist",
      "emphasis": "Creative flow, deep work, simplicity",
      "app_store": {
        "title": "FoxTimer: Creative Flow",
        "subtitle": "Time tracker for makers",
        "promotional_text": "Enter deep focus. Create without distraction. Track your creative sessions with elegance.",
        "description": "...",
        "keywords": "timer,focus,creative,artist,maker,flow,deep work,productivity,minimal,track"
      },
      "google_play": {
        "title": "FoxTimer - Flow Timer",
        "short_description": "Track your creative flow. Focus on what matters. Simple timer.",
        "full_description": "...",
        "tags": ["creativity", "focus", "timer", "productivity", "minimalist"]
      },
      "ai_prompt_used": "...",
      "generated_at": "2025-11-15T14:30:02Z"
    }
  ]
}
```

---

## 🔍 VALIDACIÓN AUTOMÁTICA

### Reglas de Validación

```typescript
function validateMetadataVariant(variant: MetadataVariant): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // App Store validation
  if (variant.app_store.title.length > 30) {
    errors.push(`App Store title exceeds 30 chars: ${variant.app_store.title.length}`);
  }
  if (variant.app_store.subtitle.length > 30) {
    errors.push(`App Store subtitle exceeds 30 chars: ${variant.app_store.subtitle.length}`);
  }
  if (variant.app_store.keywords.length > 100) {
    errors.push(`App Store keywords exceed 100 chars: ${variant.app_store.keywords.length}`);
  }
  if (variant.app_store.promotional_text.length > 170) {
    errors.push(`Promotional text exceeds 170 chars: ${variant.app_store.promotional_text.length}`);
  }

  // Check for forbidden words in App Store
  const forbiddenWords = ['#1', 'best app', 'download now', 'free forever', 'top app'];
  const appStoreText = `${variant.app_store.title} ${variant.app_store.subtitle} ${variant.app_store.description}`.toLowerCase();

  forbiddenWords.forEach(word => {
    if (appStoreText.includes(word.toLowerCase())) {
      warnings.push(`App Store metadata contains forbidden phrase: "${word}"`);
    }
  });

  // Google Play validation
  if (variant.google_play.title.length > 30) {
    errors.push(`Google Play title exceeds 30 chars: ${variant.google_play.title.length}`);
  }
  if (variant.google_play.short_description.length > 80) {
    errors.push(`Google Play short desc exceeds 80 chars: ${variant.google_play.short_description.length}`);
  }
  if (variant.google_play.full_description.length > 4000) {
    errors.push(`Google Play full desc exceeds 4000 chars: ${variant.google_play.full_description.length}`);
  }

  // Check for forbidden words in Google Play
  const googlePlayText = `${variant.google_play.title} ${variant.google_play.short_description} ${variant.google_play.full_description}`.toLowerCase();

  forbiddenWords.forEach(word => {
    if (googlePlayText.includes(word.toLowerCase())) {
      warnings.push(`Google Play metadata contains forbidden phrase: "${word}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## 🚦 ESTADOS DEL MÓDULO

| Estado | Color | Significado | Acción del Usuario |
|--------|-------|-------------|-------------------|
| `idle` | Gris | No ejecutado, esperando inputs | Conectar inputs y ejecutar |
| `running` | Azul | Generando variantes con AI | Esperar... |
| `done` | Verde | Variantes generadas exitosamente | Abrir panel y seleccionar |
| `warning` | Amarillo | Variantes generadas pero con advertencias de validación | Revisar warnings en logs |
| `error` | Rojo | Error en generación (AI falló, inputs faltantes) | Ver error y corregir |

---

## 📤 OUTPUTS DISPONIBLES

### 1. metadataPackage (JSON)
```json
{
  "brand_name": "FoxTimer",
  "num_variants": 3,
  "variants": [ /* array de MetadataVariant */ ],
  "category": "Productivity",
  "language": "en",
  "validation_passed": true
}
```

**Usado por**: Módulos de documentación, exportación, análisis

---

### 2. chosenMetadata (JSON)
```json
{
  "variant_id": 1,
  "app_store": { /* AppStoreMetadata */ },
  "google_play": { /* GooglePlayMetadata */ },
  "chosen_at": "2025-11-15T14:35:00Z",
  "source_module": "MetadataGenerator5",
  "engine_version": "3.0"
}
```

**Usado por**: Módulos de publicación, export final, marketing pack

---

### 3. metadataLog (TEXT)
```
=== METADATA GENERATOR LOG ===
Date: 2025-11-15T14:30:00Z
Provider: together
Model: meta-llama/Llama-3.3-70B-Instruct-Turbo

INPUTS RECEIVED:
- Brand Name: FoxTimer
- Category: Productivity
- Language: en
- Features: 4
- Num Variants Requested: 3

AI PROMPT (excerpt):
You are a professional app marketing copywriter...
[Brand Name: FoxTimer]
[Category: Productivity]
...

VALIDATION RESULTS:
✓ Variant 1: PASS (all limits OK)
✓ Variant 2: PASS (all limits OK)
✓ Variant 3: PASS (all limits OK)

WARNINGS:
- None

FINAL STATUS: SUCCESS
Generated 3 valid variants
```

---

### 4. flowContext (JSON)
```json
{
  "language": "en",
  "targetMarket": "Global",
  "brandTone": "professional modern",
  "category": "Productivity",
  "appName": "FoxTimer",
  "slogan": "Time with style"
}
```

**Propagado a**: Módulos downstream (marketing materials, screenshots, etc.)

---

## 🎛️ CONFIGURACIÓN DEL MÓDULO

### Parámetros Ajustables

```typescript
interface MetadataGeneratorConfig {
  // Cuántas variantes generar
  numVariants: number;          // Default: 3, Range: 1-5

  // Mercado objetivo (afecta keywords y tono)
  targetMarket: string;         // 'US', 'EU', 'LATAM', 'ASIA', 'Global'

  // Features específicos a enfatizar
  emphasizeFeatures: string[];  // e.g., ['analytics', 'goal tracking']

  // Estilo de metadata
  style: 'conservative' | 'creative' | 'balanced';  // Default: 'balanced'

  // AI Provider settings (heredadas o custom)
  aiProvider?: AIProvider;
  aiModel?: string;
  temperature?: number;         // Default: 0.7 (más creativo = 1.0)
}
```

---

## 🧪 CASOS DE USO

### Caso 1: Marketing Multi-Idioma
```
Usuario genera 3 variantes en inglés → Selecciona Variant #1 →
Cambia language a 'es' en flowContext → Re-ejecuta módulo →
Obtiene 3 nuevas variantes en español basadas en la misma estrategia
```

### Caso 2: A/B Testing
```
Genera 5 variantes con diferentes tonos →
Exporta todas como JSON →
Sube a plataforma de A/B testing →
Analiza cuál tiene mejor conversion rate
```

### Caso 3: Adaptación de Mercado
```
Variant 1: targetMarket = 'US' → Enfasis en "productivity", "ROI"
Variant 2: targetMarket = 'EU' → Enfasis en "work-life balance", "privacy"
Variant 3: targetMarket = 'ASIA' → Enfasis en "efficiency", "innovation"
```

---

## 🔗 INTEGRACIÓN CON OTROS MÓDULOS

### Módulo 2 (AIE Engine) → Módulo 5
```
appIntelligence.keywords → Usados en App Store keywords
appIntelligence.features → Listados en descriptions
appIntelligence.targetAudience → Define tone de variantes
appIntelligence.problemsSolved → Base para promotional text
```

### Módulo 3 (Naming Engine) → Módulo 5
```
chosenName.final_name → App title base
namingPackage.slogan → Subtitle base
namingPackage.branding.brand_tone → Tone de metadata
namingPackage.branding.color_palette → Contexto visual
```

### Módulo 4B (App Icon) → Módulo 5 (opcional)
```
iconOptions.variants → Enriquece prompts con contexto visual
chosenIcon.final_ios_icon → Referencia en descriptions ("elegant icon design")
```

### Módulo 5 → Módulos Futuros
```
chosenMetadata → Screenshots Generator (usar keywords como contexto)
chosenMetadata → Press Kit Generator (usar descriptions)
chosenMetadata → Landing Page Generator (usar promotional text)
```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error 1: "No input connected"
**Causa**: Falta conexión desde Módulo 2 o Módulo 3
**Solución**: Conectar outputs de AIE Engine y Naming Engine

### Error 2: "Title exceeds 30 characters"
**Causa**: AI generó títulos demasiado largos
**Solución**: Re-ejecutar con temperature más bajo o editar manualmente

### Error 3: "Keywords contain forbidden words"
**Causa**: AI usó "best", "#1", etc.
**Solución**: Validación automática los detecta, usuario puede editar

### Error 4: "Language mismatch"
**Causa**: flowContext.language = 'es' pero outputs en inglés
**Solución**: Verificar que el prompt incluya el idioma correcto

---

## 📊 MÉTRICAS DE CALIDAD

### KPIs del Módulo

```
✓ Character Limit Compliance: 100% (todas las variantes dentro de límites)
✓ Keyword Optimization: 8-10 keywords relevantes por variante
✓ Forbidden Word Detection: 0 palabras prohibidas
✓ Variant Diversity: 3+ tonos diferentes identificables
✓ Generation Time: < 30 segundos para 3 variantes
```

---

## 🔄 VERSIONADO

### v1.0 (Inicial)
- Generación básica de App Store + Google Play metadata
- 1 variante por ejecución
- Sin validación automática

### v2.0 (Multi-Variante)
- N variantes personalizables
- Validación automática de límites
- Panel de selección interactivo
- Integración con FlowContext

### v3.0 (Actual)
- Multi-idioma via flowContext
- Estrategias por mercado (US, EU, LATAM, ASIA)
- Validación de palabras prohibidas
- Integración completa con Módulo 4B (icons)
- AI Provider configurable por módulo
- Metadata log detallado

---

## 📚 REFERENCIAS

### Documentación Oficial
- [App Store Connect - Metadata](https://developer.apple.com/app-store/product-page/)
- [Google Play Console - Store Listing](https://support.google.com/googleplay/android-developer/answer/9866151)

### Archivos del Proyecto
- `/types/index.ts` - Definiciones de tipos
- `/lib/store.ts` - Store con moduleDefaults
- `/components/modules/NamingEngineModule.tsx` - Patrón de referencia
- `/lib/ai-provider.ts` - AI Provider manager

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Tipos y Estructura
- [ ] Añadir tipos a `/types/index.ts`:
  - [ ] MetadataGeneratorInputs
  - [ ] AppStoreMetadata
  - [ ] GooglePlayMetadata
  - [ ] MetadataVariant
  - [ ] MetadataPackage
  - [ ] ChosenMetadata
  - [ ] MetadataGeneratorOutputs
- [ ] Actualizar `ModuleType` enum con `'metadata-generator'`
- [ ] Añadir module defaults a `/lib/store.ts`

### Fase 2: Componente Principal
- [ ] Crear `/components/modules/MetadataGeneratorModule.tsx`
- [ ] Implementar UI de configuración (numVariants, targetMarket)
- [ ] Implementar handler `handleRun()`
- [ ] Integrar con AI Provider
- [ ] Parsear outputs de AI

### Fase 3: Validación
- [ ] Crear función `validateMetadataVariant()`
- [ ] Implementar validación de límites de caracteres
- [ ] Implementar detección de palabras prohibidas
- [ ] Añadir warnings al log

### Fase 4: Panel de Variantes
- [ ] Crear componente `MetadataVariantsPanel`
- [ ] Diseñar tarjetas de variantes
- [ ] Implementar selección de variante final
- [ ] Actualizar `chosenMetadata` en outputs

### Fase 5: Integración
- [ ] Conectar inputs desde Módulo 2, 3, 4B
- [ ] Leer flowContext.language
- [ ] Propagar flowContext a outputs
- [ ] Testear con diferentes idiomas

### Fase 6: Testing
- [ ] Test con 1, 3, 5 variantes
- [ ] Test con diferentes idiomas (en, es, fr)
- [ ] Test con diferentes mercados (US, EU, LATAM)
- [ ] Test de validación (límites, palabras prohibidas)
- [ ] Test de error handling (sin inputs, AI falla)

---

**Estado del documento**: ✅ Completo y listo para implementación
**Próximo paso**: Implementar tipos en `/types/index.ts`
**Owner**: Equipo de Marketing Automation
**Última revisión**: 2025-11-15
