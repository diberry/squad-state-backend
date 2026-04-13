# State Backend Manager

A reference implementation for managing Squad SDK state backends. This example demonstrates how teams can choose where Squad state lives (filesystem, git-notes, orphan branches, or external repositories), migrate between backends with verification, enforce retention policies, and validate state integrity—all through configuration and simple CLI commands.

## Using This Example

### Installation

**Prerequisites:** Node.js 18+, npm 9+

```bash
npm install
npm run build
```

### Check Backend Status

See what backend is currently active and verify its health:

```bash
# Show backend type, file count, size, and integrity status
npx squad-state status

# Example output:
# Backend: git-notes
# Files: 12
# Size: 4,096 bytes
# Last Write: 2024-01-15 10:30:00
# Healthy: yes
# Integrity: valid
```

### Migrate Between Backends

Move state from one backend to another with automatic verification:

```bash
# Perform migration from filesystem to git-notes
npx squad-state migrate filesystem git-notes

# Example output:
# Migration complete: 12 files transferred from filesystem to git-notes (4096 bytes, 42ms)
```

### Verify State Integrity

Check for corruption, missing files, or invalid JSON:

```bash
npx squad-state verify

# Example output:
# ✓ All checks passed.
# All checks passed. 12 files validated.
```

### Set Retention Policies

Configure automatic archival of old logs:

```bash
# Keep logs for 30 days
npx squad-state retain --max-age 30

# Example output:
# Retention policy set: max age 30 days, archive to .squad/archive
```

---

## Extending This Example

### Adding a Custom Backend

Implement the `StateBackend` interface from `src/types.ts`:

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

Register it in `src/core/backend-resolver.ts` to make it discoverable.

### Integrating with Real Git Backends

This example uses simulated backends (filesystem directories). Production implementations:

**Git Notes Backend** — Store state in git notes:
```bash
git notes --ref=squad-state add -f -m "$(cat state.json)" HEAD
git notes --ref=squad-state show HEAD
```

**Orphan Branch Backend** — Store state on an orphan git branch:
```bash
git checkout --orphan squad-state
git rm -rf .
echo '{}' > state.json && git commit -m "Update"
```

**External Repository Backend** — Clone/pull a dedicated state repo, write, commit, push.

See `src/core/state-exporter.ts` and `src/core/state-importer.ts` for migration orchestration patterns.

### Programmatic API

All capabilities are available as importable TypeScript functions:

```typescript
import {
  resolveBackend,
  getCurrentBackendType,
  inspectBackendStatus,
  checkStateIntegrity,
  migrateBackend,
} from './dist/index.js';

const backendType = await getCurrentBackendType('/path/to/project');
const backend = await resolveBackend({ backendType, config: { rootDir: '/path' } });
const status = await inspectBackendStatus(backend, backendType);
const integrity = await checkStateIntegrity(backend);
```

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                 Programmatic API Layer                       │
│ statusCommand | migrateCommand | verifyCommand | etc.        │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────────┐
│                 Orchestration Layer                          │
│ Migrator | StatusInspector | IntegrityChecker | Archiver     │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────────┐
│                 Core Service Layer                           │
│ BackendResolver | StateExporter | StateImporter | Policies   │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────────┐
│          Simulated Backends (filesystem directories)         │
│ FilesystemBackend | GitNotesBackend | OrphanBranchBackend    │
└──────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── index.ts                 # Barrel export (public API)
├── types.ts                 # All interfaces (StateBackend, StatusReport, etc.)
├── core/                    # Core service layer
│   ├── backend-resolver.ts       # Resolve backend from config
│   ├── state-exporter.ts         # Export state from any backend
│   ├── state-importer.ts         # Import state to any backend
│   ├── migrator.ts               # Backend-to-backend migration orchestration
│   ├── integrity-checker.ts      # Validate JSON, detect corruption
│   ├── status-inspector.ts       # Report health metrics
│   ├── retention-policy.ts       # Parse retention configuration
│   └── retention-archiver.ts     # Auto-archive old logs
└── cli/                     # CLI command layer
    ├── main.ts                   # CLI entrypoint (squad-state binary)
    ├── index.ts                  # Command registration
    └── commands/
        ├── backend-set.ts        # Change backend type
        ├── status.ts             # Show backend health
        ├── migrate.ts            # Execute migration
        ├── verify.ts             # Run integrity checks
        └── retention-set.ts      # Configure retention
```

## SDK Modules

This project integrates with Squad SDK:

| Module | Purpose | Status |
|--------|---------|--------|
| `state.WorktreeBackend` | Filesystem state storage | Implemented (real) |
| `state.GitNotesBackend` | Git notes state storage | Simulated (filesystem) |
| `state.OrphanBranchBackend` | Orphan branch state storage | Simulated (filesystem) |
| `state.resolveStateBackend()` | Auto-select backend | Implemented |
| `storage.FSStorageProvider` | Filesystem I/O | Used directly |

---

## Testing

```bash
# Run all tests
npm run test

# Interactive test UI
npm run test:ui

# Watch mode
npm run test -- --watch
```

Tests cover:
- **Unit tests** (`test/unit/`) — Core logic and utilities
- **CLI tests** (`test/cli/`) — Command parsing and execution
- **E2E tests** (`test/e2e/`) — Full migration workflows

---

## Roadmap

- [x] Simulated backend implementations (filesystem directories)
- [x] Backend resolution and discovery
- [x] State migration with pre/post verification
- [x] Integrity validation (JSON, required files, orphaned data)
- [x] Retention policies and auto-archival
- [x] CLI command interface
- [ ] Real git-notes backend (requires `nodegit` or `isomorphic-git`)
- [ ] Real orphan-branch backend (requires git worktree integration)
- [ ] External repository backend (requires remote auth/sync)
- [ ] Performance benchmarks for large state volumes
- [ ] State compression and delta sync

---

## License

Proprietary — Squad SDK Example Project

**Links:** [Squad SDK](https://github.com/bradygaster/squad-sdk) · [Quick Start](./QUICKSTART.md)
