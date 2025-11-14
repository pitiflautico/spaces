import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface LocalAnalysisRequest {
  localProjectPath: string;
  includeHiddenFiles?: boolean;
  includeNodeModules?: boolean;
}

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

// Helper function to check if path should be excluded
function shouldExclude(name: string, includeHidden: boolean, includeNodeModules: boolean): boolean {
  // Always exclude .git
  if (name === '.git') return true;

  // Exclude hidden files/folders if not included
  if (!includeHidden && name.startsWith('.')) return true;

  // Exclude node_modules if not included
  if (!includeNodeModules && name === 'node_modules') return true;

  return false;
}

// Helper function to scan directory structure
async function scanDirectory(
  dirPath: string,
  relativePath: string = '',
  includeHidden: boolean = false,
  includeNodeModules: boolean = false
): Promise<FileNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      // Skip excluded files/directories
      if (shouldExclude(entry.name, includeHidden, includeNodeModules)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      try {
        const stats = await fs.stat(fullPath);

        if (entry.isDirectory()) {
          const children = await scanDirectory(fullPath, relPath, includeHidden, includeNodeModules);
          nodes.push({
            name: entry.name,
            type: 'directory',
            path: relPath,
            children,
          });
        } else {
          nodes.push({
            name: entry.name,
            type: 'file',
            path: relPath,
            size: stats.size,
          });
        }
      } catch (err) {
        // Skip files/directories we can't access
        console.warn(`Skipping ${fullPath}: ${err}`);
      }
    }

    return nodes;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

// Helper function to read file content safely
async function readFileContent(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`Could not read ${filePath}:`, error);
    return null;
  }
}

// Helper function to detect project metadata
async function detectProjectMetadata(projectPath: string): Promise<any> {
  const metadata: any = {
    projectName: path.basename(projectPath),
    projectPath,
    detectedFiles: [],
    projectType: 'unknown',
    framework: null,
    dependencies: {},
    devDependencies: {},
    hasPackageJson: false,
    hasReadme: false,
    hasTailwindConfig: false,
    hasTypeScript: false,
    directories: {
      hasSrc: false,
      hasApp: false,
      hasComponents: false,
      hasAssets: false,
      hasPublic: false,
    },
  };

  try {
    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
      metadata.hasPackageJson = true;
      metadata.detectedFiles.push('package.json');

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      metadata.projectName = packageJson.name || metadata.projectName;
      metadata.dependencies = packageJson.dependencies || {};
      metadata.devDependencies = packageJson.devDependencies || {};

      // Detect framework
      const allDeps = { ...metadata.dependencies, ...metadata.devDependencies };

      if (allDeps.next) {
        metadata.framework = 'Next.js';
        metadata.projectType = 'web';
      } else if (allDeps['react-native'] || allDeps.expo) {
        metadata.framework = allDeps.expo ? 'Expo' : 'React Native';
        metadata.projectType = 'mobile';
      } else if (allDeps.react) {
        metadata.framework = 'React';
        metadata.projectType = 'web';
      } else if (allDeps.vue) {
        metadata.framework = 'Vue.js';
        metadata.projectType = 'web';
      } else if (allDeps.angular) {
        metadata.framework = 'Angular';
        metadata.projectType = 'web';
      } else if (allDeps.svelte) {
        metadata.framework = 'Svelte';
        metadata.projectType = 'web';
      }
    } catch (e) {
      // No package.json
    }

    // Check for README
    const readmeFiles = ['README.md', 'README.txt', 'readme.md', 'Readme.md'];
    for (const readme of readmeFiles) {
      try {
        await fs.access(path.join(projectPath, readme));
        metadata.hasReadme = true;
        metadata.detectedFiles.push(readme);
        break;
      } catch (e) {
        // Continue checking
      }
    }

    // Check for TypeScript
    try {
      await fs.access(path.join(projectPath, 'tsconfig.json'));
      metadata.hasTypeScript = true;
      metadata.detectedFiles.push('tsconfig.json');
    } catch (e) {
      // No TypeScript
    }

    // Check for Tailwind
    const tailwindFiles = ['tailwind.config.js', 'tailwind.config.ts'];
    for (const tailwind of tailwindFiles) {
      try {
        await fs.access(path.join(projectPath, tailwind));
        metadata.hasTailwindConfig = true;
        metadata.detectedFiles.push(tailwind);
        break;
      } catch (e) {
        // Continue
      }
    }

    // Check for other common files
    const commonFiles = [
      'app.json',
      'angular.json',
      'vue.config.js',
      'nuxt.config.js',
      'gatsby-config.js',
      'vite.config.js',
      'webpack.config.js',
    ];

    for (const file of commonFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        metadata.detectedFiles.push(file);
      } catch (e) {
        // Continue
      }
    }

    // Check for common directories
    const directories = ['src', 'app', 'components', 'assets', 'public'];
    for (const dir of directories) {
      try {
        const stats = await fs.stat(path.join(projectPath, dir));
        if (stats.isDirectory()) {
          metadata.directories[`has${dir.charAt(0).toUpperCase()}${dir.slice(1)}`] = true;
        }
      } catch (e) {
        // Directory doesn't exist
      }
    }
  } catch (error) {
    console.error('Error detecting metadata:', error);
  }

  return metadata;
}

// Helper function to read important file contents
async function readProjectFiles(projectPath: string): Promise<any> {
  const fileContents: any = {};

  // Read package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageContent = await readFileContent(packageJsonPath);
  if (packageContent) {
    fileContents.packageJson = JSON.parse(packageContent);
  }

  // Read README
  const readmeFiles = ['README.md', 'README.txt', 'readme.md', 'Readme.md'];
  for (const readme of readmeFiles) {
    const content = await readFileContent(path.join(projectPath, readme));
    if (content) {
      fileContents.readme = content;
      break;
    }
  }

  // Read app.json (if exists)
  const appJsonContent = await readFileContent(path.join(projectPath, 'app.json'));
  if (appJsonContent) {
    fileContents.appJson = JSON.parse(appJsonContent);
  }

  // Read tailwind config (if exists)
  const tailwindFiles = ['tailwind.config.js', 'tailwind.config.ts'];
  for (const tailwind of tailwindFiles) {
    const content = await readFileContent(path.join(projectPath, tailwind));
    if (content) {
      fileContents.tailwindConfig = content;
      break;
    }
  }

  // Read tsconfig.json (if exists)
  const tsconfigContent = await readFileContent(path.join(projectPath, 'tsconfig.json'));
  if (tsconfigContent) {
    fileContents.tsconfig = JSON.parse(tsconfigContent);
  }

  // List files in src/ (if exists)
  try {
    const srcPath = path.join(projectPath, 'src');
    await fs.access(srcPath);
    const srcFiles = await scanDirectory(srcPath, 'src', false, false);
    fileContents.srcFiles = srcFiles;
  } catch (e) {
    // No src directory
  }

  // List files in app/ (if exists)
  try {
    const appPath = path.join(projectPath, 'app');
    await fs.access(appPath);
    const appFiles = await scanDirectory(appPath, 'app', false, false);
    fileContents.appFiles = appFiles;
  } catch (e) {
    // No app directory
  }

  // List files in assets/ (if exists)
  try {
    const assetsPath = path.join(projectPath, 'assets');
    await fs.access(assetsPath);
    const assetFiles = await scanDirectory(assetsPath, 'assets', false, false);
    fileContents.assetFiles = assetFiles;
  } catch (e) {
    // No assets directory
  }

  return fileContents;
}

export async function POST(request: NextRequest) {
  try {
    const body: LocalAnalysisRequest = await request.json();
    const {
      localProjectPath,
      includeHiddenFiles = false,
      includeNodeModules = false
    } = body;

    // Validate inputs
    if (!localProjectPath) {
      return NextResponse.json(
        { error: 'Local project path is required' },
        { status: 400 }
      );
    }

    // Check if path exists
    try {
      await fs.access(localProjectPath);
    } catch (error) {
      return NextResponse.json(
        { error: `Path does not exist or is not accessible: ${localProjectPath}` },
        { status: 400 }
      );
    }

    // Check if it's a directory
    const stats = await fs.stat(localProjectPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path must be a directory' },
        { status: 400 }
      );
    }

    // Initialize log
    const log: string[] = [];
    log.push(`[${new Date().toISOString()}] Starting local project analysis`);
    log.push(`Project path: ${localProjectPath}`);
    log.push(`Include hidden files: ${includeHiddenFiles}`);
    log.push(`Include node_modules: ${includeNodeModules}`);

    // Scan project structure
    log.push('Scanning project structure...');
    const repoStructure = await scanDirectory(
      localProjectPath,
      '',
      includeHiddenFiles,
      includeNodeModules
    );
    log.push(`Found ${repoStructure.length} top-level items`);

    // Detect project metadata
    log.push('Detecting project metadata...');
    const repositoryMetadata = await detectProjectMetadata(localProjectPath);
    log.push(`Project name: ${repositoryMetadata.projectName}`);
    log.push(`Project type: ${repositoryMetadata.projectType}`);
    log.push(`Framework: ${repositoryMetadata.framework || 'unknown'}`);
    log.push(`Detected files: ${repositoryMetadata.detectedFiles.join(', ')}`);

    // Read important file contents
    log.push('Reading project files...');
    const fileContents = await readProjectFiles(localProjectPath);
    log.push('File contents extracted successfully');

    log.push(`[${new Date().toISOString()}] Analysis completed successfully`);

    // Return success response
    return NextResponse.json({
      success: true,
      repositoryMetadata,
      fileContents,
      repoStructure: {
        root: path.basename(localProjectPath),
        items: repoStructure,
      },
      analysisLog: log.join('\n'),
    });
  } catch (error: any) {
    console.error('Local analysis error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
