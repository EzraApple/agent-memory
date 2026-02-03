/**
 * OpenAI embeddings provider implementation
 *
 * Uses OpenAI's text-embedding-3 models for generating embeddings.
 */

import type { EmbeddingsProvider } from './index.js';
import { EMBEDDING_DIMENSIONS, DEFAULT_EMBEDDING_MODEL } from '../../config.js';
import { ProviderError } from '../../errors.js';

/**
 * OpenAI embeddings provider.
 *
 * @example
 * ```typescript
 * const provider = new OpenAIEmbeddings({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'text-embedding-3-small',
 * });
 *
 * const embedding = await provider.embed('Hello world');
 * ```
 */
export class OpenAIEmbeddings implements EmbeddingsProvider {
  private readonly apiKey: string;
  private readonly model: string;
  readonly dimensions: number;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_EMBEDDING_MODEL;
    this.dimensions = EMBEDDING_DIMENSIONS[this.model] ?? 1536;
  }

  async embed(text: string): Promise<number[]> {
    // TODO: Create OpenAI client
    // TODO: Call embeddings.create()
    // TODO: Return embedding vector
    // TODO: Wrap errors in ProviderError

    void this.apiKey;
    void this.model;
    void text;
    void ProviderError;

    throw new Error('Not implemented');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // TODO: Call embeddings.create() with array input
    // TODO: Return array of embeddings
    // TODO: Wrap errors in ProviderError

    void texts;

    throw new Error('Not implemented');
  }
}
