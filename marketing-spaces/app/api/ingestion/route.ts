import { NextRequest, NextResponse } from 'next/server';
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';

interface IngestionRequest {
  projectName: string;
  repoUrl?: string;
  branch?: string;
  mode?: 'copy' | 'readonly';
}

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

// Helper function to scan directory structure
async function scanDirectory(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      const children = await scanDirectory(fullPath, relPath);
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
      });
    }
  }

  return nodes;
}

// Helper function to detect important files
async function detectProjectMetadata(projectPath: string): Promise<any> {
  const metadata: any = {
    detectedFiles: [],
    projectType: 'unknown',
    hasPackageJson: false,
    hasReadme: false,
    framework: null,
  };

  try {
    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
      metadata.hasPackageJson = true;
      metadata.detectedFiles.push('package.json');

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // Detect framework
      if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
        metadata.framework = 'Next.js';
        metadata.projectType = 'web';
      } else if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
        metadata.framework = 'React';
        metadata.projectType = 'web';
      } else if (packageJson.dependencies?.['react-native']) {
        metadata.framework = 'React Native';
        metadata.projectType = 'mobile';
      } else if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
        metadata.framework = 'Vue.js';
        metadata.projectType = 'web';
      }
    } catch (e) {
      // File doesn't exist
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

    // Check for other common files
    const commonFiles = [
      'tsconfig.json',
      'app.json',
      'angular.json',
      'vue.config.js',
      'nuxt.config.js',
      'gatsby-config.js',
    ];

    for (const file of commonFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        metadata.detectedFiles.push(file);
      } catch (e) {
        // Continue
      }
    }
  } catch (error) {
    console.error('Error detecting metadata:', error);
  }

  return metadata;
}

export async function POST(request: NextRequest) {
  try {
    const body: IngestionRequest = await request.json();
    const { projectName, repoUrl, branch = 'main', mode = 'copy' } = body;

    // Validate inputs
    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required (ZIP upload not yet implemented)' },
        { status: 400 }
      );
    }

    // Create storage directory
    const storagePath = path.join(process.cwd(), 'storage', 'projects');
    await fs.mkdir(storagePath, { recursive: true });

    const projectPath = path.join(storagePath, projectName);

    // Check if project already exists
    try {
      await fs.access(projectPath);
      // Project exists, remove it first
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (e) {
      // Project doesn't exist, continue
    }

    // Initialize log
    const log: string[] = [];
    log.push(`[${new Date().toISOString()}] Starting ingestion for project: ${projectName}`);
    log.push(`Repository URL: ${repoUrl}`);
    log.push(`Branch: ${branch}`);
    log.push(`Mode: ${mode}`);

    // Clone repository
    log.push('Cloning repository...');
    const git = simpleGit();

    try {
      await git.clone(repoUrl, projectPath, ['--branch', branch, '--single-branch']);
      log.push('Repository cloned successfully');
    } catch (error: any) {
      log.push(`Error cloning repository: ${error.message}`);
      return NextResponse.json(
        {
          error: 'Failed to clone repository',
          details: error.message,
          log: log.join('\n')
        },
        { status: 500 }
      );
    }

    // Scan folder structure
    log.push('Scanning project structure...');
    const folderStructure = await scanDirectory(projectPath);
    log.push(`Found ${folderStructure.length} top-level items`);

    // Detect project metadata
    log.push('Detecting project metadata...');
    const metadata = await detectProjectMetadata(projectPath);
    log.push(`Project type: ${metadata.projectType}`);
    log.push(`Framework: ${metadata.framework || 'unknown'}`);
    log.push(`Detected files: ${metadata.detectedFiles.join(', ')}`);

    // Save outputs
    const folderStructurePath = path.join(projectPath, 'folder_structure.json');
    await fs.writeFile(
      folderStructurePath,
      JSON.stringify(folderStructure, null, 2)
    );

    const metadataPath = path.join(projectPath, 'project_metadata.json');
    await fs.writeFile(
      metadataPath,
      JSON.stringify({
        projectName,
        repoUrl,
        branch,
        mode,
        clonedAt: new Date().toISOString(),
        ...metadata,
      }, null, 2)
    );

    const logPath = path.join(projectPath, 'ingestion_log.txt');
    log.push(`[${new Date().toISOString()}] Ingestion completed successfully`);
    await fs.writeFile(logPath, log.join('\n'));

    // Return success response
    return NextResponse.json({
      success: true,
      projectPath,
      folderStructure,
      metadata,
      log: log.join('\n'),
    });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
