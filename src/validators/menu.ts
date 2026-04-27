// src/validators/menu.ts
import { z } from "zod";

export const createCategorySchema = z.object({
  restaurantId: z.string().min(1),
  nameAr: z.string().min(1, "اسم القسم بالعربي مطلوب"),
  nameEn: z.string().optional(),
  nameTr: z.string().optional(),
  emoji: z.string().optional(),
  iconUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  scheduleType: z.enum(["ALL_DAY", "BREAKFAST", "LUNCH", "DINNER", "CUSTOM"]).optional(),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().omit({ restaurantId: true });

export const createItemSchema = z.object({
  categoryId: z.string().min(1),
  nameAr: z.string().min(1, "اسم العنصر بالعربي مطلوب"),
  nameEn: z.string().optional(),
  nameTr: z.string().optional(),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  descTr: z.string().optional(),
  price: z.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
  discountPrice: z.number().min(0).optional(),
  calories: z.number().int().min(0).optional(),
  prepTime: z.number().int().min(0).optional(),
  allergens: z.string().optional(),
  badge: z.enum(["NEW", "POPULAR", "OFFER"]).optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateItemSchema = createItemSchema.partial().omit({ categoryId: true });

export const createItemSizeSchema = z.object({
  itemId: z.string().min(1),
  nameAr: z.string().min(1, "اسم الحجم مطلوب"),
  nameEn: z.string().optional(),
  price: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const createItemExtraSchema = z.object({
  itemId: z.string().min(1),
  nameAr: z.string().min(1, "اسم الإضافة مطلوب"),
  nameEn: z.string().optional(),
  price: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
