/**
 * Error types for @agent-memory/core
 *
 * All errors extend MemoryError for easy catching.
 * Each error type includes a code and relevant context.
 */

import type { ZodError } from 'zod';

/**
 * Base error class for all memory errors.
 */
export class MemoryError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}

/**
 * Thrown when a session or memory is not found.
 */
export class NotFoundError extends MemoryError {
  constructor(
    public readonly id: string,
    public readonly entityType: 'session' | 'memory'
  ) {
    super(`${entityType} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when input validation fails.
 */
export class ValidationError extends MemoryError {
  constructor(
    message: string,
    public readonly errors: ZodError
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when file system or database operations fail.
 */
export class StorageError extends MemoryError {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Thrown when embeddings or summarizer API calls fail.
 */
export class ProviderError extends MemoryError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}
