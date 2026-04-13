/**
 * CLI Command: squad state retain --max-age <duration>
 * Set retention policy for state archival
 */

import { parseDuration, parseRetentionPolicy } from '../../core/retention-policy.js';
import type { RetentionPolicy } from '../../types.js';

export interface RetentionSetOptions {
  maxAge: string;
  archiveDir?: string;
}

export interface RetentionSetResult {
  success: boolean;
  message: string;
  policy: RetentionPolicy;
  config: Record<string, unknown>;
}

export async function retentionSetCommand(
  options: RetentionSetOptions,
  existingConfig: Record<string, unknown> = {}
): Promise<RetentionSetResult> {
  const maxAgeDays = parseDuration(options.maxAge);

  const policy = parseRetentionPolicy({
    maxAgeDays,
    archiveDir: options.archiveDir,
    enabled: true,
  });

  const updatedConfig = {
    ...existingConfig,
    retentionPolicy: {
      maxAgeDays: policy.maxAgeDays,
      archiveDir: policy.archiveDir,
      enabled: policy.enabled,
    },
  };

  return {
    success: true,
    message: `Retention policy set: max age ${policy.maxAgeDays} days, archive to ${policy.archiveDir}`,
    policy,
    config: updatedConfig,
  };
}
