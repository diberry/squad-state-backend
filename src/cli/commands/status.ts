/**
 * CLI Command: squad state status
 * Display current backend and state health
 */

import type { StateBackend, StatusReport, IntegrityReport } from '../../types.js';
import { inspectBackendStatus } from '../../core/status-inspector.js';
import { checkStateIntegrity } from '../../core/integrity-checker.js';

export interface StatusResult {
  status: StatusReport;
  integrity: IntegrityReport;
  formatted: string;
}

export async function statusCommand(
  backend: StateBackend,
  backendType: string,
  options?: { json?: boolean }
): Promise<StatusResult> {
  const status = await inspectBackendStatus(backend, backendType);
  const integrity = await checkStateIntegrity(backend);

  if (options?.json) {
    const formatted = JSON.stringify({ status, integrity }, null, 2);
    return { status, integrity, formatted };
  }

  const lines = [
    `Backend: ${status.backend}`,
    `Files: ${status.fileCount}`,
    `Size: ${status.stateSizeBytes} bytes`,
    `Last Write: ${status.lastWriteAt}`,
    `Healthy: ${status.isHealthy ? 'yes' : 'no'}`,
    `Integrity: ${integrity.isValid ? 'valid' : 'issues found'}`,
  ];

  if (!status.isHealthy || !integrity.isValid) {
    lines.push('');
    if (integrity.errors.length > 0) {
      lines.push('Errors:');
      for (const err of integrity.errors) {
        lines.push(`  - [${err.severity}] ${err.file}: ${err.message}`);
      }
    }
    if (integrity.warnings.length > 0) {
      lines.push('Warnings:');
      for (const warn of integrity.warnings) {
        lines.push(`  - [${warn.severity}] ${warn.file}: ${warn.message}`);
      }
    }
  }

  return { status, integrity, formatted: lines.join('\n') };
}
