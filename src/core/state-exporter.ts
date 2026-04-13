/**
 * State exporter: export state from any backend into memory
 */

import * as crypto from 'node:crypto';
import type { StateBackend, SerializedState } from '../types.js';

export async function exportState(backend: StateBackend): Promise<SerializedState> {
  return exportStateWithMetadata(backend, backend.name);
}

export async function exportStateWithMetadata(
  backend: StateBackend,
  backendName: string
): Promise<SerializedState> {
  const files = new Map<string, string>();
  const allFiles = await backend.listFiles();

  for (const filePath of allFiles) {
    try {
      const content = await backend.readFile(filePath);
      files.set(filePath, content);
    } catch {
      // Skip files that can't be read (permission issues, etc.)
    }
  }

  const checksumMd5 = computeChecksum(files);

  return {
    files,
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedFrom: backendName,
      checksumMd5,
    },
  };
}

export function computeChecksum(files: Map<string, string>): string {
  const hash = crypto.createHash('md5');
  const sortedKeys = [...files.keys()].sort();
  for (const key of sortedKeys) {
    hash.update(key);
    hash.update(files.get(key)!);
  }
  return hash.digest('hex');
}
