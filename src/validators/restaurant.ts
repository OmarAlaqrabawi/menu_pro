// src/validators/restaurant.ts
import { z } from "zod";

export const createRestaurantSchema = z.object({
  nameAr: z.string().min(1, "اسم المطعم بالعربي مطلوب").min(2, "يجب أن يكون حرفين على الأقل"),
  nameEn: z.string().optional(),
  slug: z
    .string()
    .min(1, "الرابط المختصر مطلوب")
    .regex(/^[a-z0-9-]+$/, "يجب أن يحتوي فقط على أحرف إنجليزية صغيرة وأرقام وشرطات"),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح").default("#FF6B35"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح").default("#1A1A2E"),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  address: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  currency: z.string().default("JOD"),
  taxPercent: z.number().min(0).max(100).default(0),
  servicePercent: z.number().min(0).max(100).default(0),
  enabledLangs: z.string().default("ar"),
  defaultLang: z.string().default("ar"),
  menuViewMode: z.enum(["LIST", "GRID"]).default("LIST"),
  aboutAr: z.string().optional(),
  aboutEn: z.string().optional(),
  workingHours: z.string().optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const updatePermissionsSchema = z.object({
  ownerCanEditMenu: z.boolean().optional(),
  ownerCanEditBranding: z.boolean().optional(),
  ownerCanEditSettings: z.boolean().optional(),
  ownerCanManageTables: z.boolean().optional(),
  ownerCanDeleteOrders: z.boolean().optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
