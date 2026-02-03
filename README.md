# @agent-memory/core

Memory SDK for agentic AI systems. Provides session auto-storage, agent-written memories, and hybrid search capabilities.

## Overview

`@agent-memory/core` gives your AI agents persistent memory:

- **Session auto-storage**: Ingest conversation sessions with automatic summarization
- **Agent-written memories**: Let agents write markdown memories for persistent knowledge
- **Hybrid search**: BM25 + vector search over sessions and memories
- **Chunk-based reading**: Read large sessions by chunk index for agent-friendly pagination

Zero infrastructure required - uses embedded LanceDB for vector search and local file storage by default.

## Installation

```bash
npm install @agent-memory/core
```

### Peer Dependencies

For OpenAI embeddings/summarization (default):

```bash
npm install openai
```

## Quick Start

```typescript
import { Memory } from '@agent-memory/core';

// Initialize memory
const memory = await Memory.init({
  storagePath: '~/.my-agent/memory',
  embeddings: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
  summarizer: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Ingest a conversation session
await memory.ingestSession({
  id: 'session-123',
  channel: 'telegram',
  userId: 'user-456',
  messages: [
    { role: 'user', content: 'I prefer dark mode', timestamp: new Date().toISOString() },
    { role: 'assistant', content: 'Noted! I\'ll remember that.', timestamp: new Date().toISOString() },
  ],
});

// Search memories
const results = await memory.search('user preferences');
// [{ id: 'session-123', type: 'session', summary: '...', score: 0.87, chunks: 1 }]

// Read full session content by chunk
const chunk = await memory.read('session-123', { chunk: 0 });
// { messages: [...], chunkIndex: 0, totalChunks: 1, summary: '...' }

// Write a persistent memory
await memory.write({
  title: 'User preferences',
  content: 'User prefers dark mode in all applications',
  tags: ['preference', 'ui'],
});
```

## Configuration Reference

### `Memory.init(config)`

Creates and initializes a Memory instance.

```typescript
const memory = await Memory.init(config: MemoryConfig): Promise<Memory>
```

#### MemoryConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `storagePath` | `string` | `'~/.agent-memory'` | Root directory for all memory storage |
| `embeddings` | `EmbeddingsConfig` | required | Embeddings provider configuration |
| `summarizer` | `SummarizerConfig` | required | Summarizer provider configuration |
| `chunkSize` | `number` | `50` | Messages per chunk for session storage |
| `search` | `SearchConfig` | `{}` | Search behavior configuration |

#### EmbeddingsConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | `'openai' \| 'ollama'` | required | Embeddings provider to use |
| `apiKey` | `string` | - | API key (required for OpenAI) |
| `model` | `string` | `'text-embedding-3-small'` | Model to use for embeddings |
| `baseUrl` | `string` | - | Base URL (required for Ollama) |

#### SummarizerConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | `'openai' \| 'anthropic'` | required | Summarizer provider to use |
| `apiKey` | `string` | required | API key for the provider |
| `model` | `string` | `'gpt-4o-mini'` | Model to use for summarization |

#### SearchConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hybridWeight` | `number` | `0.7` | Weight for vector search (0-1). BM25 weight is `1 - hybridWeight` |
| `defaultLimit` | `number` | `10` | Default number of results to return |

### Full Configuration Example

```typescript
const memory = await Memory.init({
  storagePath: '~/.my-agent/memory',

  embeddings: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  },

  summarizer: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  },

  chunkSize: 50,

  search: {
    hybridWeight: 0.7,
    defaultLimit: 10,
  },
});
```

## API Reference

### `memory.ingestSession(session)`

Ingests a conversation session, automatically generating a summary and indexing for search.

```typescript
await memory.ingestSession(session: Session): Promise<void>
```

#### Session

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | yes | Unique session identifier |
| `channel` | `string` | no | Channel/platform (e.g., 'telegram', 'slack') |
| `userId` | `string` | no | User identifier |
| `messages` | `Message[]` | yes | Array of messages in the session |

#### Message

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `role` | `'user' \| 'assistant' \| 'system'` | yes | Message role |
| `content` | `string` | yes | Message content |
| `timestamp` | `string` | no | ISO 8601 timestamp |

#### Example

```typescript
await memory.ingestSession({
  id: 'session-abc123',
  channel: 'telegram',
  userId: 'user-789',
  messages: [
    {
      role: 'user',
      content: 'What\'s the weather like?',
      timestamp: '2024-02-02T10:30:00Z',
    },
    {
      role: 'assistant',
      content: 'I don\'t have access to weather data, but I can help you find a weather service.',
      timestamp: '2024-02-02T10:30:05Z',
    },
  ],
});
```

#### Behavior

- **New sessions**: Creates session file, generates summary, indexes in vector store
- **Existing sessions**: Appends messages, regenerates summary if significantly changed
- **Large sessions**: Automatically splits into chunks based on `chunkSize` config

---

### `memory.search(query, options?)`

Searches across sessions and memories using hybrid BM25 + vector search.

```typescript
const results = await memory.search(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]>
```

#### SearchOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `limit` | `number` | `10` | Maximum results to return |
| `type` | `'all' \| 'session' \| 'memory'` | `'all'` | Filter by result type |

#### SearchResult

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Session or memory ID |
| `type` | `'session' \| 'memory'` | Result type |
| `summary` | `string` | Session summary or memory content |
| `score` | `number` | Relevance score (0-1, higher is better) |
| `chunks` | `number` | Number of chunks (sessions only) |
| `timestamp` | `string` | Creation/update timestamp |
| `title` | `string` | Memory title (memories only) |
| `tags` | `string[]` | Memory tags (memories only) |

#### Example

```typescript
// Search all memories
const results = await memory.search('user preferences');

// Search only sessions
const sessionResults = await memory.search('dark mode', {
  type: 'session',
  limit: 5,
});

// Search only written memories
const memoryResults = await memory.search('food preferences', {
  type: 'memory',
});
```

#### Result Example

```typescript
[
  {
    id: 'session-123',
    type: 'session',
    summary: 'User discussed their preference for dark mode in applications. Assistant acknowledged and noted the preference.',
    score: 0.87,
    chunks: 1,
    timestamp: '2024-02-02T10:30:00Z',
  },
  {
    id: 'memory-456',
    type: 'memory',
    summary: 'User prefers dark mode in all applications',
    title: 'UI Preferences',
    tags: ['preference', 'ui'],
    score: 0.82,
    chunks: 1,
    timestamp: '2024-02-02T11:00:00Z',
  },
]
```

---

### `memory.read(id, options?)`

Reads session or memory content by chunk index.

```typescript
const chunk = await memory.read(
  id: string,
  options?: ReadOptions
): Promise<ReadResult>
```

#### ReadOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chunk` | `number` | `0` | Zero-indexed chunk to read |

#### ReadResult

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Session or memory ID |
| `type` | `'session' \| 'memory'` | Content type |
| `messages` | `Message[]` | Messages in this chunk (sessions only) |
| `content` | `string` | Full content (memories only) |
| `chunkIndex` | `number` | Current chunk index (0-based) |
| `totalChunks` | `number` | Total number of chunks |
| `summary` | `string` | Session summary for context |

#### Example

```typescript
// Read first chunk (default)
const chunk0 = await memory.read('session-123');
console.log(chunk0.messages); // First 50 messages
console.log(chunk0.totalChunks); // e.g., 3

// Read second chunk
const chunk1 = await memory.read('session-123', { chunk: 1 });

// Read a memory (always 1 chunk)
const mem = await memory.read('memory-456');
console.log(mem.content); // Full memory content
```

#### Chunk-Based Reading Explained

Sessions are divided into chunks of `chunkSize` messages (default 50). This design is agent-friendly:

1. **Search returns chunk count**: `{ id, summary, chunks: 3 }` tells the agent how much content exists
2. **Summary provides context**: Agent can often answer from summary alone
3. **Progressive reading**: Agent reads chunk 0, then 1, 2 only if needed
4. **Predictable sizing**: Each chunk fits comfortably in context windows

Why not offset/limit?
- "Read chunk 0" is clearer than "read offset 0 limit 50"
- Chunk count in search results gives immediate scope awareness
- Maps naturally to how agents reason about content

---

### `memory.write(options)`

Creates a new written memory.

```typescript
const id = await memory.write(options: WriteOptions): Promise<string>
```

#### WriteOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | yes | Memory title |
| `content` | `string` | yes | Memory content (markdown supported) |
| `tags` | `string[]` | no | Tags for categorization |

#### Example

```typescript
const memoryId = await memory.write({
  title: 'Food preferences',
  content: 'User prefers spicy food, especially Thai cuisine. Allergic to shellfish.',
  tags: ['preference', 'food', 'allergy'],
});
// Returns: 'memory-a1b2c3d4'
```

#### Behavior

- Generates unique ID for the memory
- Creates markdown file in `memories/` directory
- Generates embedding and indexes for search
- Returns the memory ID

---

### `memory.update(id, options)`

Updates an existing memory.

```typescript
await memory.update(id: string, options: UpdateOptions): Promise<void>
```

#### UpdateOptions

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | `string` | no | New content |
| `title` | `string` | no | New title |
| `tags` | `string[]` | no | New tags (replaces existing) |

#### Example

```typescript
await memory.update('memory-a1b2c3d4', {
  content: 'User prefers spicy food, especially Thai and Indian cuisine. Allergic to shellfish and peanuts.',
  tags: ['preference', 'food', 'allergy', 'updated'],
});
```

#### Behavior

- Updates the markdown file
- Re-generates embedding
- Updates search index
- Updates `updated` timestamp

---

### `memory.delete(id)`

Soft-deletes a memory or session.

```typescript
await memory.delete(id: string): Promise<void>
```

#### Example

```typescript
await memory.delete('memory-a1b2c3d4');
```

#### Behavior

- **Soft delete**: Adds tombstone marker, excludes from search
- Does not physically delete files (allows recovery)
- Removes from search index

---

## Tool Definitions

Export framework-agnostic tool definitions for agent integration:

```typescript
import { memoryTools } from '@agent-memory/core/tools';
```

### Available Tools

#### `memory_search`

Search memories and sessions.

```typescript
{
  name: 'memory_search',
  description: 'Search through stored memories and conversation sessions',
  parameters: {
    query: { type: 'string', description: 'Search query', required: true },
    limit: { type: 'number', description: 'Max results (default: 10)' },
    type: { type: 'string', enum: ['all', 'session', 'memory'], description: 'Filter by type' },
  },
}
```

#### `memory_read`

Read memory or session content by chunk.

```typescript
{
  name: 'memory_read',
  description: 'Read the content of a memory or session by chunk index',
  parameters: {
    id: { type: 'string', description: 'Memory or session ID', required: true },
    chunk: { type: 'number', description: 'Chunk index (0-based, default: 0)' },
  },
}
```

#### `memory_write`

Write a new memory.

```typescript
{
  name: 'memory_write',
  description: 'Write a new persistent memory',
  parameters: {
    title: { type: 'string', description: 'Memory title', required: true },
    content: { type: 'string', description: 'Memory content', required: true },
    tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
  },
}
```

#### `memory_update`

Update an existing memory.

```typescript
{
  name: 'memory_update',
  description: 'Update an existing memory',
  parameters: {
    id: { type: 'string', description: 'Memory ID', required: true },
    content: { type: 'string', description: 'New content' },
    title: { type: 'string', description: 'New title' },
    tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
  },
}
```

#### `memory_delete`

Delete a memory.

```typescript
{
  name: 'memory_delete',
  description: 'Delete a memory (soft delete)',
  parameters: {
    id: { type: 'string', description: 'Memory ID', required: true },
  },
}
```

### Using with Agent Frameworks

Tools are exported as Zod schemas with execute functions, making them framework-agnostic:

```typescript
import { memoryTools } from '@agent-memory/core/tools';
import { Memory } from '@agent-memory/core';

const memory = await Memory.init({ /* config */ });

// Each tool has: name, description, parameters (Zod schema), execute function
for (const tool of memoryTools(memory)) {
  console.log(tool.name, tool.description);
  // Register with your agent framework
}
```

---

## Storage Format

### Directory Structure

```
~/.agent-memory/
├── sessions/
│   ├── {sessionId}.jsonl        # Raw messages (append-only)
│   └── {sessionId}.meta.json    # Summary, chunk count, timestamps
├── memories/
│   └── {memoryId}.md            # Markdown memory files
└── index/
    └── lance/
        ├── sessions.lance       # Session embeddings
        └── memories.lance       # Memory embeddings
```

### Session Files

**JSONL format** (`sessions/{id}.jsonl`):

```jsonl
{"role":"user","content":"Hello!","timestamp":"2024-02-02T10:00:00Z"}
{"role":"assistant","content":"Hi there!","timestamp":"2024-02-02T10:00:01Z"}
```

**Meta format** (`sessions/{id}.meta.json`):

```json
{
  "id": "session-123",
  "summary": "User greeted the assistant...",
  "keyFacts": ["User said hello"],
  "chunks": 1,
  "messageCount": 2,
  "channel": "telegram",
  "userId": "user-456",
  "createdAt": "2024-02-02T10:00:00Z",
  "updatedAt": "2024-02-02T10:00:01Z"
}
```

### Memory Files

**Markdown format** (`memories/{id}.md`):

```markdown
# Food preferences

User prefers spicy food and Thai cuisine. Allergic to shellfish.

---
tags: preference, food, allergy
created: 2024-02-02T11:00:00Z
updated: 2024-02-02T11:00:00Z
```

---

## Provider Options

### Embeddings Providers

#### OpenAI (Default)

```typescript
embeddings: {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-3-small', // or 'text-embedding-3-large'
}
```

#### Ollama (Local)

```typescript
embeddings: {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'nomic-embed-text',
}
```

### Summarizer Providers

#### OpenAI (Default)

```typescript
summarizer: {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini', // or 'gpt-4o'
}
```

#### Anthropic

```typescript
summarizer: {
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-haiku-20240307', // or 'claude-3-5-sonnet-20241022'
}
```

---

## Examples

### Basic Agent Integration

```typescript
import { Memory } from '@agent-memory/core';

const memory = await Memory.init({
  storagePath: './agent-data/memory',
  embeddings: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
  summarizer: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
});

// In your agent's tool handler
async function handleMemorySearch(query: string) {
  const results = await memory.search(query, { limit: 5 });
  return results.map(r => ({
    id: r.id,
    summary: r.summary,
    chunks: r.chunks,
  }));
}

async function handleMemoryRead(id: string, chunk = 0) {
  return await memory.read(id, { chunk });
}
```

### Session Lifecycle

```typescript
// After each conversation turn, ingest the updated session
async function onConversationEnd(sessionId: string, messages: Message[]) {
  await memory.ingestSession({
    id: sessionId,
    messages,
    channel: 'web',
    userId: getCurrentUserId(),
  });
}
```

### Agent Writing Memories

```typescript
// When agent learns something important
async function rememberFact(fact: string, category: string) {
  await memory.write({
    title: `Learned: ${category}`,
    content: fact,
    tags: [category, 'auto-learned'],
  });
}
```

---

## Error Handling

All methods throw typed errors:

```typescript
import { MemoryError, NotFoundError, ValidationError } from '@agent-memory/core';

try {
  await memory.read('nonexistent-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Memory not found:', error.id);
  }
}
```

### Error Types

| Error | Description |
|-------|-------------|
| `MemoryError` | Base error class |
| `NotFoundError` | Session or memory not found |
| `ValidationError` | Invalid input parameters |
| `StorageError` | File system or database error |
| `ProviderError` | Embeddings or summarizer API error |

---

## License

MIT
