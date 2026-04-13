import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend, GitNotesBackend } from '../../src/core/backend-resolver.js';
import { migrateState, validateMigration } from '../../src/core/migrator.js';

describe('Migrator', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-migrate-'));
  });

  it('should migrate state from one backend to another with verification', async () => {
    const source = new FilesystemBackend(tmpDir, 'filesystem');
    await source.writeFile('team.md', '# Team');
    await source.writeFile('decisions.md', '# Decisions');

    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-target-'));
    const target = new FilesystemBackend(targetDir, 'git-notes');

    const report = await migrateState(source, target, 'filesystem', 'git-notes');
    expect(report.success).toBe(true);
    expect(report.filesTransferred).toBe(2);
    expect(report.checksumMatch).toBe(true);
    expect(await target.readFile('team.md')).toBe('# Team');
  });

  it('should verify state consistency after migration', async () => {
    const source = new FilesystemBackend(tmpDir, 'filesystem');
    await source.writeFile('team.md', '# Team');

    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-target-'));
    const target = new FilesystemBackend(targetDir, 'git-notes');

    await migrateState(source, target, 'filesystem', 'git-notes');
    const valid = await validateMigration(source, target);
    expect(valid).toBe(true);
  });

  it('should handle all backend pairs correctly', async () => {
    const source = new FilesystemBackend(tmpDir);
    await source.writeFile('data.txt', 'content');

    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-target-'));
    const target = new FilesystemBackend(targetDir);

    const report = await migrateState(source, target, 'filesystem', 'orphan');
    expect(report.success).toBe(true);
    expect(report.sourceBackend).toBe('filesystem');
    expect(report.targetBackend).toBe('orphan');
  });

  it('should reject migration from same backend to same backend', async () => {
    const source = new FilesystemBackend(tmpDir);
    const target = new FilesystemBackend(tmpDir);

    const report = await migrateState(source, target, 'filesystem', 'filesystem');
    expect(report.success).toBe(false);
    expect(report.errors).toContain('Cannot migrate to the same backend type');
  });

  it('should return detailed migration report', async () => {
    const source = new FilesystemBackend(tmpDir);
    await source.writeFile('team.md', '# Team');

    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-target-'));
    const target = new FilesystemBackend(targetDir);

    const report = await migrateState(source, target, 'filesystem', 'git-notes');
    expect(report).toHaveProperty('success');
    expect(report).toHaveProperty('sourceBackend');
    expect(report).toHaveProperty('targetBackend');
    expect(report).toHaveProperty('filesTransferred');
    expect(report).toHaveProperty('bytesTransferred');
    expect(report).toHaveProperty('durationMs');
    expect(report).toHaveProperty('checksumMatch');
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
    expect(report.bytesTransferred).toBeGreaterThan(0);
  });

  it('should support rollback on migration failure', async () => {
    const source = new FilesystemBackend(tmpDir);
    await source.writeFile('team.md', '# Team');

    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-target-'));
    const target = new FilesystemBackend(targetDir);
    // Make writeFile fail
    const origWrite = target.writeFile.bind(target);
    target.writeFile = async () => { throw new Error('Disk full'); };

    const report = await migrateState(source, target, 'filesystem', 'git-notes');
    expect(report.success).toBe(false);
    expect(report.errors).toBeDefined();
    expect(report.errors!.length).toBeGreaterThan(0);
  });
});
