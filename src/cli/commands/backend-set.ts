/**
 * CLI Command: squad state backend set <type>
 * Set the state backend type in configuration
 */

export interface BackendSetOptions {
  backendType: 'filesystem' | 'git-notes' | 'orphan' | 'external';
}

export async function backendSetCommand(options: BackendSetOptions): Promise<void> {
  // TODO: Implement backend-set command
  // - Validate backend type
  // - Load existing config
  // - Update backend field
  // - Persist config (use config.saveConfig() or manual YAML write)
  // - Display success message with new backend type
  throw new Error('Not implemented');
}
