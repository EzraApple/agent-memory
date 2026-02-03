/**
 * Zod schemas and TypeScript types for @agent-memory/core
 *
 * All data structures that cross boundaries (config, API input/output, storage)
 * are defined here with Zod schemas. Types are inferred from schemas.
 */

import { z } from 'zod';

// =============================================================================
// Configuration Schemas
// =============================================================================

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

export type EmbeddingsConfig = z.infer<typeof EmbeddingsConfigSchema>;
export type SummarizerConfig = z.infer<typeof SummarizerConfigSchema>;
export type SearchConfig = z.infer<typeof SearchConfigSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

// =============================================================================
// Message & Session Schemas
// =============================================================================

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  channel: z.string().optional(),
  userId: z.string().optional(),
  messages: z.array(MessageSchema),
});

export const SessionMetaSchema = z.object({
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

export type Message = z.infer<typeof MessageSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionMeta = z.infer<typeof SessionMetaSchema>;

// =============================================================================
// Written Memory Schemas
// =============================================================================

export const WrittenMemorySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deleted: z.boolean().default(false),
});

export type WrittenMemory = z.infer<typeof WrittenMemorySchema>;

// =============================================================================
// Search Schemas
// =============================================================================

export const SearchOptionsSchema = z.object({
  limit: z.number().positive().optional(),
  type: z.enum(['all', 'session', 'memory']).optional(),
});

export const SearchResultSchema = z.object({
  id: z.string(),
  type: z.enum(['session', 'memory']),
  summary: z.string(),
  score: z.number(),
  chunks: z.number(),
  timestamp: z.string().datetime(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;

// =============================================================================
// Read Schemas
// =============================================================================

export const ReadOptionsSchema = z.object({
  chunk: z.number().nonnegative().default(0),
});

export const ReadResultSchema = z.object({
  id: z.string(),
  type: z.enum(['session', 'memory']),
  messages: z.array(MessageSchema).optional(),
  content: z.string().optional(),
  chunkIndex: z.number(),
  totalChunks: z.number(),
  summary: z.string(),
});

export type ReadOptions = z.infer<typeof ReadOptionsSchema>;
export type ReadResult = z.infer<typeof ReadResultSchema>;

// =============================================================================
// Write/Update Schemas
// =============================================================================

export const WriteOptionsSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

export const UpdateOptionsSchema = z.object({
  content: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type WriteOptions = z.infer<typeof WriteOptionsSchema>;
export type UpdateOptions = z.infer<typeof UpdateOptionsSchema>;

// =============================================================================
// Summarization Result
// =============================================================================

export const SummarizationResultSchema = z.object({
  summary: z.string(),
  keyFacts: z.array(z.string()),
});

export type SummarizationResult = z.infer<typeof SummarizationResultSchema>;
