/**
 * Tool definitions for agent integration
 *
 * Exports framework-agnostic tool definitions with Zod schemas.
 * Can be used with any agent framework that supports JSON schema tools.
 */

import { z } from 'zod';
import type { Memory } from '../memory.js';

/**
 * Tool definition with Zod schema and execute function.
 */
export interface ToolDefinition<T extends z.ZodType> {
  name: string;
  description: string;
  parameters: T;
  execute: (params: z.infer<T>, memory: Memory) => Promise<unknown>;
}

// =============================================================================
// Tool Parameter Schemas
// =============================================================================

export const MemorySearchParamsSchema = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().positive().optional().describe('Max results (default: 10)'),
  type: z
    .enum(['all', 'session', 'memory'])
    .optional()
    .describe('Filter by type'),
});

export const MemoryReadParamsSchema = z.object({
  id: z.string().describe('Memory or session ID'),
  chunk: z.number().nonnegative().optional().describe('Chunk index (0-based, default: 0)'),
});

export const MemoryWriteParamsSchema = z.object({
  title: z.string().describe('Memory title'),
  content: z.string().describe('Memory content'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
});

export const MemoryUpdateParamsSchema = z.object({
  id: z.string().describe('Memory ID'),
  content: z.string().optional().describe('New content'),
  title: z.string().optional().describe('New title'),
  tags: z.array(z.string()).optional().describe('New tags'),
});

export const MemoryDeleteParamsSchema = z.object({
  id: z.string().describe('Memory ID'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

/**
 * Search tool definition.
 */
export const memorySearchTool: ToolDefinition<typeof MemorySearchParamsSchema> = {
  name: 'memory_search',
  description: 'Search through stored memories and conversation sessions',
  parameters: MemorySearchParamsSchema,
  execute: async (params, memory) => {
    return await memory.search(params.query, {
      limit: params.limit,
      type: params.type,
    });
  },
};

/**
 * Read tool definition.
 */
export const memoryReadTool: ToolDefinition<typeof MemoryReadParamsSchema> = {
  name: 'memory_read',
  description: 'Read the content of a memory or session by chunk index',
  parameters: MemoryReadParamsSchema,
  execute: async (params, memory) => {
    return await memory.read(params.id, { chunk: params.chunk ?? 0 });
  },
};

/**
 * Write tool definition.
 */
export const memoryWriteTool: ToolDefinition<typeof MemoryWriteParamsSchema> = {
  name: 'memory_write',
  description: 'Write a new persistent memory',
  parameters: MemoryWriteParamsSchema,
  execute: async (params, memory) => {
    const id = await memory.write({
      title: params.title,
      content: params.content,
      tags: params.tags,
    });
    return { id };
  },
};

/**
 * Update tool definition.
 */
export const memoryUpdateTool: ToolDefinition<typeof MemoryUpdateParamsSchema> = {
  name: 'memory_update',
  description: 'Update an existing memory',
  parameters: MemoryUpdateParamsSchema,
  execute: async (params, memory) => {
    await memory.update(params.id, {
      content: params.content,
      title: params.title,
      tags: params.tags,
    });
    return { success: true };
  },
};

/**
 * Delete tool definition.
 */
export const memoryDeleteTool: ToolDefinition<typeof MemoryDeleteParamsSchema> = {
  name: 'memory_delete',
  description: 'Delete a memory (soft delete)',
  parameters: MemoryDeleteParamsSchema,
  execute: async (params, memory) => {
    await memory.delete(params.id);
    return { success: true };
  },
};

/**
 * Get all memory tools configured with a Memory instance.
 *
 * @param memory - Memory instance to bind tools to
 * @returns Array of tool definitions ready for use
 *
 * @example
 * ```typescript
 * import { memoryTools } from '@agent-memory/core/tools';
 *
 * const memory = await Memory.init(config);
 * const tools = memoryTools(memory);
 *
 * // Register with your agent framework
 * for (const tool of tools) {
 *   agent.registerTool(tool.name, tool.description, tool.parameters, tool.execute);
 * }
 * ```
 */
export function memoryTools(memory: Memory) {
  return [
    {
      name: memorySearchTool.name,
      description: memorySearchTool.description,
      parameters: memorySearchTool.parameters,
      execute: (params: z.infer<typeof MemorySearchParamsSchema>) =>
        memorySearchTool.execute(params, memory),
    },
    {
      name: memoryReadTool.name,
      description: memoryReadTool.description,
      parameters: memoryReadTool.parameters,
      execute: (params: z.infer<typeof MemoryReadParamsSchema>) =>
        memoryReadTool.execute(params, memory),
    },
    {
      name: memoryWriteTool.name,
      description: memoryWriteTool.description,
      parameters: memoryWriteTool.parameters,
      execute: (params: z.infer<typeof MemoryWriteParamsSchema>) =>
        memoryWriteTool.execute(params, memory),
    },
    {
      name: memoryUpdateTool.name,
      description: memoryUpdateTool.description,
      parameters: memoryUpdateTool.parameters,
      execute: (params: z.infer<typeof MemoryUpdateParamsSchema>) =>
        memoryUpdateTool.execute(params, memory),
    },
    {
      name: memoryDeleteTool.name,
      description: memoryDeleteTool.description,
      parameters: memoryDeleteTool.parameters,
      execute: (params: z.infer<typeof MemoryDeleteParamsSchema>) =>
        memoryDeleteTool.execute(params, memory),
    },
  ];
}

/**
 * Convert a tool definition to JSON Schema format.
 *
 * @param tool - Tool definition
 * @returns JSON Schema representation
 */
export function toJSONSchema(tool: ToolDefinition<z.ZodType>): object {
  return {
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.parameters),
  };
}

/**
 * Basic Zod to JSON Schema conversion.
 * For more complete conversion, use zod-to-json-schema package.
 */
function zodToJsonSchema(schema: z.ZodType): object {
  // TODO: Implement proper Zod to JSON Schema conversion
  // For now, return the schema's description if available
  void schema;
  return { type: 'object' };
}
