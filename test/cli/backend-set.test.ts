import { describe, it, expect } from 'vitest';
import { backendSetCommand } from '../../src/cli/commands/backend-set.js';

describe('CLI: backend-set command', () => {
  it('should accept backend type and persist config', async () => {
    const result = await backendSetCommand({ backendType: 'git-notes' });
    expect(result.success).toBe(true);
    expect(result.backendType).toBe('git-notes');
    expect(result.config.backend).toBe('git-notes');
  });

  it('should reject invalid backend type', async () => {
    await expect(
      backendSetCommand({ backendType: 'invalid-type' })
    ).rejects.toThrow('Invalid backend type');
  });

  it('should merge with existing config', async () => {
    const existing = { team: 'my-team', version: '1.0' };
    const result = await backendSetCommand({ backendType: 'orphan' }, existing);
    expect(result.config.backend).toBe('orphan');
    expect(result.config.team).toBe('my-team');
    expect(result.config.version).toBe('1.0');
  });

  it('should return success confirmation', async () => {
    const result = await backendSetCommand({ backendType: 'filesystem' });
    expect(result.message).toContain('filesystem');
    expect(result.message).toContain('successfully');
  });

  it('should support all valid backend types', async () => {
    for (const type of ['filesystem', 'git-notes', 'orphan', 'external']) {
      const result = await backendSetCommand({ backendType: type });
      expect(result.backendType).toBe(type);
    }
  });
});
