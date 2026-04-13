# State Backend Manager

A **demonstration** state management tool built on Squad SDK that shows how teams could choose where `.squad/` state lives, migrate between backends with verification, manage retention policies, and validate state integrity.

> **⚠️ Simulated Backends:** The git-notes, orphan branch, and external repo backends are simulated using local filesystem directories. See [Production Integration](#production-integration) for what real backends would look like.

## What It Does

This project provides a reference implementation for managing Squad state backends:

- **Backend Resolution** — Select the correct backend based on configuration
- **State Export & Import** — Extract state from any backend and write to another with full fidelity
- **Backend Migration** — Migrate state between simulated backends with pre/post verification
- **State Integrity Validation** — Detect corrupted JSON, orphaned files, and missing required files
- **Backend Health Inspection** — Report backend type, state size, file count, and last modification time
- **Retention Policy Management** — Configure and enforce automatic archival of logs older than a specified threshold
- **Programmatic API** — All capabilities exposed as importable TypeScript functions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Programmatic API Layer                    │
│  statusCommand | migrateCommand | verifyCommand | etc.      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                   Orchestration Layer                       │
│  Migrator | Status Inspector | Integrity Checker | Archiver│
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│                    Core Service Layer                       │
│  Backend Resolver | State Exporter | State Importer         │
│  Retention Policy | Retention Archiver                      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│              Simulated Backends (filesystem dirs)           │
│  FilesystemBackend | GitNotesBackend (simulated)            │
│  OrphanBranchBackend (simulated) | ExternalRepoBackend (sim)│
└─────────────────────────────────────────────────────────────┘
```

## SDK Modules Used

This project demonstrates patterns that could integrate with these SDK modules:

| Module | Purpose | Status in This Example |
|--------|---------|----------------------|
| `state.WorktreeBackend` | State stored in git worktree | Simulated with filesystem |
| `state.GitNotesBackend` | State stored in git notes (out-of-tree) | Simulated with `.git-notes-state/` dir |
| `state.OrphanBranchBackend` | State stored on an orphan branch | Simulated with `.orphan-branch-state/` dir |
| `state.resolveStateBackend()` | Auto-select backend based on config | Simulated with directory detection |
| `storage.FSStorageProvider` | Filesystem read/write | Used directly |

## Project Structure

```
project-squad-sdk-example-state-backend/
├── src/
│   ├── index.ts                    # Barrel export
│   ├── types.ts                    # All interfaces (StateBackend, SerializedState, etc.)
│   ├── core/
│   │   ├── backend-resolver.ts     # Resolve backend from configuration
│   │   ├── state-exporter.ts       # Export state from any backend
│   │   ├── state-importer.ts       # Import state into any backend
│   │   ├── migrator.ts             # Orchestrate backend-to-backend migration
│   │   ├── integrity-checker.ts    # Validate state structure and JSON
│   │   ├── status-inspector.ts     # Report backend health metrics
│   │   ├── retention-policy.ts     # Parse and validate retention rules
│   │   └── retention-archiver.ts   # Auto-archive old logs
│   └── cli/
│       ├── index.ts                # Register CLI commands
│       └── commands/
│           ├── backend-set.ts      # Set backend configuration
│           ├── migrate.ts          # Execute migration
│           ├── status.ts           # Show backend status
│           ├── verify.ts           # Run integrity checks
│           └── retention-set.ts    # Configure retention policy
├── test/
│   ├── unit/                       # Unit tests for core modules
│   ├── cli/                        # CLI command tests
│   └── e2e/                        # End-to-end integration tests
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+ 
- npm 9+

### Install Dependencies

```bash
npm install
```

## Build

```bash
npm run build
```

This compiles TypeScript from `src/` to `dist/` with declarations.

## Test

```bash
npm run test
```

Run all unit, CLI, and end-to-end tests with Vitest.

For interactive UI:

```bash
npm run test:ui
```

## Configuration

State Backend Manager reads configuration from your Squad project's `squad.yaml` file:

```yaml
backend: git-notes  # Options: filesystem, git-notes, orphan-branch, external-repo

retentionPolicy:
  enabled: true
  maxAgeDays: 30
  archiveDir: archive/
```

### Backend Options

All non-filesystem backends are **simulated** using local directories for demonstration:

- **filesystem** — Store state in `.squad/` directory (default, real implementation)
- **git-notes** — _Simulated_ with `.git-notes-state/` directory (production: `git notes` commands)
- **orphan-branch** — _Simulated_ with `.orphan-branch-state/` directory (production: orphan git branches)
- **external-repo** — _Simulated_ with `.external-state/` directory (production: separate git repository)

### Retention Policy Options

- **maxAgeDays** — Archive logs older than this many days (default: 30)
- **archiveDir** — Directory within `.squad/` to archive old files (default: `archive/`)
- **enabled** — Enable/disable automatic archival (default: true)

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for step-by-step setup and migration guide.

## Usage

All capabilities are available as importable TypeScript functions:

```typescript
import {
  resolveBackend,
  getCurrentBackendType,
  inspectBackendStatus,
  checkStateIntegrity,
  migrateBackend,
} from 'project-squad-sdk-example-state-backend';

// Detect current backend
const backendType = await getCurrentBackendType('/path/to/project');
console.log(`Current backend: ${backendType}`);

// Resolve a backend instance
const backend = await resolveBackend({
  backendType: 'git-notes',
  config: { rootDir: '/path/to/project' },
});

// Check status
const status = await inspectBackendStatus(backend, backendType);
console.log(`Files: ${status.fileCount}, Healthy: ${status.isHealthy}`);

// Verify integrity
const integrity = await checkStateIntegrity(backend);
console.log(`Valid: ${integrity.isValid}`);
```

See [QUICKSTART.md](./QUICKSTART.md) for a complete walkthrough.

## Production Integration

This example uses simulated backends (filesystem directories). Here's what production implementations would look like:

### Git Notes Backend
A real git-notes backend would:
```bash
# Write state
git notes --ref=squad-state add -f -m "$(cat state.json)" HEAD

# Read state
git notes --ref=squad-state show HEAD

# List all state entries
git notes --ref=squad-state list
```
Implementation would shell out to `git notes` commands or use a git library (e.g., `isomorphic-git`, `nodegit`).

### Orphan Branch Backend
A real orphan-branch backend would:
```bash
# Create orphan branch (once)
git checkout --orphan squad-state
git rm -rf .

# Write state files, commit, switch back
echo '{}' > state.json
git add state.json && git commit -m "Update state"
git checkout -   # return to working branch
```
Implementation would use git worktrees or stash/checkout sequences to avoid disrupting the working directory.

### External Repository Backend
A real external-repo backend would:
- Clone or pull a dedicated state repository
- Write state files, commit, and push
- Use shallow clones for performance
- Handle authentication and remote configuration

### Extending This Example
To build a production backend, implement the `StateBackend` interface from `src/types.ts`:
```typescript
export interface StateBackend {
  readonly name: string;
  readFile(relativePath: string): Promise<string>;
  writeFile(relativePath: string, content: string): Promise<void>;
  deleteFile(relativePath: string): Promise<void>;
  listFiles(prefix?: string): Promise<string[]>;
  exists(relativePath: string): Promise<boolean>;
}
```

## Development

```bash
# Clean build artifacts
npm run clean

# Run tests in watch mode
npm run test -- --watch
```

## License

Proprietary — Squad SDK Example Project

## Links

- [Squad SDK Documentation](https://github.com/bradygaster/squad-sdk)
- [Quick Start Guide](./QUICKSTART.md)
