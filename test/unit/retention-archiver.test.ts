import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { archiveOldLogs, parseLogEntry, isEntryOlderThan } from '../../src/core/retention-archiver.js';
import type { RetentionPolicy } from '../../src/types.js';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('RetentionArchiver', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;
  const policy: RetentionPolicy = {
    maxAgeDays: 30,
    archiveDir: 'archive',
    enabled: true,
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-archive-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should archive logs older than retention policy threshold', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old' });
    const recentEntry = JSON.stringify({ timestamp: daysAgo(5), message: 'recent' });
    await backend.writeFile('orchestration-log/run.log', `${oldEntry}\n${recentEntry}\n`);

    const report = await archiveOldLogs(backend, policy);
    expect(report.filesArchived).toBe(1);
    expect(report.bytesArchived).toBeGreaterThan(0);

    // Check that archive has the old entry
    const archiveContent = await backend.readFile('archive/orchestration-log/run.log');
    expect(archiveContent).toContain('old');

    // Check that original only has recent entry
    const remaining = await backend.readFile('orchestration-log/run.log');
    expect(remaining).toContain('recent');
    expect(remaining).not.toContain('"old"');
  });

  it('should preserve recent logs', async () => {
    const recentEntry = JSON.stringify({ timestamp: daysAgo(5), message: 'recent' });
    await backend.writeFile('orchestration-log/run.log', `${recentEntry}\n`);

    const report = await archiveOldLogs(backend, policy);
    expect(report.filesArchived).toBe(0);

    const content = await backend.readFile('orchestration-log/run.log');
    expect(content).toContain('recent');
  });

  it('should handle partial log files', async () => {
    const validEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old' });
    await backend.writeFile('orchestration-log/run.log', `not a log entry\n${validEntry}\n`);

    const report = await archiveOldLogs(backend, policy);
    expect(report.entriesProcessed).toBe(2);
  });

  it('should not re-archive already archived logs', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old' });
    await backend.writeFile('orchestration-log/run.log', `${oldEntry}\n`);

    // Archive once
    await archiveOldLogs(backend, policy);
    // Archive again — original is now empty, nothing to archive
    const report2 = await archiveOldLogs(backend, policy);
    expect(report2.filesArchived).toBe(0);
  });

  it('should return accurate archive report', async () => {
    const oldEntry = JSON.stringify({ timestamp: daysAgo(60), message: 'old' });
    await backend.writeFile('orchestration-log/run.log', `${oldEntry}\n`);

    const report = await archiveOldLogs(backend, policy);
    expect(report).toHaveProperty('filesArchived');
    expect(report).toHaveProperty('bytesArchived');
    expect(report).toHaveProperty('entriesProcessed');
    expect(report).toHaveProperty('archivePath', 'archive');
    expect(report.entriesProcessed).toBe(1);
  });

  it('should parse JSON log entries', () => {
    const entry = parseLogEntry('{"timestamp":"2024-01-01T00:00:00.000Z","msg":"hi"}');
    expect(entry).not.toBeNull();
    expect(entry!.timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should parse CSV log entries', () => {
    const entry = parseLogEntry('2024-01-01T00:00:00.000Z,some data,more');
    expect(entry).not.toBeNull();
    expect(entry!.timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should return null for unparseable entries', () => {
    expect(parseLogEntry('just random text no date')).toBeNull();
  });

  it('should correctly identify old entries', () => {
    expect(isEntryOlderThan(daysAgo(60), 30)).toBe(true);
    expect(isEntryOlderThan(daysAgo(5), 30)).toBe(false);
    expect(isEntryOlderThan('invalid-date', 30)).toBe(false);
  });
});
