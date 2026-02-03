/**
 * Embeddings provider interface and factory
 *
 * Providers generate vector embeddings for text content.
 * Used for semantic search over sessions and memories.
 */

import type { EmbeddingsConfig } from '../../types.js';

/**
 * Interface for embeddings providers.
 *
 * Implementations must provide:
 * - embed(): Generate embedding for single text
 * - dimensions: Embedding vector size (needed for LanceDB schema)
 * - embedBatch() (optional): Batch embedding for efficiency
 *
 * @example
 * ```typescript
 * class CustomEmbeddings implements EmbeddingsProvider {
 *   readonly dimensions = 1024;
 *
 *   async embed(text: string): Promise<number[]> {
 *     // Call your embedding API
 *     return embedding;
 *   }
 * }
 * ```
 */
export interface EmbeddingsProvider {
  /**
   * Generate embedding for text.
   *
   * @param text - Text to embed
   * @returns Embedding vector
   */
  embed(text: string): Promise<number[]>;

  /**
   * Embedding dimension size.
   * Must be known ahead of time for LanceDB schema.
   */
  readonly dimensions: number;

  /**
   * Optional: Generate embeddings for multiple texts.
   * More efficient than calling embed() multiple times.
   */
  embedBatch?(texts: string[]): Promise<number[][]>;
}

/**
 * Create an embeddings provider from configuration.
 *
 * @param config - Embeddings configuration
 * @returns Configured embeddings provider
 */
export function createEmbeddingsProvider(_config: EmbeddingsConfig): EmbeddingsProvider {
  // TODO: Switch on config.provider
  // TODO: Return OpenAIEmbeddings for 'openai'
  // TODO: Return OllamaEmbeddings for 'ollama'
  // TODO: Throw for unknown provider

  throw new Error('Not implemented');
}
