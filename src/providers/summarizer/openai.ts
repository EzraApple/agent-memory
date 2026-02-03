/**
 * OpenAI summarizer provider implementation
 *
 * Uses OpenAI's chat models for generating conversation summaries.
 */

import type { SummarizerProvider } from './index.js';
import type { Message, SummarizationResult } from '../../types.js';
import { DEFAULT_SUMMARIZER_MODEL } from '../../config.js';
import { ProviderError } from '../../errors.js';
import {
  SUMMARIZATION_SYSTEM_PROMPT,
  SUMMARIZATION_USER_PROMPT,
  parseSummarizationResponse,
  formatMessagesForPrompt,
} from './index.js';

/**
 * OpenAI summarizer provider.
 *
 * @example
 * ```typescript
 * const provider = new OpenAISummarizer({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'gpt-4o-mini',
 * });
 *
 * const { summary, keyFacts } = await provider.summarize(messages);
 * ```
 */
export class OpenAISummarizer implements SummarizerProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_SUMMARIZER_MODEL;
  }

  async summarize(messages: Message[]): Promise<SummarizationResult> {
    // TODO: Create OpenAI client
    // TODO: Format messages for prompt
    // TODO: Call chat.completions.create()
    // TODO: Parse response with parseSummarizationResponse()
    // TODO: Wrap errors in ProviderError

    void this.apiKey;
    void this.model;
    void messages;
    void SUMMARIZATION_SYSTEM_PROMPT;
    void SUMMARIZATION_USER_PROMPT;
    void parseSummarizationResponse;
    void formatMessagesForPrompt;
    void ProviderError;

    throw new Error('Not implemented');
  }
}
