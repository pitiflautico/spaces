# 🤖 LOCAL AUTOMATION DAEMON

**Versión**: 1.0
**Última actualización**: 2025-11-15
**Estado**: 📋 Planificado - Implementación pendiente

---

## 🎯 PROPÓSITO

Motor local de automatización que permite ejecutar comandos nativos de macOS, controlar el Simulador de iOS, automatizar navegación, capturar screenshots y exportar imágenes en formatos oficiales de App Store/Google Play.

Este daemon actúa como **PUENTE** entre la interfaz web (que corre en el navegador) y el sistema operativo local (macOS), superando las limitaciones de seguridad del navegador.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌──────────────────────────────────────────┐
│  INTERFAZ WEB (Browser)                  │
│  Marketing Spaces - Módulo 6+            │
│  http://localhost:3000                   │
└──────────────┬───────────────────────────┘
               │ REST API (POST/GET)
               ▼
┌──────────────────────────────────────────┐
│  LOCAL AUTOMATION DAEMON                 │
│  http://localhost:5050                   │
│  Node.js / Python / Go                   │
└──────────────┬───────────────────────────┘
               │ Child Process / Exec
               ▼
┌──────────────────────────────────────────┐
│  macOS Native Commands                   │
│  - xcrun simctl                          │
│  - open -a Simulator                     │
│  - cliclick (mouse automation)           │
│  - screencapture / simctl screenshot     │
│  - sips (image resize)                   │
│  - osascript (AppleScript)               │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  iOS SIMULATOR + App Instalada          │
│  - Boot device                           │
│  - Install .app                          │
│  - Launch app                            │
│  - Navigate & Screenshot                 │
└──────────────────────────────────────────┘
```

---

## 📦 ESTRUCTURA DE ARCHIVOS

```
/local-automation-daemon
├── package.json / requirements.txt
├── README.md
├── .env.example
│
├── /bin
│   └── daemon.js                    # Servidor principal (Node.js)
│   └── daemon.py                    # Alternativa Python
│
├── /config
│   ├── devices.json                 # Simuladores disponibles
│   └── settings.json                # Configuración del daemon
│
├── /scripts
│   ├── /navigation                  # Scripts de navegación automática
│   │   ├── onboarding.json
│   │   └── screenshot-flow.json
│   └── /helpers
│       ├── screenshot.js
│       ├── resize.js
│       └── click.js
│
├── /captures                        # Screenshots capturados
│   ├── /variant_1
│   ├── /variant_2
│   └── /variant_3
│
├── /logs
│   └── daemon.log                   # Logs persistentes
│
└── /test
    └── test-endpoints.sh            # Tests de endpoints
```

---

## ⚙️ REQUISITOS DEL SISTEMA

### Requisitos Mínimos

- **macOS**: 13.0+ (Ventura or newer)
- **Xcode**: 14.0+ (con Command Line Tools instalados)
- **iOS Simulators**: Configurados y listos
- **Node.js**: 18+ (si se usa implementación Node)
- **Python**: 3.9+ (si se usa implementación Python)

### Herramientas Requeridas

```bash
# Verificar Xcode Command Line Tools
xcode-select --install

# Verificar simuladores disponibles
xcrun simctl list devices available

# Instalar cliclick (mouse automation)
brew install cliclick

# Instalar sips (viene con macOS)
which sips  # /usr/bin/sips
```

---

## 🚀 INSTALACIÓN Y USO

### Instalación (Node.js)

```bash
cd local-automation-daemon
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tus rutas

# Iniciar daemon
npm start
# o
node bin/daemon.js
```

### Instalación (Python)

```bash
cd local-automation-daemon
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Iniciar daemon
python bin/daemon.py
```

### Verificar que funciona

```bash
# Test endpoint
curl http://localhost:5050/health

# Output esperado:
# {"status":"ok","version":"1.0"}
```

---

## 📡 ENDPOINTS DEL DAEMON

Base URL: `http://localhost:5050`

### 1. GET `/health`

**Descripción**: Health check del daemon

**Response**:
```json
{
  "status": "ok",
  "version": "1.0",
  "uptime": 3600,
  "simulators_available": 5
}
```

---

### 2. GET `/list-simulators`

**Descripción**: Lista todos los simuladores iOS disponibles

**Response**:
```json
{
  "simulators": [
    {
      "name": "iPhone 15 Pro",
      "udid": "A1B2C3...",
      "state": "Shutdown",
      "os": "iOS 17.0"
    },
    {
      "name": "iPhone 14",
      "udid": "D4E5F6...",
      "state": "Booted",
      "os": "iOS 17.0"
    }
  ]
}
```

**Comando ejecutado**:
```bash
xcrun simctl list devices available --json
```

---

### 3. POST `/boot-simulator`

**Descripción**: Bootea un simulador específico y abre Simulator.app

**Body**:
```json
{
  "device": "iPhone 15 Pro"
}
```

**Response**:
```json
{
  "status": "success",
  "device": "iPhone 15 Pro",
  "udid": "A1B2C3...",
  "state": "Booted",
  "boot_time_ms": 4500
}
```

**Comandos ejecutados**:
```bash
# 1. Boot simulator
xcrun simctl boot "iPhone 15 Pro"

# 2. Open Simulator.app
open -a Simulator

# 3. Wait until fully booted
xcrun simctl bootstatus "iPhone 15 Pro" -b
```

---

### 4. POST `/install-app`

**Descripción**: Instala un .app en el simulador booteado

**Body**:
```json
{
  "app_path": "/Users/user/DerivedData/Build/Products/Debug-iphonesimulator/MyApp.app"
}
```

**Response**:
```json
{
  "status": "installed",
  "app_path": "/Users/user/.../MyApp.app",
  "bundle_id": "com.company.myapp"
}
```

**Comandos ejecutados**:
```bash
# Install app
xcrun simctl install booted "/path/to/MyApp.app"

# Get bundle ID
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "/path/to/MyApp.app/Info.plist"
```

---

### 5. POST `/launch-app`

**Descripción**: Lanza la app instalada en el simulador

**Body**:
```json
{
  "bundle_id": "com.company.myapp"
}
```

**Response**:
```json
{
  "status": "launched",
  "bundle_id": "com.company.myapp",
  "pid": 12345
}
```

**Comandos ejecutados**:
```bash
xcrun simctl launch booted com.company.myapp
```

---

### 6. POST `/tap`

**Descripción**: Simula un tap (click) en coordenadas específicas

**Body**:
```json
{
  "x": 510,
  "y": 900
}
```

**Response**:
```json
{
  "status": "success",
  "action": "tap",
  "coordinates": {"x": 510, "y": 900}
}
```

**Comandos ejecutados**:
```bash
cliclick c:510,900
```

---

### 7. POST `/move`

**Descripción**: Mueve el cursor a coordenadas específicas

**Body**:
```json
{
  "x": 300,
  "y": 500
}
```

**Response**:
```json
{
  "status": "success",
  "action": "move",
  "coordinates": {"x": 300, "y": 500}
}
```

**Comandos ejecutados**:
```bash
cliclick m:300,500
```

---

### 8. POST `/scroll`

**Descripción**: Simula scroll en el simulador

**Body**:
```json
{
  "direction": "down",
  "amount": 200
}
```

**Response**:
```json
{
  "status": "success",
  "action": "scroll",
  "direction": "down",
  "amount": 200
}
```

**Comandos ejecutados**:
```bash
# Using AppleScript for scroll
osascript -e 'tell application "Simulator" to activate'
osascript -e 'tell application "System Events" to key code 125' # Down arrow
```

---

### 9. POST `/screenshot`

**Descripción**: Captura screenshot del simulador

**Body**:
```json
{
  "output": "screen_01.png",
  "variant_id": 1
}
```

**Response**:
```json
{
  "status": "success",
  "screenshot_path": "/daemon/captures/variant_1/screen_01.png",
  "size": "1290x2796",
  "format": "png"
}
```

**Comandos ejecutados**:
```bash
xcrun simctl io booted screenshot "/daemon/captures/variant_1/screen_01.png"
```

---

### 10. POST `/run-script`

**Descripción**: Ejecuta un script completo de navegación automática

**Body**:
```json
{
  "navigation_script": [
    {"action": "wait", "seconds": 2},
    {"action": "tap", "x": 300, "y": 800},
    {"action": "wait", "seconds": 1},
    {"action": "scroll", "direction": "down", "amount": 200},
    {"action": "screenshot", "name": "shot_01.png"},
    {"action": "tap", "x": 500, "y": 600},
    {"action": "wait", "seconds": 1},
    {"action": "screenshot", "name": "shot_02.png"}
  ],
  "variant_id": 1,
  "app_bundle_id": "com.company.myapp"
}
```

**Response**:
```json
{
  "status": "completed",
  "variant_id": 1,
  "screenshots": [
    "/daemon/captures/variant_1/shot_01.png",
    "/daemon/captures/variant_1/shot_02.png"
  ],
  "execution_time_ms": 8500,
  "steps_executed": 7
}
```

**Flujo interno**:
```
1. Validar que app está instalada
2. Lanzar app si no está corriendo
3. Esperar 2 segundos
4. Para cada paso:
   - Ejecutar acción (tap/scroll/screenshot/wait)
   - Validar resultado
   - Log de progreso
5. Retornar lista de screenshots capturados
```

---

### 11. POST `/resize-images`

**Descripción**: Redimensiona imágenes a tamaños oficiales de App Store/Google Play

**Body**:
```json
{
  "input_folder": "/daemon/captures/variant_1",
  "targets": [
    {"size": "1290x2796", "device": "iPhone_67"},
    {"size": "1242x2688", "device": "iPhone_65"},
    {"size": "1242x2208", "device": "iPhone_55"}
  ],
  "output_folder": "/daemon/captures/variant_1/resized"
}
```

**Response**:
```json
{
  "status": "success",
  "images_processed": 5,
  "outputs": [
    {
      "original": "shot_01.png",
      "resized": [
        "/daemon/captures/variant_1/resized/shot_01_iPhone_67.png",
        "/daemon/captures/variant_1/resized/shot_01_iPhone_65.png",
        "/daemon/captures/variant_1/resized/shot_01_iPhone_55.png"
      ]
    }
  ]
}
```

**Comandos ejecutados**:
```bash
# Para cada imagen y cada tamaño
sips -z 2796 1290 input.png --out output_iPhone_67.png
sips -z 2688 1242 input.png --out output_iPhone_65.png
sips -z 2208 1242 input.png --out output_iPhone_55.png
```

---

### 12. POST `/kill-app`

**Descripción**: Termina la app en el simulador

**Body**:
```json
{
  "bundle_id": "com.company.myapp"
}
```

**Response**:
```json
{
  "status": "success",
  "action": "terminated",
  "bundle_id": "com.company.myapp"
}
```

**Comandos ejecutados**:
```bash
xcrun simctl terminate booted com.company.myapp
```

---

### 13. POST `/shutdown-simulator`

**Descripción**: Apaga el simulador

**Response**:
```json
{
  "status": "success",
  "action": "shutdown"
}
```

**Comandos ejecutados**:
```bash
xcrun simctl shutdown booted
```

---

## 🔐 SEGURIDAD

### Restricciones

1. **Solo localhost**: El daemon SOLO escucha en `localhost:5050`, no accesible desde red externa
2. **CORS restringido**: Solo acepta requests desde `http://localhost:3000` (interfaz web local)
3. **No ejecución arbitraria**: Solo comandos whitelistados (no `eval()` ni command injection)
4. **Paths validados**: Solo acceso a carpetas específicas (`/daemon/captures`, `/Users/user/...`)

### Implementación de Seguridad

```javascript
// Ejemplo: Validación de paths
function validatePath(inputPath) {
  const allowedBasePaths = [
    '/Users/user/Projects',
    '/daemon/captures',
    '/tmp/daemon',
  ];

  const resolvedPath = path.resolve(inputPath);

  const isAllowed = allowedBasePaths.some(basePath =>
    resolvedPath.startsWith(basePath)
  );

  if (!isAllowed) {
    throw new Error('Path not allowed');
  }

  return resolvedPath;
}

// CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## 📊 ESTADOS DEL DAEMON

El daemon mantiene un estado interno:

```typescript
interface DaemonState {
  status: 'READY' | 'BOOTING_SIMULATOR' | 'INSTALLING_APP' |
          'LAUNCHING_APP' | 'RUNNING_SCRIPT' | 'CAPTURING' |
          'EXPORTING' | 'ERROR';

  current_simulator?: {
    name: string;
    udid: string;
    state: string;
  };

  current_app?: {
    bundle_id: string;
    pid?: number;
  };

  active_scripts: number;
  screenshots_captured: number;
  uptime_seconds: number;
}
```

---

## 🧪 TESTING

### Test Manual de Endpoints

```bash
# 1. Health check
curl http://localhost:5050/health

# 2. List simulators
curl http://localhost:5050/list-simulators

# 3. Boot simulator
curl -X POST http://localhost:5050/boot-simulator \
  -H "Content-Type: application/json" \
  -d '{"device": "iPhone 15 Pro"}'

# 4. Install app
curl -X POST http://localhost:5050/install-app \
  -H "Content-Type: application/json" \
  -d '{"app_path": "/Users/user/MyApp.app"}'

# 5. Launch app
curl -X POST http://localhost:5050/launch-app \
  -H "Content-Type: application/json" \
  -d '{"bundle_id": "com.company.myapp"}'

# 6. Take screenshot
curl -X POST http://localhost:5050/screenshot \
  -H "Content-Type: application/json" \
  -d '{"output": "test.png", "variant_id": 1}'
```

### Test Suite Automatizado

```bash
# En /test/test-endpoints.sh
#!/bin/bash

echo "Testing daemon endpoints..."

# Test 1: Health
echo "✓ Testing /health"
curl -s http://localhost:5050/health | jq .

# Test 2: List simulators
echo "✓ Testing /list-simulators"
curl -s http://localhost:5050/list-simulators | jq .

# ... más tests
```

---

## 🔄 INTEGRACIÓN CON MÓDULO 6 (Screenshot Generator)

### Flujo Completo

```
┌─────────────────────────────────────────────┐
│ MÓDULO 6: Screenshot Generator (Browser)   │
│                                             │
│ User clicks "Generate Screenshots"         │
│ ↓                                           │
│ Builds navigation script JSON              │
│ ↓                                           │
│ POST /run-script to daemon                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ LOCAL AUTOMATION DAEMON                     │
│                                             │
│ 1. Boot simulator (if needed)              │
│ 2. Install app (if needed)                 │
│ 3. Launch app                              │
│ 4. Execute navigation script:              │
│    - Tap (300, 800)                        │
│    - Wait 1s                               │
│    - Screenshot → shot_01.png              │
│    - Scroll down                           │
│    - Screenshot → shot_02.png              │
│ 5. Resize screenshots to official sizes    │
│ 6. Return screenshot paths                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ MÓDULO 6: Screenshot Generator (Browser)   │
│                                             │
│ Receives screenshot paths                  │
│ ↓                                           │
│ Fetches images from daemon file server     │
│ ↓                                           │
│ Displays screenshots in variant cards      │
│ ↓                                           │
│ User selects final screenshots             │
└─────────────────────────────────────────────┘
```

### Código de Integración (Módulo 6)

```typescript
// En Screenshot Generator Module

async function generateScreenshots(
  appPath: string,
  bundleId: string,
  navigationScript: any[],
  variantId: number
) {
  try {
    // 1. Boot simulator
    const bootResponse = await fetch('http://localhost:5050/boot-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device: 'iPhone 15 Pro' })
    });

    if (!bootResponse.ok) {
      throw new Error('Failed to boot simulator');
    }

    // 2. Install app
    const installResponse = await fetch('http://localhost:5050/install-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_path: appPath })
    });

    // 3. Run navigation script
    const scriptResponse = await fetch('http://localhost:5050/run-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        navigation_script: navigationScript,
        variant_id: variantId,
        app_bundle_id: bundleId
      })
    });

    const result = await scriptResponse.json();

    // 4. Return screenshots
    return {
      variant_id: variantId,
      screenshots: result.screenshots,
      execution_time: result.execution_time_ms
    };

  } catch (error) {
    console.error('Screenshot generation failed:', error);
    throw error;
  }
}
```

---

## 📝 LOGS

### Log Format

```
[2025-11-15T14:30:00.123Z] [INFO] Daemon started on http://localhost:5050
[2025-11-15T14:30:15.456Z] [INFO] POST /boot-simulator - device: iPhone 15 Pro
[2025-11-15T14:30:19.789Z] [INFO] Simulator booted successfully (udid: A1B2C3...)
[2025-11-15T14:30:22.012Z] [INFO] POST /install-app - path: /Users/user/MyApp.app
[2025-11-15T14:30:25.345Z] [INFO] App installed - bundle_id: com.company.myapp
[2025-11-15T14:30:28.678Z] [INFO] POST /run-script - variant_id: 1, steps: 7
[2025-11-15T14:30:30.901Z] [INFO] Step 1/7: wait - 2s
[2025-11-15T14:30:32.234Z] [INFO] Step 2/7: tap - (300, 800)
[2025-11-15T14:30:33.567Z] [INFO] Step 3/7: screenshot - shot_01.png
[2025-11-15T14:30:34.890Z] [INFO] Screenshot saved: /daemon/captures/variant_1/shot_01.png
[2025-11-15T14:30:36.123Z] [INFO] Script execution completed - 7 steps in 7.4s
[2025-11-15T14:30:36.456Z] [ERROR] Failed to tap (9999, 9999) - coordinates out of bounds
```

### Log Rotation

```javascript
// Winston logger config
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/daemon.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console()
  ]
});
```

---

## 🛠️ IMPLEMENTACIÓN (Node.js)

### package.json

```json
{
  "name": "local-automation-daemon",
  "version": "1.0.0",
  "description": "Local automation daemon for iOS Simulator",
  "main": "bin/daemon.js",
  "scripts": {
    "start": "node bin/daemon.js",
    "dev": "nodemon bin/daemon.js",
    "test": "bash test/test-endpoints.sh"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### bin/daemon.js (Esqueleto)

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/daemon.log' }),
    new winston.transports.Console()
  ]
});

// Express app
const app = express();
const PORT = 5050;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

// State
let daemonState = {
  status: 'READY',
  current_simulator: null,
  current_app: null,
  active_scripts: 0,
  screenshots_captured: 0,
  uptime_seconds: 0
};

// ========================================
// ENDPOINTS
// ========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0',
    uptime: daemonState.uptime_seconds,
    current_state: daemonState.status
  });
});

// List simulators
app.get('/list-simulators', (req, res) => {
  try {
    const output = execSync('xcrun simctl list devices available --json', { encoding: 'utf-8' });
    const data = JSON.parse(output);

    const simulators = [];
    Object.keys(data.devices).forEach(runtime => {
      data.devices[runtime].forEach(device => {
        if (device.isAvailable) {
          simulators.push({
            name: device.name,
            udid: device.udid,
            state: device.state,
            os: runtime.replace('com.apple.CoreSimulator.SimRuntime.', '').replace(/-/g, ' ')
          });
        }
      });
    });

    res.json({ simulators });
  } catch (error) {
    logger.error('Failed to list simulators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Boot simulator
app.post('/boot-simulator', async (req, res) => {
  const { device } = req.body;

  try {
    logger.info(`Booting simulator: ${device}`);
    daemonState.status = 'BOOTING_SIMULATOR';

    // Boot
    execSync(`xcrun simctl boot "${device}"`, { encoding: 'utf-8' });

    // Open Simulator.app
    execSync('open -a Simulator', { encoding: 'utf-8' });

    // Wait for boot
    execSync(`xcrun simctl bootstatus "${device}" -b`, { encoding: 'utf-8' });

    daemonState.status = 'READY';
    daemonState.current_simulator = { name: device };

    logger.info(`Simulator booted: ${device}`);
    res.json({ status: 'success', device });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to boot simulator:', error);
    res.status(500).json({ error: error.message });
  }
});

// Install app
app.post('/install-app', (req, res) => {
  const { app_path } = req.body;

  try {
    logger.info(`Installing app: ${app_path}`);
    daemonState.status = 'INSTALLING_APP';

    execSync(`xcrun simctl install booted "${app_path}"`, { encoding: 'utf-8' });

    // Get bundle ID
    const bundleId = execSync(
      `/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "${app_path}/Info.plist"`,
      { encoding: 'utf-8' }
    ).trim();

    daemonState.status = 'READY';
    daemonState.current_app = { bundle_id: bundleId };

    logger.info(`App installed: ${bundleId}`);
    res.json({ status: 'installed', bundle_id: bundleId });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to install app:', error);
    res.status(500).json({ error: error.message });
  }
});

// Launch app
app.post('/launch-app', (req, res) => {
  const { bundle_id } = req.body;

  try {
    logger.info(`Launching app: ${bundle_id}`);
    daemonState.status = 'LAUNCHING_APP';

    const output = execSync(`xcrun simctl launch booted ${bundle_id}`, { encoding: 'utf-8' });
    const pidMatch = output.match(/(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1]) : null;

    daemonState.status = 'READY';
    daemonState.current_app = { bundle_id, pid };

    logger.info(`App launched: ${bundle_id} (PID: ${pid})`);
    res.json({ status: 'launched', bundle_id, pid });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to launch app:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tap
app.post('/tap', (req, res) => {
  const { x, y } = req.body;

  try {
    execSync(`cliclick c:${x},${y}`, { encoding: 'utf-8' });
    logger.info(`Tap at (${x}, ${y})`);
    res.json({ status: 'success', action: 'tap', coordinates: { x, y } });

  } catch (error) {
    logger.error('Failed to tap:', error);
    res.status(500).json({ error: error.message });
  }
});

// Screenshot
app.post('/screenshot', (req, res) => {
  const { output, variant_id } = req.body;

  try {
    const capturesDir = path.join(__dirname, '../captures', `variant_${variant_id}`);
    fs.mkdirSync(capturesDir, { recursive: true });

    const screenshotPath = path.join(capturesDir, output);
    execSync(`xcrun simctl io booted screenshot "${screenshotPath}"`, { encoding: 'utf-8' });

    daemonState.screenshots_captured++;

    logger.info(`Screenshot captured: ${screenshotPath}`);
    res.json({ status: 'success', screenshot_path: screenshotPath });

  } catch (error) {
    logger.error('Failed to capture screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run script
app.post('/run-script', async (req, res) => {
  const { navigation_script, variant_id, app_bundle_id } = req.body;

  try {
    logger.info(`Running navigation script - variant: ${variant_id}, steps: ${navigation_script.length}`);
    daemonState.status = 'RUNNING_SCRIPT';
    daemonState.active_scripts++;

    const screenshots = [];

    for (let i = 0; i < navigation_script.length; i++) {
      const step = navigation_script[i];
      logger.info(`Step ${i + 1}/${navigation_script.length}: ${step.action}`);

      switch (step.action) {
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.seconds * 1000));
          break;

        case 'tap':
          execSync(`cliclick c:${step.x},${step.y}`);
          break;

        case 'scroll':
          // Implement scroll
          break;

        case 'screenshot':
          const capturesDir = path.join(__dirname, '../captures', `variant_${variant_id}`);
          fs.mkdirSync(capturesDir, { recursive: true });
          const screenshotPath = path.join(capturesDir, step.name);
          execSync(`xcrun simctl io booted screenshot "${screenshotPath}"`);
          screenshots.push(screenshotPath);
          break;
      }
    }

    daemonState.status = 'READY';
    daemonState.active_scripts--;

    logger.info(`Script completed - ${screenshots.length} screenshots captured`);
    res.json({ status: 'completed', variant_id, screenshots });

  } catch (error) {
    daemonState.status = 'ERROR';
    daemonState.active_scripts--;
    logger.error('Failed to run script:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, 'localhost', () => {
  logger.info(`Local Automation Daemon started on http://localhost:${PORT}`);
  console.log(`🤖 Daemon running on http://localhost:${PORT}`);
  console.log(`📊 Logs: logs/daemon.log`);

  // Uptime counter
  setInterval(() => {
    daemonState.uptime_seconds++;
  }, 1000);
});
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup Básico
- [ ] Crear estructura de carpetas
- [ ] Inicializar npm/package.json
- [ ] Instalar dependencias (express, cors, winston)
- [ ] Crear archivo .env.example
- [ ] Escribir README.md básico

### Fase 2: Endpoints Core
- [ ] Implementar `/health`
- [ ] Implementar `/list-simulators`
- [ ] Implementar `/boot-simulator`
- [ ] Implementar `/install-app`
- [ ] Implementar `/launch-app`

### Fase 3: Automatización
- [ ] Implementar `/tap`
- [ ] Implementar `/move`
- [ ] Implementar `/scroll`
- [ ] Implementar `/screenshot`
- [ ] Implementar `/run-script`

### Fase 4: Procesamiento de Imágenes
- [ ] Implementar `/resize-images`
- [ ] Configurar tamaños oficiales App Store
- [ ] Configurar tamaños oficiales Google Play

### Fase 5: Seguridad
- [ ] Implementar validación de paths
- [ ] Configurar CORS restringido
- [ ] Whitelist de comandos
- [ ] Rate limiting (opcional)

### Fase 6: Logging y Monitoreo
- [ ] Configurar Winston logger
- [ ] Log rotation
- [ ] Estado interno del daemon
- [ ] Métricas de uso

### Fase 7: Testing
- [ ] Script de test manual (curl)
- [ ] Test suite automatizado
- [ ] Test de integración con Módulo 6

### Fase 8: Documentación
- [ ] Documentar todos los endpoints
- [ ] Ejemplos de uso
- [ ] Troubleshooting guide
- [ ] Video demo (opcional)

---

## 🚨 TROUBLESHOOTING

### Problema: Simulator no bootea

**Síntomas**: Error "Failed to boot simulator"

**Soluciones**:
```bash
# 1. Verificar simuladores disponibles
xcrun simctl list devices available

# 2. Limpiar simuladores
xcrun simctl erase all

# 3. Restart CoreSimulatorService
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
```

### Problema: cliclick no funciona

**Síntomas**: Error "command not found: cliclick"

**Solución**:
```bash
brew install cliclick
```

### Problema: CORS error en browser

**Síntomas**: Fetch blocked por CORS

**Solución**: Verificar origen en daemon:
```javascript
app.use(cors({ origin: 'http://localhost:3000' }));
```

---

## 📚 REFERENCIAS

- [Xcode Simctl Documentation](https://developer.apple.com/documentation/xcode)
- [cliclick GitHub](https://github.com/BlueM/cliclick)
- [Express.js Documentation](https://expressjs.com/)
- [Winston Logger](https://github.com/winstonjs/winston)

---

**Estado**: ✅ Documentación completa
**Próximo paso**: Implementar Fase 1 (Setup Básico)
**Owner**: Equipo de Automatización Local
**Última revisión**: 2025-11-15
