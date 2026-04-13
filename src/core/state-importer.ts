/**
 * State importer: import state into any backend from memory
 */

import type { StateBackend, SerializedState } from '../types.js';
import { computeChecksum } from './state-exporter.js';

export interface ImportOptions {
  overwrite?: boolean;
  verify?: boolean;
  rollbackOnError?: boolean;
}

export interface ImportResult {
  filesWritten: number;
  bytesWritten: number;
  errors: string[];
  success: boolean;
}

export async function importState(
  backend: StateBackend,
  state: SerializedState,
  options?: ImportOptions
): Promise<ImportResult> {
  const opts = {
    overwrite: true,
    verify: false,
    rollbackOnError: true,
    ...options,
  };

  const errors: string[] = [];
  let filesWritten = 0;
  let bytesWritten = 0;
  const writtenFiles: string[] = [];

  for (const [filePath, content] of state.files) {
    try {
      if (!opts.overwrite) {
        const fileExists = await backend.exists(filePath);
        if (fileExists) {
          errors.push(`File already exists (overwrite disabled): ${filePath}`);
          continue;
        }
      }
      await backend.writeFile(filePath, content);
      writtenFiles.push(filePath);
      filesWritten++;
      bytesWritten += Buffer.byteLength(content, 'utf-8');
    } catch (err) {
      const msg = `Failed to write ${filePath}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);

      if (opts.rollbackOnError) {
        // Rollback previously written files
        for (const written of writtenFiles) {
          try {
            await backend.deleteFile(written);
          } catch {
            // Best-effort rollback
          }
        }
        return {
          filesWritten: 0,
          bytesWritten: 0,
          errors,
          success: false,
        };
      }
    }
  }

  if (opts.verify && errors.length === 0) {
    const verifyChecksum = await verifyImport(backend, state);
    if (!verifyChecksum) {
      errors.push('Post-import verification failed: checksum mismatch');
    }
  }

  return {
    filesWritten,
    bytesWritten,
    errors,
    success: errors.length === 0,
  };
}

async function verifyImport(
  backend: StateBackend,
  originalState: SerializedState
): Promise<boolean> {
  const importedFiles = new Map<string, string>();
  for (const [filePath] of originalState.files) {
    try {
      const content = await backend.readFile(filePath);
      importedFiles.set(filePath, content);
    } catch {
      return false;
    }
  }
  const importedChecksum = computeChecksum(importedFiles);
  const originalChecksum = computeChecksum(originalState.files);
  return importedChecksum === originalChecksum;
}
