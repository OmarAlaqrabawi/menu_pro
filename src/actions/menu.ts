// src/actions/menu.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema, updateCategorySchema,
  createItemSchema, updateItemSchema,
  createItemSizeSchema, createItemExtraSchema, reorderSchema,
} from "@/validators/menu";
import type { CreateCategoryInput, UpdateCategoryInput, CreateItemInput, UpdateItemInput } from "@/validators/menu";
import type { ActionResult } from "./auth";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; role?: string };
}

async function canEditMenu(user: { id: string; role?: string }, restaurantId: string) {
  if (user.role === "ADMIN") return true;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return false;
  return restaurant.userId === user.id && restaurant.ownerCanEditMenu;
}

// ═══════════════ Categories ═══════════════

export async function getCategories(restaurantId: string) {
  return prisma.category.findMany({
    where: { restaurantId },
    include: {
      items: {
        include: {
          sizes: { orderBy: { sortOrder: "asc" } },
          extras: { orderBy: { sortOrder: "asc" } },
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(data: CreateCategoryInput): Promise<ActionResult & { id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };
  if (!(await canEditMenu(user, data.restaurantId))) return { success: false, error: "لا تملك صلاحية تعديل المنيو" };

  const validated = createCategorySchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  const maxOrder = await prisma.category.findFirst({
    where: { restaurantId: data.restaurantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: { ...validated.data, sortOrder: (maxOrder?.sortOrder ?? -1) + 1 },
  });

  return { success: true, id: category.id };
}

export async function updateCategory(id: string, data: UpdateCategoryInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { success: false, error: "القسم غير موجود" };
  if (!(await canEditMenu(user, category.restaurantId))) return { success: false, error: "لا تملك صلاحية تعديل المنيو" };

  const validated = updateCategorySchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  await prisma.category.update({ where: { id }, data: validated.data });
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { success: false, error: "القسم غير موجود" };
  if (!(await canEditMenu(user, category.restaurantId))) return { success: false, error: "لا تملك صلاحية تعديل المنيو" };

  await prisma.category.delete({ where: { id } });
  return { success: true };
}

export async function reorderCategories(restaurantId: string, items: { id: string; sortOrder: number }[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };
  if (!(await canEditMenu(user, restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = reorderSchema.safeParse({ items });
  if (!validated.success) return { success: false, error: "بيانات غير صالحة" };

  for (const item of items) {
    await prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } });
  }
  return { success: true };
}

// ═══════════════ Items ═══════════════

export async function getItems(categoryId: string) {
  return prisma.item.findMany({
    where: { categoryId },
    include: { sizes: { orderBy: { sortOrder: "asc" } }, extras: { orderBy: { sortOrder: "asc" } }, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createItem(data: CreateItemInput): Promise<ActionResult & { id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { success: false, error: "القسم غير موجود" };
  if (!(await canEditMenu(user, category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = createItemSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  const maxOrder = await prisma.item.findFirst({
    where: { categoryId: data.categoryId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await prisma.item.create({
    data: { ...validated.data, sortOrder: (maxOrder?.sortOrder ?? -1) + 1 },
  });

  return { success: true, id: item.id };
}

export async function updateItem(id: string, data: UpdateItemInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({ where: { id }, include: { category: true } });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = updateItemSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  await prisma.item.update({ where: { id }, data: validated.data });
  return { success: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({ where: { id }, include: { category: true } });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  await prisma.item.delete({ where: { id } });
  return { success: true };
}

export async function toggleItemAvailability(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({ where: { id }, include: { category: true } });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  await prisma.item.update({ where: { id }, data: { isAvailable: !item.isAvailable } });
  return { success: true };
}

// ═══════════════ Sizes & Extras ═══════════════

export async function addItemSize(data: { itemId: string; nameAr: string; nameEn?: string; price: number }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({ where: { id: data.itemId }, include: { category: true } });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = createItemSizeSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  await prisma.itemSize.create({ data: validated.data });
  return { success: true };
}

export async function deleteItemSize(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const size = await prisma.itemSize.findUnique({ where: { id }, include: { item: { include: { category: true } } } });
  if (!size) return { success: false, error: "غير موجود" };
  if (!(await canEditMenu(user, size.item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  await prisma.itemSize.delete({ where: { id } });
  return { success: true };
}

export async function addItemExtra(data: { itemId: string; nameAr: string; nameEn?: string; price: number }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({ where: { id: data.itemId }, include: { category: true } });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const validated = createItemExtraSchema.safeParse(data);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  await prisma.itemExtra.create({ data: validated.data });
  return { success: true };
}

export async function deleteItemExtra(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const extra = await prisma.itemExtra.findUnique({ where: { id }, include: { item: { include: { category: true } } } });
  if (!extra) return { success: false, error: "غير موجود" };
  if (!(await canEditMenu(user, extra.item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  await prisma.itemExtra.delete({ where: { id } });
  return { success: true };
}

// ═══════════════ Item Images ═══════════════

export async function addItemImage(data: { itemId: string; imageUrl: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({ where: { id: data.itemId }, include: { category: true } });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const maxOrder = await prisma.itemImage.findFirst({
    where: { itemId: data.itemId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.itemImage.create({
    data: {
      itemId: data.itemId,
      imageUrl: data.imageUrl,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });
  return { success: true };
}

export async function deleteItemImage(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const image = await prisma.itemImage.findUnique({ where: { id }, include: { item: { include: { category: true } } } });
  if (!image) return { success: false, error: "غير موجود" };
  if (!(await canEditMenu(user, image.item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  await prisma.itemImage.delete({ where: { id } });
  return { success: true };
}

// ═══════════════ Copy & Reorder ═══════════════

export async function copyItem(itemId: string): Promise<ActionResult & { id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { category: true, sizes: true, extras: true },
  });
  if (!item) return { success: false, error: "العنصر غير موجود" };
  if (!(await canEditMenu(user, item.category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const maxOrder = await prisma.item.findFirst({
    where: { categoryId: item.categoryId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const newItem = await prisma.item.create({
    data: {
      categoryId: item.categoryId,
      nameAr: item.nameAr + " (نسخة)",
      nameEn: item.nameEn,
      descAr: item.descAr,
      price: item.price,
      discountPrice: item.discountPrice,
      badge: item.badge,
      calories: item.calories,
      prepTime: item.prepTime,
      isAvailable: item.isAvailable,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    },
  });

  // Copy sizes
  for (const size of item.sizes) {
    await prisma.itemSize.create({
      data: { itemId: newItem.id, nameAr: size.nameAr, nameEn: size.nameEn, price: size.price, sortOrder: size.sortOrder },
    });
  }

  // Copy extras
  for (const extra of item.extras) {
    await prisma.itemExtra.create({
      data: { itemId: newItem.id, nameAr: extra.nameAr, nameEn: extra.nameEn, price: extra.price, sortOrder: extra.sortOrder },
    });
  }

  return { success: true, id: newItem.id };
}

export async function copyCategory(categoryId: string): Promise<ActionResult & { id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { items: { include: { sizes: true, extras: true } } },
  });
  if (!category) return { success: false, error: "القسم غير موجود" };
  if (!(await canEditMenu(user, category.restaurantId))) return { success: false, error: "لا تملك صلاحية" };

  const maxOrder = await prisma.category.findFirst({
    where: { restaurantId: category.restaurantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const newCategory = await prisma.category.create({
    data: {
      restaurantId: category.restaurantId,
      nameAr: category.nameAr + " (نسخة)",
      nameEn: category.nameEn,
      emoji: category.emoji,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
    },
  });

  // Copy all items in category
  for (const item of category.items) {
    const newItem = await prisma.item.create({
      data: {
        categoryId: newCategory.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        descAr: item.descAr,
        price: item.price,
        discountPrice: item.discountPrice,
        badge: item.badge,
        calories: item.calories,
        prepTime: item.prepTime,
        isAvailable: item.isAvailable,
        sortOrder: item.sortOrder,
      },
    });

    for (const size of item.sizes) {
      await prisma.itemSize.create({
        data: { itemId: newItem.id, nameAr: size.nameAr, nameEn: size.nameEn, price: size.price, sortOrder: size.sortOrder },
      });
    }
    for (const extra of item.extras) {
      await prisma.itemExtra.create({
        data: { itemId: newItem.id, nameAr: extra.nameAr, nameEn: extra.nameEn, price: extra.price, sortOrder: extra.sortOrder },
      });
    }
  }

  return { success: true, id: newCategory.id };
}

export async function reorderItems(items: { id: string; sortOrder: number }[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يرجى تسجيل الدخول" };

  // Verify ownership of at least the first item
  if (items.length > 0) {
    const firstItem = await prisma.item.findUnique({ where: { id: items[0].id }, include: { category: true } });
    if (firstItem && !(await canEditMenu(user, firstItem.category.restaurantId))) {
      return { success: false, error: "لا تملك صلاحية" };
    }
  }

  for (const item of items) {
    await prisma.item.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } });
  }
  return { success: true };
}
