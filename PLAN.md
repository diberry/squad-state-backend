# State Backend Manager — TDD Implementation Plan

## Project Overview

An enterprise-grade state management tool built on Squad SDK that lets teams:
- Choose where `.squad/` state lives (filesystem, git-notes, orphan branch, external repo)
- Migrate between backends with verification
- Manage retention policies and archival
- Validate state integrity

**Target:** Enterprise teams with compliance requirements, branch protection constraints, and state noise concerns.

---

## SDK Modules Verified & Available

| Module | Purpose | Status |
|--------|---------|--------|
| `state.WorktreeBackend` | State stored in git worktree | ✅ Solid |
| `state.GitNotesBackend` | State stored in git notes (out-of-tree) | ✅ Solid |
| `state.OrphanBranchBackend` | State stored on an orphan branch | ✅ Solid |
| `state.resolveStateBackend()` | Auto-select backend based on config | ✅ Solid |
| `storage.FSStorageProvider` | Filesystem read/write | ✅ Solid |
| `storage.SQLiteStorageProvider` | SQLite-based persistence | ✅ Solid |
| `sharing.export` / `sharing.import` | Export/import squad definitions | ✅ Solid |
| `config.loadConfig()` | Config with backend selection | ✅ Solid |

---

## Known Gaps to Build

These features are **NOT** provided by the SDK and must be implemented:
1. **Migration between backends** — export from source, import to target with verification
2. **Retention policies** — auto-archive logs/orchestration-log older than N days
3. **Backend health checks & diagnostics** — validate and report backend status
4. **CLI commands** — surface backend management to users
5. **Integrity validation** — detect corrupted JSON, orphaned files, state mismatches

---

## Phase 1: MVP (P0) — Core Backend Management

### Feature 1.1: Backend Type Resolution

**Test Name:** `should resolve correct backend from configuration`
- **Assertion:** Given a config with `backend: "git-notes"`, resolveStateBackend() returns a GitNotesBackend instance
- **Other cases:** filesystem, orphan-branch, external-repo backends resolve correctly

**Implementation:**
- Create `src/core/backend-resolver.ts`
- Wrap `state.resolveStateBackend()` to add type coercion and error handling
- Handle missing config (default to filesystem)
- Return typed backend instances

---

### Feature 1.2: State Export (Source-Agnostic)

**Test Name:** `should export state from any backend into memory`
- **Assertion:** Export all `.squad/` directories (team.md, decisions.md, agents/, orchestration-log, history, context) from any backend into a SerializedState object
- **Other cases:** Handle empty state, missing files, partial state gracefully

**Implementation:**
- Create `src/core/state-exporter.ts`
- Use `sharing.export()` from SDK
- Define `SerializedState` interface (files map + metadata)
- Handle errors and report which files were skipped

---

### Feature 1.3: State Import (Target-Agnostic)

**Test Name:** `should import state into any backend from memory`
- **Assertion:** Take a SerializedState object and write all files to target backend
- **Other cases:** Handle overwrites, verify files written, roll back on partial failure

**Implementation:**
- Create `src/core/state-importer.ts`
- Use `sharing.import()` from SDK
- Transaction-like semantics: all files succeed or rollback
- Return import summary with file counts

---

### Feature 1.4: Backend Migration (Orchestrator)

**Test Name:** `should migrate state from one backend to another with verification`
- **Assertion:** Migrate state from WorktreeBackend → GitNotesBackend; verify source + target states match
- **Other cases:** All backend pairs (6 total), handle locked state, verify checksums

**Implementation:**
- Create `src/core/migrator.ts`
- Orchestrate: resolve source → export → resolve target → import → verify
- Store pre/post migration checksums for audit
- Return migration report with status, duration, file counts

---

### Feature 1.5: State Integrity Validator

**Test Name:** `should detect corrupted JSON and orphaned files`
- **Assertion:** Scan state directory; report files with invalid JSON, missing expected files, unexpected files
- **Other cases:** Empty state passes, large files, symlinks handled

**Implementation:**
- Create `src/core/integrity-checker.ts`
- Read each file, validate JSON schema
- Check for required files (team.md, decisions.md)
- Detect orphaned or unexpected files
- Return detailed report per file

---

### Feature 1.6: Backend Status & Health

**Test Name:** `should report backend type, state size, and last write time`
- **Assertion:** Status shows backend type, total state size in MB, timestamp of last modification, file count
- **Other cases:** Handle uninitialized state, git operations failing, permission errors

**Implementation:**
- Create `src/core/status-inspector.ts`
- Query backend for metadata (commit time for git-based, fs stat for worktree)
- Sum file sizes recursively
- Return StatusReport interface with all metadata

---

### Feature 1.7: Retention Policy Configuration

**Test Name:** `should load and validate retention policy from config`
- **Assertion:** Given `{ retentionPolicy: { maxAgeDays: 30 } }`, parse and return retention rule
- **Other cases:** Invalid values rejected, default policy applied if missing

**Implementation:**
- Create `src/core/retention-policy.ts`
- Define RetentionPolicy interface (maxAgeDays, archiveDir, etc.)
- Validate against schema (days > 0, archiveDir valid)
- Return normalized policy

---

### Feature 1.8: Retention Archival Engine

**Test Name:** `should archive logs older than retention policy threshold`
- **Assertion:** Given maxAgeDays: 30, move orchestration-log entries older than 30 days to archive/
- **Other cases:** Partial log files, missing timestamps, archived logs not re-archived

**Implementation:**
- Create `src/core/retention-archiver.ts`
- Parse log file timestamps (JSON or CSV format)
- Identify entries older than threshold
- Move to archive subdirectory with timestamp in name
- Return archive report (files moved, bytes archived)

---

### Feature 1.9: CLI Command — Backend Set

**Test Name:** `should accept 'squad state backend set <type>' and persist config`
- **Assertion:** Command sets config.backend to "git-notes", writes to squad.yaml, returns confirmation
- **Other cases:** Invalid backend type rejected, existing config merged

**Implementation:**
- Create `src/cli/commands/backend-set.ts`
- Parse command arguments (filesystem|git-notes|orphan|external)
- Load existing config, update backend field
- Write back with `config.saveConfig()` or manual YAML write
- Return success message

---

### Feature 1.10: CLI Command — Migrate

**Test Name:** `should accept 'squad state migrate <from> <to>' and execute migration`
- **Assertion:** Command migrates state, verifies result, updates config, returns report
- **Other cases:** Same backend rejected, migration fails gracefully with rollback

**Implementation:**
- Create `src/cli/commands/migrate.ts`
- Parse from/to backend types
- Call migrator orchestrator
- Update config to new backend
- Display detailed report (files, size, time, verification result)

---

### Feature 1.11: CLI Command — Status

**Test Name:** `should display current backend and state health`
- **Assertion:** `squad state status` shows backend type, size, last write, file count, validation result
- **Other cases:** No state files returns "not initialized"

**Implementation:**
- Create `src/cli/commands/status.ts`
- Call status-inspector
- Call integrity-checker for health
- Format output as table or JSON
- Include any warnings (corrupted files, outdated state)

---

### Feature 1.12: CLI Command — Verify

**Test Name:** `should validate state integrity and report issues`
- **Assertion:** `squad state verify` runs integrity checker and displays all problems in human-readable format
- **Other cases:** Clean state returns "all checks passed"

**Implementation:**
- Create `src/cli/commands/verify.ts`
- Call integrity-checker
- Format issues with line numbers, severity levels
- Suggest fixes for common issues
- Exit with error code if any critical issues found

---

### Feature 1.13: CLI Command — Retention Set

**Test Name:** `should accept 'squad state retain --max-age 30d' and persist policy`
- **Assertion:** Command parses duration, sets policy, persists to config, returns confirmation
- **Other cases:** Invalid durations rejected, policy applied on next state write

**Implementation:**
- Create `src/cli/commands/retention-set.ts`
- Parse duration string (30d, 7d, 1y formats)
- Convert to days
- Update config with retention policy
- Persist and display current policy

---

## Phase 2: Verification & Testing

### Feature 2.1: E2E Migration Test

**Test Name:** `should successfully migrate through all backend pairs`
- **Assertion:** Generate sample state, run migrations Worktree→GitNotes→Orphan→Worktree, verify state unchanged
- **Integration:** Real git repo (temp), real files

**Implementation:**
- Create `test/e2e/migration-roundtrip.test.ts`
- Use @bradygaster/squad-sdk real backends
- Create temporary git repo
- Assert state integrity at each step

---

### Feature 2.2: Retention Policy E2E

**Test Name:** `should archive old logs and preserve recent ones`
- **Assertion:** Create log with entries from 60 days ago and 5 days ago; run retention with 30d max-age; verify old entry archived, recent entry preserved
- **Integration:** Real filesystem

**Implementation:**
- Create `test/e2e/retention-archival.test.ts`
- Generate mock orchestration-log with dated entries
- Run archival engine
- Verify file structure and timestamps

---

## Test File Structure

```
test/
├── unit/
│   ├── backend-resolver.test.ts
│   ├── state-exporter.test.ts
│   ├── state-importer.test.ts
│   ├── migrator.test.ts
│   ├── integrity-checker.test.ts
│   ├── status-inspector.test.ts
│   ├── retention-policy.test.ts
│   └── retention-archiver.test.ts
├── cli/
│   ├── backend-set.test.ts
│   ├── migrate.test.ts
│   ├── status.test.ts
│   ├── verify.test.ts
│   └── retention-set.test.ts
└── e2e/
    ├── migration-roundtrip.test.ts
    └── retention-archival.test.ts
```

---

## Source File Structure

```
src/
├── index.ts                 (barrel export)
├── types.ts                 (all interfaces)
├── core/
│   ├── backend-resolver.ts
│   ├── state-exporter.ts
│   ├── state-importer.ts
│   ├── migrator.ts
│   ├── integrity-checker.ts
│   ├── status-inspector.ts
│   ├── retention-policy.ts
│   └── retention-archiver.ts
└── cli/
    ├── commands/
    │   ├── backend-set.ts
    │   ├── migrate.ts
    │   ├── status.ts
    │   ├── verify.ts
    │   └── retention-set.ts
    └── index.ts             (register commands)
```

---

## Implementation Order & Dependencies

1. **Phase 1.1–1.3** (No dependencies): Backend resolver, exporter, importer
2. **Phase 1.4** (Depends on 1.1–1.3): Migrator orchestrator
3. **Phase 1.5–1.8** (No dependencies): Integrity checker, status inspector, retention policy, retention archiver
4. **Phase 1.9–1.13** (Depends on 1.1–1.8): CLI commands
5. **Phase 2** (E2E testing after all core features)

---

## Success Criteria

- ✅ All tests pass (unit + E2E)
- ✅ No data loss during migration (verified by checksum comparison)
- ✅ State integrity checks catch all common issues (corrupted JSON, orphaned files, missing required files)
- ✅ CLI is intuitive and provides clear feedback
- ✅ All P0 features working end-to-end
- ✅ Build succeeds with no warnings

---

## Notes for Implementation

1. **Error Handling:** All features must handle errors gracefully (locked state, permission issues, missing files, network errors for external backends)
2. **Logging:** Debug logs for every step (useful for troubleshooting migrations)
3. **Rollback:** Migration failures must not leave state in intermediate state
4. **Type Safety:** Strict TypeScript with no `any` types
5. **Dependencies:** Only use `@bradygaster/squad-sdk` for backend access; don't duplicate backend logic
