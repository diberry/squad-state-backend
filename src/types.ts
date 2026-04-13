/**
 * Core types and interfaces for State Backend Manager
 */

/** Abstract backend interface for state storage */
export interface StateBackend {
  readonly name: string;
  readFile(relativePath: string): Promise<string>;
  writeFile(relativePath: string, content: string): Promise<void>;
  deleteFile(relativePath: string): Promise<void>;
  listFiles(prefix?: string): Promise<string[]>;
  exists(relativePath: string): Promise<boolean>;
}

export interface SerializedState {
  files: Map<string, string>;
  metadata: {
    exportedAt: string;
    exportedFrom: string;
    checksumMd5: string;
  };
}

export interface RetentionPolicy {
  maxAgeDays: number;
  archiveDir: string;
  enabled: boolean;
}

export interface StatusReport {
  backend: string;
  stateSizeBytes: number;
  fileCount: number;
  lastWriteAt: string;
  isHealthy: boolean;
}

export interface IntegrityReport {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

export interface ValidationError {
  file: string;
  severity: 'critical' | 'error';
  message: string;
}

export interface ValidationWarning {
  file: string;
  severity: 'warning' | 'info';
  message: string;
}

export interface MigrationReport {
  success: boolean;
  sourceBackend: string;
  targetBackend: string;
  filesTransferred: number;
  bytesTransferred: number;
  durationMs: number;
  checksumMatch: boolean;
  errors?: string[];
}

export interface ArchiveReport {
  filesArchived: number;
  bytesArchived: number;
  entriesProcessed: number;
  archivePath: string;
}

export type BackendType = 'filesystem' | 'git-notes' | 'orphan' | 'external';
