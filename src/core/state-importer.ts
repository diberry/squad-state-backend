/**
 * State importer: import state into any backend from memory
 */

import type { StateBackend } from '@bradygaster/squad-sdk';
import type { SerializedState } from '../types.js';

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
  // TODO: Implement state import
  // - Use sharing.import() from SDK
  // - Write all files from SerializedState to target backend
  // - Handle overwrites based on options.overwrite
  // - Implement transaction-like rollback on partial failure
  // - Verify files written if options.verify is true
  // - Return ImportResult with counts and errors
  throw new Error('Not implemented');
}
