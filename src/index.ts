/**
 * @agent-memory/core
 *
 * Memory SDK for agentic AI systems.
 *
 * @example
 * ```typescript
 * import { Memory } from '@agent-memory/core';
 *
 * const memory = await Memory.init({
 *   storagePath: '~/.my-agent/memory',
 *   embeddings: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
 *   summarizer: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
 * });
 *
 * await memory.ingestSession({ id: 'session-1', messages: [...] });
 * const results = await memory.search('user preferences');
 * ```
 */

// Main API
export { Memory } from './memory.js';

// Types
export type {
  MemoryConfig,
  EmbeddingsConfig,
  SummarizerConfig,
  SearchConfig,
  Session,
  Message,
  SessionMeta,
  WrittenMemory,
  SearchResult,
  ReadResult,
  SearchOptions,
  ReadOptions,
  WriteOptions,
  UpdateOptions,
} from './types.js';

// Errors
export {
  MemoryError,
  NotFoundError,
  ValidationError,
  StorageError,
  ProviderError,
} from './errors.js';

// Provider interfaces (for custom implementations)
export type { EmbeddingsProvider } from './providers/embeddings/index.js';
export type { SummarizerProvider } from './providers/summarizer/index.js';

// Storage interfaces (for custom implementations)
export type { SessionStorage } from './storage/index.js';
