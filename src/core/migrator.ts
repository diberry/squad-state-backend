/**
 * Migrator: orchestrate state migration between backends
 */

import type { StateBackend, MigrationReport } from '../types.js';
import { exportState, computeChecksum } from './state-exporter.js';
import { importState } from './state-importer.js';

export interface MigrationOptions {
  verify?: boolean;
  updateConfig?: boolean;
}

export async function migrateState(
  sourceBackend: StateBackend,
  targetBackend: StateBackend,
  sourceName: string,
  targetName: string,
  options?: MigrationOptions
): Promise<MigrationReport> {
  const opts = { verify: true, updateConfig: false, ...options };
  const startTime = Date.now();
  const errors: string[] = [];

  if (sourceName === targetName) {
    return {
      success: false,
      sourceBackend: sourceName,
      targetBackend: targetName,
      filesTransferred: 0,
      bytesTransferred: 0,
      durationMs: Date.now() - startTime,
      checksumMatch: false,
      errors: ['Cannot migrate to the same backend type'],
    };
  }

  try {
    // Export from source
    const exportedState = await exportState(sourceBackend);
    const sourceChecksum = exportedState.metadata.checksumMd5;

    // Import to target
    const importResult = await importState(targetBackend, exportedState, {
      overwrite: true,
      verify: false,
      rollbackOnError: true,
    });

    if (!importResult.success) {
      return {
        success: false,
        sourceBackend: sourceName,
        targetBackend: targetName,
        filesTransferred: 0,
        bytesTransferred: 0,
        durationMs: Date.now() - startTime,
        checksumMatch: false,
        errors: importResult.errors,
      };
    }

    // Verify if requested
    let checksumMatch = false;
    if (opts.verify) {
      checksumMatch = await validateMigration(sourceBackend, targetBackend);
    }

    return {
      success: true,
      sourceBackend: sourceName,
      targetBackend: targetName,
      filesTransferred: importResult.filesWritten,
      bytesTransferred: importResult.bytesWritten,
      durationMs: Date.now() - startTime,
      checksumMatch: opts.verify ? checksumMatch : true,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    return {
      success: false,
      sourceBackend: sourceName,
      targetBackend: targetName,
      filesTransferred: 0,
      bytesTransferred: 0,
      durationMs: Date.now() - startTime,
      checksumMatch: false,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

export async function validateMigration(
  sourceBackend: StateBackend,
  targetBackend: StateBackend
): Promise<boolean> {
  try {
    const sourceFiles = await sourceBackend.listFiles();
    const targetFiles = await targetBackend.listFiles();

    if (sourceFiles.length !== targetFiles.length) return false;

    const sourceMap = new Map<string, string>();
    for (const f of sourceFiles) {
      sourceMap.set(f, await sourceBackend.readFile(f));
    }

    const targetMap = new Map<string, string>();
    for (const f of targetFiles) {
      targetMap.set(f, await targetBackend.readFile(f));
    }

    return computeChecksum(sourceMap) === computeChecksum(targetMap);
  } catch {
    return false;
  }
}
