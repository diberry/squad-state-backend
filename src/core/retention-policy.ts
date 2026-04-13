/**
 * Retention policy: load, validate, and manage retention configuration
 */

import type { RetentionPolicy } from '../types.js';

export interface RetentionPolicyInput {
  maxAgeDays?: number;
  archiveDir?: string;
  enabled?: boolean;
}

export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  maxAgeDays: 90,
  archiveDir: '.squad/archive',
  enabled: false,
};

export function parseRetentionPolicy(
  input: RetentionPolicyInput | Record<string, unknown>
): RetentionPolicy {
  const maxAgeDays = typeof input.maxAgeDays === 'number' ? input.maxAgeDays : DEFAULT_RETENTION_POLICY.maxAgeDays;
  const archiveDir = typeof input.archiveDir === 'string' ? input.archiveDir : DEFAULT_RETENTION_POLICY.archiveDir;
  const enabled = typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_RETENTION_POLICY.enabled;

  const policy: RetentionPolicy = { maxAgeDays, archiveDir, enabled };

  if (!validateRetentionPolicy(policy)) {
    throw new Error(`Invalid retention policy: maxAgeDays must be > 0, got ${maxAgeDays}`);
  }

  return policy;
}

export function validateRetentionPolicy(policy: RetentionPolicy): boolean {
  if (policy.maxAgeDays <= 0) return false;
  if (!policy.archiveDir || policy.archiveDir.trim() === '') return false;
  return true;
}

export function parseDuration(durationStr: string): number {
  const match = durationStr.match(/^(\d+)([dwmy])$/i);
  if (!match) {
    throw new Error(`Invalid duration format: "${durationStr}". Expected format: 30d, 7w, 6m, 1y`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'd': return value;
    case 'w': return value * 7;
    case 'm': return value * 30;
    case 'y': return value * 365;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}
