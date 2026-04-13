import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { checkStateIntegrity, validateJson, REQUIRED_STATE_FILES } from '../../src/core/integrity-checker.js';

describe('IntegrityChecker', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-integrity-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should detect corrupted JSON files', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');
    await backend.writeFile('context/data.json', '{invalid json');

    const report = await checkStateIntegrity(backend);
    expect(report.errors.some((e) => e.message.includes('Invalid JSON'))).toBe(true);
  });

  it('should detect orphaned files', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');
    await backend.writeFile('random-unknown-file.txt', 'data');

    const report = await checkStateIntegrity(backend);
    expect(report.warnings.some((w) => w.message.includes('Unexpected file'))).toBe(true);
  });

  it('should verify required files exist', async () => {
    // No files at all
    const report = await checkStateIntegrity(backend);
    const missingErrors = report.errors.filter((e) => e.message.includes('Required file missing'));
    expect(missingErrors.length).toBe(REQUIRED_STATE_FILES.length);
  });

  it('should handle empty state gracefully', async () => {
    const report = await checkStateIntegrity(backend);
    expect(report).toBeDefined();
    expect(report.isValid).toBe(false); // missing required files
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('should return comprehensive integrity report', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const report = await checkStateIntegrity(backend);
    expect(report).toHaveProperty('isValid');
    expect(report).toHaveProperty('errors');
    expect(report).toHaveProperty('warnings');
    expect(report).toHaveProperty('summary');
    expect(typeof report.summary).toBe('string');
  });

  it('should pass checks for clean state', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const report = await checkStateIntegrity(backend);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.summary).toContain('All checks passed');
  });

  it('should validate valid JSON', () => {
    expect(validateJson('{"key": "value"}', 'test.json')).toBe(true);
  });

  it('should throw on invalid JSON', () => {
    expect(() => validateJson('{bad', 'test.json')).toThrow('Invalid JSON');
  });
});
