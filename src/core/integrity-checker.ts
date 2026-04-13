/**
 * Integrity checker: validate state consistency and detect issues
 */

import type { StateBackend, IntegrityReport, ValidationError, ValidationWarning } from '../types.js';

export const REQUIRED_STATE_FILES = [
  'team.md',
  'decisions.md',
];

const KNOWN_STATE_PATHS = [
  'team.md',
  'decisions.md',
  'agents/',
  'orchestration-log/',
  'history/',
  'context/',
];

export interface IntegrityCheckOptions {
  checkSchemas?: boolean;
  checkForOrphaned?: boolean;
}

export async function checkStateIntegrity(
  backend: StateBackend,
  options?: IntegrityCheckOptions
): Promise<IntegrityReport> {
  const opts = { checkSchemas: true, checkForOrphaned: true, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required files exist
  for (const requiredFile of REQUIRED_STATE_FILES) {
    const fileExists = await backend.exists(requiredFile);
    if (!fileExists) {
      errors.push({
        file: requiredFile,
        severity: 'critical',
        message: `Required file missing: ${requiredFile}`,
      });
    }
  }

  // List all files and validate
  const allFiles = await backend.listFiles();

  for (const filePath of allFiles) {
    // Validate JSON files
    if (opts.checkSchemas && filePath.endsWith('.json')) {
      try {
        const content = await backend.readFile(filePath);
        validateJson(content, filePath);
      } catch {
        errors.push({
          file: filePath,
          severity: 'error',
          message: `Invalid JSON in file: ${filePath}`,
        });
      }
    }

    // Check for orphaned files
    if (opts.checkForOrphaned) {
      const isKnown = KNOWN_STATE_PATHS.some(
        (known) => filePath === known || filePath.startsWith(known)
      );
      if (!isKnown) {
        warnings.push({
          file: filePath,
          severity: 'warning',
          message: `Unexpected file found: ${filePath}`,
        });
      }
    }
  }

  const isValid = errors.length === 0;
  const summary = isValid
    ? `All checks passed. ${allFiles.length} files validated.`
    : `Found ${errors.length} error(s) and ${warnings.length} warning(s).`;

  return { isValid, errors, warnings, summary };
}

export function validateJson(content: string, filePath: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    throw new Error(`Invalid JSON in ${filePath}`);
  }
}
