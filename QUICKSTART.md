# Quick Start Guide — State Backend Manager

Get up and running with state backend management in 5 steps. No code writing required—everything is configured via CLI commands.

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later
- **Git** (for production backends)

## Setup

### 1. Install and Build

```bash
git clone https://github.com/bradygaster/project-squad-sdk-example-state-backend.git
cd project-squad-sdk-example-state-backend
npm install
npm run build
```

### 2. Run Tests (Optional)

Verify the build is working:

```bash
npm run test
```

---

## 5-Minute Tutorial

### Step 1: Check Backend Status

See what backend is active and verify state health:

```bash
npm run dev -- squad state status
```

**Expected output:**
```
Backend: filesystem
Files: 8
Size: 2,048 bytes
Last Write: 2024-01-15 10:15:00
Healthy: yes
Integrity: valid
```

If state is corrupted or missing files, you'll see warnings here.

---

### Step 2: Create Some State

Add test data so we have something to migrate:

```bash
npm run dev -- squad state backend set filesystem
npm run dev -- squad state create-sample
```

Check that files were created:

```bash
npm run dev -- squad state status
```

You should see file count increase.

---

### Step 3: Migrate to Git-Notes Backend

Move state from filesystem to a simulated git-notes backend:

```bash
npm run dev -- squad state migrate --target git-notes
```

**Expected output:**
```
Migration started: filesystem → git-notes
Files transferred: 8
Pre-migration integrity: valid
Post-migration integrity: valid
Checksums match: yes
Migration complete
```

The migration automatically:
- Reads all files from the source backend
- Writes them to the target backend
- Verifies both before and after
- Confirms checksums match

---

### Step 4: Verify State Integrity

Run a full integrity check on the new backend:

```bash
npm run dev -- squad state verify
```

**Expected output:**
```
✓ State integrity check passed
Files scanned: 8
JSON valid: 8/8
Required files present: yes
No orphaned data detected
```

If you want to see detailed results:

```bash
npm run dev -- squad state verify --json
```

---

### Step 5: Set Retention Policy

Configure automatic archival of old logs:

```bash
npm run dev -- squad state retention set --max-age-days 30 --archive-dir archive/
```

**Expected output:**
```
Retention policy configured
Max age: 30 days
Archive directory: .squad/archive/
Enabled: yes
```

Logs older than 30 days will be automatically moved to `.squad/archive/` on the next run.

---

## What's Happening Behind the Scenes

### Backends

This example includes four simulated backends stored in local directories:

| Backend | Location | Production Uses |
|---------|----------|-----------------|
| **filesystem** | `.squad/` | Real filesystem (default) |
| **git-notes** | `.git-notes-state/` | Git notes via `git notes` commands |
| **orphan** | `.orphan-branch-state/` | Orphan git branches |
| **external** | `.external-state/` | Separate git repository |

All backends implement the same `StateBackend` interface, so migrations between any two are transparent.

### State Files

The state directory typically contains:

```
.squad/
├── team.md              # Team information
├── agents/              # Agent configurations
│   ├── agent1.md
│   └── agent2.md
├── decisions.md         # Shared decisions
└── archive/             # Old logs (if retention enabled)
    └── decisions-2024-01-01.md
```

### Migration Process

```
1. Read state from source backend
   ↓
2. Validate JSON, check for corruption
   ↓
3. Export serialized state (files + metadata)
   ↓
4. Import to target backend
   ↓
5. Verify target backend state
   ↓
6. Confirm checksums match
```

If any step fails, the migration is aborted and the source backend remains unchanged.

---

## Exploring the API

For programmatic access, import functions directly:

```typescript
import {
  resolveBackend,
  getCurrentBackendType,
  inspectBackendStatus,
  checkStateIntegrity,
  migrateBackend,
} from './dist/index.js';

// Get current backend type
const backendType = await getCurrentBackendType('/path/to/project');
console.log(`Current: ${backendType}`); // "filesystem"

// Resolve backend instance
const backend = await resolveBackend({
  backendType: 'git-notes',
  config: { rootDir: '/path/to/project' },
});

// Check status
const status = await inspectBackendStatus(backend, 'git-notes');
console.log(`Files: ${status.fileCount}`);
```

See the full API in [README.md → Programmatic API](./README.md#programmatic-api).

---

## Troubleshooting

**"Migration failed: Integrity check failed"**
- The target backend has corrupted or incomplete state.
- Run `npm run dev -- squad state verify` to see details.
- Clear the target backend and retry.

**"Files don't match checksums"**
- State was corrupted during transfer.
- Verify both backends with `squad state verify`.
- Contact support if it persists.

**"Backend not found"**
- Ensure the backend directory exists: `.squad/`, `.git-notes-state/`, `.orphan-branch-state/`, or `.external-state/`.
- Set the backend explicitly: `npm run dev -- squad state backend set filesystem`

---

## Next Steps

- **Read the [README.md](./README.md)** for full API and architecture details
- **Explore CLI commands** — Try `npm run dev -- squad state --help`
- **Build a real backend** — Implement `StateBackend` interface for your git strategy
- **Run the test suite** — `npm run test` to see more usage examples
- **Check the source** — `src/core/` has well-commented implementations

---

**Happy managing! 🚀**
