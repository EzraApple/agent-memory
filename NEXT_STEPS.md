# Next Steps

Implementation roadmap for `@agent-memory/core`. Follow these phases in order.

---

## Phase 1: CI Setup

Set up GitHub Actions for continuous integration before writing implementation code.

### 1.1 Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run check

      - name: Build
        run: npm run build

      - name: Test
        run: npm test -- --run --passWithNoTests

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint
```

### 1.2 Add ESLint

```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

Create `eslint.config.js`:

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
);
```

Add to `package.json` scripts:

```json
"lint": "eslint src tests",
"lint:fix": "eslint src tests --fix"
```

### 1.3 Add Prettier (Optional)

```bash
npm install -D prettier eslint-config-prettier
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## Phase 2: Types & Config

Implement configuration validation and type exports.

### Tasks

1. **Verify Zod schemas** (`src/types.ts`)
   - Ensure all schemas match ARCHITECTURE.md spec
   - Add unit tests for schema validation
   - Test edge cases (missing fields, invalid types)

2. **Implement config loader** (`src/config.ts`)
   - Path resolution (`~` expansion)
   - Default value application
   - Validation error messages
   - Unit tests for config validation

### Tests to Write

```
tests/unit/config.test.ts
- validates required fields
- applies defaults correctly
- resolves ~ in paths
- rejects invalid hybridWeight (< 0 or > 1)
- requires apiKey for OpenAI embeddings
- requires baseUrl for Ollama embeddings
```

---

## Phase 3: Storage Layer

Implement file-based storage for sessions and memories.

### Tasks

1. **Session storage** (`src/storage/sessions.ts`)
   - `append()` - Write JSONL lines
   - `readChunk()` - Read slice of messages
   - `readAll()` - Read all messages
   - `getMeta()` / `setMeta()` - JSON metadata
   - `exists()` / `list()` - File operations

2. **Memory storage** (`src/storage/memories.ts`)
   - `create()` - Generate ID, write markdown
   - `read()` - Parse markdown + frontmatter
   - `update()` - Merge changes, update timestamp
   - `delete()` - Set tombstone flag
   - `exists()` / `list()` - File operations

### Tests to Write

```
tests/unit/storage.test.ts (mocked fs)
- calculates chunk count correctly
- parses JSONL format
- parses markdown frontmatter
- generates unique IDs

tests/integration/storage.test.ts (real fs, temp dir)
- creates session files on first append
- appends to existing sessions
- reads correct chunk by index
- writes and reads markdown memories
- handles special characters in content
```

---

## Phase 4: Providers

Implement embeddings and summarizer providers.

### Tasks

1. **Embeddings providers**
   - `OpenAIEmbeddings` - Call OpenAI API
   - `OllamaEmbeddings` - Call Ollama API
   - Factory function in `index.ts`

2. **Summarizer providers**
   - `OpenAISummarizer` - Call OpenAI chat API
   - `AnthropicSummarizer` - Call Anthropic API
   - Response parsing (summary + key facts)
   - Factory function in `index.ts`

### Tests to Write

```
tests/unit/providers.test.ts (mocked APIs)
- constructs with required config
- sets correct dimensions for model
- parses summarization response format
- throws ProviderError on API failure

tests/integration/providers.test.ts (env-gated: LIVE_TEST=1)
- generates real embeddings from OpenAI
- generates real summaries from OpenAI
```

---

## Phase 5: Search Layer

Implement LanceDB hybrid search.

### Tasks

1. **LanceDB wrapper** (`src/search/lancedb.ts`)
   - `init()` - Create tables, FTS indexes
   - `indexSession()` / `indexMemory()` - Insert records
   - `updateSession()` / `updateMemory()` - Update records
   - `remove()` - Soft delete
   - `search()` - Hybrid BM25 + vector search

### Tests to Write

```
tests/unit/search.test.ts (mocked LanceDB)
- normalizes distance to score correctly
- filters by type
- excludes deleted items
- sorts by score descending
- respects limit

tests/integration/search.test.ts (real LanceDB, temp dir)
- creates tables and indexes
- indexes and retrieves sessions
- indexes and retrieves memories
- hybrid search returns relevant results
```

---

## Phase 6: Memory Class

Wire everything together in the main API.

### Tasks

1. **Implement `Memory.init()`**
   - Validate config
   - Create directories
   - Initialize providers
   - Initialize search index

2. **Implement methods**
   - `ingestSession()` - Store, summarize, embed, index
   - `search()` - Query search index
   - `read()` - Read by chunk
   - `write()` - Create memory
   - `update()` - Update memory
   - `delete()` - Soft delete
   - `close()` - Cleanup

### Tests to Write

```
tests/integration/memory.test.ts (mocked providers)
- initializes and creates directories
- ingests session and indexes
- search returns indexed sessions
- read returns correct chunks
- write creates memory and indexes
- update modifies memory
- delete removes from search
```

---

## Phase 7: Tools

Implement tool definitions for agent frameworks.

### Tasks

1. **Verify tool schemas** (`src/tools/index.ts`)
   - Ensure Zod schemas match API
   - Test execute functions

2. **Add JSON Schema export**
   - Implement `toJSONSchema()` properly
   - Or add `zod-to-json-schema` dependency

### Tests to Write

```
tests/unit/tools.test.ts
- exports all required tools
- validates tool parameters
- execute functions call Memory methods correctly
```

---

## Phase 8: E2E Tests

Full workflow tests.

### Tests to Write

```
tests/e2e/workflows.test.ts
- full session lifecycle: ingest → search → read
- full memory lifecycle: write → search → read → update → delete
- multi-session search ranking
- large session chunking (150+ messages)
- mixed session and memory search
```

---

## Implementation Order

For each phase:

1. **Write tests first** (TDD approach)
2. **Implement until tests pass**
3. **Run full test suite** (`npm test`)
4. **Run type check** (`npm run check`)
5. **Run lint** (`npm run lint`)
6. **Commit with descriptive message**
7. **Push and verify CI passes**

---

## Quick Reference

```bash
# Development
npm run check      # Type check
npm run build      # Build to dist/
npm run lint       # Lint code
npm run lint:fix   # Fix lint issues

# Testing
npm test                        # Run all tests (watch mode)
npm test -- --run               # Run once
npm test -- --run tests/unit    # Run unit tests only
npm test -- --coverage          # With coverage report
LIVE_TEST=1 npm test            # Include live API tests

# Git workflow
git add <files>
git commit -m "feat: description"
git push
```

---

## Definition of Done

A phase is complete when:

- [ ] All tests pass (`npm test -- --run`)
- [ ] Type check passes (`npm run check`)
- [ ] Lint passes (`npm run lint`)
- [ ] CI workflow passes on GitHub
- [ ] Code matches ARCHITECTURE.md spec
