/**
 * Summarizer provider interface and factory
 *
 * Providers generate summaries and key facts from conversation messages.
 * Used when ingesting sessions to create searchable summaries.
 */

import type { Message, SummarizerConfig, SummarizationResult } from '../../types.js';

/**
 * Interface for summarizer providers.
 *
 * Implementations must generate:
 * - summary: 2-4 sentence summary of the conversation
 * - keyFacts: Bullet points of important information
 *
 * @example
 * ```typescript
 * class CustomSummarizer implements SummarizerProvider {
 *   async summarize(messages: Message[]): Promise<SummarizationResult> {
 *     // Call your LLM API
 *     return { summary, keyFacts };
 *   }
 * }
 * ```
 */
export interface SummarizerProvider {
  /**
   * Summarize a conversation.
   *
   * @param messages - Messages to summarize
   * @returns Summary and key facts
   */
  summarize(messages: Message[]): Promise<SummarizationResult>;
}

/**
 * Create a summarizer provider from configuration.
 *
 * @param config - Summarizer configuration
 * @returns Configured summarizer provider
 */
export function createSummarizerProvider(_config: SummarizerConfig): SummarizerProvider {
  // TODO: Switch on config.provider
  // TODO: Return OpenAISummarizer for 'openai'
  // TODO: Return AnthropicSummarizer for 'anthropic'
  // TODO: Throw for unknown provider

  throw new Error('Not implemented');
}

/**
 * System prompt for summarization.
 */
export const SUMMARIZATION_SYSTEM_PROMPT =
  'You are a helpful assistant that summarizes conversations concisely.';

/**
 * User prompt template for summarization.
 */
export const SUMMARIZATION_USER_PROMPT = `Summarize this conversation in 2-4 sentences.
Focus on:
- Key topics discussed
- Important decisions or preferences expressed
- Action items or outcomes

Then list 3-5 key facts as bullet points.

Conversation:
{messages}

Respond in this exact format:
SUMMARY:
[Your summary here]

KEY FACTS:
- [Fact 1]
- [Fact 2]
- [Fact 3]`;

/**
 * Parse the LLM response into summary and key facts.
 */
export function parseSummarizationResponse(response: string): SummarizationResult {
  const summaryMatch = response.match(/SUMMARY:\s*\n([\s\S]*?)(?=\n\s*KEY FACTS:|$)/i);
  const factsMatch = response.match(/KEY FACTS:\s*\n([\s\S]*?)$/i);

  const summary = summaryMatch?.[1]?.trim() ?? response.trim();
  const factsText = factsMatch?.[1] ?? '';
  const keyFacts = factsText
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);

  return { summary, keyFacts };
}

/**
 * Format messages for the summarization prompt.
 */
export function formatMessagesForPrompt(messages: Message[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join('\n');
}
