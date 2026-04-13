/**
 * State exporter: export state from any backend into memory
 */

import type { StateBackend } from '@bradygaster/squad-sdk';
import type { SerializedState } from '../types.js';

export async function exportState(backend: StateBackend): Promise<SerializedState> {
  // TODO: Implement state export
  // - Use sharing.export() from SDK
  // - Collect all .squad/ files (team.md, decisions.md, agents/, orchestration-log, history, context)
  // - Handle missing files gracefully
  // - Compute MD5 checksum for verification
  // - Return SerializedState with metadata
  throw new Error('Not implemented');
}

export async function exportStateWithMetadata(
  backend: StateBackend,
  backendName: string
): Promise<SerializedState> {
  // TODO: Implement export with additional metadata
  throw new Error('Not implemented');
}
