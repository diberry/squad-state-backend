import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { importState } from '../../src/core/state-importer.js';
import type { SerializedState } from '../../src/types.js';
import { computeChecksum } from '../../src/core/state-exporter.js';

function makeState(files: Record<string, string>): SerializedState {
  const map = new Map(Object.entries(files));
  return {
    files: map,
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedFrom: 'test',
      checksumMd5: computeChecksum(map),
    },
  };
}

describe('StateImporter', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-import-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should import state into any backend from memory', async () => {
    const state = makeState({ 'team.md': '# Team', 'decisions.md': '# Decisions' });
    const result = await importState(backend, state);

    expect(result.success).toBe(true);
    expect(result.filesWritten).toBe(2);
    expect(await backend.readFile('team.md')).toBe('# Team');
  });

  it('should handle overwrites based on options', async () => {
    await backend.writeFile('team.md', 'old content');
    const state = makeState({ 'team.md': 'new content' });

    // Overwrite disabled — should report error
    const result1 = await importState(backend, state, { overwrite: false });
    expect(result1.errors.length).toBeGreaterThan(0);
    expect(await backend.readFile('team.md')).toBe('old content');

    // Overwrite enabled — should succeed
    const result2 = await importState(backend, state, { overwrite: true });
    expect(result2.success).toBe(true);
    expect(await backend.readFile('team.md')).toBe('new content');
  });

  it('should rollback on partial failure', async () => {
    // Create a backend where writing a specific path will fail
    const failBackend = new FilesystemBackend(tmpDir);
    const origWrite = failBackend.writeFile.bind(failBackend);
    let callCount = 0;
    failBackend.writeFile = async (p: string, c: string) => {
      callCount++;
      if (callCount === 2) throw new Error('Disk full');
      return origWrite(p, c);
    };

    const state = makeState({ 'a.txt': 'a', 'b.txt': 'b' });
    const result = await importState(failBackend, state, { rollbackOnError: true });

    expect(result.success).toBe(false);
    expect(result.filesWritten).toBe(0);
  });

  it('should verify files written when requested', async () => {
    const state = makeState({ 'team.md': '# Team' });
    const result = await importState(backend, state, { verify: true });
    expect(result.success).toBe(true);
  });

  it('should return accurate file counts in result', async () => {
    const state = makeState({ 'a.md': 'a', 'b.md': 'b', 'c/d.md': 'd' });
    const result = await importState(backend, state);
    expect(result.filesWritten).toBe(3);
    expect(result.bytesWritten).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });
});
