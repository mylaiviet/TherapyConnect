# TypeScript + Node.js Cache Issues - Troubleshooting Guide

## The Problem We Solved

### Symptoms
- Code changes not reflected when server restarts
- Hot-reload detects changes but runs old code
- "X is not a function" errors despite code being fixed
- Logs showing old error messages after file is updated

### Root Cause
**Double Caching Problem:**
1. **TypeScript Build Cache**: `tsconfig.tsbuildinfo` caches build metadata. When files are renamed or significantly changed, TypeScript may not detect cache invalidation.
2. **Node.js Module Cache**: `require.cache` stores loaded modules in memory to avoid filesystem reads on every require()
3. **Tool-Specific Cache**: ts-node-dev, nodemon, and other dev tools maintain their own compilation caches

### Our Specific Case
- Updated `therapistMatcher.ts` to return `{ therapists: [...], hasMore, total }`
- Fixed `stateMachine.ts` to destructure: `const { therapists } = await findMatchingTherapists()`
- File was updated on disk, but server continued executing old cached code
- Restarting server didn't help due to persistent build cache

---

## Solution Hierarchy (Most Effective First)

### 🔴 NUCLEAR OPTION (99% Success Rate)
**When to use:** Persistent cache issues, major refactoring, weird errors
```bash
npm run clean
npm run dev
```

**Or manually:**
```bash
rm -rf dist/
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo
rm -f tsconfig.build.tsbuildinfo
npm run dev
```

**Why it works:**
- Removes all compiled JavaScript (dist/)
- Clears Node module compilation cache
- Deletes TypeScript's build info cache
- Forces complete recompilation

---

### 🟡 STANDARD CLEAN (Use Before Each Dev Session)
```bash
npm run clean
npm run dev
```

**package.json setup:**
```json
{
  "scripts": {
    "clean": "rimraf dist tsconfig.tsbuildinfo node_modules/.cache",
    "dev": "npm run clean && tsx server/index.ts"
  },
  "devDependencies": {
    "rimraf": "^6.0.0"
  }
}
```

---

### 🟢 TYPESCRIPT FORCE REBUILD
```bash
tsc --build --force
```
Forces TypeScript to ignore cache and recompile all files.

---

### 🔵 PROGRAMMATIC CACHE CLEAR (Development Only)
Add to main server file (e.g., `server/index.ts`):
```typescript
// Clear specific modules from Node's require cache
if (process.env.NODE_ENV === 'development') {
  const modulesToClear = [
    'stateMachine',
    'therapistMatcher',
    // Add other frequently changed modules
  ];

  Object.keys(require.cache).forEach(key => {
    if (modulesToClear.some(mod => key.includes(mod))) {
      delete require.cache[key];
      console.log(`Cleared cache for: ${key}`);
    }
  });
}
```

---

## Prevention Strategies

### 1. Clean Build on Git Operations
Add to `.git/hooks/post-merge`:
```bash
#!/bin/bash
npm run clean
```

### 2. Pre-Start Cleanup
Always clean before starting dev:
```json
{
  "scripts": {
    "dev": "npm run clean && tsx server/index.ts",
    "prestart": "npm run clean"
  }
}
```

### 3. VSCode Integration
Add to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Clean TypeScript Cache",
      "type": "shell",
      "command": "npm run clean",
      "problemMatcher": []
    }
  ]
}
```

---

## Tool-Specific Issues

### tsx (Our Current Setup)
**Problem:** Doesn't always reload changed files correctly
**Solution:** Run clean before each dev session:
```json
{
  "scripts": {
    "dev": "npm run clean && tsx server/index.ts"
  }
}
```

### ts-node-dev
**Problem:** Doesn't always reload changed files correctly
**Solution:** Add flags:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only --exit-child --ignore-watch node_modules src/index.ts"
  }
}
```

**Flags explained:**
- `--respawn`: Restart on crashes
- `--transpile-only`: Skip type checking (faster, use `tsc --noEmit` separately)
- `--exit-child`: Kill child process completely on restart
- `--ignore-watch node_modules`: Don't watch node_modules

### nodemon + ts-node
**Problem:** Doesn't watch TypeScript files by default
**Solution:**
```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node ./src/index.ts"
}
```

---

## Cache Locations Reference

| Cache Type | Location | Purpose | Safe to Delete? |
|------------|----------|---------|-----------------|
| TypeScript build info | `tsconfig.tsbuildinfo` | Incremental compilation | ✅ Yes |
| Compiled output | `dist/` or `lib/` | JavaScript output | ✅ Yes |
| Node module cache | `node_modules/.cache` | Tool caches | ✅ Yes |
| Node require cache | In-memory: `require.cache` | Module loading | ⚠️ Runtime only |
| npm cache | `~/.npm` | Package downloads | ⚠️ Not usually needed |

---

## Debugging Commands

### Check what TypeScript is compiling
```bash
tsc --listFiles | grep -i "yourfile"
```

### See what nodemon is watching
```bash
nodemon --verbose
```

### Check Node require cache
```javascript
console.log(Object.keys(require.cache));
```

### Force module reload in REPL
```javascript
delete require.cache[require.resolve('./module')]
require('./module') // Fresh load
```

---

## Emergency Checklist

When code changes aren't reflected:

- [ ] Stop dev server completely (Ctrl+C)
- [ ] Run `npm run clean`
- [ ] Verify files are actually changed on disk: `cat src/yourfile.ts`
- [ ] Check if IDE has file watcher issues (restart IDE)
- [ ] Run `npm run dev` fresh
- [ ] Check if watching correct directory: `tsx --version`
- [ ] Verify no Docker volume caching (if using Docker)
- [ ] Last resort: Restart computer (clears all in-memory caches)

---

## Docker-Specific Issues

If running in Docker and hot reload fails:
```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - ./src:/app/src:cached  # Add :cached flag
      - /app/node_modules      # Prevent overwriting
```

Add to nodemon config:
```json
{
  "legacyWatch": true,
  "pollingInterval": 100
}
```

---

## References

- TypeScript Incremental Builds: https://www.typescriptlang.org/docs/handbook/project-references.html
- Node.js Module Caching: https://nodejs.org/api/modules.html#caching
- tsx Documentation: https://github.com/privatenumber/tsx

---

## Incident Log

| Date | Issue | Solution Applied | Success? |
|------|-------|------------------|----------|
| 2025-10-19 | stateMachine.ts changes not reflecting after fixing return type mismatch | Nuclear cleanup + updated package.json scripts | ✅ |

Add future incidents here for pattern recognition.
