/**
 * CLI Command: squad state migrate <from> <to>
 * Migrate state from one backend to another
 */

import type { MigrationReport, BackendType } from '../../types.js';
import { resolveBackend } from '../../core/backend-resolver.js';
import { migrateState } from '../../core/migrator.js';

const VALID_BACKEND_TYPES: readonly string[] = ['filesystem', 'git-notes', 'orphan', 'external'];

export interface MigrateOptions {
  from: string;
  to: string;
  rootDir?: string;
}

export interface MigrateResult {
  success: boolean;
  message: string;
  report: MigrationReport;
}

export async function migrateCommand(options: MigrateOptions): Promise<MigrateResult> {
  if (!VALID_BACKEND_TYPES.includes(options.from)) {
    throw new Error(`Invalid source backend: "${options.from}"`);
  }
  if (!VALID_BACKEND_TYPES.includes(options.to)) {
    throw new Error(`Invalid target backend: "${options.to}"`);
  }
  if (options.from === options.to) {
    throw new Error(`Cannot migrate from "${options.from}" to the same backend type`);
  }

  const rootDir = options.rootDir || process.cwd();
  const sourceBackend = await resolveBackend({
    backendType: options.from as BackendType,
    config: { rootDir },
  });
  const targetBackend = await resolveBackend({
    backendType: options.to as BackendType,
    config: { rootDir },
  });

  const report = await migrateState(
    sourceBackend, targetBackend, options.from, options.to, { verify: true }
  );

  const message = report.success
    ? `Migration complete: ${report.filesTransferred} files transferred from ${options.from} to ${options.to} (${report.bytesTransferred} bytes, ${report.durationMs}ms)`
    : `Migration failed: ${report.errors?.join(', ')}`;

  return { success: report.success, message, report };
}
