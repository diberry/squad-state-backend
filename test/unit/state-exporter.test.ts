import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { exportState, exportStateWithMetadata, computeChecksum } from '../../src/core/state-exporter.js';

describe('StateExporter', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-export-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should export state from any backend into memory', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const state = await exportState(backend);
    expect(state.files.size).toBe(2);
    expect(state.files.get('team.md')).toBe('# Team');
    expect(state.files.get('decisions.md')).toBe('# Decisions');
  });

  it('should handle empty state gracefully', async () => {
    const state = await exportState(backend);
    expect(state.files.size).toBe(0);
    expect(state.metadata.checksumMd5).toBeDefined();
  });

  it('should include all required files in export', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');
    await backend.writeFile('agents/agent1.md', 'Agent 1');
    await backend.writeFile('orchestration-log/log1.json', '{}');

    const state = await exportState(backend);
    expect(state.files.has('team.md')).toBe(true);
    expect(state.files.has('decisions.md')).toBe(true);
    expect(state.files.has('agents/agent1.md')).toBe(true);
    expect(state.files.has('orchestration-log/log1.json')).toBe(true);
  });

  it('should compute MD5 checksum for verification', async () => {
    await backend.writeFile('team.md', '# Team');
    const state = await exportState(backend);
    expect(state.metadata.checksumMd5).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should handle missing optional files without error', async () => {
    await backend.writeFile('team.md', '# Team');
    // No decisions.md, no agents/ — should not throw
    const state = await exportState(backend);
    expect(state.files.size).toBe(1);
    expect(state.metadata.exportedFrom).toBe('filesystem');
  });

  it('should include metadata with export timestamp', async () => {
    const state = await exportStateWithMetadata(backend, 'test-backend');
    expect(state.metadata.exportedFrom).toBe('test-backend');
    expect(state.metadata.exportedAt).toBeDefined();
    expect(new Date(state.metadata.exportedAt).getTime()).not.toBeNaN();
  });

  it('should produce consistent checksums for same content', async () => {
    const files = new Map([['a.txt', 'hello'], ['b.txt', 'world']]);
    const c1 = computeChecksum(files);
    const c2 = computeChecksum(files);
    expect(c1).toBe(c2);
  });
});
