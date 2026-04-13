import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { migrateCommand } from '../../src/cli/commands/migrate.js';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';

describe('CLI: migrate command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-cli-migrate-'));
    // Seed source data in filesystem backend (root dir)
    const srcBackend = new FilesystemBackend(tmpDir);
    await srcBackend.writeFile('team.md', '# Team');
    await srcBackend.writeFile('decisions.md', '# Decisions');
  });

  it('should execute migration and update config', async () => {
    const result = await migrateCommand({ from: 'filesystem', to: 'git-notes', rootDir: tmpDir });
    expect(result.success).toBe(true);
    expect(result.report.filesTransferred).toBe(2);
  });

  it('should reject same-backend migrations', async () => {
    await expect(
      migrateCommand({ from: 'filesystem', to: 'filesystem', rootDir: tmpDir })
    ).rejects.toThrow('Cannot migrate');
  });

  it('should display detailed migration report', async () => {
    const result = await migrateCommand({ from: 'filesystem', to: 'orphan', rootDir: tmpDir });
    expect(result.message).toContain('files transferred');
    expect(result.report.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should handle migration failures gracefully', async () => {
    // Invalid source backend type
    await expect(
      migrateCommand({ from: 'nonexistent' as any, to: 'git-notes', rootDir: tmpDir })
    ).rejects.toThrow('Invalid source backend');
  });
});
