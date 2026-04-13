import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import {
  inspectBackendStatus,
  getBackendSize,
  getBackendFileCount,
  getLastModificationTime,
} from '../../src/core/status-inspector.js';

describe('StatusInspector', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-status-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should report backend type', async () => {
    await backend.writeFile('team.md', '# Team');
    const status = await inspectBackendStatus(backend, 'filesystem');
    expect(status.backend).toBe('filesystem');
  });

  it('should calculate total state size', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const size = await getBackendSize(backend);
    expect(size).toBeGreaterThan(0);
    expect(size).toBe(
      Buffer.byteLength('# Team', 'utf-8') + Buffer.byteLength('# Decisions', 'utf-8')
    );
  });

  it('should count all state files', async () => {
    await backend.writeFile('a.md', 'a');
    await backend.writeFile('b.md', 'b');
    await backend.writeFile('sub/c.md', 'c');

    const count = await getBackendFileCount(backend);
    expect(count).toBe(3);
  });

  it('should get last modification time', async () => {
    await backend.writeFile('team.md', '# Team');
    const timestamp = await getLastModificationTime(backend);
    expect(new Date(timestamp).getTime()).not.toBeNaN();
  });

  it('should return comprehensive status report', async () => {
    await backend.writeFile('team.md', '# Team');

    const status = await inspectBackendStatus(backend, 'git-notes');
    expect(status).toHaveProperty('backend', 'git-notes');
    expect(status).toHaveProperty('stateSizeBytes');
    expect(status).toHaveProperty('fileCount');
    expect(status).toHaveProperty('lastWriteAt');
    expect(status).toHaveProperty('isHealthy');
    expect(status.stateSizeBytes).toBeGreaterThan(0);
    expect(status.fileCount).toBe(1);
  });

  it('should handle uninitialized state', async () => {
    const status = await inspectBackendStatus(backend, 'filesystem');
    expect(status.fileCount).toBe(0);
    expect(status.stateSizeBytes).toBe(0);
    expect(status.isHealthy).toBe(false);
    expect(status.lastWriteAt).toBe('N/A');
  });
});
