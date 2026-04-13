/**
 * Backend resolver: determine current backend and create instances
 */

import type { StateBackend } from '@bradygaster/squad-sdk';

export interface BackendResolverOptions {
  backendType: 'filesystem' | 'git-notes' | 'orphan' | 'external';
  config?: Record<string, unknown>;
}

export async function resolveBackend(
  options: BackendResolverOptions
): Promise<StateBackend> {
  // TODO: Implement backend resolution
  // - Use state.resolveStateBackend() from SDK
  // - Handle all backend types
  // - Return typed backend instance
  throw new Error('Not implemented');
}

export async function getCurrentBackendType(): Promise<string> {
  // TODO: Implement current backend detection
  throw new Error('Not implemented');
}
