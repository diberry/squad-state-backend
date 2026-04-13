/**
 * Retention archiver: archive old logs based on retention policy
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StateBackend, ArchiveReport, RetentionPolicy } from '../types.js';

export async function archiveOldLogs(
  backend: StateBackend,
  policy: RetentionPolicy
): Promise<ArchiveReport> {
  const archivePath = policy.archiveDir;
  let filesArchived = 0;
  let bytesArchived = 0;
  let entriesProcessed = 0;

  // Find log files in orchestration-log/ and history/
  const allFiles = await backend.listFiles();
  const logFiles = allFiles.filter(
    (f) => f.startsWith('orchestration-log/') || f.startsWith('history/')
  );

  for (const logFile of logFiles) {
    try {
      const content = await backend.readFile(logFile);
      const lines = content.split('\n').filter((l) => l.trim().length > 0);

      const oldEntries: string[] = [];
      const recentEntries: string[] = [];

      for (const line of lines) {
        entriesProcessed++;
        const parsed = parseLogEntry(line);
        if (parsed && isEntryOlderThan(parsed.timestamp, policy.maxAgeDays)) {
          oldEntries.push(line);
        } else {
          recentEntries.push(line);
        }
      }

      if (oldEntries.length > 0) {
        // Write old entries to archive
        const archiveFilePath = `${archivePath}/${logFile}`;
        const archiveContent = oldEntries.join('\n') + '\n';

        // Check if archive already exists and append
        let existingContent = '';
        try {
          if (await backend.exists(archiveFilePath)) {
            existingContent = await backend.readFile(archiveFilePath);
          }
        } catch {
          // No existing archive
        }

        await backend.writeFile(archiveFilePath, existingContent + archiveContent);

        // Update original with only recent entries
        if (recentEntries.length > 0) {
          await backend.writeFile(logFile, recentEntries.join('\n') + '\n');
        } else {
          await backend.writeFile(logFile, '');
        }

        filesArchived++;
        bytesArchived += Buffer.byteLength(archiveContent, 'utf-8');
      }
    } catch {
      // Skip files that can't be processed
    }
  }

  return {
    filesArchived,
    bytesArchived,
    entriesProcessed,
    archivePath,
  };
}

export function parseLogEntry(
  line: string
): { timestamp: string; entry: string } | null {
  // Try JSON format: {"timestamp":"...", ...}
  try {
    const parsed = JSON.parse(line);
    if (parsed.timestamp) {
      return { timestamp: parsed.timestamp, entry: line };
    }
  } catch {
    // Not JSON
  }

  // Try CSV format: timestamp,data,...
  const csvMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.Z+-]+),(.*)$/);
  if (csvMatch) {
    return { timestamp: csvMatch[1], entry: line };
  }

  // Try simple date prefix: YYYY-MM-DD ...
  const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s+(.*)$/);
  if (dateMatch) {
    return { timestamp: dateMatch[1], entry: line };
  }

  return null;
}

export function isEntryOlderThan(
  timestamp: string,
  maxAgeDays: number
): boolean {
  const entryDate = new Date(timestamp);
  if (isNaN(entryDate.getTime())) return false;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  return entryDate < cutoffDate;
}

export async function moveToArchive(
  filePath: string,
  archiveDir: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.basename(filePath);
  const archiveName = `${timestamp}_${baseName}`;
  const archivePath = path.join(archiveDir, archiveName);

  await fs.promises.mkdir(archiveDir, { recursive: true });
  await fs.promises.rename(filePath, archivePath);

  return archivePath;
}
