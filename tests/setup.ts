/**
 * Vitest test setup
 *
 * This file is loaded before all tests.
 * Use it for global mocks, fixtures, and utilities.
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Check if live API tests should run.
 */
export const LIVE_TEST = process.env.LIVE_TEST === '1';

/**
 * Skip helper for environment-gated tests.
 */
export function skipIfNoLiveTest(description: string) {
  return LIVE_TEST ? description : `[SKIPPED] ${description}`;
}

// =============================================================================
// Sample Fixtures
// =============================================================================

export const sampleMessage = {
  role: 'user' as const,
  content: 'Hello, world!',
  timestamp: '2024-02-02T10:00:00Z',
};

export const sampleSession = {
  id: 'test-session-1',
  channel: 'test',
  userId: 'user-1',
  messages: [
    { role: 'user' as const, content: 'Hello', timestamp: '2024-02-02T10:00:00Z' },
    { role: 'assistant' as const, content: 'Hi!', timestamp: '2024-02-02T10:00:01Z' },
  ],
};

export const largeSession = {
  id: 'test-session-large',
  messages: Array.from({ length: 150 }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Message ${i}`,
    timestamp: new Date(Date.UTC(2024, 1, 2, 10, 0, i)).toISOString(),
  })),
};

export const sampleMemory = {
  id: 'test-memory-1',
  title: 'Test Memory',
  content: 'This is test content',
  tags: ['test', 'sample'],
  createdAt: '2024-02-02T10:00:00Z',
  updatedAt: '2024-02-02T10:00:00Z',
  deleted: false,
};

// =============================================================================
// Mock Factories
// =============================================================================

/**
 * Create a mock embeddings provider.
 */
export function createMockEmbeddings(dimensions = 1536) {
  return {
    embed: vi.fn().mockResolvedValue(new Array(dimensions).fill(0)),
    dimensions,
    embedBatch: vi.fn().mockImplementation((texts: string[]) =>
      Promise.resolve(texts.map(() => new Array(dimensions).fill(0)))
    ),
  };
}

/**
 * Create a mock summarizer provider.
 */
export function createMockSummarizer() {
  return {
    summarize: vi.fn().mockResolvedValue({
      summary: 'Test summary of the conversation.',
      keyFacts: ['Fact 1', 'Fact 2', 'Fact 3'],
    }),
  };
}

/**
 * Create a mock LanceDB table.
 */
export function createMockLanceTable() {
  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
  };

  return {
    search: vi.fn().mockReturnValue(mockQuery),
    add: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    createFtsIndex: vi.fn().mockResolvedValue(undefined),
  };
}
