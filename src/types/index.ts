// src/types/index.ts
// Shared types & constants for the MenuPro platform

/* ─── User Roles ─── */
export const UserRole = {
  ADMIN: "ADMIN",
  RESTAURANT_OWNER: "RESTAURANT_OWNER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/* ─── Menu View Mode ─── */
export const MenuViewMode = {
  LIST: "LIST",
  GRID: "GRID",
} as const;
export type MenuViewMode = (typeof MenuViewMode)[keyof typeof MenuViewMode];

/* ─── Item Badge ─── */
export const ItemBadge = {
  NEW: "NEW",
  POPULAR: "POPULAR",
  OFFER: "OFFER",
} as const;
export type ItemBadge = (typeof ItemBadge)[keyof typeof ItemBadge];

/* ─── Order Type ─── */
export const OrderType = {
  DINE_IN: "DINE_IN",
  TAKEAWAY: "TAKEAWAY",
  DELIVERY: "DELIVERY",
  SCHEDULED: "SCHEDULED",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

/* ─── Order Status ─── */
export const OrderStatus = {
  NEW: "NEW",
  PREPARING: "PREPARING",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/* ─── Subscription Status ─── */
export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  TRIAL: "TRIAL",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

/* ─── Billing Cycle ─── */
export const BillingCycle = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type BillingCycle = (typeof BillingCycle)[keyof typeof BillingCycle];

/* ─── Analytics Event Type ─── */
export const AnalyticsEventType = {
  MENU_VIEW: "MENU_VIEW",
  CATEGORY_VIEW: "CATEGORY_VIEW",
  ITEM_VIEW: "ITEM_VIEW",
  ITEM_ADD_TO_CART: "ITEM_ADD_TO_CART",
  ORDER_PLACED: "ORDER_PLACED",
  QR_SCAN: "QR_SCAN",
} as const;
export type AnalyticsEventType = (typeof AnalyticsEventType)[keyof typeof AnalyticsEventType];

/* ─── Notification Type ─── */
export const NotificationType = {
  NEW_ORDER: "NEW_ORDER",
  ORDER_UPDATED: "ORDER_UPDATED",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/* ─── Arabic Labels (for UI) ─── */
export const OrderStatusLabel: Record<string, string> = {
  NEW: "جديد",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

export const OrderTypeLabel: Record<string, string> = {
  DINE_IN: "طاولة",
  TAKEAWAY: "سفري",
  DELIVERY: "توصيل",
  SCHEDULED: "مجدول",
};

export const UserRoleLabel: Record<string, string> = {
  ADMIN: "مدير النظام",
  RESTAURANT_OWNER: "صاحب مطعم",
};

/* ─── Order Status Flow (allowed transitions) ─── */
export const OrderStatusFlow: Record<string, string[]> = {
  NEW: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
