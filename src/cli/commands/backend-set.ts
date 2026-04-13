/**
 * CLI Command: squad state backend set <type>
 * Set the state backend type in configuration
 */

import type { BackendType } from '../../types.js';

const VALID_BACKEND_TYPES: readonly string[] = ['filesystem', 'git-notes', 'orphan', 'external'];

export interface BackendSetOptions {
  backendType: string;
}

export interface BackendSetResult {
  success: boolean;
  message: string;
  backendType: BackendType;
  config: Record<string, unknown>;
}

export async function backendSetCommand(
  options: BackendSetOptions,
  existingConfig: Record<string, unknown> = {}
): Promise<BackendSetResult> {
  if (!VALID_BACKEND_TYPES.includes(options.backendType)) {
    throw new Error(
      `Invalid backend type: "${options.backendType}". Valid types: ${VALID_BACKEND_TYPES.join(', ')}`
    );
  }

  const backendType = options.backendType as BackendType;
  const updatedConfig = { ...existingConfig, backend: backendType };

  return {
    success: true,
    message: `Backend set to "${backendType}" successfully.`,
    backendType,
    config: updatedConfig,
  };
}
