/**
 * Configuration handling for @agent-memory/core
 *
 * Validates and processes configuration using Zod schemas.
 */

import { homedir } from 'os';
import { MemoryConfigSchema, type MemoryConfig } from './types.js';
import { ValidationError } from './errors.js';

/**
 * Validate and process memory configuration.
 *
 * @param config - Raw configuration input
 * @returns Validated and processed configuration
 * @throws ValidationError if configuration is invalid
 */
export function validateConfig(config: unknown): MemoryConfig {
  const result = MemoryConfigSchema.safeParse(config);

  if (!result.success) {
    throw new ValidationError('Invalid configuration', result.error);
  }

  return {
    ...result.data,
    storagePath: resolvePath(result.data.storagePath),
  };
}

/**
 * Resolve ~ to home directory in paths.
 *
 * @param path - Path that may contain ~
 * @returns Resolved absolute path
 */
export function resolvePath(path: string): string {
  if (path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  return path;
}

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG = {
  storagePath: '~/.agent-memory',
  chunkSize: 50,
  search: {
    hybridWeight: 0.7,
    defaultLimit: 10,
  },
} as const;

/**
 * Default model for OpenAI embeddings.
 */
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Default model for OpenAI summarizer.
 */
export const DEFAULT_SUMMARIZER_MODEL = 'gpt-4o-mini';

/**
 * Embedding dimensions by model.
 */
export const EMBEDDING_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
  'nomic-embed-text': 768,
};
