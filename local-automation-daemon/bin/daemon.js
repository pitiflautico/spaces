#!/usr/bin/env node

/**
 * LOCAL AUTOMATION DAEMON v1.0
 *
 * Purpose: Bridge between web interface and macOS native commands
 * Port: 5050 (localhost only)
 *
 * Capabilities:
 * - Control iOS Simulator
 * - Automate mouse/keyboard
 * - Capture screenshots
 * - Resize images
 * - Execute navigation scripts
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

// ============================================================
// LOGGER SETUP
// ============================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/daemon.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================================
// EXPRESS SETUP
// ============================================================

const app = express();
const PORT = process.env.PORT || 5050;
const HOST = 'localhost'; // Security: Only bind to localhost

// Middleware
app.use(cors({
  origin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// DAEMON STATE
// ============================================================

let daemonState = {
  status: 'READY',
  current_simulator: null,
  current_app: null,
  active_scripts: 0,
  screenshots_captured: 0,
  uptime_seconds: 0,
  started_at: new Date().toISOString()
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate path to prevent directory traversal attacks
 */
function validatePath(inputPath) {
  const resolvedPath = path.resolve(inputPath);
  const allowedBasePaths = [
    path.join(__dirname, '../captures'),
    '/Users',
    '/tmp/daemon',
  ];

  const isAllowed = allowedBasePaths.some(basePath =>
    resolvedPath.startsWith(path.resolve(basePath))
  );

  if (!isAllowed) {
    throw new Error(`Path not allowed: ${resolvedPath}`);
  }

  return resolvedPath;
}

/**
 * Execute command safely with timeout
 */
function executeCommand(command, options = {}) {
  const timeout = options.timeout || 30000; // 30 seconds default

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      ...options
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    logger.error(`Command failed: ${command}`, { error: error.message });
    return { success: false, error: error.message, stderr: error.stderr };
  }
}

/**
 * Async wait helper
 */
function wait(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ============================================================
// ENDPOINTS
// ============================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0',
    uptime: daemonState.uptime_seconds,
    current_state: daemonState.status,
    started_at: daemonState.started_at,
    screenshots_captured: daemonState.screenshots_captured,
    active_scripts: daemonState.active_scripts
  });
});

/**
 * GET /list-simulators
 * List all available iOS simulators
 */
app.get('/list-simulators', (req, res) => {
  try {
    const result = executeCommand('xcrun simctl list devices available --json');

    if (!result.success) {
      throw new Error(result.error);
    }

    const data = JSON.parse(result.output);
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

    logger.info(`Found ${simulators.length} available simulators`);
    res.json({ simulators });

  } catch (error) {
    logger.error('Failed to list simulators:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /boot-simulator
 * Boot a specific simulator
 */
app.post('/boot-simulator', async (req, res) => {
  const { device } = req.body;

  if (!device) {
    return res.status(400).json({ error: 'Device name required' });
  }

  try {
    logger.info(`Booting simulator: ${device}`);
    daemonState.status = 'BOOTING_SIMULATOR';

    const startTime = Date.now();

    // Check if already booted
    const listResult = executeCommand(`xcrun simctl list devices | grep "${device}"`);
    if (listResult.output.includes('(Booted)')) {
      logger.info(`Simulator ${device} already booted`);
      daemonState.status = 'READY';
      return res.json({ status: 'already_booted', device });
    }

    // Boot simulator
    const bootResult = executeCommand(`xcrun simctl boot "${device}"`, { timeout: 60000 });

    if (!bootResult.success && !bootResult.stderr?.includes('Unable to boot device in current state: Booted')) {
      throw new Error(bootResult.error || 'Failed to boot simulator');
    }

    // Open Simulator.app
    executeCommand('open -a Simulator');

    // Wait for boot to complete
    executeCommand(`xcrun simctl bootstatus "${device}" -b`, { timeout: 120000 });

    const bootTime = Date.now() - startTime;

    daemonState.status = 'READY';
    daemonState.current_simulator = { name: device };

    logger.info(`Simulator booted successfully in ${bootTime}ms`);
    res.json({
      status: 'success',
      device,
      boot_time_ms: bootTime
    });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to boot simulator:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /install-app
 * Install an app on the booted simulator
 */
app.post('/install-app', (req, res) => {
  const { app_path } = req.body;

  if (!app_path) {
    return res.status(400).json({ error: 'app_path required' });
  }

  try {
    logger.info(`Installing app: ${app_path}`);
    daemonState.status = 'INSTALLING_APP';

    // Validate path
    const validatedPath = validatePath(app_path);

    // Check if .app exists
    if (!fs.existsSync(validatedPath)) {
      throw new Error(`App not found: ${validatedPath}`);
    }

    // Install app
    const installResult = executeCommand(`xcrun simctl install booted "${validatedPath}"`);

    if (!installResult.success) {
      throw new Error(installResult.error || 'Failed to install app');
    }

    // Get bundle ID
    const plistPath = path.join(validatedPath, 'Info.plist');
    const bundleIdResult = executeCommand(
      `/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "${plistPath}"`
    );

    const bundleId = bundleIdResult.success ? bundleIdResult.output : 'unknown';

    daemonState.status = 'READY';
    daemonState.current_app = { bundle_id: bundleId };

    logger.info(`App installed successfully: ${bundleId}`);
    res.json({
      status: 'installed',
      app_path: validatedPath,
      bundle_id: bundleId
    });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to install app:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /launch-app
 * Launch an installed app
 */
app.post('/launch-app', (req, res) => {
  const { bundle_id } = req.body;

  if (!bundle_id) {
    return res.status(400).json({ error: 'bundle_id required' });
  }

  try {
    logger.info(`Launching app: ${bundle_id}`);
    daemonState.status = 'LAUNCHING_APP';

    const launchResult = executeCommand(`xcrun simctl launch booted ${bundle_id}`);

    if (!launchResult.success) {
      throw new Error(launchResult.error || 'Failed to launch app');
    }

    // Extract PID from output
    const pidMatch = launchResult.output.match(/(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1]) : null;

    daemonState.status = 'READY';
    daemonState.current_app = { bundle_id, pid };

    logger.info(`App launched successfully: ${bundle_id} (PID: ${pid})`);
    res.json({
      status: 'launched',
      bundle_id,
      pid
    });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to launch app:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /tap
 * Simulate a tap at coordinates
 */
app.post('/tap', (req, res) => {
  const { x, y } = req.body;

  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: 'x and y coordinates required' });
  }

  try {
    const result = executeCommand(`cliclick c:${x},${y}`);

    if (!result.success) {
      throw new Error(result.error || 'Failed to tap');
    }

    logger.info(`Tap at (${x}, ${y})`);
    res.json({
      status: 'success',
      action: 'tap',
      coordinates: { x, y }
    });

  } catch (error) {
    logger.error('Failed to tap:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /move
 * Move cursor to coordinates
 */
app.post('/move', (req, res) => {
  const { x, y } = req.body;

  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: 'x and y coordinates required' });
  }

  try {
    const result = executeCommand(`cliclick m:${x},${y}`);

    if (!result.success) {
      throw new Error(result.error || 'Failed to move cursor');
    }

    logger.info(`Move cursor to (${x}, ${y})`);
    res.json({
      status: 'success',
      action: 'move',
      coordinates: { x, y }
    });

  } catch (error) {
    logger.error('Failed to move cursor:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /scroll
 * Simulate scroll gesture
 */
app.post('/scroll', (req, res) => {
  const { direction, amount } = req.body;

  try {
    // Using AppleScript for scrolling
    const keyCode = direction === 'down' ? '125' : '126'; // Down arrow : Up arrow
    const script = `
      tell application "Simulator" to activate
      tell application "System Events"
        key code ${keyCode}
      end tell
    `;

    const result = executeCommand(`osascript -e '${script}'`);

    if (!result.success) {
      throw new Error(result.error || 'Failed to scroll');
    }

    logger.info(`Scroll ${direction} (amount: ${amount || 'default'})`);
    res.json({
      status: 'success',
      action: 'scroll',
      direction,
      amount: amount || 'default'
    });

  } catch (error) {
    logger.error('Failed to scroll:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /screenshot
 * Capture screenshot from simulator
 */
app.post('/screenshot', (req, res) => {
  const { output, variant_id } = req.body;

  if (!output) {
    return res.status(400).json({ error: 'output filename required' });
  }

  try {
    const capturesDir = path.join(__dirname, '../captures', `variant_${variant_id || 1}`);
    ensureDir(capturesDir);

    const screenshotPath = path.join(capturesDir, output);
    const result = executeCommand(`xcrun simctl io booted screenshot "${screenshotPath}"`);

    if (!result.success) {
      throw new Error(result.error || 'Failed to capture screenshot');
    }

    daemonState.screenshots_captured++;

    logger.info(`Screenshot captured: ${screenshotPath}`);
    res.json({
      status: 'success',
      screenshot_path: screenshotPath,
      format: 'png'
    });

  } catch (error) {
    logger.error('Failed to capture screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /run-script
 * Execute a complete navigation script
 */
app.post('/run-script', async (req, res) => {
  const { navigation_script, variant_id, app_bundle_id } = req.body;

  if (!navigation_script || !Array.isArray(navigation_script)) {
    return res.status(400).json({ error: 'navigation_script array required' });
  }

  try {
    logger.info(`Running navigation script - variant: ${variant_id}, steps: ${navigation_script.length}`);
    daemonState.status = 'RUNNING_SCRIPT';
    daemonState.active_scripts++;

    const startTime = Date.now();
    const screenshots = [];

    for (let i = 0; i < navigation_script.length; i++) {
      const step = navigation_script[i];
      logger.info(`Step ${i + 1}/${navigation_script.length}: ${step.action}`);

      try {
        switch (step.action) {
          case 'wait':
            await wait(step.seconds || 1);
            break;

          case 'tap':
            if (step.x !== undefined && step.y !== undefined) {
              executeCommand(`cliclick c:${step.x},${step.y}`);
            }
            break;

          case 'move':
            if (step.x !== undefined && step.y !== undefined) {
              executeCommand(`cliclick m:${step.x},${step.y}`);
            }
            break;

          case 'scroll':
            const keyCode = step.direction === 'down' ? '125' : '126';
            const scrollScript = `tell application "Simulator" to activate\ntell application "System Events" to key code ${keyCode}`;
            executeCommand(`osascript -e '${scrollScript}'`);
            break;

          case 'screenshot':
            if (step.name) {
              const capturesDir = path.join(__dirname, '../captures', `variant_${variant_id || 1}`);
              ensureDir(capturesDir);
              const screenshotPath = path.join(capturesDir, step.name);
              const result = executeCommand(`xcrun simctl io booted screenshot "${screenshotPath}"`);
              if (result.success) {
                screenshots.push(screenshotPath);
                daemonState.screenshots_captured++;
              }
            }
            break;

          default:
            logger.warn(`Unknown action: ${step.action}`);
        }

      } catch (stepError) {
        logger.error(`Step ${i + 1} failed:`, stepError);
        // Continue with next step
      }
    }

    const executionTime = Date.now() - startTime;

    daemonState.status = 'READY';
    daemonState.active_scripts--;

    logger.info(`Script completed - ${screenshots.length} screenshots captured in ${executionTime}ms`);
    res.json({
      status: 'completed',
      variant_id: variant_id || 1,
      screenshots,
      execution_time_ms: executionTime,
      steps_executed: navigation_script.length
    });

  } catch (error) {
    daemonState.status = 'ERROR';
    daemonState.active_scripts--;
    logger.error('Failed to run script:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /resize-images
 * Resize images to App Store/Google Play sizes
 */
app.post('/resize-images', (req, res) => {
  const { input_folder, targets, output_folder } = req.body;

  if (!input_folder || !targets) {
    return res.status(400).json({ error: 'input_folder and targets required' });
  }

  try {
    logger.info(`Resizing images from ${input_folder}`);
    daemonState.status = 'EXPORTING';

    const validatedInput = validatePath(input_folder);
    const outputDir = output_folder ? validatePath(output_folder) : path.join(validatedInput, 'resized');

    ensureDir(outputDir);

    // Get all PNG files in input folder
    const files = fs.readdirSync(validatedInput).filter(f => f.endsWith('.png'));

    const outputs = [];

    files.forEach(file => {
      const inputPath = path.join(validatedInput, file);
      const resized = [];

      targets.forEach(target => {
        const [width, height] = target.size.split('x').map(Number);
        const outputFile = `${path.basename(file, '.png')}_${target.device}.png`;
        const outputPath = path.join(outputDir, outputFile);

        const result = executeCommand(`sips -z ${height} ${width} "${inputPath}" --out "${outputPath}"`);

        if (result.success) {
          resized.push(outputPath);
          logger.info(`Resized ${file} to ${target.size} (${target.device})`);
        }
      });

      outputs.push({
        original: file,
        resized
      });
    });

    daemonState.status = 'READY';

    logger.info(`Resized ${files.length} images to ${targets.length} sizes`);
    res.json({
      status: 'success',
      images_processed: files.length,
      outputs
    });

  } catch (error) {
    daemonState.status = 'ERROR';
    logger.error('Failed to resize images:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /kill-app
 * Terminate app in simulator
 */
app.post('/kill-app', (req, res) => {
  const { bundle_id } = req.body;

  if (!bundle_id) {
    return res.status(400).json({ error: 'bundle_id required' });
  }

  try {
    const result = executeCommand(`xcrun simctl terminate booted ${bundle_id}`);

    if (!result.success) {
      throw new Error(result.error || 'Failed to kill app');
    }

    logger.info(`App terminated: ${bundle_id}`);
    res.json({
      status: 'success',
      action: 'terminated',
      bundle_id
    });

  } catch (error) {
    logger.error('Failed to kill app:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /shutdown-simulator
 * Shutdown the booted simulator
 */
app.post('/shutdown-simulator', (req, res) => {
  try {
    const result = executeCommand('xcrun simctl shutdown booted');

    if (!result.success && !result.stderr?.includes('Unable to shutdown device in current state: Shutdown')) {
      throw new Error(result.error || 'Failed to shutdown simulator');
    }

    daemonState.current_simulator = null;
    daemonState.current_app = null;

    logger.info('Simulator shutdown successfully');
    res.json({
      status: 'success',
      action: 'shutdown'
    });

  } catch (error) {
    logger.error('Failed to shutdown simulator:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// MODULE 7: APP STORE CONNECT AUTOMATION
// ============================================================

/**
 * POST /run-appstore
 * Automate App Store Connect setup using Playwright
 *
 * Body:
 * {
 *   metadata: { app_store: {...}, google_play: {...} },
 *   icon_path: string,
 *   screenshots: { screenshots_by_device: {...} },
 *   build_config: { bundle_id, version, build_number, team_id, ... }
 * }
 *
 * NOTE: This is currently a MOCK implementation.
 * Real implementation would use Playwright to automate the browser.
 * See docs/MODULE_7_APPSTORE_CONNECT.md for full implementation details.
 */
app.post('/run-appstore', async (req, res) => {
  try {
    const { metadata, icon_path, screenshots, build_config } = req.body;

    // Validate required fields
    if (!metadata || !build_config) {
      return res.status(400).json({
        error: 'Missing required fields: metadata and build_config are required'
      });
    }

    if (!build_config.bundle_id || !build_config.version || !build_config.build_number || !build_config.team_id) {
      return res.status(400).json({
        error: 'Missing required build_config fields: bundle_id, version, build_number, team_id'
      });
    }

    logger.info(`[App Store Connect] Starting automation for ${build_config.bundle_id}`);
    logger.info(`[App Store Connect] Version: ${build_config.version} (${build_config.build_number})`);

    const startTime = Date.now();
    const logLines = [];

    // Helper function to log
    const log = (message) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      logLines.push(`[${timestamp}] ${message}`);
      logger.info(`[ASC] ${message}`);
    };

    // ========================================
    // MOCK AUTOMATION (Replace with Playwright implementation)
    // ========================================

    log('Starting App Store Connect automation...');

    // Simulate login
    log('✓ Logging in to App Store Connect...');
    await sleep(500);
    log('✓ Login successful (session cached)');

    // Simulate app creation/detection
    log(`Checking if app exists: ${build_config.bundle_id}`);
    await sleep(300);
    const appExists = Math.random() > 0.5; // Random for demo
    if (appExists) {
      log('✓ App found in App Store Connect');
    } else {
      log('Creating new app...');
      await sleep(800);
      log('✓ App created successfully');
    }

    // Simulate metadata upload
    log('Uploading app metadata...');
    await sleep(400);
    log(`  - Title: ${metadata.app_store?.title || 'N/A'}`);
    log(`  - Subtitle: ${metadata.app_store?.subtitle || 'N/A'}`);
    log(`  - Keywords: ${metadata.app_store?.keywords || 'N/A'}`);
    await sleep(200);
    log('✓ Metadata uploaded');

    // Simulate icon upload
    const iconUploaded = !!icon_path;
    if (icon_path) {
      log('Uploading app icon (1024x1024)...');
      await sleep(300);
      log('✓ Icon uploaded successfully');
    } else {
      log('⚠ No icon provided (skipping)');
    }

    // Simulate screenshots upload
    const screenshotsUploaded = !!screenshots && Object.keys(screenshots.screenshots_by_device || {}).length > 0;
    if (screenshotsUploaded) {
      log('Uploading screenshots...');
      const deviceSizes = Object.keys(screenshots.screenshots_by_device);
      for (const size of deviceSizes) {
        const count = screenshots.screenshots_by_device[size].length;
        log(`  - ${size}": ${count} screenshots`);
        await sleep(200);
      }
      log('✓ Screenshots uploaded');
    } else {
      log('⚠ No screenshots provided (skipping)');
    }

    // Simulate build selection
    log(`Looking for build ${build_config.version} (${build_config.build_number})...`);
    await sleep(400);
    const buildFound = Math.random() > 0.3; // 70% chance for demo
    if (buildFound) {
      log(`✓ Build ${build_config.version} (${build_config.build_number}) found and selected`);
    } else {
      log(`⚠ Build ${build_config.version} (${build_config.build_number}) not found in TestFlight`);
    }

    // Simulate privacy configuration
    log('Configuring privacy settings...');
    await sleep(300);
    if (build_config.privacy_policy_url) {
      log(`  - Privacy Policy URL: ${build_config.privacy_policy_url}`);
    }
    log('✓ Privacy settings configured');

    // Simulate validation
    log('Running App Store Connect validation...');
    await sleep(600);

    const validationErrors = [];
    const validationWarnings = [];

    // Check for common issues
    if (!build_config.privacy_policy_url) {
      validationErrors.push('Missing privacy policy URL');
    }

    if (!screenshotsUploaded) {
      validationWarnings.push('Consider adding screenshots for better visibility');
    }

    if (!buildFound) {
      validationErrors.push(`Build ${build_config.version} (${build_config.build_number}) not available in TestFlight`);
    }

    const validationPassed = validationErrors.length === 0;

    if (validationPassed) {
      log('✓ Validation passed!');
    } else {
      log('⚠ Validation completed with errors:');
      validationErrors.forEach(err => log(`  - ${err}`));
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    log(`Automation completed in ${(executionTime / 1000).toFixed(1)}s`);

    // ========================================
    // BUILD RESPONSE
    // ========================================

    const result = {
      status: validationPassed ? 'success' : (validationErrors.length > 0 ? 'partial' : 'failed'),
      app_created: !appExists,
      metadata_uploaded: true,
      icon_uploaded: iconUploaded,
      screenshots_uploaded: screenshotsUploaded,
      build_selected: buildFound,
      privacy_configured: true,
      validation_passed: validationPassed,
      errors: validationErrors,
      warnings: validationWarnings,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
    };

    const validation = {
      passed: validationPassed,
      errors: validationErrors.map(msg => ({
        code: 'VALIDATION_ERROR',
        message: msg,
        severity: 'error',
        field: 'unknown'
      })),
      warnings: validationWarnings.map(msg => ({
        code: 'VALIDATION_WARNING',
        message: msg,
        severity: 'warning',
        field: 'unknown'
      })),
      timestamp: new Date().toISOString(),
    };

    logger.info(`[App Store Connect] Automation completed: ${result.status}`);

    res.json({
      status: 'success',
      result,
      validation,
      log: logLines.join('\n'),
      message: 'App Store Connect automation completed (MOCK MODE - Replace with Playwright for production)',
    });

  } catch (error) {
    logger.error('[App Store Connect] Error:', error.message);
    res.status(500).json({
      error: error.message,
      details: 'App Store Connect automation failed'
    });
  }
});

// Helper function: sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, HOST, () => {
  logger.info(`Local Automation Daemon v1.0 started`);
  logger.info(`Listening on http://${HOST}:${PORT}`);
  logger.info(`Web origin: ${process.env.WEB_ORIGIN || 'http://localhost:3000'}`);
  logger.info(`Logs: logs/daemon.log`);

  console.log('\n🤖 LOCAL AUTOMATION DAEMON v1.0');
  console.log(`📡 Server: http://${HOST}:${PORT}`);
  console.log(`📊 Logs: logs/daemon.log`);
  console.log(`🔒 Security: Localhost only`);
  console.log('\n✅ Daemon ready. Waiting for requests...\n');

  // Uptime counter
  setInterval(() => {
    daemonState.uptime_seconds++;
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
