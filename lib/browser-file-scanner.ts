/**
 * Browser-based File Scanner
 *
 * Scans a local project directory using File System Access API
 * This runs entirely in the browser without needing backend filesystem access
 */

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

interface ScanOptions {
  includeHiddenFiles?: boolean;
  includeNodeModules?: boolean;
  maxDepth?: number;
}

/**
 * Check if path should be excluded
 */
function shouldExclude(name: string, includeHidden: boolean, includeNodeModules: boolean): boolean {
  // Always exclude .git
  if (name === '.git') return true;

  // Exclude hidden files/folders if not included
  if (!includeHidden && name.startsWith('.')) return true;

  // Exclude node_modules if not included
  if (!includeNodeModules && name === 'node_modules') return true;

  return false;
}

/**
 * Scan directory structure using File System Access API
 */
export async function scanDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  relativePath: string = '',
  options: ScanOptions = {},
  depth: number = 0
): Promise<FileNode[]> {
  const {
    includeHiddenFiles = false,
    includeNodeModules = false,
    maxDepth = 10
  } = options;

  // Prevent infinite recursion
  if (depth > maxDepth) {
    return [];
  }

  const nodes: FileNode[] = [];

  try {
    for await (const entry of handle.values()) {
      // Skip excluded files/directories
      if (shouldExclude(entry.name, includeHiddenFiles, includeNodeModules)) {
        continue;
      }

      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        const dirHandle = entry as FileSystemDirectoryHandle;
        const children = await scanDirectoryHandle(dirHandle, relPath, options, depth + 1);

        nodes.push({
          name: entry.name,
          type: 'directory',
          path: relPath,
          children,
        });
      } else {
        const fileHandle = entry as FileSystemFileHandle;
        try {
          const file = await fileHandle.getFile();
          nodes.push({
            name: entry.name,
            type: 'file',
            path: relPath,
            size: file.size,
          });
        } catch (err) {
          console.warn(`Skipping ${relPath}: ${err}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${relativePath}:`, error);
  }

  return nodes;
}

/**
 * Read file content from handle
 */
export async function readFileFromHandle(handle: FileSystemFileHandle): Promise<string | null> {
  try {
    const file = await handle.getFile();
    const text = await file.text();
    return text;
  } catch (error) {
    console.warn(`Could not read file:`, error);
    return null;
  }
}

/**
 * Get a file handle by path from root handle
 */
export async function getFileHandleByPath(
  rootHandle: FileSystemDirectoryHandle,
  pathParts: string[]
): Promise<FileSystemFileHandle | null> {
  let currentHandle: FileSystemDirectoryHandle = rootHandle;

  // Navigate to the file
  for (let i = 0; i < pathParts.length - 1; i++) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
    } catch (error) {
      console.error(`Directory not found: ${pathParts[i]}`, error);
      return null;
    }
  }

  // Get the file
  try {
    const fileName = pathParts[pathParts.length - 1];
    return await currentHandle.getFileHandle(fileName);
  } catch (error) {
    console.error(`File not found: ${pathParts[pathParts.length - 1]}`, error);
    return null;
  }
}

/**
 * Detect project metadata from directory handle
 */
export async function detectProjectMetadataFromHandle(
  projectHandle: FileSystemDirectoryHandle
): Promise<any> {
  const metadata: any = {
    projectName: projectHandle.name,
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
    try {
      const packageJsonHandle = await projectHandle.getFileHandle('package.json');
      const packageJsonContent = await readFileFromHandle(packageJsonHandle);

      if (packageJsonContent) {
        metadata.hasPackageJson = true;
        metadata.detectedFiles.push('package.json');

        const packageJson = JSON.parse(packageJsonContent);
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
      }
    } catch (e) {
      // No package.json
    }

    // Check for README
    const readmeFiles = ['README.md', 'README.txt', 'readme.md', 'Readme.md'];
    for (const readme of readmeFiles) {
      try {
        await projectHandle.getFileHandle(readme);
        metadata.hasReadme = true;
        metadata.detectedFiles.push(readme);
        break;
      } catch (e) {
        // Continue checking
      }
    }

    // Check for TypeScript
    try {
      await projectHandle.getFileHandle('tsconfig.json');
      metadata.hasTypeScript = true;
      metadata.detectedFiles.push('tsconfig.json');
    } catch (e) {
      // No TypeScript
    }

    // Check for Tailwind
    const tailwindFiles = ['tailwind.config.js', 'tailwind.config.ts'];
    for (const tailwind of tailwindFiles) {
      try {
        await projectHandle.getFileHandle(tailwind);
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
        await projectHandle.getFileHandle(file);
        metadata.detectedFiles.push(file);
      } catch (e) {
        // Continue
      }
    }

    // Check for common directories
    const directories = ['src', 'app', 'components', 'assets', 'public'];
    for (const dir of directories) {
      try {
        await projectHandle.getDirectoryHandle(dir);
        metadata.directories[`has${dir.charAt(0).toUpperCase()}${dir.slice(1)}`] = true;
      } catch (e) {
        // Directory doesn't exist
      }
    }
  } catch (error) {
    console.error('Error detecting metadata:', error);
  }

  return metadata;
}

/**
 * Read important project files from handle
 */
export async function readProjectFilesFromHandle(
  projectHandle: FileSystemDirectoryHandle
): Promise<any> {
  const fileContents: any = {};

  // Read package.json
  try {
    const packageJsonHandle = await projectHandle.getFileHandle('package.json');
    const packageContent = await readFileFromHandle(packageJsonHandle);
    if (packageContent) {
      fileContents.packageJson = JSON.parse(packageContent);
    }
  } catch (e) {
    // No package.json
  }

  // Read README
  const readmeFiles = ['README.md', 'README.txt', 'readme.md', 'Readme.md'];
  for (const readme of readmeFiles) {
    try {
      const readmeHandle = await projectHandle.getFileHandle(readme);
      const content = await readFileFromHandle(readmeHandle);
      if (content) {
        fileContents.readme = content;
        break;
      }
    } catch (e) {
      // Continue
    }
  }

  // Read app.json (if exists)
  try {
    const appJsonHandle = await projectHandle.getFileHandle('app.json');
    const appJsonContent = await readFileFromHandle(appJsonHandle);
    if (appJsonContent) {
      fileContents.appJson = JSON.parse(appJsonContent);
    }
  } catch (e) {
    // No app.json
  }

  // Read tailwind config (if exists)
  const tailwindFiles = ['tailwind.config.js', 'tailwind.config.ts'];
  for (const tailwind of tailwindFiles) {
    try {
      const tailwindHandle = await projectHandle.getFileHandle(tailwind);
      const content = await readFileFromHandle(tailwindHandle);
      if (content) {
        fileContents.tailwindConfig = content;
        break;
      }
    } catch (e) {
      // Continue
    }
  }

  // Read tsconfig.json (if exists)
  try {
    const tsconfigHandle = await projectHandle.getFileHandle('tsconfig.json');
    const tsconfigContent = await readFileFromHandle(tsconfigHandle);
    if (tsconfigContent) {
      fileContents.tsconfig = JSON.parse(tsconfigContent);
    }
  } catch (e) {
    // No tsconfig
  }

  // List files in src/ (if exists)
  try {
    const srcHandle = await projectHandle.getDirectoryHandle('src');
    const srcFiles = await scanDirectoryHandle(srcHandle, 'src', { includeHiddenFiles: false, includeNodeModules: false });
    fileContents.srcFiles = srcFiles;
  } catch (e) {
    // No src directory
  }

  // List files in app/ (if exists)
  try {
    const appHandle = await projectHandle.getDirectoryHandle('app');
    const appFiles = await scanDirectoryHandle(appHandle, 'app', { includeHiddenFiles: false, includeNodeModules: false });
    fileContents.appFiles = appFiles;
  } catch (e) {
    // No app directory
  }

  // List files in assets/ (if exists)
  try {
    const assetsHandle = await projectHandle.getDirectoryHandle('assets');
    const assetFiles = await scanDirectoryHandle(assetsHandle, 'assets', { includeHiddenFiles: false, includeNodeModules: false });
    fileContents.assetFiles = assetFiles;
  } catch (e) {
    // No assets directory
  }

  return fileContents;
}

/**
 * Perform complete project analysis from directory handle
 */
export async function analyzeProjectFromHandle(
  projectHandle: FileSystemDirectoryHandle,
  options: ScanOptions = {}
): Promise<any> {
  const log: string[] = [];
  log.push(`[${new Date().toISOString()}] Starting browser-based project analysis`);
  log.push(`Project: ${projectHandle.name}`);
  log.push(`Include hidden files: ${options.includeHiddenFiles || false}`);
  log.push(`Include node_modules: ${options.includeNodeModules || false}`);

  // Scan project structure
  log.push('Scanning project structure...');
  const repoStructure = await scanDirectoryHandle(projectHandle, '', options);
  log.push(`Found ${repoStructure.length} top-level items`);

  // Detect project metadata
  log.push('Detecting project metadata...');
  const repositoryMetadata = await detectProjectMetadataFromHandle(projectHandle);
  log.push(`Project name: ${repositoryMetadata.projectName}`);
  log.push(`Project type: ${repositoryMetadata.projectType}`);
  log.push(`Framework: ${repositoryMetadata.framework || 'unknown'}`);
  log.push(`Detected files: ${repositoryMetadata.detectedFiles.join(', ')}`);

  // Read important file contents
  log.push('Reading project files...');
  const fileContents = await readProjectFilesFromHandle(projectHandle);
  log.push('File contents extracted successfully');

  log.push(`[${new Date().toISOString()}] Analysis completed successfully`);

  return {
    success: true,
    repositoryMetadata,
    fileContents,
    repoStructure: {
      root: projectHandle.name,
      items: repoStructure,
    },
    analysisLog: log.join('\n'),
  };
}
