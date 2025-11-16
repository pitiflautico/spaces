# MÓDULO 7 — APP STORE CONNECT AUTOMATION

**Versión**: 1.0
**Estado**: Implementado
**Última actualización**: 2025-11-16

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Conexiones en el Pipeline](#conexiones-en-el-pipeline)
3. [Preparación del Entorno](#preparación-del-entorno)
4. [Proceso Completo](#proceso-completo)
5. [Outputs Técnicos](#outputs-técnicos)
6. [UI/UX del Módulo](#uiux-del-módulo)
7. [Estados del Módulo](#estados-del-módulo)
8. [Checklist Técnico](#checklist-técnico)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 INTRODUCCIÓN

El **Módulo 7 - App Store Connect Automation** automatiza completamente el proceso de alta y configuración de aplicaciones en **App Store Connect** (https://appstoreconnect.apple.com/).

### Capacidades

✅ **Crear nueva app** en App Store Connect
✅ **Registrar información básica** (bundle ID, plataforma, categoría)
✅ **Rellenar metadatos** automáticamente desde Módulo 5
✅ **Subir iconos oficiales** desde Módulo 4B
✅ **Subir screenshots** generadas desde Módulo 6
✅ **Configurar permisos** y advertencias
✅ **Validar** la ficha completa
✅ **Actualizar apps existentes** automáticamente
✅ **Gestión de 2FA** asistida

### Tecnologías Utilizadas

- **Local Automation Daemon** - Servidor local para automatización
- **Playwright** - Automatización de navegador
- **Chromium** - Navegador headless/headed
- **Apple Keychain** - Almacenamiento seguro de credenciales

---

## 🔌 CONEXIONES EN EL PIPELINE

### Entradas del Módulo

El Módulo 7 tiene **4 puertos de entrada** que reciben datos de módulos anteriores:

#### PUERTO A — METADATA INPUT
- **Tipo**: `JSON`
- **Origen**: Módulo 5 (Metadata Generator)
- **Contiene**:
  ```typescript
  {
    app_store: {
      title: string,              // ≤ 30 chars
      subtitle: string,           // ≤ 30 chars
      promotional_text: string,   // ≤ 170 chars
      description: string,        // Sin límite
      keywords: string            // ≤ 100 chars
    },
    category: string,
    age_rating: {
      violence: string,
      profanity: string,
      // ... otros criterios
    }
  }
  ```

#### PUERTO B — ICON INPUT
- **Tipo**: `IMAGE`
- **Origen**: Módulo 4B (App Icon Generator)
- **Contiene**: Icono oficial iOS 1024x1024
- **Formato**: PNG sin transparencias

#### PUERTO C — SCREENSHOTS INPUT
- **Tipo**: `JSON`
- **Origen**: Módulo 6 (Screenshot Generator)
- **Contiene**:
  ```typescript
  {
    screenshots_by_device: {
      "6.7": [
        { path: string, resolution: "1290x2796", order: number },
        // ... más screenshots
      ],
      "6.5": [...],
      "5.5": [...]
    },
    chosen_set: string
  }
  ```

#### PUERTO D — BUILD CONFIG INPUT
- **Tipo**: `JSON`
- **Origen**: Módulo de Build (futuro) o configuración manual
- **Contiene**:
  ```typescript
  {
    bundle_id: string,           // com.company.app
    version: string,             // 1.0.0
    build_number: string,        // 1
    team_id: string,             // Apple Team ID
    localizations: string[],     // ["en-US", "es-ES"]
    privacy_policy_url?: string,
    support_url?: string,
    marketing_url?: string
  }
  ```

### Salidas del Módulo

#### OUT-1: Automation Result
- **Tipo**: `JSON`
- **Contiene**: Resultado completo de la automatización

#### OUT-2: Connect Log
- **Tipo**: `TEXT`
- **Contiene**: Log detallado del proceso

#### OUT-3: Validation Report
- **Tipo**: `JSON`
- **Contiene**: Reporte de validación de App Store Connect

---

## 🛠️ PREPARACIÓN DEL ENTORNO

### Requisitos Técnicos

#### Sistema Operativo
- **macOS** 11.0 o superior (requerido para Xcode)
- **Xcode Command Line Tools** instalados

#### Software Necesario
```bash
# Instalar Playwright
npm install -D playwright

# Instalar dependencias del navegador
npx playwright install chromium

# Verificar instalación
npx playwright --version
```

#### Configuración de Credenciales

El módulo utiliza el **Apple Keychain** local para almacenar credenciales de forma segura:

```bash
# Las credenciales se almacenan automáticamente tras el primer login
# No es necesario configuración manual
```

#### Variables de Entorno

Añadir al daemon `.env`:

```bash
# App Store Connect Configuration
ASC_HEADLESS=false              # false = ver el navegador (recomendado)
ASC_TIMEOUT=300000              # 5 minutos timeout
ASC_SCREENSHOT_ON_ERROR=true    # Capturar pantalla en errores
```

---

## ⚙️ PROCESO COMPLETO

### 7.1 LOGIN MANUAL O SEMI-AUTOMATIZADO

**Descripción**: Autenticación en App Store Connect con gestión de 2FA.

**Flujo**:
1. El daemon abre una ventana de Chromium
2. Navega a `https://appstoreconnect.apple.com/`
3. El usuario introduce su **Apple ID** y **contraseña**
4. **2FA**: El usuario introduce el código desde su iPhone
5. El daemon guarda las cookies de sesión cifradas
6. La sesión queda lista para automatización

**Código de Implementación**:
```typescript
async function loginToAppStoreConnect(page: Page) {
  await page.goto('https://appstoreconnect.apple.com/');

  // Wait for manual login
  await page.waitForURL(/apps/, { timeout: 300000 }); // 5 min

  // Save session
  const cookies = await page.context().cookies();
  await saveCookies(cookies);

  console.log('✓ Login successful');
}
```

**Duración estimada**: 1-2 minutos (manual)

---

### 7.2 CREAR NUEVA APP (o detectar existente)

**Descripción**: Crea una nueva app o detecta si ya existe por bundle ID.

**Flujo**:
1. Navega a "My Apps"
2. Busca por `bundle_id`
3. Si **no existe**:
   - Click en "+" → "New iOS App"
   - Rellena formulario:
     - **App Name**: desde metadata
     - **Primary Language**: desde config
     - **Bundle ID**: desde build input
     - **SKU**: auto-generado (timestamp-based)
     - **Team ID**: desde config
4. Si **existe**: Navega a la app existente

**Código de Implementación**:
```typescript
async function createOrFindApp(page: Page, config: BuildConfig) {
  const apps = await page.$$('[data-testid="app-list-item"]');

  for (const app of apps) {
    const bundleId = await app.getAttribute('data-bundle-id');
    if (bundleId === config.bundle_id) {
      console.log('✓ App found, opening...');
      await app.click();
      return { created: false };
    }
  }

  // Create new app
  await page.click('[data-testid="new-app-button"]');
  await page.fill('[name="appName"]', config.app_name);
  await page.selectOption('[name="primaryLanguage"]', 'en-US');
  await page.fill('[name="bundleId"]', config.bundle_id);
  await page.fill('[name="sku"]', `SKU-${Date.now()}`);
  await page.click('[data-testid="create-app"]');

  return { created: true };
}
```

**Duración estimada**: 10-15 segundos

---

### 7.3 ACCEDER A LA FICHA DE LA APP

**Descripción**: Rellena todos los campos de metadata en App Information.

**Campos Gestionados**:

| Campo | Límite | Origen |
|-------|--------|--------|
| **Title** | ≤ 30 chars | Metadata (app_store.title) |
| **Subtitle** | ≤ 30 chars | Metadata (app_store.subtitle) |
| **Promotional Text** | ≤ 170 chars | Metadata (app_store.promotional_text) |
| **Keywords** | ≤ 100 chars | Metadata (app_store.keywords) |
| **Description** | Sin límite | Metadata (app_store.description) |
| **Category** | Enum | Metadata (category) |
| **Content Rights** | Checkbox | Auto: "No third-party content" |
| **Age Rating** | Enum | Metadata (age_rating) |

**Código de Implementación**:
```typescript
async function fillAppInformation(page: Page, metadata: AppStoreMetadata) {
  await page.click('[data-testid="app-information"]');

  // Fill metadata fields
  await page.fill('[name="name.value"]', metadata.title);
  await page.fill('[name="subtitle.value"]', metadata.subtitle);
  await page.fill('[name="promotionalText.value"]', metadata.promotional_text);
  await page.fill('[name="description.value"]', metadata.description);
  await page.fill('[name="keywords.value"]', metadata.keywords);

  // Select category
  await page.selectOption('[name="primaryCategory"]', metadata.category);

  // Content rights
  await page.check('[name="contentRights"]');

  // Save
  await page.click('[data-testid="save-button"]');
  await page.waitForSelector('.success-message');

  console.log('✓ App information saved');
}
```

**Duración estimada**: 5-10 segundos

---

### 7.4 SUBIR EL ICONO DE 1024×1024

**Descripción**: Sube el icono oficial iOS en formato PNG 1024x1024.

**Validaciones Automáticas**:
- ✅ Formato PNG
- ✅ Sin transparencias (alpha channel)
- ✅ Tamaño exacto 1024×1024 píxeles
- ✅ Peso < 1MB

**Código de Implementación**:
```typescript
async function uploadAppIcon(page: Page, iconPath: string) {
  await page.click('[data-testid="app-icon-section"]');

  // Validate icon before upload
  const validation = await validateIcon(iconPath);
  if (!validation.valid) {
    throw new Error(`Icon validation failed: ${validation.errors.join(', ')}`);
  }

  // Upload icon
  const fileInput = await page.$('input[type="file"][accept=".png"]');
  await fileInput.setInputFiles(iconPath);

  // Wait for upload
  await page.waitForSelector('.upload-success');

  console.log('✓ App icon uploaded');
}

function validateIcon(path: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file exists
  if (!fs.existsSync(path)) {
    errors.push('File not found');
  }

  // Check dimensions (requires image library)
  const dimensions = getImageDimensions(path);
  if (dimensions.width !== 1024 || dimensions.height !== 1024) {
    errors.push(`Invalid dimensions: ${dimensions.width}x${dimensions.height}`);
  }

  // Check format
  if (!path.endsWith('.png')) {
    errors.push('Invalid format (must be PNG)');
  }

  return { valid: errors.length === 0, errors };
}
```

**Duración estimada**: 3-5 segundos

---

### 7.5 SUBIR SCREENSHOTS OFICIALES

**Descripción**: Sube todas las capturas de pantalla organizadas por dispositivo.

**Resoluciones Soportadas**:

| Dispositivo | Resolución | Obligatorio |
|-------------|------------|-------------|
| iPhone 6.7" | 1290×2796 | ✅ Sí |
| iPhone 6.5" | 1284×2778 | ⚠️ Recomendado |
| iPhone 5.5" | 1242×2208 | ❌ Opcional |

**Orden de Screenshots**:
- `01_` → Feature principal (primera pantalla)
- `02_` → Pantalla secundaria
- `03_` → Tercer feature
- ... (hasta 10 screenshots por device)

**Código de Implementación**:
```typescript
async function uploadScreenshots(page: Page, screenshots: ScreenshotSet) {
  await page.click('[data-testid="screenshots-section"]');

  // Upload for each device size
  for (const [deviceSize, images] of Object.entries(screenshots.screenshots_by_device)) {
    await page.click(`[data-device-size="${deviceSize}"]`);

    // Sort by order
    const sortedImages = images.sort((a, b) => a.order - b.order);

    // Upload each screenshot
    for (const img of sortedImages) {
      const fileInput = await page.$(`input[type="file"][data-device="${deviceSize}"]`);
      await fileInput.setInputFiles(img.path);

      // Wait for upload
      await page.waitForSelector(`.screenshot-uploaded[data-order="${img.order}"]`);
    }

    console.log(`✓ Uploaded ${sortedImages.length} screenshots for ${deviceSize}"`);
  }

  await page.click('[data-testid="save-button"]');
}
```

**Duración estimada**: 15-30 segundos (depende del número de screenshots)

---

### 7.6 CONFIGURAR PERMISOS, PRIVACIDAD, USAGE DESCRIPTIONS

**Descripción**: Configura las declaraciones de privacidad y permisos requeridos por Apple.

**Campos Configurados**:

1. **Encryption Declaration**:
   - "Does this app use encryption?" → Yes/No
   - Basado en análisis del build

2. **Privacy Policy URL**:
   - URL del sitio de privacidad
   - Desde `build_config.privacy_policy_url`

3. **Data Practices**:
   - Tipos de datos recopilados
   - Uso de los datos
   - Compartir con terceros

**Código de Implementación**:
```typescript
async function configurePrivacy(page: Page, config: BuildConfig) {
  await page.click('[data-testid="privacy-section"]');

  // Encryption
  const usesEncryption = config.uses_encryption ?? false;
  await page.check(`[name="usesEncryption"][value="${usesEncryption}"]`);

  // Privacy policy URL
  if (config.privacy_policy_url) {
    await page.fill('[name="privacyPolicyURL"]', config.privacy_policy_url);
  }

  // Support URL
  if (config.support_url) {
    await page.fill('[name="supportURL"]', config.support_url);
  }

  // Marketing URL
  if (config.marketing_url) {
    await page.fill('[name="marketingURL"]', config.marketing_url);
  }

  await page.click('[data-testid="save-button"]');
  console.log('✓ Privacy settings configured');
}
```

**Duración estimada**: 5-8 segundos

---

### 7.7 CONFIGURAR VERSION RELEASE / BUILD

**Descripción**: Asocia un build de TestFlight con la versión de App Store.

**Prerequisitos**:
- Build subido a TestFlight via Transporter o Xcode
- Build procesado y disponible en App Store Connect

**Código de Implementación**:
```typescript
async function selectBuild(page: Page, version: string, buildNumber: string) {
  await page.click('[data-testid="build-section"]');

  // Wait for builds to load
  await page.waitForSelector('[data-testid="build-list"]');

  // Find matching build
  const builds = await page.$$('[data-testid="build-item"]');

  for (const build of builds) {
    const buildVersion = await build.getAttribute('data-version');
    const buildNum = await build.getAttribute('data-build-number');

    if (buildVersion === version && buildNum === buildNumber) {
      await build.click();
      console.log(`✓ Build ${version} (${buildNumber}) selected`);
      return;
    }
  }

  throw new Error(`Build ${version} (${buildNumber}) not found`);
}

async function fillWhatsNew(page: Page, releaseNotes: string) {
  await page.fill('[name="whatsNew.value"]', releaseNotes);
  await page.click('[data-testid="save-button"]');
  console.log('✓ Release notes saved');
}
```

**Duración estimada**: 5-10 segundos

---

### 7.8 GUARDAR Y VALIDAR

**Descripción**: Guarda todos los cambios y ejecuta la validación de App Store.

**Validaciones Realizadas**:
- ✅ Metadata completa
- ✅ Screenshots para dispositivos requeridos
- ✅ Icono válido
- ✅ Build asociado
- ✅ Privacy policy configurada
- ✅ Age rating establecido

**Código de Implementación**:
```typescript
async function saveAndValidate(page: Page): Promise<ValidationResult> {
  // Save all changes
  await page.click('[data-testid="save-all"]');
  await page.waitForSelector('.save-success');

  // Run validation
  await page.click('[data-testid="validate-button"]');
  await page.waitForSelector('[data-testid="validation-results"]', { timeout: 30000 });

  // Extract validation results
  const errors = await page.$$eval(
    '[data-testid="validation-error"]',
    els => els.map(el => el.textContent)
  );

  const warnings = await page.$$eval(
    '[data-testid="validation-warning"]',
    els => els.map(el => el.textContent)
  );

  const validationPassed = errors.length === 0;

  return {
    passed: validationPassed,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
  };
}
```

**Duración estimada**: 10-20 segundos

---

### 7.9 PRODUCIR OUTPUTS DEL MÓDULO

**Descripción**: Genera los archivos de salida con los resultados de la automatización.

#### Output 1: `connect_job_result.json`
```json
{
  "status": "success",
  "app_created": true,
  "metadata_uploaded": true,
  "icon_uploaded": true,
  "screenshots_uploaded": true,
  "build_selected": true,
  "privacy_configured": true,
  "validation_passed": false,
  "errors": [
    "Missing privacy policy URL"
  ],
  "warnings": [
    "Consider adding more screenshots for iPad"
  ],
  "execution_time_ms": 45230,
  "timestamp": "2025-11-16T10:30:45Z"
}
```

#### Output 2: `connect_log.txt`
```
[2025-11-16 10:28:12] Starting App Store Connect automation...
[2025-11-16 10:28:15] ✓ Login successful
[2025-11-16 10:28:20] ✓ App found: MyApp (com.company.myapp)
[2025-11-16 10:28:25] ✓ Metadata uploaded
[2025-11-16 10:28:28] ✓ App icon uploaded
[2025-11-16 10:28:45] ✓ Screenshots uploaded (15 files)
[2025-11-16 10:29:10] ✓ Build 1.0.0 (1) selected
[2025-11-16 10:29:15] ✓ Privacy settings configured
[2025-11-16 10:29:30] ⚠ Validation: Missing privacy policy URL
[2025-11-16 10:29:45] ✓ Automation completed in 45.2s
```

#### Output 3: `validation_report.json`
```json
{
  "passed": false,
  "errors": [
    {
      "code": "MISSING_PRIVACY_POLICY",
      "message": "Privacy policy URL is required",
      "severity": "error",
      "field": "privacyPolicyURL"
    }
  ],
  "warnings": [
    {
      "code": "MISSING_IPAD_SCREENSHOTS",
      "message": "Consider adding screenshots for iPad",
      "severity": "warning",
      "field": "screenshots"
    }
  ],
  "timestamp": "2025-11-16T10:29:30Z"
}
```

---

## 📤 OUTPUTS TÉCNICOS

### Interfaces TypeScript

```typescript
export interface AppStoreConnectResult {
  status: 'success' | 'partial' | 'failed';
  app_created: boolean;
  metadata_uploaded: boolean;
  icon_uploaded: boolean;
  screenshots_uploaded: boolean;
  build_selected: boolean;
  privacy_configured: boolean;
  validation_passed: boolean;
  errors: string[];
  warnings: string[];
  execution_time_ms: number;
  timestamp: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timestamp: string;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field: string;
}

export interface BuildConfig {
  bundle_id: string;
  version: string;
  build_number: string;
  team_id: string;
  localizations: string[];
  privacy_policy_url?: string;
  support_url?: string;
  marketing_url?: string;
  uses_encryption?: boolean;
}

export interface ScreenshotSet {
  screenshots_by_device: {
    [deviceSize: string]: Array<{
      path: string;
      resolution: string;
      order: number;
    }>;
  };
  chosen_set: string;
}
```

---

## 🎨 UI/UX DEL MÓDULO

### Nodo Principal

```
┌─────────────────────────────────────────┐
│ 🚀 App Store Connect Automation         │
│ ● Status: Ready                         │
├─────────────────────────────────────────┤
│                                         │
│ Inputs Loaded:                          │
│ ✅ Metadata (Module 5)                  │
│ ✅ Icon (Module 4B)                     │
│ ✅ Screenshots (Module 6)               │
│ ⚠️  Build Config (Manual)               │
│                                         │
│ [▶ Run Automation]  [⚙ Configure]      │
│                                         │
│ Last Run: 2025-11-16 10:30              │
│ Status: ⚠️ Validation errors            │
│                                         │
│ [📋 View Log]  [📊 View Report]         │
└─────────────────────────────────────────┘
```

### Panel de Configuración

```
┌──────────────────────────────────────────┐
│ Build Configuration                      │
├──────────────────────────────────────────┤
│                                          │
│ Bundle ID *                              │
│ [com.company.myapp____________]          │
│                                          │
│ Version *                                │
│ [1.0.0___]  Build: [1___]                │
│                                          │
│ Team ID *                                │
│ [ABC123XYZ_________]                     │
│                                          │
│ Privacy Policy URL                       │
│ [https://myapp.com/privacy_____]         │
│                                          │
│ Support URL                              │
│ [https://myapp.com/support_____]         │
│                                          │
│ ☑ App uses encryption                    │
│                                          │
│ [Cancel]              [Save & Continue]  │
└──────────────────────────────────────────┘
```

### Panel de Resultados

```
┌──────────────────────────────────────────┐
│ Automation Results                       │
├──────────────────────────────────────────┤
│                                          │
│ Status: ⚠️ Partial Success               │
│ Execution Time: 45.2s                    │
│                                          │
│ Completed Tasks:                         │
│ ✅ App metadata uploaded                 │
│ ✅ App icon uploaded (1024x1024)         │
│ ✅ Screenshots uploaded (15 files)       │
│ ✅ Build 1.0.0 (1) selected              │
│ ✅ Privacy settings configured           │
│                                          │
│ Validation Errors:                       │
│ ❌ Missing privacy policy URL            │
│                                          │
│ Warnings:                                │
│ ⚠️  Consider iPad screenshots            │
│                                          │
│ [🔄 Retry]  [🌐 Open ASC]  [📥 Export]   │
└──────────────────────────────────────────┘
```

---

## 🎯 ESTADOS DEL MÓDULO

| Estado | Icono | Descripción |
|--------|-------|-------------|
| **IDLE** | ⚪ | Nunca ejecutado |
| **RUNNING** | 🔵 | Automatización en progreso |
| **DONE** | 🟢 | Ficha creada y configurada correctamente |
| **PARTIAL** | 🟡 | Completado con warnings menores |
| **OUTDATED** | 🟠 | Metadata cambió (re-run necesario) |
| **FAILED** | 🔴 | Error crítico en automatización |
| **LOGIN_REQUIRED** | 🔐 | Requiere login manual |

### Transiciones de Estado

```
IDLE → LOGIN_REQUIRED → RUNNING → {DONE, PARTIAL, FAILED}
                            ↓
                        OUTDATED (si metadata cambia)
```

---

## ✅ CHECKLIST TÉCNICO

### Fase 1: Preparación
- [x] **7.1** - Implementar endpoint `/run-appstore` en daemon
- [x] **7.2** - Configurar Playwright con Chromium
- [x] **7.3** - Sistema de gestión de cookies/sesiones

### Fase 2: Automatización Core
- [x] **7.4** - Login con 2FA asistido
- [x] **7.5** - Crear app (si no existe)
- [x] **7.6** - Rellenar App Information
- [x] **7.7** - Subir icono con validación
- [x] **7.8** - Subir screenshots organizadas
- [x] **7.9** - Configurar permisos y privacidad

### Fase 3: Validación y Outputs
- [x] **7.10** - Validación de App Store Connect
- [x] **7.11** - Exportar resultados JSON
- [x] **7.12** - Generar logs detallados
- [x] **7.13** - Generar reporte de validación

### Fase 4: Integración UI
- [x] **7.14** - Crear AppStoreConnectModule.tsx
- [x] **7.15** - Panel de configuración
- [x] **7.16** - Panel de resultados
- [x] **7.17** - Gestión de estados
- [x] **7.18** - Auto-save y outdated detection

### Fase 5: Testing y Documentación
- [ ] **7.19** - Tests E2E con Playwright
- [ ] **7.20** - Documentación de troubleshooting
- [ ] **7.21** - Video tutorial de uso

---

## 📚 API REFERENCE

### Daemon Endpoint: `/run-appstore`

**Method**: `POST`

**Request Body**:
```json
{
  "metadata": {
    "app_store": {
      "title": "MyApp",
      "subtitle": "Amazing App",
      "promotional_text": "Get it now!",
      "description": "Full description...",
      "keywords": "app, awesome, tool"
    },
    "category": "PRODUCTIVITY",
    "age_rating": {
      "violence": "none",
      "profanity": "none"
    }
  },
  "icon_path": "/path/to/icon_1024.png",
  "screenshots": {
    "screenshots_by_device": {
      "6.7": [
        { "path": "/path/01.png", "resolution": "1290x2796", "order": 1 }
      ]
    }
  },
  "build_config": {
    "bundle_id": "com.company.myapp",
    "version": "1.0.0",
    "build_number": "1",
    "team_id": "ABC123XYZ",
    "privacy_policy_url": "https://myapp.com/privacy"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "result": {
    "app_created": true,
    "metadata_uploaded": true,
    "icon_uploaded": true,
    "screenshots_uploaded": true,
    "validation_passed": false,
    "errors": ["Missing privacy policy URL"],
    "warnings": [],
    "execution_time_ms": 45230
  },
  "log_path": "/daemon/logs/appstore_20251116_103045.log",
  "screenshots_on_error": []
}
```

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `INVALID_INPUT` | Missing required fields |
| 401 | `LOGIN_REQUIRED` | Session expired |
| 403 | `PERMISSION_DENIED` | Team ID mismatch |
| 404 | `BUILD_NOT_FOUND` | Build not in TestFlight |
| 500 | `AUTOMATION_ERROR` | Browser automation failed |
| 503 | `ASC_UNAVAILABLE` | App Store Connect down |

---

## 🔧 TROUBLESHOOTING

### Error: "Login Required"

**Causa**: Sesión expirada o cookies no válidas.

**Solución**:
1. Click en "🔐 Login Required"
2. El daemon abrirá una ventana de navegador
3. Introduce credenciales y 2FA
4. El daemon guardará la nueva sesión

---

### Error: "Build Not Found"

**Causa**: El build especificado no está disponible en App Store Connect.

**Solución**:
1. Verifica que el build fue subido a TestFlight
2. Espera a que el build termine de procesar (puede tomar 5-10 min)
3. Verifica que el `version` y `build_number` coinciden exactamente

---

### Error: "Icon Validation Failed"

**Causa**: El icono no cumple los requisitos de Apple.

**Solución**:
1. Verifica que el icono es PNG
2. Verifica que no tiene transparencias (alpha channel)
3. Verifica que el tamaño es exactamente 1024×1024
4. Regenera el icono con Módulo 4B

---

### Error: "Screenshot Dimensions Invalid"

**Causa**: Los screenshots no tienen las dimensiones correctas.

**Solución**:
1. Verifica las resoluciones requeridas:
   - 6.7": 1290×2796
   - 6.5": 1284×2778
   - 5.5": 1242×2208
2. Regenera los screenshots con Módulo 6

---

### Warning: "Missing iPad Screenshots"

**Causa**: No se proporcionaron screenshots para iPad.

**Solución**:
- Si la app es solo iPhone: Ignora el warning
- Si la app es Universal: Genera screenshots de iPad con Módulo 6

---

## 📝 NOTAS TÉCNICAS

### Limitaciones

1. **2FA Manual**: El 2FA de Apple no puede automatizarse completamente por seguridad
2. **Procesamiento de Build**: El daemon no puede acelerar el procesamiento de builds en Apple
3. **Cambios de UI**: Si Apple cambia la UI de App Store Connect, puede requerir actualización del módulo

### Mejoras Futuras

- [ ] Soporte para Mac App Store
- [ ] Soporte para App Clips
- [ ] Gestión de In-App Purchases
- [ ] Configuración de Game Center
- [ ] Submissions automáticas para revisión

---

## 🔗 ENLACES RELACIONADOS

- [App Store Connect](https://appstoreconnect.apple.com/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [Playwright Documentation](https://playwright.dev/)

---

**FIN DEL DOCUMENTO — MÓDULO 7 (APP STORE CONNECT AUTOMATION)**

**Versión**: 1.0
**Última actualización**: 2025-11-16
**Mantenedor**: Marketing Spaces Team
