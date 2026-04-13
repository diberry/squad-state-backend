#!/usr/bin/env node
/**
 * CLI entrypoint for squad-state
 *
 * Commands:
 *   squad-state status              Show current backend, state size
 *   squad-state migrate <from> <to> Run migration between backends
 *   squad-state verify              Check state integrity
 *   squad-state retain --max-age N  Set retention policy (days)
 */

import { resolveBackend, getCurrentBackendType } from '../core/backend-resolver.js';
import { statusCommand } from './commands/status.js';
import { migrateCommand } from './commands/migrate.js';
import { verifyCommand } from './commands/verify.js';
import { retentionSetCommand } from './commands/retention-set.js';
import type { BackendType } from '../types.js';

function printUsage(): void {
  console.log(`Usage: squad-state <command> [options]

Commands:
  status                  Show current backend, state size, and health
  migrate <from> <to>     Migrate state between backends
  verify                  Check state integrity
  retain --max-age <days> Set retention policy

Backend types: filesystem, git-notes, orphan, external

Examples:
  squad-state status
  squad-state migrate filesystem git-notes
  squad-state verify
  squad-state retain --max-age 30`);
}

function parseArgs(argv: string[]): { command: string; args: string[]; flags: Record<string, string> } {
  // Skip node + script path
  const raw = argv.slice(2);
  const command = raw[0] || '';
  const args: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 1; i < raw.length; i++) {
    if (raw[i].startsWith('--')) {
      const key = raw[i].replace(/^--/, '');
      const value = raw[i + 1] && !raw[i + 1].startsWith('--') ? raw[++i] : 'true';
      flags[key] = value;
    } else {
      args.push(raw[i]);
    }
  }

  return { command, args, flags };
}

async function main(): Promise<void> {
  const { command, args, flags } = parseArgs(process.argv);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'status': {
        const backendType = await getCurrentBackendType();
        const backend = await resolveBackend({ backendType });
        const result = await statusCommand(backend, backendType);
        console.log(result.formatted);
        break;
      }

      case 'migrate': {
        const from = args[0];
        const to = args[1];
        if (!from || !to) {
          console.error('Error: migrate requires <from> and <to> arguments');
          console.error('Usage: squad-state migrate <from> <to>');
          process.exit(1);
        }
        const result = await migrateCommand({ from, to });
        console.log(result.message);
        if (!result.success) process.exit(1);
        break;
      }

      case 'verify': {
        const backendType = await getCurrentBackendType();
        const backend = await resolveBackend({ backendType });
        const result = await verifyCommand(backend);
        console.log(result.formatted);
        process.exit(result.exitCode);
        break;
      }

      case 'retain': {
        const maxAge = flags['max-age'];
        if (!maxAge) {
          console.error('Error: retain requires --max-age <days>');
          console.error('Usage: squad-state retain --max-age 30');
          process.exit(1);
        }
        const archiveDir = flags['archive-dir'];
        const result = await retentionSetCommand({
          maxAge: `${maxAge}d`,
          archiveDir,
        });
        console.log(result.message);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
