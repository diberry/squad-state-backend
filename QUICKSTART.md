# Quick Start Guide — State Backend Manager

This guide walks you through using the State Backend Manager programmatically.

> **Note:** This project exposes a TypeScript API, not a CLI. All examples below use the programmatic interface.

## Prerequisites

- **Node.js** 18.0.0 or later
- **npm** 9.0.0 or later

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/bradygaster/project-squad-sdk-example-state-backend.git
cd project-squad-sdk-example-state-backend
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Run Tests

```bash
npx vitest run
```

## Programmatic Usage

### Check Current Backend Type

```typescript
import { getCurrentBackendType } from './dist/index.js';

const backendType = await getCurrentBackendType('/path/to/project');
console.log(`Current backend: ${backendType}`);
// Output: "filesystem", "git-notes", "orphan", or "external"
```

### Resolve a Backend Instance

```typescript
import { resolveBackend } from './dist/index.js';

const backend = await resolveBackend({
  backendType: 'filesystem',
  config: { rootDir: '/path/to/project/.squad' },
});

// Read/write state files
await backend.writeFile('team.md', '# My Team');
const content = await backend.readFile('team.md');
console.log(content); // "# My Team"
```

### Inspect Backend Status

```typescript
import { resolveBackend, inspectBackendStatus } from './dist/index.js';

const backend = await resolveBackend({
  backendType: 'filesystem',
  config: { rootDir: '/path/to/project/.squad' },
});

const status = await inspectBackendStatus(backend, 'filesystem');
console.log(`Files: ${status.fileCount}`);
console.log(`Size: ${status.stateSizeBytes} bytes`);
console.log(`Healthy: ${status.isHealthy}`);
```

### Verify State Integrity

```typescript
import { resolveBackend, checkStateIntegrity } from './dist/index.js';

const backend = await resolveBackend({
  backendType: 'filesystem',
  config: { rootDir: '/path/to/project/.squad' },
});

const integrity = await checkStateIntegrity(backend);
console.log(`Valid: ${integrity.isValid}`);
if (integrity.errors.length > 0) {
  for (const err of integrity.errors) {
    console.error(`[${err.severity}] ${err.file}: ${err.message}`);
  }
}
```

### Migrate Between Backends

```typescript
import { resolveBackend, migrateBackend } from './dist/index.js';

const source = await resolveBackend({
  backendType: 'filesystem',
  config: { rootDir: '/path/to/project/.squad' },
});

const target = await resolveBackend({
  backendType: 'git-notes',
  config: { rootDir: '/path/to/project' },
});

const report = await migrateBackend(source, target);
console.log(`Migration ${report.success ? 'succeeded' : 'failed'}`);
console.log(`Files transferred: ${report.filesTransferred}`);
console.log(`Checksums match: ${report.checksumMatch}`);
```

### Configure Retention Policy

```typescript
import { parseRetentionPolicy } from './dist/index.js';

const policy = parseRetentionPolicy({
  maxAgeDays: 30,
  archiveDir: 'archive/',
  enabled: true,
});

console.log(`Archive logs older than ${policy.maxAgeDays} days`);
```

## ⚠️ About Simulated Backends

The git-notes, orphan, and external backends are **simulated** using local filesystem directories:

| Backend | Simulated With | Production Would Use |
|---------|---------------|---------------------|
| `filesystem` | Real filesystem | Real filesystem |
| `git-notes` | `.git-notes-state/` dir | `git notes` commands |
| `orphan` | `.orphan-branch-state/` dir | Orphan git branches |
| `external` | `.external-state/` dir | Separate git repository |

The architecture, interfaces, and migration patterns are production-ready — only the backend implementations are simplified for demonstration.

See the [README Production Integration](./README.md#production-integration) section for details on building real backends.

## Next Steps

1. **Read the [README.md](./README.md)** for full API documentation
2. **Explore the tests** in `test/` for more usage examples
3. **Build a real backend** by implementing the `StateBackend` interface

---

**Happy managing! 🚀**
