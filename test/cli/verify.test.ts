import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FilesystemBackend } from '../../src/core/backend-resolver.js';
import { verifyCommand } from '../../src/cli/commands/verify.js';

describe('CLI: verify command', () => {
  let tmpDir: string;
  let backend: FilesystemBackend;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-cli-verify-'));
    backend = new FilesystemBackend(tmpDir);
  });

  it('should validate state integrity', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const result = await verifyCommand(backend);
    expect(result.report.isValid).toBe(true);
  });

  it('should display errors and warnings grouped by severity', async () => {
    // Missing required files + orphaned file
    await backend.writeFile('unknown.txt', 'data');

    const result = await verifyCommand(backend);
    expect(result.formatted).toContain('Errors:');
    expect(result.formatted).toContain('critical');
    expect(result.formatted).toContain('Warnings:');
  });

  it('should suggest fixes for common issues', async () => {
    // Missing required files
    const result = await verifyCommand(backend);
    expect(result.formatted).toContain('Fix:');
  });

  it('should exit with code 0 for clean state', async () => {
    await backend.writeFile('team.md', '# Team');
    await backend.writeFile('decisions.md', '# Decisions');

    const result = await verifyCommand(backend);
    expect(result.exitCode).toBe(0);
    expect(result.formatted).toContain('All checks passed');
  });

  it('should exit with code 1 if critical issues found', async () => {
    // No required files at all
    const result = await verifyCommand(backend);
    expect(result.exitCode).toBe(1);
  });
});
