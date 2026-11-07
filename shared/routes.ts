import { z } from "zod";
import {
  insertProjectSchema,
  insertFileSchema,
  insertTerminalHistorySchema,
  codeProjects,
  codeFiles,
  terminalHistory,
  userCredits,
  userUsage,
  userSubscriptions,
} from "./schema";

// Error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  // Projects
  projects: {
    list: {
      method: "GET" as const,
      path: "/api/projects" as const,
      responses: {
        200: z.array(z.custom<typeof codeProjects.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/projects/:id" as const,
      responses: {
        200: z.object({
          project: z.custom<typeof codeProjects.$inferSelect>(),
          files: z.array(z.custom<typeof codeFiles.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/projects" as const,
      input: insertProjectSchema.omit({ userId: true, sessionId: true }),
      responses: {
        201: z.custom<typeof codeProjects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/projects/:id" as const,
      input: insertProjectSchema.omit({ userId: true, sessionId: true }).partial(),
      responses: {
        200: z.custom<typeof codeProjects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/projects/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Files
  files: {
    create: {
      method: "POST" as const,
      path: "/api/projects/:projectId/files" as const,
      input: insertFileSchema.omit({ projectId: true }),
      responses: {
        201: z.custom<typeof codeFiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/files/:id" as const,
      input: z.object({
        filename: z.string().optional(),
        content: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof codeFiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/files/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    download: {
      method: "GET" as const,
      path: "/api/files/:id/download" as const,
      responses: {
        200: z.object({
          filename: z.string(),
          content: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },

  // Terminal
  terminal: {
    execute: {
      method: "POST" as const,
      path: "/api/projects/:projectId/terminal/execute" as const,
      input: z.object({
        command: z.string(),
      }),
      responses: {
        200: z.object({
          output: z.string(),
          error: z.string().optional(),
        }),
        400: errorSchemas.validation,
      },
    },
    history: {
      method: "GET" as const,
      path: "/api/projects/:projectId/terminal/history" as const,
      responses: {
        200: z.array(z.custom<typeof terminalHistory.$inferSelect>()),
      },
    },
  },

  // AI Assistant
  ai: {
    fixCode: {
      method: "POST" as const,
      path: "/api/ai/fix-code" as const,
      input: z.object({
        code: z.string(),
        language: z.string(),
        error: z.string().optional(),
      }),
      responses: {
        200: z.object({
          fixedCode: z.string(),
          explanation: z.string(),
        }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    explainError: {
      method: "POST" as const,
      path: "/api/ai/explain-error" as const,
      input: z.object({
        error: z.string(),
        code: z.string(),
        language: z.string(),
      }),
      responses: {
        200: z.object({
          explanation: z.string(),
        }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    improveCode: {
      method: "POST" as const,
      path: "/api/ai/improve-code" as const,
      input: z.object({
        code: z.string(),
        language: z.string(),
      }),
      responses: {
        200: z.object({
          improvedCode: z.string(),
          suggestions: z.array(z.string()),
        }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    generateProgram: {
      method: "POST" as const,
      path: "/api/ai/generate-program" as const,
      input: z.object({
        prompt: z.string().trim().min(3).max(4000),
        language: z.string().trim().min(1).max(50),
      }),
      responses: {
        200: z.object({
          code: z.string(),
          filename: z.string(),
        }),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
  },

  // Usage & Credits
  usage: {
    check: {
      method: "GET" as const,
      path: "/api/usage/check" as const,
      responses: {
        200: z.object({
          isAuthenticated: z.boolean(),
          canUseEditor: z.boolean(),
          canUseAI: z.boolean(),
          remainingMinutes: z.number().optional(),
          remainingCredits: z.number().optional(),
          subscriptionTier: z.string(),
        }),
      },
    },
    track: {
      method: "POST" as const,
      path: "/api/usage/track" as const,
      input: z.object({
        minutes: z.number(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
        }),
      },
    },
  },

  credits: {
    get: {
      method: "GET" as const,
      path: "/api/credits" as const,
      responses: {
        200: z.custom<typeof userCredits.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  subscription: {
    get: {
      method: "GET" as const,
      path: "/api/subscription" as const,
      responses: {
        200: z.custom<typeof userSubscriptions.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/subscription/checkout" as const,
      input: z.object({
        tier: z.enum(["premium", "premium_ultimate"]),
      }),
      responses: {
        200: z.object({
          checkoutUrl: z.string(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// Helper function
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Type helpers
export type ProjectInput = z.infer<typeof api.projects.create.input>;
export type ProjectResponse = z.infer<typeof api.projects.get.responses[200]>;
export type FileInput = z.infer<typeof api.files.create.input>;
export type FileResponse = z.infer<typeof api.files.update.responses[200]>;
export type TerminalExecuteInput = z.infer<typeof api.terminal.execute.input>;
export type TerminalExecuteResponse = z.infer<typeof api.terminal.execute.responses[200]>;
export type AIFixCodeInput = z.infer<typeof api.ai.fixCode.input>;
export type AIFixCodeResponse = z.infer<typeof api.ai.fixCode.responses[200]>;
export type UsageCheckResponse = z.infer<typeof api.usage.check.responses[200]>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
