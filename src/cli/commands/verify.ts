/**
 * CLI Command: squad state verify
 * Validate state integrity and report issues
 */

import type { StateBackend, IntegrityReport } from '../../types.js';
import { checkStateIntegrity } from '../../core/integrity-checker.js';

export interface VerifyResult {
  exitCode: number;
  report: IntegrityReport;
  formatted: string;
}

const FIX_SUGGESTIONS: Record<string, string> = {
  'Required file missing': 'Create the missing file with default content',
  'Invalid JSON': 'Fix the JSON syntax error in the file',
  'Unexpected file': 'Remove the file or move it to an appropriate location',
};

export async function verifyCommand(backend: StateBackend): Promise<VerifyResult> {
  const report = await checkStateIntegrity(backend);

  const lines: string[] = [];

  if (report.isValid && report.warnings.length === 0) {
    lines.push('✓ All checks passed.');
    lines.push(report.summary);
    return { exitCode: 0, report, formatted: lines.join('\n') };
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const err of report.errors) {
      lines.push(`  ✗ [${err.severity}] ${err.file}: ${err.message}`);
      const suggestion = Object.entries(FIX_SUGGESTIONS).find(([key]) =>
        err.message.includes(key)
      );
      if (suggestion) {
        lines.push(`    Fix: ${suggestion[1]}`);
      }
    }
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warn of report.warnings) {
      lines.push(`  ⚠ [${warn.severity}] ${warn.file}: ${warn.message}`);
      const suggestion = Object.entries(FIX_SUGGESTIONS).find(([key]) =>
        warn.message.includes(key)
      );
      if (suggestion) {
        lines.push(`    Fix: ${suggestion[1]}`);
      }
    }
  }

  lines.push('');
  lines.push(report.summary);

  const exitCode = report.errors.some((e) => e.severity === 'critical') ? 1 : 0;

  return { exitCode, report, formatted: lines.join('\n') };
}
