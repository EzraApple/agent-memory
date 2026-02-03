/**
 * Markdown-based memory storage implementation
 *
 * Stores agent-written memories as markdown files with YAML-like frontmatter.
 *
 * File format:
 *   # Title Here
 *
 *   Content goes here...
 *
 *   ---
 *   tags: tag1, tag2
 *   created: 2024-02-02T11:00:00Z
 *   updated: 2024-02-02T11:00:00Z
 *   deleted: false
 */

import type { WrittenMemory } from '../types.js';
import type { MemoryStorage, CreateMemoryOptions, UpdateMemoryOptions } from './index.js';

/**
 * Markdown-based memory storage.
 *
 * @example
 * ```typescript
 * const storage = new MarkdownMemoryStorage('/path/to/memories');
 * const id = await storage.create({
 *   title: 'Preferences',
 *   content: 'User prefers dark mode',
 *   tags: ['preference'],
 * });
 * const memory = await storage.read(id);
 * ```
 */
export class MarkdownMemoryStorage implements MemoryStorage {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async create(_options: CreateMemoryOptions): Promise<string> {
    // TODO: Generate unique ID
    // TODO: Format as markdown
    // TODO: Write file to this.basePath
    // TODO: Return ID

    void this.basePath;
    throw new Error('Not implemented');
  }

  async read(_id: string): Promise<WrittenMemory | null> {
    // TODO: Read markdown file
    // TODO: Parse content and frontmatter
    // TODO: Return null if not found

    throw new Error('Not implemented');
  }

  async update(_id: string, _options: UpdateMemoryOptions): Promise<void> {
    // TODO: Read existing memory
    // TODO: Merge updates
    // TODO: Update timestamp
    // TODO: Write file

    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: Read existing memory
    // TODO: Set deleted flag
    // TODO: Write file

    throw new Error('Not implemented');
  }

  async list(): Promise<string[]> {
    // TODO: List all .md files
    // TODO: Filter out deleted
    // TODO: Return IDs

    throw new Error('Not implemented');
  }

  async exists(_id: string): Promise<boolean> {
    // TODO: Check if file exists

    throw new Error('Not implemented');
  }
}

/**
 * Generate a unique memory ID.
 */
export function generateMemoryId(): string {
  // Format: memory-{random8chars}
  return `memory-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Format a memory as markdown.
 */
export function formatMemoryMarkdown(memory: WrittenMemory): string {
  const lines = [
    `# ${memory.title}`,
    '',
    memory.content,
    '',
    '---',
    `tags: ${memory.tags.join(', ')}`,
    `created: ${memory.createdAt}`,
    `updated: ${memory.updatedAt}`,
    `deleted: ${memory.deleted}`,
  ];
  return lines.join('\n');
}

/**
 * Parse a markdown file into a WrittenMemory.
 */
export function parseMemoryMarkdown(content: string, id: string): WrittenMemory {
  const [body, frontmatter] = content.split('\n---\n');

  if (!body || !frontmatter) {
    throw new Error('Invalid memory format: missing frontmatter');
  }

  // Extract title from first heading
  const titleMatch = body.match(/^# (.+)\n/);
  const title = titleMatch?.[1] ?? 'Untitled';

  // Extract content (everything after title)
  const memoryContent = body.replace(/^# .+\n\n?/, '').trim();

  // Parse frontmatter
  const meta = parseFrontmatter(frontmatter);

  return {
    id,
    title,
    content: memoryContent,
    tags: meta.tags?.split(', ').filter(Boolean) ?? [],
    createdAt: meta.created ?? new Date().toISOString(),
    updatedAt: meta.updated ?? new Date().toISOString(),
    deleted: meta.deleted === 'true',
  };
}

/**
 * Parse YAML-like frontmatter.
 */
function parseFrontmatter(frontmatter: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of frontmatter.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      result[key] = value;
    }
  }

  return result;
}

/**
 * Get the file path for a memory.
 */
export function getMemoryFilePath(basePath: string, id: string): string {
  return `${basePath}/${id}.md`;
}
