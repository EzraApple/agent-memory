/**
 * Search interface for @agent-memory/core
 *
 * Defines the contract for search index implementations.
 * Default implementation uses LanceDB for hybrid BM25 + vector search.
 */

import type { SearchResult, SearchOptions, SessionMeta, WrittenMemory } from '../types.js';

/**
 * Interface for search index operations.
 *
 * Implementations must support:
 * - Indexing session summaries and memory content
 * - Hybrid search (BM25 + vector similarity)
 * - Filtering by type and deleted status
 */
export interface SearchIndex {
  /**
   * Initialize the search index.
   * Creates tables and FTS indexes if needed.
   */
  init(): Promise<void>;

  /**
   * Index a session summary.
   */
  indexSession(
    sessionId: string,
    summary: string,
    embedding: number[],
    meta: SessionMeta
  ): Promise<void>;

  /**
   * Index a written memory.
   */
  indexMemory(
    memoryId: string,
    content: string,
    embedding: number[],
    meta: WrittenMemory
  ): Promise<void>;

  /**
   * Update an existing index entry.
   */
  updateSession(
    sessionId: string,
    summary: string,
    embedding: number[],
    meta: SessionMeta
  ): Promise<void>;

  /**
   * Update an existing memory index entry.
   */
  updateMemory(
    memoryId: string,
    content: string,
    embedding: number[],
    meta: WrittenMemory
  ): Promise<void>;

  /**
   * Remove an entry from the index.
   */
  remove(id: string): Promise<void>;

  /**
   * Execute a hybrid search.
   *
   * @param query - Text query for BM25
   * @param queryEmbedding - Vector for similarity search
   * @param options - Search options (limit, type filter)
   */
  search(
    query: string,
    queryEmbedding: number[],
    options: SearchOptions
  ): Promise<SearchResult[]>;

  /**
   * Close the index connection.
   */
  close(): Promise<void>;
}

/**
 * Normalize a distance value to a similarity score.
 *
 * Converts distance (lower is better) to score (higher is better).
 * Output range: 0-1
 *
 * @param distance - Distance from vector search
 * @returns Normalized similarity score
 */
export function normalizeScore(distance: number): number {
  return 1 / (1 + distance);
}
