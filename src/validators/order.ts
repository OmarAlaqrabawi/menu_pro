// src/validators/order.ts
import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["NEW", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

export const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY", "SCHEDULED"]),
  tableId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1),
    itemName: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    sizeName: z.string().optional(),
    extras: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })).min(1, "يجب إضافة عنصر واحد على الأقل"),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
