// src/validators/table.ts
import { z } from "zod";

export const createTableSchema = z.object({
  restaurantId: z.string().min(1),
  tableNumber: z.string().min(1, "رقم الطاولة مطلوب"),
  isActive: z.boolean().default(true),
});

export const updateTableSchema = z.object({
  tableNumber: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const bulkCreateTablesSchema = z.object({
  restaurantId: z.string().min(1),
  count: z.number().int().min(1).max(50, "الحد الأقصى 50 طاولة"),
  startNumber: z.number().int().min(1).default(1),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type BulkCreateTablesInput = z.infer<typeof bulkCreateTablesSchema>;
