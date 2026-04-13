import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { archiveOldLogs } from '../../src/core/retention-archiver.js';
import type { RetentionPolicy } from '../../src/types.js';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('E2E: retention policy and archival', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;
  const policy: RetentionPolicy = {
    maxAgeDays: 30,
    archiveDir: 'archive',
    enabled: true,
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-e2e-retain-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should archive old logs and preserve recent ones', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old log' });
    const recentEntry = JSON.stringify({ timestamp: daysAgo(5), message: 'recent log' });
    await backend.writeFile('orchestration-log/run1.log', `${oldEntry}\n${recentEntry}\n`);

    const report = await archiveOldLogs(backend, policy);
    expect(report.filesArchived).toBe(1);

    const archived = await backend.readFile('archive/orchestration-log/run1.log');
    expect(archived).toContain('old log');

    const remaining = await backend.readFile('orchestration-log/run1.log');
    expect(remaining).toContain('recent log');
    expect(remaining).not.toContain('old log');
  });

  it('should create archive directory with proper structure', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old' });
    await backend.writeFile('orchestration-log/run1.log', `${oldEntry}\n`);

    await archiveOldLogs(backend, policy);
    expect(await backend.exists('archive/orchestration-log/run1.log')).toBe(true);
  });

  it('should handle large logs efficiently', async () => {
    const lines: string[] = [];
    for (let i = 0; i < 100; i++) {
      const age = i < 50 ? 60 : 5;
      lines.push(JSON.stringify({ timestamp: daysAgo(age), message: `entry-${i}` }));
    }
    await backend.writeFile('orchestration-log/big.log', lines.join('\n') + '\n');

    const report = await archiveOldLogs(backend, policy);
    expect(report.entriesProcessed).toBe(100);
    expect(report.filesArchived).toBe(1);
  });

  it('should be idempotent', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old' });
    const recentEntry = JSON.stringify({ timestamp: daysAgo(5), message: 'recent' });
    await backend.writeFile('orchestration-log/run1.log', `${oldEntry}\n${recentEntry}\n`);

    await archiveOldLogs(backend, policy);
    const report2 = await archiveOldLogs(backend, policy);
    // Second run should not archive anything new
    expect(report2.filesArchived).toBe(0);
  });

  it('should report accurate bytes archived', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old data here' });
    await backend.writeFile('orchestration-log/run1.log', `${oldEntry}\n`);

    const report = await archiveOldLogs(backend, policy);
    expect(report.bytesArchived).toBeGreaterThan(0);
    expect(report.bytesArchived).toBe(Buffer.byteLength(oldEntry + '\n', 'utf-8'));
  });
});
