/**
 * Storage interfaces for @agent-memory/core
 *
 * These interfaces define the contract for session and memory storage.
 * Default implementations use JSONL for sessions and markdown for memories.
 * Custom implementations can use different backends (SQLite, PostgreSQL, etc.).
 */

import type { Message, SessionMeta, WrittenMemory } from '../types.js';

/**
 * Interface for session storage operations.
 *
 * Default implementation uses JSONL files for messages and JSON for metadata.
 *
 * @example
 * ```typescript
 * class PostgresSessionStorage implements SessionStorage {
 *   async append(sessionId, messages) {
 *     // INSERT INTO messages ...
 *   }
 *   // ... implement remaining methods
 * }
 * ```
 */
export interface SessionStorage {
  /**
   * Append messages to a session.
   * Creates the session if it doesn't exist.
   */
  append(sessionId: string, messages: Message[]): Promise<void>;

  /**
   * Read a specific chunk of messages.
   * @param chunkIndex - Zero-indexed chunk number
   * @param chunkSize - Messages per chunk
   */
  readChunk(sessionId: string, chunkIndex: number, chunkSize: number): Promise<Message[]>;

  /**
   * Read all messages in a session.
   * Used for summarization.
   */
  readAll(sessionId: string): Promise<Message[]>;

  /**
   * Get session metadata.
   * Returns null if session doesn't exist.
   */
  getMeta(sessionId: string): Promise<SessionMeta | null>;

  /**
   * Set session metadata.
   */
  setMeta(sessionId: string, meta: SessionMeta): Promise<void>;

  /**
   * Check if a session exists.
   */
  exists(sessionId: string): Promise<boolean>;

  /**
   * List all session IDs.
   */
  list(): Promise<string[]>;
}

/**
 * Interface for written memory storage operations.
 *
 * Default implementation uses markdown files.
 */
export interface MemoryStorage {
  /**
   * Create a new memory.
   * @returns Generated memory ID
   */
  create(options: CreateMemoryOptions): Promise<string>;

  /**
   * Read a memory by ID.
   * Returns null if not found.
   */
  read(id: string): Promise<WrittenMemory | null>;

  /**
   * Update an existing memory.
   */
  update(id: string, options: UpdateMemoryOptions): Promise<void>;

  /**
   * Soft delete a memory.
   * Sets tombstone, does not physically delete.
   */
  delete(id: string): Promise<void>;

  /**
   * List all non-deleted memory IDs.
   */
  list(): Promise<string[]>;

  /**
   * Check if a memory exists (including deleted).
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Options for creating a new memory.
 */
export interface CreateMemoryOptions {
  title: string;
  content: string;
  tags?: string[];
}

/**
 * Options for updating a memory.
 */
export interface UpdateMemoryOptions {
  title?: string;
  content?: string;
  tags?: string[];
}
