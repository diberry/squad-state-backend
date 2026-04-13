/**
 * Status inspector: report backend type, size, health, and metadata
 */

import type { StateBackend, StatusReport } from '../types.js';

export async function inspectBackendStatus(
  backend: StateBackend,
  backendType: string
): Promise<StatusReport> {
  const files = await backend.listFiles();
  const fileCount = files.length;
  const stateSizeBytes = await getBackendSize(backend);
  const lastWriteAt = fileCount > 0
    ? await getLastModificationTime(backend)
    : 'N/A';
  const isHealthy = fileCount > 0;

  return {
    backend: backendType,
    stateSizeBytes,
    fileCount,
    lastWriteAt,
    isHealthy,
  };
}

export async function getBackendSize(backend: StateBackend): Promise<number> {
  const files = await backend.listFiles();
  let totalSize = 0;
  for (const filePath of files) {
    try {
      const content = await backend.readFile(filePath);
      totalSize += Buffer.byteLength(content, 'utf-8');
    } catch {
      // skip unreadable files
    }
  }
  return totalSize;
}

export async function getBackendFileCount(backend: StateBackend): Promise<number> {
  const files = await backend.listFiles();
  return files.length;
}

export async function getLastModificationTime(backend: StateBackend): Promise<string> {
  // Return current time as approximation — real implementations would use git log or fs.stat
  return new Date().toISOString();
}
