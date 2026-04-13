# Quick Start Guide — State Backend Manager

This guide walks you through setting up the State Backend Manager and migrating your Squad state backend.

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later
- **Git** 2.0.0 or later (for git-based backends)
- An existing Squad project with `.squad/` directory

## Setup

### 1. Clone the Repository

```bash
cd /path/to/your/workspace
git clone https://github.com/bradygaster/project-squad-sdk-example-state-backend.git
cd project-squad-sdk-example-state-backend
```

### 2. Install Dependencies

```bash
npm install
```

Expected output:
```
added 42 packages in 3s
```

### 3. Build the Project

```bash
npm run build
```

Expected output:
```
✓ src/index.ts compiled successfully
```

### 4. Run Tests

```bash
npm test
```

Expected output:
```
✓ test/unit/backend-resolver.test.ts (5)
✓ test/unit/state-exporter.test.ts (3)
✓ test/unit/state-importer.test.ts (3)
✓ test/unit/migrator.test.ts (4)
✓ test/unit/integrity-checker.test.ts (4)
✓ test/unit/status-inspector.test.ts (3)
✓ test/unit/retention-policy.test.ts (3)
✓ test/unit/retention-archiver.test.ts (3)
✓ test/cli/backend-set.test.ts (4)
✓ test/cli/migrate.test.ts (4)
✓ test/cli/status.test.ts (3)
✓ test/cli/verify.test.ts (4)
✓ test/cli/retention-set.test.ts (3)
✓ test/e2e/migration-roundtrip.test.ts (6)
✓ test/e2e/retention-archival.test.ts (3)

PASS  All tests passed!
```

## Migrate Your State Backend

### Step 1: Check Your Current Backend

```bash
squad state status
```

Expected output (if on filesystem backend):
```
Backend:      filesystem
State Size:   2.3 MB
File Count:   47
Last Write:   2024-01-15T10:22:33Z
Health:       ✓ All checks passed
```

### Step 2: Verify State Integrity

```bash
squad state verify
```

Expected output:
```
Checking state integrity...
✓ team.md valid
✓ decisions.md valid
✓ agents/ (12 files) valid
✓ orchestration-log valid
✓ context valid

Result: All checks passed
```

### Step 3: Run Migration

To migrate from filesystem to git-notes (recommended for most teams):

```bash
squad state migrate filesystem git-notes
```

Expected output:
```
Initiating migration: filesystem → git-notes

Pre-migration checks:
  ✓ Source backend accessible (2.3 MB)
  ✓ Target backend ready (0 MB)

Exporting state from filesystem...
  ✓ Exported 47 files (2.3 MB)
  ✓ Checksum: 8f4e9d2c7b1a6f3e9c2d8a1b

Importing state to git-notes...
  ✓ Imported 47 files (2.3 MB)
  ✓ Checksum: 8f4e9d2c7b1a6f3e9c2d8a1b

Verification:
  ✓ Checksums match
  ✓ File counts match (47 = 47)

Migration Summary:
  Status:     COMPLETED
  Duration:   3.2s
  Files:      47 moved
  Size:       2.3 MB
  Verified:   ✓ Yes

Updating configuration...
  ✓ backend set to "git-notes" in squad.yaml

✅ Migration successful! Your state is now stored in git notes.
```

### Step 4: Verify After Migration

```bash
squad state status
```

Expected output (after successful migration):
```
Backend:      git-notes
State Size:   2.3 MB
File Count:   47
Last Write:   2024-01-15T10:25:18Z
Health:       ✓ All checks passed
```

```bash
squad state verify
```

Expected output:
```
Checking state integrity...
✓ team.md valid
✓ decisions.md valid
✓ agents/ (12 files) valid
✓ orchestration-log valid
✓ context valid

Result: All checks passed
```

### Step 5: Set Retention Policy (Optional)

To automatically archive logs older than 30 days:

```bash
squad state retain --max-age 30d
```

Expected output:
```
Setting retention policy...
  maxAgeDays: 30
  archiveDir: archive/
  enabled: true

✓ Retention policy updated in squad.yaml
```

To verify the retention policy is working, you can manually trigger archival:

```bash
squad state retain --apply
```

Expected output:
```
Running retention archival...
  Processing orchestration-log...
  ✓ Found 5 entries older than 30 days
  ✓ Archived 5 entries to archive/orchestration-log-2024-01-15.json
  ✓ Freed 412 KB

Summary:
  Files archived: 1
  Bytes freed:    412 KB
  Duration:       0.8s
```

## Rollback (If Needed)

If you need to revert to your previous backend during migration testing:

```bash
squad state migrate git-notes filesystem
```

This will reverse the migration with the same verification and checksums.

## Common Tasks

### Check Backend Types Supported

```bash
squad state backend list
```

Output:
```
Available backends:
  • filesystem   (default)
  • git-notes    (recommended)
  • orphan-branch
  • external-repo
```

### Switch Backend Later

To change backends after initial setup:

```bash
squad state backend set git-notes
squad state migrate filesystem git-notes
```

### View State Health Report

```bash
squad state status --full
```

Output includes:
- Backend type and version
- State size and file count
- Last modification timestamp
- Integrity check results
- Recent errors (if any)
- Retention policy status

### Export State for Backup

```bash
squad state export state-backup.json
```

This creates a portable JSON file you can version control or store externally.

### Import State from Backup

```bash
squad state import state-backup.json
```

This restores state from a previously exported file.

## Troubleshooting

### Migration Hangs

If a migration seems stuck:
1. Open a new terminal and check git status:
   ```bash
   git status
   ```
2. Look for any file locks or git operations in progress
3. Cancel the migration (Ctrl+C) and check logs:
   ```bash
   less ~/.squad/logs/migration-*.log
   ```

### State Integrity Errors

If `squad state verify` reports errors:

```bash
# Get detailed error information
squad state verify --verbose
```

Common issues:
- **Invalid JSON** — Corrupted file, fix manually or restore from backup
- **Missing required files** — Reinitialize with `squad init`
- **Orphaned files** — Safe to clean up with `squad state verify --clean`

### Permission Errors

Ensure you have write access to `.squad/` and the git repository:

```bash
# Check permissions
ls -la .squad/
git status
```

For git-notes backend, ensure you have push permissions to the repository.

## Next Steps

1. **Read the [README.md](./README.md)** for comprehensive documentation
2. **Explore CLI commands** — all commands support `--help`:
   ```bash
   squad state --help
   squad state migrate --help
   ```
3. **Set up CI/CD integration** — automate retention archival and verification
4. **Configure team notifications** — get alerts when migration or archival runs

## Getting Help

For issues or questions:
1. Check logs in `.squad/logs/`
2. Run with verbose flag: `squad state --verbose <command>`
3. Review [README.md](./README.md) Architecture section
4. Open an issue on GitHub with your error log

## Key Concepts

- **Backend** — Where `.squad/` state is stored (filesystem, git-notes, etc.)
- **Migration** — Moving state from one backend to another with verification
- **Retention Policy** — Rules for automatically archiving old state files
- **Integrity Check** — Validation that state structure is correct and uncorrupted
- **Verification** — Comparing checksums before/after migration to ensure no data loss

---

**Happy managing! 🚀**
