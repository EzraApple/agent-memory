/**
 * Anthropic summarizer provider implementation
 *
 * Uses Claude models for generating conversation summaries.
 */

import type { SummarizerProvider } from './index.js';
import type { Message, SummarizationResult } from '../../types.js';
import { ProviderError } from '../../errors.js';
import {
  SUMMARIZATION_USER_PROMPT,
  parseSummarizationResponse,
  formatMessagesForPrompt,
} from './index.js';

/**
 * Anthropic summarizer provider.
 *
 * @example
 * ```typescript
 * const provider = new AnthropicSummarizer({
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   model: 'claude-3-haiku-20240307',
 * });
 *
 * const { summary, keyFacts } = await provider.summarize(messages);
 * ```
 */
export class AnthropicSummarizer implements SummarizerProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-3-haiku-20240307';
  }

  async summarize(messages: Message[]): Promise<SummarizationResult> {
    // TODO: POST to https://api.anthropic.com/v1/messages
    // TODO: Headers: x-api-key, anthropic-version
    // TODO: Body: { model, max_tokens: 500, messages: [...] }
    // TODO: Parse response with parseSummarizationResponse()
    // TODO: Wrap errors in ProviderError

    void this.apiKey;
    void this.model;
    void messages;
    void SUMMARIZATION_USER_PROMPT;
    void parseSummarizationResponse;
    void formatMessagesForPrompt;
    void ProviderError;

    throw new Error('Not implemented');
  }
}
