import { z } from 'zod';
import { insertUserSchema, insertReportSchema, users, reports } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Analytics response schemas
const dailyStatSchema = z.object({
  date: z.string(),
  transfers: z.number(),
  sales: z.number(),
});

const agentPerformanceSchema = z.object({
  agentName: z.string(),
  transfers: z.number(),
  sales: z.number(),
});

const kpiSchema = z.object({
  totalCalls: z.number(),
  totalTransfers: z.number(),
  totalSales: z.number(),
  conversionRate: z.string(),
});

export const api = {
  // Auth
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  // Users (Admin/DEO only)
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
        403: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
  },
  // Reports
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        agentId: z.string().optional(), // For admin/deo to filter by agent
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      input: insertReportSchema,
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/reports/bulk',
      input: z.array(insertReportSchema),
      responses: {
        201: z.object({ count: z.number(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
  // Analytics
  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard',
      input: z.object({
        days: z.coerce.number().optional(),
        location: z.string().optional(),
      }).optional(),
      responses: {
        200: z.object({
          dailyStats: z.array(dailyStatSchema),
          agentPerformance: z.array(agentPerformanceSchema),
          performerComparison: z.array(z.object({
            name: z.string(),
            transfers: z.number(),
            sales: z.number(),
          })),
          kpis: kpiSchema.extend({
            totalAgents: z.number(),
          }),
        }),
      },
    },
  },
};

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
