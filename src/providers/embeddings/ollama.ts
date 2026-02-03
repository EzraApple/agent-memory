/**
 * Ollama embeddings provider implementation
 *
 * Uses locally-running Ollama for generating embeddings.
 * Requires Ollama server running with an embedding model.
 */

import type { EmbeddingsProvider } from './index.js';
import { EMBEDDING_DIMENSIONS } from '../../config.js';
import { ProviderError } from '../../errors.js';

/**
 * Ollama embeddings provider.
 *
 * @example
 * ```typescript
 * const provider = new OllamaEmbeddings({
 *   baseUrl: 'http://localhost:11434',
 *   model: 'nomic-embed-text',
 * });
 *
 * const embedding = await provider.embed('Hello world');
 * ```
 */
export class OllamaEmbeddings implements EmbeddingsProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  readonly dimensions: number;

  constructor(config: { baseUrl: string; model?: string }) {
    this.baseUrl = config.baseUrl;
    this.model = config.model ?? 'nomic-embed-text';
    this.dimensions = EMBEDDING_DIMENSIONS[this.model] ?? 768;
  }

  async embed(text: string): Promise<number[]> {
    // TODO: POST to {baseUrl}/api/embeddings
    // TODO: Body: { model, prompt: text }
    // TODO: Parse response.embedding
    // TODO: Wrap errors in ProviderError

    void this.baseUrl;
    void this.model;
    void text;
    void ProviderError;

    throw new Error('Not implemented');
  }
}
