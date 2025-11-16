/**
 * App Store Connect Automation
 * Uses Playwright to automate app submission and metadata updates
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * App Store Connect Automation Class
 */
class AppStoreConnectAutomation {
  constructor(logger, credentials) {
    this.logger = logger;
    this.credentials = credentials;
    this.browser = null;
    this.page = null;
    this.logLines = [];
  }

  /**
   * Log message to both logger and internal log array
   */
  log(message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    this.logLines.push(`[${timestamp}] ${message}`);
    this.logger.info(`[ASC] ${message}`);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Launch browser and create page
   */
  async launchBrowser(headless = true) {
    this.log('Launching browser...');

    this.browser = await chromium.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ]
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await context.newPage();

    this.log('✓ Browser launched');
  }

  /**
   * Login to App Store Connect
   */
  async login() {
    this.log('Navigating to App Store Connect...');
    await this.page.goto('https://appstoreconnect.apple.com/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    this.log('Logging in...');

    // Wait for Apple ID login page
    await this.page.waitForSelector('#account_name_text_field', { timeout: 30000 });

    // Enter Apple ID
    await this.page.type('#account_name_text_field', this.credentials.appleId);
    await this.page.click('#sign-in');

    await this.sleep(2000);

    // Enter password
    await this.page.waitForSelector('#password_text_field', { timeout: 30000 });
    await this.page.type('#password_text_field', this.credentials.password);
    await this.page.click('#sign-in');

    this.log('Submitted credentials...');

    // Handle 2FA if needed
    try {
      const twoFactorSelector = await Promise.race([
        this.page.waitForSelector('.auth-code-input', { timeout: 10000 }).then(() => '2fa'),
        this.page.waitForSelector('[data-testid="apps-button"]', { timeout: 10000 }).then(() => 'success'),
        this.sleep(10000).then(() => 'timeout')
      ]);

      if (twoFactorSelector === '2fa') {
        this.log('⚠ Two-factor authentication required');
        this.log('Please enter the 6-digit code in the browser window...');

        // Wait for 2FA to be completed (up to 2 minutes)
        await this.page.waitForSelector('[data-testid="apps-button"]', { timeout: 120000 });
        this.log('✓ Two-factor authentication completed');
      }
    } catch (error) {
      this.log('Checking login status...');
    }

    // Verify we're logged in
    await this.page.waitForSelector('[data-testid="apps-button"]', { timeout: 30000 });
    this.log('✓ Login successful');

    await this.sleep(2000);
  }

  /**
   * Navigate to My Apps
   */
  async navigateToMyApps() {
    this.log('Navigating to My Apps...');

    // Click on "My Apps" button
    await this.page.click('[data-testid="apps-button"]');
    await this.sleep(3000);

    // Wait for apps list to load
    await this.page.waitForSelector('.main-content', { timeout: 30000 });
    this.log('✓ My Apps page loaded');
  }

  /**
   * Check if app exists by bundle ID
   */
  async checkAppExists(bundleId) {
    this.log(`Checking if app exists: ${bundleId}`);

    try {
      // Search for app by bundle ID
      const appLink = await this.page.evaluate((searchBundleId) => {
        const links = Array.from(document.querySelectorAll('a[href*="/app/"]'));
        const matchingLink = links.find(link => {
          const text = link.textContent || '';
          return text.includes(searchBundleId);
        });
        return matchingLink ? matchingLink.href : null;
      }, bundleId);

      if (appLink) {
        this.log('✓ App found in App Store Connect');
        return { exists: true, url: appLink };
      } else {
        this.log('App not found - will create new app');
        return { exists: false, url: null };
      }
    } catch (error) {
      this.log(`Error checking app existence: ${error.message}`);
      return { exists: false, url: null };
    }
  }

  /**
   * Create new app
   */
  async createNewApp(buildConfig, metadata) {
    this.log('Creating new app...');

    try {
      // Click "Add App" button
      const addAppButton = await this.page.waitForSelector('button:has-text("+")', { timeout: 10000 });
      await addAppButton.click();
      await this.sleep(1000);

      // Select iOS platform
      await this.page.click('[data-testid="platform-ios"]');
      await this.sleep(500);

      // Fill in app name
      await this.page.type('[data-testid="app-name-input"]', metadata.app_store.title);

      // Select primary language
      await this.page.click('[data-testid="language-select"]');
      await this.sleep(500);
      await this.page.click('[data-testid="language-option-en-US"]');

      // Enter bundle ID
      await this.page.type('[data-testid="bundle-id-input"]', buildConfig.bundle_id);

      // Enter SKU (use bundle ID as SKU)
      await this.page.type('[data-testid="sku-input"]', buildConfig.bundle_id);

      // Submit
      await this.page.click('[data-testid="create-button"]');
      await this.sleep(3000);

      this.log('✓ App created successfully');
      return true;
    } catch (error) {
      this.log(`⚠ Error creating app: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to app details page
   */
  async navigateToApp(appUrl) {
    this.log('Navigating to app details...');
    await this.page.goto(appUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await this.sleep(2000);
    this.log('✓ App details page loaded');
  }

  /**
   * Upload app metadata
   */
  async uploadMetadata(metadata) {
    this.log('Uploading app metadata...');

    try {
      // Navigate to App Information section
      await this.page.click('a:has-text("App Information")');
      await this.sleep(2000);

      // App Name
      if (metadata.app_store.title) {
        this.log(`  - Title: ${metadata.app_store.title}`);
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="app-name"]');
          if (input) input.value = '';
        });
        await this.page.type('[data-testid="app-name"]', metadata.app_store.title);
      }

      // Subtitle
      if (metadata.app_store.subtitle) {
        this.log(`  - Subtitle: ${metadata.app_store.subtitle}`);
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="subtitle"]');
          if (input) input.value = '';
        });
        await this.page.type('[data-testid="subtitle"]', metadata.app_store.subtitle);
      }

      // Navigate to Version Information
      await this.page.click('a:has-text("Version Information")');
      await this.sleep(2000);

      // Description
      if (metadata.app_store.description) {
        this.log(`  - Description: ${metadata.app_store.description.substring(0, 50)}...`);
        await this.page.evaluate(() => {
          const textarea = document.querySelector('[data-testid="description"]');
          if (textarea) textarea.value = '';
        });
        await this.page.type('[data-testid="description"]', metadata.app_store.description);
      }

      // Keywords
      if (metadata.app_store.keywords) {
        this.log(`  - Keywords: ${metadata.app_store.keywords}`);
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="keywords"]');
          if (input) input.value = '';
        });
        await this.page.type('[data-testid="keywords"]', metadata.app_store.keywords);
      }

      // Promotional text
      if (metadata.app_store.promotional_text) {
        this.log(`  - Promotional text: ${metadata.app_store.promotional_text.substring(0, 50)}...`);
        await this.page.evaluate(() => {
          const textarea = document.querySelector('[data-testid="promotional-text"]');
          if (textarea) textarea.value = '';
        });
        await this.page.type('[data-testid="promotional-text"]', metadata.app_store.promotional_text);
      }

      // Support URL
      if (metadata.app_store.support_url) {
        this.log(`  - Support URL: ${metadata.app_store.support_url}`);
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="support-url"]');
          if (input) input.value = '';
        });
        await this.page.type('[data-testid="support-url"]', metadata.app_store.support_url);
      }

      // Marketing URL
      if (metadata.app_store.marketing_url) {
        this.log(`  - Marketing URL: ${metadata.app_store.marketing_url}`);
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="marketing-url"]');
          if (input) input.value = '';
        });
        await this.page.type('[data-testid="marketing-url"]', metadata.app_store.marketing_url);
      }

      // Save changes
      await this.page.click('[data-testid="save-button"]');
      await this.sleep(2000);

      this.log('✓ Metadata uploaded');
      return true;
    } catch (error) {
      this.log(`⚠ Error uploading metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload app icon
   */
  async uploadIcon(iconPath) {
    if (!iconPath || !fs.existsSync(iconPath)) {
      this.log('⚠ No icon provided or file not found (skipping)');
      return false;
    }

    this.log('Uploading app icon (1024x1024)...');

    try {
      // Navigate to App Store section
      await this.page.click('a:has-text("App Store")');
      await this.sleep(2000);

      // Find and click icon upload area
      const iconUploadInput = await this.page.waitForSelector('input[type="file"][accept*="image"]', { timeout: 10000 });
      await iconUploadInput.uploadFile(iconPath);

      await this.sleep(3000);
      this.log('✓ Icon uploaded successfully');
      return true;
    } catch (error) {
      this.log(`⚠ Error uploading icon: ${error.message}`);
      return false;
    }
  }

  /**
   * Upload screenshots
   */
  async uploadScreenshots(screenshots) {
    if (!screenshots || !screenshots.screenshots_by_device || Object.keys(screenshots.screenshots_by_device).length === 0) {
      this.log('⚠ No screenshots provided (skipping)');
      return false;
    }

    this.log('Uploading screenshots...');

    try {
      const deviceSizes = Object.keys(screenshots.screenshots_by_device);

      for (const size of deviceSizes) {
        const screenshotPaths = screenshots.screenshots_by_device[size];
        const validPaths = screenshotPaths.filter(p => fs.existsSync(p));

        if (validPaths.length === 0) {
          this.log(`  - ${size}": No valid files found (skipping)`);
          continue;
        }

        this.log(`  - ${size}": ${validPaths.length} screenshots`);

        // Find upload input for this device size
        const uploadInput = await this.page.waitForSelector(`input[type="file"][data-device-size="${size}"]`, { timeout: 5000 });

        for (const screenshotPath of validPaths) {
          await uploadInput.uploadFile(screenshotPath);
          await this.sleep(1000);
        }
      }

      await this.sleep(2000);
      this.log('✓ Screenshots uploaded');
      return true;
    } catch (error) {
      this.log(`⚠ Error uploading screenshots: ${error.message}`);
      return false;
    }
  }

  /**
   * Select build from TestFlight
   */
  async selectBuild(buildConfig) {
    this.log(`Looking for build ${buildConfig.version} (${buildConfig.build_number})...`);

    try {
      // Navigate to Build section
      await this.page.click('a:has-text("Build")');
      await this.sleep(2000);

      // Click "Select a build" or "Change build"
      const buildButton = await this.page.waitForSelector('button:has-text("Select"), button:has-text("Change")', { timeout: 10000 });
      await buildButton.click();
      await this.sleep(2000);

      // Search for build with matching version and build number
      const buildFound = await this.page.evaluate((version, buildNumber) => {
        const buildRows = Array.from(document.querySelectorAll('[data-testid="build-row"]'));
        const matchingBuild = buildRows.find(row => {
          const versionText = row.querySelector('[data-testid="version"]')?.textContent || '';
          const buildText = row.querySelector('[data-testid="build"]')?.textContent || '';
          return versionText.includes(version) && buildText.includes(buildNumber);
        });

        if (matchingBuild) {
          matchingBuild.querySelector('input[type="radio"]')?.click();
          return true;
        }
        return false;
      }, buildConfig.version, buildConfig.build_number);

      if (buildFound) {
        // Click "Done" to confirm selection
        await this.page.click('button:has-text("Done")');
        await this.sleep(2000);

        this.log(`✓ Build ${buildConfig.version} (${buildConfig.build_number}) selected`);
        return true;
      } else {
        this.log(`⚠ Build ${buildConfig.version} (${buildConfig.build_number}) not found in TestFlight`);
        return false;
      }
    } catch (error) {
      this.log(`⚠ Error selecting build: ${error.message}`);
      return false;
    }
  }

  /**
   * Configure privacy settings
   */
  async configurePrivacy(buildConfig) {
    this.log('Configuring privacy settings...');

    try {
      // Navigate to App Privacy section
      await this.page.click('a:has-text("App Privacy")');
      await this.sleep(2000);

      // Privacy Policy URL
      if (buildConfig.privacy_policy_url) {
        this.log(`  - Privacy Policy URL: ${buildConfig.privacy_policy_url}`);
        await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="privacy-policy-url"]');
          if (input) input.value = '';
        });
        await this.page.type('[data-testid="privacy-policy-url"]', buildConfig.privacy_policy_url);
      }

      // Save changes
      await this.page.click('[data-testid="save-button"]');
      await this.sleep(2000);

      this.log('✓ Privacy settings configured');
      return true;
    } catch (error) {
      this.log(`⚠ Error configuring privacy: ${error.message}`);
      return false;
    }
  }

  /**
   * Run validation
   */
  async runValidation(buildConfig, iconUploaded, screenshotsUploaded, buildSelected) {
    this.log('Running App Store Connect validation...');

    const validationErrors = [];
    const validationWarnings = [];

    // Check for common issues
    if (!buildConfig.privacy_policy_url) {
      validationErrors.push('Missing privacy policy URL');
    }

    if (!screenshotsUploaded) {
      validationWarnings.push('Consider adding screenshots for better visibility');
    }

    if (!buildSelected) {
      validationErrors.push(`Build ${buildConfig.version} (${buildConfig.build_number}) not available in TestFlight`);
    }

    if (!iconUploaded) {
      validationWarnings.push('App icon not uploaded');
    }

    const validationPassed = validationErrors.length === 0;

    if (validationPassed) {
      this.log('✓ Validation passed!');
    } else {
      this.log('⚠ Validation completed with errors:');
      validationErrors.forEach(err => this.log(`  - ${err}`));
    }

    return {
      passed: validationPassed,
      errors: validationErrors,
      warnings: validationWarnings
    };
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed');
    }
  }

  /**
   * Main automation flow
   */
  async run(metadata, iconPath, screenshots, buildConfig, headless = true) {
    const startTime = Date.now();

    try {
      // Launch browser
      await this.launchBrowser(headless);

      // Login
      await this.login();

      // Navigate to My Apps
      await this.navigateToMyApps();

      // Check if app exists
      const appCheck = await this.checkAppExists(buildConfig.bundle_id);
      let appUrl = appCheck.url;

      // Create app if it doesn't exist
      if (!appCheck.exists) {
        await this.createNewApp(buildConfig, metadata);

        // Get the newly created app URL
        await this.sleep(2000);
        const newAppCheck = await this.checkAppExists(buildConfig.bundle_id);
        appUrl = newAppCheck.url;
      }

      // Navigate to app
      if (appUrl) {
        await this.navigateToApp(appUrl);
      }

      // Upload metadata
      await this.uploadMetadata(metadata);

      // Upload icon
      const iconUploaded = await this.uploadIcon(iconPath);

      // Upload screenshots
      const screenshotsUploaded = await this.uploadScreenshots(screenshots);

      // Select build
      const buildSelected = await this.selectBuild(buildConfig);

      // Configure privacy
      await this.configurePrivacy(buildConfig);

      // Run validation
      const validation = await this.runValidation(buildConfig, iconUploaded, screenshotsUploaded, buildSelected);

      // Close browser
      await this.closeBrowser();

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.log(`Automation completed in ${(executionTime / 1000).toFixed(1)}s`);

      // Build result
      const result = {
        status: validation.passed ? 'success' : (validation.errors.length > 0 ? 'partial' : 'failed'),
        app_created: !appCheck.exists,
        metadata_uploaded: true,
        icon_uploaded: iconUploaded,
        screenshots_uploaded: screenshotsUploaded,
        build_selected: buildSelected,
        privacy_configured: true,
        validation_passed: validation.passed,
        errors: validation.errors,
        warnings: validation.warnings,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        result,
        validation: {
          passed: validation.passed,
          errors: validation.errors.map(msg => ({
            code: 'VALIDATION_ERROR',
            message: msg,
            severity: 'error',
            field: 'unknown'
          })),
          warnings: validation.warnings.map(msg => ({
            code: 'VALIDATION_WARNING',
            message: msg,
            severity: 'warning',
            field: 'unknown'
          })),
          timestamp: new Date().toISOString(),
        },
        log: this.logLines.join('\n'),
      };

    } catch (error) {
      await this.closeBrowser();
      this.log(`⚠ Automation failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        log: this.logLines.join('\n'),
      };
    }
  }
}

module.exports = AppStoreConnectAutomation;
