/**
 * JSONL-based session storage implementation
 *
 * Stores session messages in append-only JSONL files
 * and metadata in JSON files.
 *
 * File structure:
 *   sessions/
 *   ├── {sessionId}.jsonl       # Messages (one per line)
 *   └── {sessionId}.meta.json   # Metadata (summary, chunks, etc.)
 */

import type { Message, SessionMeta } from '../types.js';
import type { SessionStorage } from './index.js';

/**
 * JSONL-based session storage.
 *
 * @example
 * ```typescript
 * const storage = new JSONLSessionStorage('/path/to/sessions');
 * await storage.append('session-1', [{ role: 'user', content: 'Hello' }]);
 * const messages = await storage.readChunk('session-1', 0, 50);
 * ```
 */
export class JSONLSessionStorage implements SessionStorage {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async append(_sessionId: string, _messages: Message[]): Promise<void> {
    // TODO: Get session file path from this.basePath
    // TODO: Append messages as JSONL lines
    // TODO: Handle file creation if needed

    void this.basePath;
    throw new Error('Not implemented');
  }

  async readChunk(
    _sessionId: string,
    _chunkIndex: number,
    _chunkSize: number
  ): Promise<Message[]> {
    // TODO: Read JSONL file
    // TODO: Calculate start/end indices
    // TODO: Return slice of messages

    throw new Error('Not implemented');
  }

  async readAll(_sessionId: string): Promise<Message[]> {
    // TODO: Read entire JSONL file
    // TODO: Parse all lines
    // TODO: Return all messages

    throw new Error('Not implemented');
  }

  async getMeta(_sessionId: string): Promise<SessionMeta | null> {
    // TODO: Read meta.json file
    // TODO: Parse and validate with schema
    // TODO: Return null if not found

    throw new Error('Not implemented');
  }

  async setMeta(_sessionId: string, _meta: SessionMeta): Promise<void> {
    // TODO: Serialize metadata
    // TODO: Write to meta.json file

    throw new Error('Not implemented');
  }

  async exists(_sessionId: string): Promise<boolean> {
    // TODO: Check if session files exist

    throw new Error('Not implemented');
  }

  async list(): Promise<string[]> {
    // TODO: List all .jsonl files in directory
    // TODO: Extract session IDs from filenames
    // TODO: Return array of IDs

    throw new Error('Not implemented');
  }
}

/**
 * Calculate the number of chunks for a given message count.
 */
export function getChunkCount(messageCount: number, chunkSize: number): number {
  return Math.ceil(messageCount / chunkSize);
}

/**
 * Get the session file path for messages.
 */
export function getSessionFilePath(basePath: string, sessionId: string): string {
  return `${basePath}/${sessionId}.jsonl`;
}

/**
 * Get the metadata file path for a session.
 */
export function getMetaFilePath(basePath: string, sessionId: string): string {
  return `${basePath}/${sessionId}.meta.json`;
}
