/**
 * Screenshot Generator Module (Module 6)
 * Automates iOS app screenshot capture using iOS Simulator
 *
 * Inputs:
 *   - in-1: App metadata (bundle ID, app path, navigation flows)
 *
 * Outputs:
 *   - screenshots: Screenshots organized by device size for App Store Connect
 *   - flowContext: Flow context for tracking
 */

import React, { useState } from 'react';
import type { Module } from '@/types';
import { useSpaceStore } from '@/lib/store';

// Output type
interface ScreenshotGeneratorOutputs {
  screenshots?: ScreenshotSet;
  flowContext?: FlowContext;
}

interface ScreenshotSet {
  screenshots_by_device: {
    [deviceSize: string]: string[]; // Device size (e.g., "6.7", "6.5", "5.5") -> array of screenshot paths
  };
  generation_timestamp: string;
  total_screenshots: number;
  devices_used: string[];
}

interface FlowContext {
  previousModules: string[];
  currentModule: string;
  timestamp: string;
}

// Device configurations for App Store Connect
const APP_STORE_DEVICES = [
  {
    id: 'iphone-6.7',
    name: 'iPhone 15 Pro Max',
    simulator: 'iPhone 15 Pro Max',
    size: '6.7',
    resolution: '1290x2796',
    required: true,
  },
  {
    id: 'iphone-6.5',
    name: 'iPhone 14 Plus',
    simulator: 'iPhone 14 Plus',
    size: '6.5',
    resolution: '1284x2778',
    required: true,
  },
  {
    id: 'iphone-5.5',
    name: 'iPhone 8 Plus',
    simulator: 'iPhone 8 Plus',
    size: '5.5',
    resolution: '1242x2208',
    required: false,
  },
  {
    id: 'ipad-12.9',
    name: 'iPad Pro 12.9"',
    simulator: 'iPad Pro (12.9-inch) (6th generation)',
    size: '12.9',
    resolution: '2048x2732',
    required: false,
  },
];

// Screenshot capture points
const DEFAULT_SCREENSHOTS = [
  { id: 'screen-1', name: 'Main Screen', description: 'App main screen or home', delay: 2000 },
  { id: 'screen-2', name: 'Feature 1', description: 'First main feature', delay: 1000 },
  { id: 'screen-3', name: 'Feature 2', description: 'Second main feature', delay: 1000 },
  { id: 'screen-4', name: 'Feature 3', description: 'Third main feature', delay: 1000 },
  { id: 'screen-5', name: 'Settings/Profile', description: 'Settings or profile screen', delay: 1000 },
];

export default function ScreenshotGeneratorModule({ module }: { module: Module }) {
  const { updateModule, addLog } = useSpaceStore();
  const space = useSpaceStore(state => state.spaces.find(s => s.id === state.currentSpaceId));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const outputs = module.outputs as ScreenshotGeneratorOutputs;

  // Module inputs
  const inputs = (module.inputs || {}) as any;
  const selectedDevices = inputs.selectedDevices || ['iphone-6.7', 'iphone-6.5'];
  const numScreenshots = inputs.numScreenshots || 5;
  const appPath = inputs.appPath || '';
  const bundleId = inputs.bundleId || '';
  const navigationScript = inputs.navigationScript || '';

  const handleDeviceToggle = (deviceId: string) => {
    const current = selectedDevices || [];
    const updated = current.includes(deviceId)
      ? current.filter((d: string) => d !== deviceId)
      : [...current, deviceId];

    updateModule(module.id, {
      inputs: {
        ...inputs,
        selectedDevices: updated,
      },
    });
  };

  const handleAppPathChange = (value: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        appPath: value,
      },
    });
  };

  const handleBundleIdChange = (value: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        bundleId: value,
      },
    });
  };

  const handleNavigationScriptChange = (value: string) => {
    updateModule(module.id, {
      inputs: {
        ...inputs,
        navigationScript: value,
      },
    });
  };

  const handleRun = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Initializing screenshot capture...');
      updateModule(module.id, { status: 'running' });

      // Get fresh space data
      const currentSpace = useSpaceStore.getState().spaces.find(
        s => s.id === useSpaceStore.getState().currentSpaceId
      );
      if (!currentSpace) {
        throw new Error('No active space found');
      }

      // Check if we have app metadata connected
      const connections = currentSpace.connections || [];
      const metadataConn = connections.find(
        (conn) => conn.targetModuleId === module.id && conn.targetPortId === 'in-1'
      );

      let appMetadata: any = null;
      let flowContext: FlowContext | undefined;

      if (metadataConn) {
        const metadataModule = currentSpace.modules.find(m => m.id === metadataConn.sourceModuleId);
        if (metadataModule) {
          appMetadata = metadataModule.outputs;
          flowContext = metadataModule.outputs.flowContext;
        }
      }

      // Use connected metadata or manual input
      const finalBundleId = appMetadata?.bundleId || bundleId;
      const finalAppPath = appMetadata?.appPath || appPath;

      if (!finalBundleId) {
        throw new Error('Bundle ID is required. Either connect app metadata or enter it manually.');
      }

      if (!finalAppPath) {
        throw new Error('App path (.app file) is required. Either connect app metadata or enter it manually.');
      }

      if (selectedDevices.length === 0) {
        throw new Error('Please select at least one device for screenshot capture.');
      }

      addLog('info', `Starting screenshot capture for ${selectedDevices.length} devices...`, module.id);

      // Prepare screenshot collection
      const screenshotsByDevice: { [key: string]: string[] } = {};
      const devicesUsed: string[] = [];

      // Process each selected device
      for (const deviceId of selectedDevices) {
        const deviceConfig = APP_STORE_DEVICES.find(d => d.id === deviceId);
        if (!deviceConfig) continue;

        setProgress(`Capturing on ${deviceConfig.name}...`);
        addLog('info', `📱 Device: ${deviceConfig.name} (${deviceConfig.size}")`, module.id);

        try {
          // 1. Boot simulator
          setProgress(`${deviceConfig.name}: Booting simulator...`);
          await callDaemon('/boot-simulator', {
            simulator_name: deviceConfig.simulator,
          });

          await sleep(3000); // Wait for boot

          // 2. Install app
          setProgress(`${deviceConfig.name}: Installing app...`);
          await callDaemon('/install-app', {
            app_path: finalAppPath,
          });

          await sleep(2000);

          // 3. Launch app
          setProgress(`${deviceConfig.name}: Launching app...`);
          await callDaemon('/launch-app', {
            bundle_id: finalBundleId,
          });

          await sleep(3000); // Wait for app to launch

          // 4. Capture screenshots
          const deviceScreenshots: string[] = [];

          for (let i = 0; i < numScreenshots; i++) {
            const screenshotConfig = DEFAULT_SCREENSHOTS[i] || DEFAULT_SCREENSHOTS[0];

            setProgress(`${deviceConfig.name}: Capturing screenshot ${i + 1}/${numScreenshots}...`);

            // Wait for screen to settle
            await sleep(screenshotConfig.delay);

            // Execute navigation script if provided (for screen transitions)
            if (navigationScript && i > 0) {
              try {
                await callDaemon('/run-script', {
                  script: navigationScript,
                  step: i,
                });
                await sleep(1000);
              } catch (navError) {
                addLog('warn', `Navigation script failed for screen ${i + 1}`, module.id);
              }
            }

            // Capture screenshot
            const screenshotResult = await callDaemon('/screenshot', {
              filename: `${deviceConfig.id}-screen-${i + 1}-${Date.now()}.png`,
            });

            if (screenshotResult.path) {
              deviceScreenshots.push(screenshotResult.path);
              addLog('info', `  ✓ Screenshot ${i + 1}: ${screenshotConfig.name}`, module.id);
            }
          }

          // 5. Shutdown simulator
          setProgress(`${deviceConfig.name}: Cleaning up...`);
          await callDaemon('/shutdown-simulator', {});

          // Store screenshots for this device
          screenshotsByDevice[deviceConfig.size] = deviceScreenshots;
          devicesUsed.push(deviceConfig.name);

          addLog('success', `✓ ${deviceConfig.name}: ${deviceScreenshots.length} screenshots captured`, module.id);

        } catch (deviceError: any) {
          addLog('error', `Failed on ${deviceConfig.name}: ${deviceError.message}`, module.id);
          // Continue with next device
        }
      }

      // Build final output
      const totalScreenshots = Object.values(screenshotsByDevice).reduce(
        (sum, screenshots) => sum + screenshots.length,
        0
      );

      const screenshotSet: ScreenshotSet = {
        screenshots_by_device: screenshotsByDevice,
        generation_timestamp: new Date().toISOString(),
        total_screenshots: totalScreenshots,
        devices_used: devicesUsed,
      };

      // Update flow context
      const newFlowContext: FlowContext = {
        previousModules: flowContext?.previousModules || [],
        currentModule: 'screenshot-generator',
        timestamp: new Date().toISOString(),
      };
      newFlowContext.previousModules.push('screenshot-generator');

      // Update module outputs
      updateModule(module.id, {
        outputs: {
          screenshots: screenshotSet,
          flowContext: newFlowContext,
        },
        status: 'success',
      });

      addLog('success', `✓ Screenshot capture complete: ${totalScreenshots} screenshots across ${devicesUsed.length} devices`, module.id);
      setProgress('');
      setIsProcessing(false);

    } catch (err: any) {
      console.error('Screenshot generation error:', err);
      setError(err.message);
      addLog('error', `Screenshot generation failed: ${err.message}`, module.id);
      updateModule(module.id, { status: 'error' });
      setProgress('');
      setIsProcessing(false);
    }
  };

  // Helper: Call daemon endpoint
  const callDaemon = async (endpoint: string, payload: any): Promise<any> => {
    const daemonUrl = 'http://localhost:5050';
    const response = await fetch(`${daemonUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `Daemon request failed: ${endpoint}`);
    }

    return await response.json();
  };

  // Helper: Sleep
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            📸
          </div>
          <div>
            <h3 className="font-semibold text-white">Screenshot Generator</h3>
            <p className="text-xs text-gray-400">iOS Simulator Automation</p>
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isProcessing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          {isProcessing ? 'Capturing...' : 'Generate Screenshots'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* App Configuration */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">App Configuration</h4>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Bundle ID</label>
            <input
              type="text"
              value={bundleId}
              onChange={(e) => handleBundleIdChange(e.target.value)}
              placeholder="com.example.myapp"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">App Path (.app file)</label>
            <input
              type="text"
              value={appPath}
              onChange={(e) => handleAppPathChange(e.target.value)}
              placeholder="/path/to/MyApp.app"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Path to your .app file from Xcode build
            </p>
          </div>
        </div>

        {/* Device Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Target Devices</h4>
          <div className="space-y-2">
            {APP_STORE_DEVICES.map((device) => (
              <label
                key={device.id}
                className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-750"
              >
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device.id)}
                  onChange={() => handleDeviceToggle(device.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{device.name}</span>
                    {device.required && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {device.size}" display - {device.resolution}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Screenshot Configuration */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Screenshot Settings</h4>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Number of Screenshots (max 10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={numScreenshots}
              onChange={(e) =>
                updateModule(module.id, {
                  inputs: { ...inputs, numScreenshots: parseInt(e.target.value) },
                })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Navigation Script (optional)
            </label>
            <textarea
              value={navigationScript}
              onChange={(e) => handleNavigationScriptChange(e.target.value)}
              placeholder="// JavaScript to navigate between screens&#10;// Example:&#10;// await tap(200, 400);&#10;// await scroll('down', 300);"
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Script to navigate between app screens (uses daemon commands)
            </p>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {outputs.screenshots && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Generated Screenshots</h4>
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ {outputs.screenshots.total_screenshots} screenshots captured across{' '}
                {outputs.screenshots.devices_used.length} devices
              </p>
            </div>

            {/* Screenshot breakdown by device */}
            <div className="space-y-2">
              {Object.entries(outputs.screenshots.screenshots_by_device).map(([size, paths]) => (
                <div key={size} className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {size}" Display
                    </span>
                    <span className="text-xs text-gray-400">{paths.length} screenshots</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {paths.map((path, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                        title={path}
                      >
                        Screen {idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-xs text-gray-400">
            💡 Make sure the Local Automation Daemon is running on port 5050
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Run: <code className="text-purple-400">cd local-automation-daemon && npm start</code>
          </p>
        </div>
      </div>
    </div>
  );
}
