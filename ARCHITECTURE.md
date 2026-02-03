# Architecture

This document provides the complete technical specification for `@agent-memory/core`. It serves as the implementation blueprint.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Memory Class                               │
│                        (Public API Layer)                            │
├─────────────────────────────────────────────────────────────────────┤
│  init() │ ingestSession() │ search() │ read() │ write() │ update() │
└────┬────────────┬──────────────┬─────────┬────────┬─────────┬───────┘
     │            │              │         │        │         │
     ▼            ▼              ▼         ▼        ▼         ▼
┌─────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────────────────┐
│ Config  │ │ Session  │ │   Search   │ │     Written Memory         │
│ Loader  │ │ Storage  │ │   Index    │ │        Storage             │
└─────────┘ └──────────┘ └────────────┘ └────────────────────────────┘
                │              │                      │
                ▼              ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Provider Layer                               │
├──────────────────────────────┬──────────────────────────────────────┤
│      EmbeddingsProvider      │        SummarizerProvider            │
│  ┌─────────┐  ┌─────────┐   │   ┌─────────┐  ┌───────────────┐     │
│  │ OpenAI  │  │ Ollama  │   │   │ OpenAI  │  │   Anthropic   │     │
│  └─────────┘  └─────────┘   │   └─────────┘  └───────────────┘     │
└──────────────────────────────┴──────────────────────────────────────┘
                │                              │
                ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Storage Layer                                 │
├─────────────────────────────────────────────────────────────────────┤
│  sessions/*.jsonl  │  sessions/*.meta.json  │  memories/*.md        │
│                    │                        │                        │
│                    └────────────────────────┼────────────────────────┤
│                                             ▼                        │
│                                    index/lance/                      │
│                              (LanceDB Vector Store)                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Memory Class (`src/memory.ts`)

The main orchestrator and public API. All user-facing methods live here.

**Responsibilities:**
- Initialize and wire all components
- Validate inputs using Zod schemas
- Coordinate between storage, search, and providers
- Handle errors and provide typed exceptions

**Public Methods:**

```typescript
class Memory {
  // Factory method - use instead of constructor
  static async init(config: MemoryConfig): Promise<Memory>;

  // Session management
  async ingestSession(session: Session): Promise<void>;

  // Search
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  // Reading
  async read(id: string, options?: ReadOptions): Promise<ReadResult>;

  // Writing memories
  async write(options: WriteOptions): Promise<string>;
  async update(id: string, options: UpdateOptions): Promise<void>;
  async delete(id: string): Promise<void>;

  // Cleanup
  async close(): Promise<void>;
}
```

**Implementation Notes:**
- Constructor is private; use `Memory.init()` factory
- `init()` creates directories, initializes LanceDB, validates config
- All methods are async
- `close()` flushes writes and closes LanceDB connection

---

### 2. Session Storage (`src/storage/sessions.ts`)

Handles raw message storage and metadata for conversation sessions.

**Interface:**

```typescript
interface SessionStorage {
  // Append messages to a session (creates if needed)
  append(sessionId: string, messages: Message[]): Promise<void>;

  // Read a specific chunk of messages
  readChunk(sessionId: string, chunkIndex: number, chunkSize: number): Promise<Message[]>;

  // Read all messages (for summarization)
  readAll(sessionId: string): Promise<Message[]>;

  // Metadata operations
  getMeta(sessionId: string): Promise<SessionMeta | null>;
  setMeta(sessionId: string, meta: SessionMeta): Promise<void>;

  // Check existence
  exists(sessionId: string): Promise<boolean>;

  // List all sessions
  list(): Promise<string[]>;
}
```

**Default Implementation: JSONL**

File structure:
```
sessions/
├── session-123.jsonl       # Append-only message log
└── session-123.meta.json   # Metadata
```

**JSONL Format:**
```jsonl
{"role":"user","content":"Hello","timestamp":"2024-02-02T10:00:00Z"}
{"role":"assistant","content":"Hi!","timestamp":"2024-02-02T10:00:01Z"}
```

**Meta JSON Format:**
```json
{
  "id": "session-123",
  "summary": "User greeted the assistant...",
  "keyFacts": ["User initiated conversation"],
  "chunks": 1,
  "messageCount": 2,
  "channel": "telegram",
  "userId": "user-456",
  "createdAt": "2024-02-02T10:00:00Z",
  "updatedAt": "2024-02-02T10:00:01Z",
  "deleted": false
}
```

**Chunk Calculation:**
```typescript
function getChunkCount(messageCount: number, chunkSize: number): number {
  return Math.ceil(messageCount / chunkSize);
}

function readChunk(sessionId: string, chunkIndex: number, chunkSize: number): Message[] {
  const allMessages = readAllFromJSONL(sessionId);
  const start = chunkIndex * chunkSize;
  const end = start + chunkSize;
  return allMessages.slice(start, end);
}
```

---

### 3. Memory Storage (`src/storage/memories.ts`)

Handles agent-written memories stored as markdown files.

**Interface:**

```typescript
interface MemoryStorage {
  // Create a new memory, returns ID
  create(options: CreateMemoryOptions): Promise<string>;

  // Read a memory
  read(id: string): Promise<WrittenMemory | null>;

  // Update a memory
  update(id: string, options: UpdateMemoryOptions): Promise<void>;

  // Soft delete (sets tombstone)
  delete(id: string): Promise<void>;

  // List all non-deleted memories
  list(): Promise<string[]>;

  // Check existence
  exists(id: string): Promise<boolean>;
}
```

**Markdown Format:**
```markdown
# Title Here

Content goes here. Supports full markdown.

Multiple paragraphs are fine.

---
tags: tag1, tag2, tag3
created: 2024-02-02T11:00:00Z
updated: 2024-02-02T11:00:00Z
deleted: false
```

**Parsing Logic:**
```typescript
function parseMemoryFile(content: string): WrittenMemory {
  const [body, frontmatter] = content.split('\n---\n');
  const title = body.match(/^# (.+)\n/)?.[1] ?? 'Untitled';
  const contentWithoutTitle = body.replace(/^# .+\n\n?/, '');
  const meta = parseFrontmatter(frontmatter);

  return {
    title,
    content: contentWithoutTitle.trim(),
    tags: meta.tags?.split(', ') ?? [],
    createdAt: meta.created,
    updatedAt: meta.updated,
    deleted: meta.deleted === 'true',
  };
}
```

**ID Generation:**
```typescript
function generateMemoryId(): string {
  // Format: memory-{random8chars}
  return `memory-${crypto.randomUUID().slice(0, 8)}`;
}
```

---

### 4. Search Index (`src/search/lancedb.ts`)

LanceDB wrapper providing hybrid BM25 + vector search.

**Interface:**

```typescript
interface SearchIndex {
  // Initialize tables and indexes
  init(): Promise<void>;

  // Index a session summary
  indexSession(sessionId: string, summary: string, embedding: number[], meta: SessionMeta): Promise<void>;

  // Index a written memory
  indexMemory(memoryId: string, content: string, embedding: number[], meta: MemoryMeta): Promise<void>;

  // Remove from index
  removeFromIndex(id: string): Promise<void>;

  // Hybrid search
  search(query: string, queryEmbedding: number[], options: SearchOptions): Promise<SearchResult[]>;

  // Close connection
  close(): Promise<void>;
}
```

**Table Schemas:**

Sessions table:
```typescript
const SessionsTableSchema = {
  id: 'string',           // Primary key
  summary: 'string',      // For BM25 search
  vector: 'vector[1536]', // Embedding (dimension varies by model)
  chunks: 'int32',
  messageCount: 'int32',
  channel: 'string',
  userId: 'string',
  createdAt: 'string',
  updatedAt: 'string',
  deleted: 'bool',
};
```

Memories table:
```typescript
const MemoriesTableSchema = {
  id: 'string',           // Primary key
  title: 'string',
  content: 'string',      // For BM25 search
  vector: 'vector[1536]', // Embedding
  tags: 'string',         // Comma-separated
  createdAt: 'string',
  updatedAt: 'string',
  deleted: 'bool',
};
```

**Hybrid Search Implementation:**

```typescript
async function search(
  query: string,
  queryEmbedding: number[],
  options: SearchOptions
): Promise<SearchResult[]> {
  const { limit = 10, type = 'all' } = options;

  const results: SearchResult[] = [];

  if (type === 'all' || type === 'session') {
    const sessionResults = await this.sessionsTable
      .search(queryEmbedding, { query_type: 'hybrid' })
      .where('deleted = false')
      .limit(limit)
      .toArray();

    results.push(...sessionResults.map(r => ({
      id: r.id,
      type: 'session' as const,
      summary: r.summary,
      score: normalizeScore(r._distance),
      chunks: r.chunks,
      timestamp: r.updatedAt,
    })));
  }

  if (type === 'all' || type === 'memory') {
    const memoryResults = await this.memoriesTable
      .search(queryEmbedding, { query_type: 'hybrid' })
      .where('deleted = false')
      .limit(limit)
      .toArray();

    results.push(...memoryResults.map(r => ({
      id: r.id,
      type: 'memory' as const,
      summary: r.content,
      title: r.title,
      tags: r.tags.split(', '),
      score: normalizeScore(r._distance),
      chunks: 1,
      timestamp: r.updatedAt,
    })));
  }

  // Sort by score and limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function normalizeScore(distance: number): number {
  // Convert distance to similarity score (0-1, higher is better)
  return 1 / (1 + distance);
}
```

**FTS Index Setup:**
```typescript
async function init(): Promise<void> {
  // Create sessions table
  this.sessionsTable = await this.db.createTable('sessions', [], {
    mode: 'overwrite',
  });
  await this.sessionsTable.createFtsIndex('summary');

  // Create memories table
  this.memoriesTable = await this.db.createTable('memories', [], {
    mode: 'overwrite',
  });
  await this.memoriesTable.createFtsIndex('content');
}
```

---

### 5. Embeddings Providers (`src/providers/embeddings/`)

**Interface:**

```typescript
interface EmbeddingsProvider {
  // Generate embedding for text
  embed(text: string): Promise<number[]>;

  // Embedding dimension (needed for LanceDB schema)
  readonly dimensions: number;

  // Optional: batch embedding
  embedBatch?(texts: string[]): Promise<number[][]>;
}
```

**OpenAI Implementation (`openai.ts`):**

```typescript
class OpenAIEmbeddings implements EmbeddingsProvider {
  private client: OpenAI;
  private model: string;
  readonly dimensions: number;

  constructor(config: { apiKey: string; model?: string }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'text-embedding-3-small';
    this.dimensions = this.model.includes('large') ? 3072 : 1536;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }
}
```

**Ollama Implementation (`ollama.ts`):**

```typescript
class OllamaEmbeddings implements EmbeddingsProvider {
  private baseUrl: string;
  private model: string;
  readonly dimensions: number;

  constructor(config: { baseUrl: string; model?: string }) {
    this.baseUrl = config.baseUrl;
    this.model = config.model ?? 'nomic-embed-text';
    // Dimension varies by model - would need lookup table
    this.dimensions = 768; // nomic-embed-text default
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: text }),
    });
    const data = await response.json();
    return data.embedding;
  }
}
```

---

### 6. Summarizer Providers (`src/providers/summarizer/`)

**Interface:**

```typescript
interface SummarizerProvider {
  summarize(messages: Message[]): Promise<SummarizationResult>;
}

interface SummarizationResult {
  summary: string;     // 2-4 sentence summary
  keyFacts: string[];  // Bullet points of key information
}
```

**Summarization Prompt:**

```typescript
const SUMMARIZATION_PROMPT = `Summarize this conversation in 2-4 sentences.
Focus on:
- Key topics discussed
- Important decisions or preferences expressed
- Action items or outcomes

Then list 3-5 key facts as bullet points.

Conversation:
{messages}

Respond in this format:
SUMMARY:
[Your summary here]

KEY FACTS:
- [Fact 1]
- [Fact 2]
- [Fact 3]`;
```

**OpenAI Implementation (`openai.ts`):**

```typescript
class OpenAISummarizer implements SummarizerProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? 'gpt-4o-mini';
  }

  async summarize(messages: Message[]): Promise<SummarizationResult> {
    const formatted = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes conversations.' },
        { role: 'user', content: SUMMARIZATION_PROMPT.replace('{messages}', formatted) },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return parseSummarizationResponse(response.choices[0].message.content);
  }
}
```

**Anthropic Implementation (`anthropic.ts`):**

```typescript
class AnthropicSummarizer implements SummarizerProvider {
  private apiKey: string;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-3-haiku-20240307';
  }

  async summarize(messages: Message[]): Promise<SummarizationResult> {
    const formatted = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        messages: [
          { role: 'user', content: SUMMARIZATION_PROMPT.replace('{messages}', formatted) },
        ],
      }),
    });

    const data = await response.json();
    return parseSummarizationResponse(data.content[0].text);
  }
}
```

---

### 7. Configuration (`src/config.ts`)

**Zod Schemas:**

```typescript
import { z } from 'zod';

export const EmbeddingsConfigSchema = z.object({
  provider: z.enum(['openai', 'ollama']),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
}).refine(
  (data) => data.provider !== 'openai' || data.apiKey,
  { message: 'apiKey required for OpenAI provider' }
).refine(
  (data) => data.provider !== 'ollama' || data.baseUrl,
  { message: 'baseUrl required for Ollama provider' }
);

export const SummarizerConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic']),
  apiKey: z.string(),
  model: z.string().optional(),
});

export const SearchConfigSchema = z.object({
  hybridWeight: z.number().min(0).max(1).default(0.7),
  defaultLimit: z.number().positive().default(10),
}).default({});

export const MemoryConfigSchema = z.object({
  storagePath: z.string().default('~/.agent-memory'),
  embeddings: EmbeddingsConfigSchema,
  summarizer: SummarizerConfigSchema,
  chunkSize: z.number().positive().default(50),
  search: SearchConfigSchema,
});

export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
```

**Path Resolution:**

```typescript
function resolvePath(path: string): string {
  if (path.startsWith('~')) {
    return path.replace('~', process.env.HOME ?? '');
  }
  return path;
}
```

---

## Data Models

### Message

```typescript
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime().optional(),
});

type Message = z.infer<typeof MessageSchema>;
```

### Session

```typescript
const SessionSchema = z.object({
  id: z.string(),
  channel: z.string().optional(),
  userId: z.string().optional(),
  messages: z.array(MessageSchema),
});

type Session = z.infer<typeof SessionSchema>;
```

### SessionMeta

```typescript
const SessionMetaSchema = z.object({
  id: z.string(),
  summary: z.string(),
  keyFacts: z.array(z.string()),
  chunks: z.number(),
  messageCount: z.number(),
  channel: z.string().optional(),
  userId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deleted: z.boolean().default(false),
});

type SessionMeta = z.infer<typeof SessionMetaSchema>;
```

### WrittenMemory

```typescript
const WrittenMemorySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deleted: z.boolean().default(false),
});

type WrittenMemory = z.infer<typeof WrittenMemorySchema>;
```

### SearchResult

```typescript
const SearchResultSchema = z.object({
  id: z.string(),
  type: z.enum(['session', 'memory']),
  summary: z.string(),
  score: z.number(),
  chunks: z.number(),
  timestamp: z.string().datetime(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type SearchResult = z.infer<typeof SearchResultSchema>;
```

### ReadResult

```typescript
const ReadResultSchema = z.object({
  id: z.string(),
  type: z.enum(['session', 'memory']),
  messages: z.array(MessageSchema).optional(),
  content: z.string().optional(),
  chunkIndex: z.number(),
  totalChunks: z.number(),
  summary: z.string(),
});

type ReadResult = z.infer<typeof ReadResultSchema>;
```

---

## Error Types

```typescript
export class MemoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class NotFoundError extends MemoryError {
  constructor(public readonly id: string, type: 'session' | 'memory') {
    super(`${type} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends MemoryError {
  constructor(message: string, public readonly errors: z.ZodError) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class StorageError extends MemoryError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class ProviderError extends MemoryError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}
```

---

## Method Flows

### `ingestSession()` Flow

```
1. Validate session input with SessionSchema
2. Check if session exists
   ├─ New session:
   │   a. Create JSONL file with messages
   │   b. Generate summary with SummarizerProvider
   │   c. Generate embedding with EmbeddingsProvider
   │   d. Create meta.json with summary, chunks, timestamps
   │   e. Index in LanceDB
   │
   └─ Existing session:
       a. Append messages to JSONL file
       b. Read all messages
       c. Regenerate summary
       d. Regenerate embedding
       e. Update meta.json (increment chunks if needed)
       f. Update LanceDB index
```

### `search()` Flow

```
1. Validate search options
2. Generate query embedding with EmbeddingsProvider
3. Execute hybrid search in LanceDB
   - BM25 on summary/content
   - Vector similarity on embedding
   - Filter by type if specified
   - Filter out deleted
4. Normalize scores
5. Sort by score descending
6. Return top N results
```

### `read()` Flow

```
1. Determine if ID is session or memory
2. If session:
   a. Get meta.json for chunk count
   b. Validate chunk index
   c. Read JSONL, extract chunk
   d. Return messages + summary
3. If memory:
   a. Read markdown file
   b. Parse content
   c. Return content (chunk always 0, totalChunks always 1)
```

### `write()` Flow

```
1. Validate write options
2. Generate unique ID
3. Generate embedding for content
4. Create markdown file
5. Index in LanceDB
6. Return ID
```

---

## Testing Architecture

### Test Directory Structure

```
tests/
├── unit/                    # Isolated component tests
│   ├── config.test.ts       # Config validation, defaults, path resolution
│   ├── storage.test.ts      # Session/memory storage (mocked fs)
│   ├── search.test.ts       # Search score normalization, filtering
│   ├── providers.test.ts    # Provider construction, error handling
│   └── tools.test.ts        # Tool schema validation
├── integration/             # Component interaction tests
│   ├── storage.test.ts      # Real file I/O operations
│   ├── providers.test.ts    # Real API calls (env-gated)
│   └── memory.test.ts       # Memory class with real storage
└── e2e/                     # Full workflow tests
    └── workflows.test.ts    # Complete user scenarios
```

### Unit Tests (`tests/unit/`)

Test individual components in isolation with mocked dependencies.

**config.test.ts:**
```typescript
describe('MemoryConfigSchema', () => {
  it('applies defaults for optional fields');
  it('requires apiKey for OpenAI embeddings');
  it('requires baseUrl for Ollama embeddings');
  it('resolves ~ in storagePath');
  it('rejects invalid hybridWeight');
});
```

**storage.test.ts:**
```typescript
describe('SessionStorage', () => {
  it('creates session file on first append');
  it('appends to existing session');
  it('reads correct chunk by index');
  it('calculates chunk count correctly');
  it('handles empty sessions');
});

describe('MemoryStorage', () => {
  it('generates unique IDs');
  it('creates markdown with correct format');
  it('parses markdown frontmatter');
  it('soft deletes by setting tombstone');
});
```

**search.test.ts:**
```typescript
describe('SearchIndex', () => {
  it('normalizes distance to score correctly');
  it('filters by type');
  it('excludes deleted items');
  it('sorts by score descending');
  it('respects limit');
});
```

**providers.test.ts:**
```typescript
describe('OpenAIEmbeddings', () => {
  it('constructs with required config');
  it('sets correct dimensions for model');
  it('throws ProviderError on API failure');
});

describe('OpenAISummarizer', () => {
  it('constructs with required config');
  it('parses summary response correctly');
  it('extracts key facts');
});
```

**tools.test.ts:**
```typescript
describe('memoryTools', () => {
  it('exports all required tools');
  it('validates memory_search parameters');
  it('validates memory_write parameters');
  it('tool schemas are valid Zod objects');
});
```

### Integration Tests (`tests/integration/`)

Test component interactions with real I/O.

**storage.test.ts:**
```typescript
describe('SessionStorage (integration)', () => {
  // Uses temp directory
  it('writes and reads JSONL files');
  it('writes and reads meta.json files');
  it('handles concurrent writes');
  it('survives process restart');
});

describe('MemoryStorage (integration)', () => {
  it('writes and reads markdown files');
  it('preserves formatting in content');
  it('handles special characters');
});
```

**providers.test.ts:**
```typescript
// Only run with LIVE_TEST=1
describe.skipIf(!process.env.LIVE_TEST)('OpenAI Providers (live)', () => {
  it('generates embeddings');
  it('summarizes messages');
});
```

**memory.test.ts:**
```typescript
describe('Memory class (integration)', () => {
  // Uses temp directory, mocked providers
  it('initializes and creates directories');
  it('ingests session and indexes');
  it('search returns indexed sessions');
  it('read returns correct chunks');
  it('write creates memory and indexes');
});
```

### E2E Tests (`tests/e2e/`)

Full workflow tests simulating real usage.

**workflows.test.ts:**
```typescript
describe('Agent Memory Workflows', () => {
  it('full session lifecycle: ingest → search → read');
  it('full memory lifecycle: write → search → read → update → delete');
  it('multi-session search ranking');
  it('mixed session and memory search');
  it('large session chunking');
  it('provider error recovery');
});
```

### Mock Strategies

**File System Mocking:**
```typescript
import { vol } from 'memfs';
vi.mock('fs/promises', () => vol.promises);

beforeEach(() => {
  vol.reset();
});
```

**LanceDB Mocking:**
```typescript
const mockTable = {
  search: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
  }),
  add: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@lancedb/lancedb', () => ({
  connect: vi.fn().mockResolvedValue({
    createTable: vi.fn().mockResolvedValue(mockTable),
    openTable: vi.fn().mockResolvedValue(mockTable),
  }),
}));
```

**Provider Mocking:**
```typescript
const mockEmbeddings: EmbeddingsProvider = {
  embed: vi.fn().mockResolvedValue(new Array(1536).fill(0)),
  dimensions: 1536,
};

const mockSummarizer: SummarizerProvider = {
  summarize: vi.fn().mockResolvedValue({
    summary: 'Test summary',
    keyFacts: ['Fact 1', 'Fact 2'],
  }),
};
```

### Test Fixtures

```typescript
// tests/fixtures/sessions.ts
export const sampleSession: Session = {
  id: 'test-session-1',
  channel: 'test',
  userId: 'user-1',
  messages: [
    { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
    { role: 'assistant', content: 'Hi!', timestamp: '2024-01-01T00:00:01Z' },
  ],
};

export const largeSession: Session = {
  id: 'test-session-large',
  messages: Array.from({ length: 150 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}`,
    timestamp: new Date(Date.now() + i * 1000).toISOString(),
  })),
};
```

### Environment-Gated Tests

```typescript
// Run with: LIVE_TEST=1 npm test

const LIVE_TEST = process.env.LIVE_TEST === '1';

describe.skipIf(!LIVE_TEST)('Live API Tests', () => {
  // These tests make real API calls
  // Require valid API keys in environment
});
```

### Coverage Expectations

- **Core paths**: 80%+ coverage
- **Error paths**: 70%+ coverage
- **Edge cases**: Documented but may have lower coverage

Run coverage: `npm test -- --coverage`

---

## Extension Points

### Custom Storage Backend

Implement `SessionStorage` interface:

```typescript
import { SessionStorage, Message, SessionMeta } from '@agent-memory/core';

class PostgresSessionStorage implements SessionStorage {
  constructor(private connectionString: string) {}

  async append(sessionId: string, messages: Message[]): Promise<void> {
    // INSERT INTO messages ...
  }

  async readChunk(sessionId: string, chunkIndex: number, chunkSize: number): Promise<Message[]> {
    // SELECT ... OFFSET ... LIMIT ...
  }

  // ... implement remaining methods
}
```

### Custom Embeddings Provider

Implement `EmbeddingsProvider` interface:

```typescript
import { EmbeddingsProvider } from '@agent-memory/core';

class VoyageEmbeddings implements EmbeddingsProvider {
  readonly dimensions = 1024;

  async embed(text: string): Promise<number[]> {
    // Call Voyage API
  }
}
```

### Custom Summarizer Provider

Implement `SummarizerProvider` interface:

```typescript
import { SummarizerProvider, Message, SummarizationResult } from '@agent-memory/core';

class GeminiSummarizer implements SummarizerProvider {
  async summarize(messages: Message[]): Promise<SummarizationResult> {
    // Call Gemini API
  }
}
```

---

## Future Directions

### Storage Adapters
- SQLite for single-file deployment
- PostgreSQL for multi-instance
- S3 for cloud storage

### Additional Providers

**Embeddings:**
- Voyage AI
- Cohere
- Local transformers (transformers.js)

**Summarizers:**
- Google Gemini
- Local LLMs (Ollama)

### Memory Linking

Inspired by A-MEM paper - Zettelkasten-style connections:

```typescript
interface LinkedMemory extends WrittenMemory {
  links: Array<{
    targetId: string;
    relationship: string;  // "relates-to", "contradicts", "supports"
  }>;
}
```

### Auto-Capture Hooks

Framework lifecycle integration:

```typescript
memory.registerHook('beforeResponse', async (context) => {
  // Auto-capture important facts
});
```

### MCP Wrapper

Expose tools via Model Context Protocol:

```typescript
import { createMCPServer } from '@agent-memory/mcp';

const server = createMCPServer(memory);
server.listen(3000);
```

---

## Design Decisions

### Why JSONL for Sessions?

- Append-only is simple and crash-safe
- Easy to read with streaming parsers
- Human-readable for debugging
- No schema migrations needed

### Why Markdown for Memories?

- Human-readable and editable
- Supports rich formatting
- Easy to version control
- Frontmatter for metadata is standard

### Why Embedded LanceDB?

- Zero infrastructure required
- Fast local vector search
- Built-in hybrid search (BM25 + vector)
- Single-file database

### Why Chunk-Based Reading?

- Agent-friendly API
- Maps to context windows
- Predictable memory usage
- Search results include chunk count

### Why No Compaction?

- Compaction is application-specific
- Frameworks can implement their own policies
- Keep SDK focused on storage/retrieval
- Avoid premature optimization

### Why No Structured Metadata?

- Agents query naturally with text
- Vector search handles semantic matching
- Avoid rigid schemas that limit flexibility
- Tags provide lightweight categorization
