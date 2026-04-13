/**
 * Backend resolver: determine current backend and create instances
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StateBackend, BackendType } from '../types.js';

export interface BackendResolverOptions {
  backendType: BackendType;
  config?: Record<string, unknown>;
}

const VALID_BACKEND_TYPES: readonly string[] = ['filesystem', 'git-notes', 'orphan', 'external'];

/** Filesystem-based StateBackend implementation */
export class FilesystemBackend implements StateBackend {
  readonly name: string;
  private readonly rootDir: string;

  constructor(rootDir: string, name: string = 'filesystem') {
    this.rootDir = rootDir;
    this.name = name;
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.rootDir, relativePath);
    return fs.promises.readFile(fullPath, 'utf-8');
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.rootDir, relativePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content, 'utf-8');
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.rootDir, relativePath);
    await fs.promises.unlink(fullPath);
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const searchDir = prefix ? path.join(this.rootDir, prefix) : this.rootDir;
    if (!fs.existsSync(searchDir)) return [];
    return this.listFilesRecursive(searchDir, this.rootDir);
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.rootDir, relativePath);
    return fs.existsSync(fullPath);
  }

  private async listFilesRecursive(dir: string, baseDir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subResults = await this.listFilesRecursive(fullPath, baseDir);
        results.push(...subResults);
      } else {
        results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
      }
    }
    return results;
  }
}

/** Git-notes backend (simulated with a namespaced filesystem directory) */
export class GitNotesBackend extends FilesystemBackend {
  constructor(rootDir: string) {
    super(path.join(rootDir, '.git-notes-state'), 'git-notes');
  }
}

/** Orphan branch backend (simulated with a namespaced filesystem directory) */
export class OrphanBranchBackend extends FilesystemBackend {
  constructor(rootDir: string) {
    super(path.join(rootDir, '.orphan-branch-state'), 'orphan');
  }
}

/** External repo backend (simulated with a separate directory) */
export class ExternalRepoBackend extends FilesystemBackend {
  constructor(rootDir: string) {
    const externalDir = (rootDir.endsWith('-external'))
      ? rootDir
      : path.join(rootDir, '.external-state');
    super(externalDir, 'external');
  }
}

export async function resolveBackend(
  options: BackendResolverOptions
): Promise<StateBackend> {
  if (!VALID_BACKEND_TYPES.includes(options.backendType)) {
    throw new Error(`Invalid backend type: "${options.backendType}". Valid types: ${VALID_BACKEND_TYPES.join(', ')}`);
  }

  const rootDir = (options.config?.rootDir as string) || process.cwd();

  switch (options.backendType) {
    case 'filesystem':
      return new FilesystemBackend(rootDir);
    case 'git-notes':
      return new GitNotesBackend(rootDir);
    case 'orphan':
      return new OrphanBranchBackend(rootDir);
    case 'external':
      return new ExternalRepoBackend(rootDir);
    default:
      throw new Error(`Unsupported backend type: ${options.backendType}`);
  }
}

export async function getCurrentBackendType(): Promise<string> {
  return 'filesystem';
}
