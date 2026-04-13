import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { statusCommand } from '../../src/cli/commands/status.js';

describe('CLI: status command', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-cli-status-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should display backend type and state health', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const result = await statusCommand(backend, 'filesystem');
    expect(result.status.backend).toBe('filesystem');
    expect(result.status.isHealthy).toBe(true);
    expect(result.formatted).toContain('Backend: filesystem');
  });

  it('should show state size, file count, last write time', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const result = await statusCommand(backend, 'filesystem');
    expect(result.status.fileCount).toBe(2);
    expect(result.status.stateSizeBytes).toBeGreaterThan(0);
    expect(result.formatted).toContain('Files: 2');
  });

  it('should include integrity check results', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const result = await statusCommand(backend, 'filesystem');
    expect(result.integrity.isValid).toBe(true);
    expect(result.formatted).toContain('Integrity: valid');
  });

  it('should handle uninitialized state', async () => {
    const result = await statusCommand(backend, 'filesystem');
    expect(result.status.isHealthy).toBe(false);
    expect(result.status.fileCount).toBe(0);
  });

  it('should support --json output format', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const result = await statusCommand(backend, 'filesystem', { json: true });
    const parsed = JSON.parse(result.formatted);
    expect(parsed.status.backend).toBe('filesystem');
    expect(parsed.integrity.isValid).toBe(true);
  });
});
