import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { migrateState, validateMigration } from '../../src/core/migrator.js';
import { exportState } from '../../src/core/state-exporter.js';

describe('E2E: migration roundtrip', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-e2e-migrate-'));
  });

  it('should successfully migrate through all backend pairs', async () => {
    // Create source with sample state
    const dir1 = path.join(tmpDir, 'backend1');
    const dir2 = path.join(tmpDir, 'backend2');
    const dir3 = path.join(tmpDir, 'backend3');

    const b1 = new FilesystemBackend(dir1, 'filesystem');
    const b2 = new FilesystemBackend(dir2, 'git-notes');
    const b3 = new FilesystemBackend(dir3, 'orphan');

    await b1.writeFile('team.md', '# Team\n- Alice\n- Bob');
    await b1.writeFile('decisions.md', '# Decisions\n- Use TypeScript');
    await b1.writeFile('agents/scribe.md', '# Scribe Agent');

    // Migrate filesystem → git-notes
    const r1 = await migrateState(b1, b2, 'filesystem', 'git-notes');
    expect(r1.success).toBe(true);
    expect(r1.checksumMatch).toBe(true);

    // Migrate git-notes → orphan
    const r2 = await migrateState(b2, b3, 'git-notes', 'orphan');
    expect(r2.success).toBe(true);
    expect(r2.checksumMatch).toBe(true);

    // Verify final state matches original
    const valid = await validateMigration(b1, b3);
    expect(valid).toBe(true);
  });

  it('should preserve state integrity across backends', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    const src = new FilesystemBackend(srcDir, 'filesystem');
    const dst = new FilesystemBackend(dstDir, 'git-notes');

    await src.writeFile('team.md', '# Team');
    const originalState = await exportState(src);

    await migrateState(src, dst, 'filesystem', 'git-notes');
    const migratedState = await exportState(dst);

    expect(migratedState.metadata.checksumMd5).toBe(originalState.metadata.checksumMd5);
  });

  it('should handle realistic state with multiple agents', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    const src = new FilesystemBackend(srcDir);
    const dst = new FilesystemBackend(dstDir);

    await src.writeFile('team.md', '# Team\n- Alice (Scribe)\n- Bob (Architect)');
    await src.writeFile('decisions.md', '# Decisions\n## 2024-01-01\nUse TDD');
    await src.writeFile('agents/scribe/charter.md', '# Scribe Charter');
    await src.writeFile('agents/architect/charter.md', '# Architect Charter');
    await src.writeFile('context/project.md', '# Project Context');

    const report = await migrateState(src, dst, 'filesystem', 'git-notes');
    expect(report.success).toBe(true);
    expect(report.filesTransferred).toBe(5);
  });

  it('should recover from migration interruption', async () => {
    const srcDir = path.join(tmpDir, 'src');
    const dstDir = path.join(tmpDir, 'dst');
    const src = new FilesystemBackend(srcDir);
    const dst = new FilesystemBackend(dstDir);

    await src.writeFile('team.md', '# Team');
    await src.writeFile('decisions.md', '# Decisions');

    // Simulate write failure
    const origWrite = dst.writeFile.bind(dst);
    let count = 0;
    dst.writeFile = async (p: string, c: string) => {
      count++;
      if (count === 2) throw new Error('Simulated failure');
      return origWrite(p, c);
    };

    const report = await migrateState(src, dst, 'filesystem', 'git-notes');
    expect(report.success).toBe(false);
    // Source should be untouched
    expect(await src.readFile('team.md')).toBe('# Team');
  });
});
