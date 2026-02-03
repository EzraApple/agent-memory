/**
 * LanceDB search index implementation
 *
 * Uses LanceDB for hybrid BM25 + vector search over sessions and memories.
 * Creates FTS indexes for keyword search and vector indexes for semantic search.
 */

import type { SearchIndex } from './index.js';
import type { SearchResult, SearchOptions, SessionMeta, WrittenMemory } from '../types.js';
import { normalizeScore } from './index.js';

/**
 * LanceDB-based search index.
 *
 * @example
 * ```typescript
 * const index = new LanceDBSearchIndex('/path/to/index', 1536);
 * await index.init();
 * await index.indexSession('session-1', 'Summary...', embedding, meta);
 * const results = await index.search('query', queryEmbedding, { limit: 10 });
 * ```
 */
export class LanceDBSearchIndex implements SearchIndex {
  // TODO: Add LanceDB connection
  // TODO: Add table references

  private readonly dbPath: string;
  private readonly dimensions: number;

  constructor(dbPath: string, dimensions: number) {
    this.dbPath = dbPath;
    this.dimensions = dimensions;
  }

  async init(): Promise<void> {
    // TODO: Connect to LanceDB at this.dbPath
    // TODO: Create sessions table with vector dimension this.dimensions
    // TODO: Create sessions table with schema:
    //   - id: string (primary key)
    //   - summary: string (for BM25)
    //   - vector: number[] (for similarity)
    //   - chunks, messageCount, channel, userId, createdAt, updatedAt, deleted
    // TODO: Create FTS index on summary
    // TODO: Create memories table with schema:
    //   - id: string (primary key)
    //   - title, content: string
    //   - vector: number[]
    //   - tags, createdAt, updatedAt, deleted
    // TODO: Create FTS index on content

    void this.dbPath;
    void this.dimensions;
    throw new Error('Not implemented');
  }

  async indexSession(
    _sessionId: string,
    _summary: string,
    _embedding: number[],
    _meta: SessionMeta
  ): Promise<void> {
    // TODO: Insert into sessions table

    throw new Error('Not implemented');
  }

  async indexMemory(
    _memoryId: string,
    _content: string,
    _embedding: number[],
    _meta: WrittenMemory
  ): Promise<void> {
    // TODO: Insert into memories table

    throw new Error('Not implemented');
  }

  async updateSession(
    _sessionId: string,
    _summary: string,
    _embedding: number[],
    _meta: SessionMeta
  ): Promise<void> {
    // TODO: Update sessions table entry

    throw new Error('Not implemented');
  }

  async updateMemory(
    _memoryId: string,
    _content: string,
    _embedding: number[],
    _meta: WrittenMemory
  ): Promise<void> {
    // TODO: Update memories table entry

    throw new Error('Not implemented');
  }

  async remove(_id: string): Promise<void> {
    // TODO: Set deleted = true in both tables
    // (Or delete from table if hard delete)

    throw new Error('Not implemented');
  }

  async search(
    _query: string,
    _queryEmbedding: number[],
    _options: SearchOptions
  ): Promise<SearchResult[]> {
    // TODO: Execute hybrid search on sessions table
    //   .search(queryEmbedding, { query_type: 'hybrid' })
    //   .where('deleted = false')
    //   .limit(limit)
    // TODO: Execute hybrid search on memories table
    // TODO: Combine results
    // TODO: Normalize scores using normalizeScore()
    // TODO: Sort by score descending
    // TODO: Apply limit
    // TODO: Filter by type if specified

    void normalizeScore; // Will be used in implementation
    throw new Error('Not implemented');
  }

  async close(): Promise<void> {
    // TODO: Close LanceDB connection

    throw new Error('Not implemented');
  }
}
