import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  resolveBackend,
  getCurrentBackendType,
  FilesystemBackend,
  GitNotesBackend,
  OrphanBranchBackend,
  ExternalRepoBackend,
} from '../../src/core/backend-resolver.js';

describe('BackendResolver', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-test-'));
  });

  it('should resolve correct backend from configuration', async () => {
    const backend = await resolveBackend({
      backendType: 'git-notes',
      config: { rootDir: tmpDir },
    });
    expect(backend.name).toBe('git-notes');
    expect(backend).toBeInstanceOf(GitNotesBackend);
  });

  it('should handle missing config with default filesystem backend', async () => {
    const backend = await resolveBackend({
      backendType: 'filesystem',
      config: { rootDir: tmpDir },
    });
    expect(backend.name).toBe('filesystem');
    expect(backend).toBeInstanceOf(FilesystemBackend);
  });

  it('should throw error for invalid backend type', async () => {
    await expect(
      resolveBackend({ backendType: 'invalid' as any })
    ).rejects.toThrow('Invalid backend type');
  });

  it('should return typed backend instances', async () => {
    const fs_backend = await resolveBackend({ backendType: 'filesystem', config: { rootDir: tmpDir } });
    const gn_backend = await resolveBackend({ backendType: 'git-notes', config: { rootDir: tmpDir } });
    const ob_backend = await resolveBackend({ backendType: 'orphan', config: { rootDir: tmpDir } });
    const ex_backend = await resolveBackend({ backendType: 'external', config: { rootDir: tmpDir } });

    expect(fs_backend).toBeInstanceOf(FilesystemBackend);
    expect(gn_backend).toBeInstanceOf(GitNotesBackend);
    expect(ob_backend).toBeInstanceOf(OrphanBranchBackend);
    expect(ex_backend).toBeInstanceOf(ExternalRepoBackend);
  });

  it('should return filesystem as current backend type', async () => {
    const type = await getCurrentBackendType();
    expect(type).toBe('filesystem');
  });

  it('should read and write files through FilesystemBackend', async () => {
    const backend = new FilesystemBackend(tmpDir);
    await backend.writeFile('test.txt', 'hello world');
    const content = await backend.readFile('test.txt');
    expect(content).toBe('hello world');
  });

  it('should list files recursively', async () => {
    const backend = new FilesystemBackend(tmpDir);
    await backend.writeFile('a.txt', 'a');
    await backend.writeFile('sub/b.txt', 'b');
    const files = await backend.listFiles();
    expect(files).toContain('a.txt');
    expect(files).toContain('sub/b.txt');
  });

  it('should check file existence', async () => {
    const backend = new FilesystemBackend(tmpDir);
    expect(await backend.exists('nope.txt')).toBe(false);
    await backend.writeFile('nope.txt', 'now it exists');
    expect(await backend.exists('nope.txt')).toBe(true);
  });
});
