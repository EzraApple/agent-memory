# CLAUDE.md

Development conventions and guidelines for `@agent-memory/core`.

## Project Context

This is a memory SDK for agentic AI systems. The target audience is AI hackers at small companies building agents with TypeScript.

**Design philosophy:**
- Zero infrastructure required (embedded LanceDB, local files)
- BYO API key (no hosted service)
- Framework-agnostic (works with any agent framework)
- Agent-friendly APIs (chunk-based reading, summaries in search results)

## Code Style

### TypeScript Configuration

- **Strict mode enabled** - all strict checks are on
- **ES2022 target** - use modern syntax
- **NodeNext modules** - ESM with .js extensions in imports

### Zod for All Schemas

Every data structure that crosses a boundary (config, API input/output, storage) uses Zod:

```typescript
// Good
const SessionSchema = z.object({
  id: z.string(),
  messages: z.array(MessageSchema),
});
type Session = z.infer<typeof SessionSchema>;

// Bad - manual type without validation
interface Session {
  id: string;
  messages: Message[];
}
```

### Async/Await Patterns

- All I/O operations are async
- Use `Promise.all` for parallel operations
- Avoid callbacks

```typescript
// Good
const [meta, messages] = await Promise.all([
  storage.getMeta(id),
  storage.readAll(id),
]);

// Bad
storage.getMeta(id, (meta) => {
  storage.readAll(id, (messages) => { ... });
});
```

### Error Handling

- Use typed errors extending `MemoryError`
- Include context in error messages
- Wrap external errors

```typescript
// Good
throw new NotFoundError(sessionId, 'session');

// Good - wrapping external error
try {
  await fs.readFile(path);
} catch (err) {
  throw new StorageError(`Failed to read ${path}`, err as Error);
}

// Bad - generic error
throw new Error('Not found');
```

### Naming Conventions

- **Files**: kebab-case (`session-storage.ts`)
- **Classes**: PascalCase (`SessionStorage`)
- **Functions/methods**: camelCase (`readChunk`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_CHUNK_SIZE`)
- **Types**: PascalCase (`SessionMeta`)
- **Schemas**: PascalCase with Schema suffix (`SessionMetaSchema`)

## File Organization

```
src/
├── index.ts              # Public exports only
├── memory.ts             # Memory class (main API)
├── types.ts              # All Zod schemas and types
├── config.ts             # Config validation and defaults
├── errors.ts             # Error classes
├── storage/
│   ├── index.ts          # Storage interfaces
│   ├── sessions.ts       # JSONL session storage
│   └── memories.ts       # Markdown memory storage
├── search/
│   ├── index.ts          # Search interface
│   └── lancedb.ts        # LanceDB implementation
├── providers/
│   ├── embeddings/
│   │   ├── index.ts      # Embeddings interface + factory
│   │   ├── openai.ts     # OpenAI implementation
│   │   └── ollama.ts     # Ollama implementation
│   └── summarizer/
│       ├── index.ts      # Summarizer interface + factory
│       ├── openai.ts     # OpenAI implementation
│       └── anthropic.ts  # Anthropic implementation
└── tools/
    └── index.ts          # Tool definitions
```

### What Goes Where

- **Public API**: Only in `memory.ts`, exported from `index.ts`
- **Types**: All in `types.ts`, even if only used internally
- **Config**: Zod schemas in `config.ts`, loaded in `memory.ts`
- **Interfaces**: In respective `index.ts` files (e.g., `storage/index.ts`)
- **Implementations**: One class per file

## Testing Strategy

### Test-Alongside-Code

Every feature gets tests in the same PR. No merging without tests.

### Test Levels

**Unit tests** (`tests/unit/`):
- Test one function/class at a time
- Mock all external dependencies (fs, LanceDB, APIs)
- Fast - should run in <1 second total
- Cover happy path + error cases

**Integration tests** (`tests/integration/`):
- Test component interactions
- Use real file system (temp directory)
- Mock only external APIs
- Medium speed - <10 seconds total

**E2E tests** (`tests/e2e/`):
- Test full workflows
- Use real file system
- External APIs env-gated (LIVE_TEST=1)
- Can be slow

### Writing Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('methodName', () => {
    it('does expected thing', async () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = await component.method(input);

      // Assert
      expect(result).toMatchObject({ ... });
    });

    it('throws on invalid input', async () => {
      await expect(component.method(null))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Mocking Patterns

**File system:**
```typescript
import { vol } from 'memfs';
vi.mock('fs/promises', () => vol.promises);

beforeEach(() => vol.reset());
```

**LanceDB:**
```typescript
const mockTable = {
  search: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue([]),
};
```

**Providers:**
```typescript
const mockEmbeddings = {
  embed: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
  dimensions: 1536,
};
```

### Environment-Gated Tests

Tests requiring real API calls:

```typescript
const LIVE_TEST = process.env.LIVE_TEST === '1';

describe.skipIf(!LIVE_TEST)('Live API Tests', () => {
  it('calls real OpenAI API', async () => {
    // Requires OPENAI_API_KEY in environment
  });
});
```

Run with: `LIVE_TEST=1 OPENAI_API_KEY=sk-... npm test`

### Coverage

Aim for:
- 80%+ on core paths
- 70%+ on error paths
- Don't chase 100% - focus on meaningful tests

## Common Tasks

### Adding a New Provider

1. Create implementation file:
   ```
   src/providers/embeddings/voyage.ts
   ```

2. Implement interface:
   ```typescript
   export class VoyageEmbeddings implements EmbeddingsProvider {
     readonly dimensions = 1024;

     async embed(text: string): Promise<number[]> {
       // implementation
     }
   }
   ```

3. Add to factory in `index.ts`:
   ```typescript
   case 'voyage':
     return new VoyageEmbeddings(config);
   ```

4. Update config schema in `config.ts`:
   ```typescript
   provider: z.enum(['openai', 'ollama', 'voyage']),
   ```

5. Add tests:
   ```
   tests/unit/providers.test.ts   # Unit tests with mocks
   tests/integration/providers.test.ts  # Live tests (env-gated)
   ```

6. Update README.md with usage example

### Adding a New Storage Backend

1. Create implementation file:
   ```
   src/storage/postgres.ts
   ```

2. Implement `SessionStorage` interface

3. Add factory/configuration option

4. Add tests with real database (Docker in CI)

### Modifying Schemas

1. Update Zod schema in `types.ts`
2. Type is automatically derived
3. Update any affected storage format
4. Add migration if needed (or bump major version)
5. Update tests

## Don'ts

### No Compaction Logic

Compaction (consolidating memories, pruning old sessions) is the framework's job:

```typescript
// Bad - don't add this
await memory.compact({ olderThan: '30d' });

// Good - framework handles it
const oldSessions = await memory.search('*', { before: thirtyDaysAgo });
for (const session of oldSessions) {
  await memory.delete(session.id);
}
```

### No Structured Metadata Fields

Don't add rigid metadata schemas. Agents query naturally:

```typescript
// Bad - rigid metadata
await memory.write({
  content: '...',
  metadata: {
    category: 'preference',
    importance: 'high',
    expiresAt: '2025-01-01',
  },
});

// Good - natural text + tags
await memory.write({
  title: 'Important preference',
  content: 'User prefers...',
  tags: ['preference', 'important'],
});
```

### No Offset/Limit Pagination

Use chunk-based reading only:

```typescript
// Bad
await memory.read('session-123', { offset: 50, limit: 50 });

// Good
await memory.read('session-123', { chunk: 1 });
```

### Keep Embedded LanceDB Only

No server mode or external vector databases:

```typescript
// Bad - external vector DB
const memory = await Memory.init({
  vectorDb: 'pinecone',
  pineconeApiKey: '...',
});

// Good - embedded only
const memory = await Memory.init({
  storagePath: '~/.agent-memory',
  // LanceDB is always embedded
});
```

### No Features Without Tests

Every PR must include tests:

```typescript
// PR adding new feature
src/memory.ts         // Feature implementation
tests/unit/memory.test.ts  // Unit tests
tests/integration/memory.test.ts  // Integration tests if needed
```

## Debugging

### Enable Debug Logging

```typescript
// Set DEBUG environment variable
DEBUG=agent-memory:* npm test
```

### Inspect LanceDB

```typescript
// In tests or debugging
import lancedb from '@lancedb/lancedb';

const db = await lancedb.connect('./path/to/index/lance');
const sessions = await db.openTable('sessions');
const rows = await sessions.query().toArray();
console.log(rows);
```

### Inspect Storage Files

Sessions are JSONL - one message per line:
```bash
cat ~/.agent-memory/sessions/session-123.jsonl
```

Memories are markdown:
```bash
cat ~/.agent-memory/memories/memory-abc.md
```

## Performance Considerations

### Embedding Batching

When ingesting large sessions, batch embedding calls:

```typescript
// Good - batch
const embeddings = await provider.embedBatch([summary, ...keyFacts]);

// Bad - sequential
const summaryEmbed = await provider.embed(summary);
const factEmbeds = await Promise.all(keyFacts.map(f => provider.embed(f)));
```

### LanceDB Index

Create FTS index for BM25 search:
```typescript
await table.createFtsIndex('content');
```

### File System

Use streaming for large JSONL files:
```typescript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: createReadStream(path),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  yield JSON.parse(line);
}
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite: `npm test`
4. Build: `npm run build`
5. Publish: `npm publish --access public`

## Dependencies

**Runtime:**
- `@lancedb/lancedb` - Vector storage and search
- `zod` - Schema validation

**Peer (optional):**
- `openai` - OpenAI provider

**Dev:**
- `typescript` - Compiler
- `vitest` - Testing
- `@types/node` - Node types
