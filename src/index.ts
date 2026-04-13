// — zero dependencies
// This is the barrel export for the State Backend Manager

export * from './types.js';
export * from './core/backend-resolver.js';
export * from './core/state-exporter.js';
export * from './core/state-importer.js';
export * from './core/migrator.js';
export * from './core/integrity-checker.js';
export * from './core/status-inspector.js';
export * from './core/retention-policy.js';
export * from './core/retention-archiver.js';
