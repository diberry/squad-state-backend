import { describe, it, expect } from 'vitest';
import {
  parseRetentionPolicy,
  validateRetentionPolicy,
  parseDuration,
  DEFAULT_RETENTION_POLICY,
} from '../../src/core/retention-policy.js';

describe('RetentionPolicy', () => {
  it('should load and validate retention policy from config', () => {
    const policy = parseRetentionPolicy({ maxAgeDays: 30 });
    expect(policy.maxAgeDays).toBe(30);
    expect(policy.enabled).toBe(false);
    expect(policy.archiveDir).toBe('.squad/archive');
  });

  it('should apply default policy when missing', () => {
    const policy = parseRetentionPolicy({});
    expect(policy.maxAgeDays).toBe(DEFAULT_RETENTION_POLICY.maxAgeDays);
    expect(policy.archiveDir).toBe(DEFAULT_RETENTION_POLICY.archiveDir);
    expect(policy.enabled).toBe(DEFAULT_RETENTION_POLICY.enabled);
  });

  it('should reject invalid max age values', () => {
    expect(() => parseRetentionPolicy({ maxAgeDays: 0 })).toThrow('Invalid retention policy');
    expect(() => parseRetentionPolicy({ maxAgeDays: -5 })).toThrow('Invalid retention policy');
  });

  it('should parse duration strings correctly', () => {
    expect(parseDuration('30d')).toBe(30);
    expect(parseDuration('7d')).toBe(7);
    expect(parseDuration('1y')).toBe(365);
    expect(parseDuration('2w')).toBe(14);
    expect(parseDuration('6m')).toBe(180);
  });

  it('should return normalized policy', () => {
    const policy = parseRetentionPolicy({
      maxAgeDays: 60,
      archiveDir: '/custom/archive',
      enabled: true,
    });
    expect(policy).toEqual({
      maxAgeDays: 60,
      archiveDir: '/custom/archive',
      enabled: true,
    });
  });

  it('should validate a correct policy', () => {
    expect(validateRetentionPolicy({ maxAgeDays: 30, archiveDir: '.squad/archive', enabled: true })).toBe(true);
  });

  it('should reject policy with empty archiveDir', () => {
    expect(validateRetentionPolicy({ maxAgeDays: 30, archiveDir: '', enabled: true })).toBe(false);
  });

  it('should throw on invalid duration format', () => {
    expect(() => parseDuration('abc')).toThrow('Invalid duration format');
    expect(() => parseDuration('')).toThrow('Invalid duration format');
    expect(() => parseDuration('30x')).toThrow('Invalid duration format');
  });
});
