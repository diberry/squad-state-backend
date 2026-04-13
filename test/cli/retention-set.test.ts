import { describe, it, expect } from 'vitest';
import { retentionSetCommand } from '../../src/cli/commands/retention-set.js';

describe('CLI: retention-set command', () => {
  it('should parse duration and set retention policy', async () => {
    const result = await retentionSetCommand({ maxAge: '30d' });
    expect(result.success).toBe(true);
    expect(result.policy.maxAgeDays).toBe(30);
    expect(result.policy.enabled).toBe(true);
  });

  it('should support multiple duration formats', async () => {
    const r1 = await retentionSetCommand({ maxAge: '7d' });
    expect(r1.policy.maxAgeDays).toBe(7);

    const r2 = await retentionSetCommand({ maxAge: '1y' });
    expect(r2.policy.maxAgeDays).toBe(365);

    const r3 = await retentionSetCommand({ maxAge: '4w' });
    expect(r3.policy.maxAgeDays).toBe(28);
  });

  it('should reject invalid durations', async () => {
    await expect(retentionSetCommand({ maxAge: 'abc' })).rejects.toThrow('Invalid duration format');
  });

  it('should persist policy to config', async () => {
    const existing = { team: 'my-team' };
    const result = await retentionSetCommand({ maxAge: '30d' }, existing);
    expect(result.config.retentionPolicy).toBeDefined();
    expect(result.config.team).toBe('my-team');
    const rp = result.config.retentionPolicy as Record<string, unknown>;
    expect(rp.maxAgeDays).toBe(30);
  });

  it('should display confirmation with policy details', async () => {
    const result = await retentionSetCommand({ maxAge: '90d' });
    expect(result.message).toContain('90');
    expect(result.message).toContain('Retention policy set');
  });

  it('should accept custom archive dir', async () => {
    const result = await retentionSetCommand({ maxAge: '30d', archiveDir: '/custom/path' });
    expect(result.policy.archiveDir).toBe('/custom/path');
  });
});
