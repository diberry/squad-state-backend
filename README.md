# State Backend Manager

An enterprise-grade state management tool built on Squad SDK that lets teams choose where `.squad/` state lives (filesystem, git-notes, orphan branch, external repo), migrate between backends with verification, manage retention policies, and validate state integrity.

## What It Does

This project provides a complete solution for managing Squad state backends with the following features:

- **Backend Resolution** — Automatically select the correct backend based on configuration
- **State Export & Import** — Extract state from any backend and write to another with full fidelity
- **Backend Migration** — Seamlessly migrate state between filesystem, git-notes, orphan branches, and external repositories with pre/post verification
- **State Integrity Validation** — Detect corrupted JSON, orphaned files, and missing required files
- **Backend Health Inspection** — Report backend type, state size, file count, and last modification time
- **Retention Policy Management** — Configure and enforce automatic archival of logs older than a specified threshold
- **CLI Commands** — Surface all capabilities through intuitive command-line interface

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Commands Layer                       │
│  backend-set | migrate | status | verify | retention-set   │
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
│                   Squad SDK Backends                        │
│  WorktreeBackend | GitNotesBackend | OrphanBranchBackend   │
│  ExternalRepoBackend | FSStorageProvider                    │
└─────────────────────────────────────────────────────────────┘
```

## SDK Modules Used

| Module | Purpose |
|--------|---------|
| `state.WorktreeBackend` | State stored in git worktree |
| `state.GitNotesBackend` | State stored in git notes (out-of-tree) |
| `state.OrphanBranchBackend` | State stored on an orphan branch |
| `state.resolveStateBackend()` | Auto-select backend based on config |
| `storage.FSStorageProvider` | Filesystem read/write |
| `storage.SQLiteStorageProvider` | SQLite-based persistence |
| `sharing.export()` / `sharing.import()` | Export/import squad definitions |
| `config.loadConfig()` | Load config with backend selection |

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

- **filesystem** — Store state in `.squad/` directory (default)
- **git-notes** — Store state in git notes, keeping repository clean
- **orphan-branch** — Store state on an orphan git branch
- **external-repo** — Store state in a separate repository

### Retention Policy Options

- **maxAgeDays** — Archive logs older than this many days (default: 30)
- **archiveDir** — Directory within `.squad/` to archive old files (default: `archive/`)
- **enabled** — Enable/disable automatic archival (default: true)

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for step-by-step setup and migration guide.

## Commands

All commands are available through the CLI:

```bash
# Show current backend and health status
squad state status

# Verify state integrity
squad state verify

# Migrate to a different backend
squad state migrate <from> <to>

# Set backend configuration
squad state backend set <type>

# Configure retention policy
squad state retain --max-age 30d
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
