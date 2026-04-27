// src/app/api/menu/import/route.ts
// Import menu data from JSON (parsed from Excel on client)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, items } = body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  // Verify permission
  const user = session.user as { id: string; role?: string };
  if (user.role !== "ADMIN") {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant || restaurant.userId !== user.id) {
      return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });
    }
  }

  let importedCount = 0;

  // Group items by category
  const categoriesMap = new Map<string, typeof items>();
  for (const item of items) {
    const catKey = item.categoryNameAr || "بدون قسم";
    if (!categoriesMap.has(catKey)) {
      categoriesMap.set(catKey, []);
    }
    categoriesMap.get(catKey)!.push(item);
  }

  // Create categories and items
  let catOrder = 0;
  for (const [catName, catItems] of categoriesMap.entries()) {
    // Find or create category
    let category = await prisma.category.findFirst({
      where: { restaurantId, nameAr: catName },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          restaurantId,
          nameAr: catName,
          nameEn: catItems[0]?.categoryNameEn || undefined,
          emoji: catItems[0]?.categoryEmoji || undefined,
          sortOrder: catOrder++,
        },
      });
    }

    let itemOrder = 0;
    for (const item of catItems) {
      const newItem = await prisma.item.create({
        data: {
          categoryId: category.id,
          nameAr: item.itemNameAr || item.nameAr || "بدون اسم",
          nameEn: item.itemNameEn || item.nameEn || undefined,
          descAr: item.descAr || undefined,
          price: parseFloat(item.price) || 0,
          discountPrice: item.discountPrice ? parseFloat(item.discountPrice) : undefined,
          calories: item.calories ? parseInt(item.calories) : undefined,
          prepTime: item.prepTime ? parseInt(item.prepTime) : undefined,
          badge: ["NEW", "POPULAR", "OFFER"].includes(item.badge) ? item.badge : undefined,
          isAvailable: item.isAvailable !== "لا",
          sortOrder: itemOrder++,
        },
      });

      // Parse sizes (format: "nameAr:price|nameAr:price")
      if (item.sizes && typeof item.sizes === "string") {
        const sizeParts = item.sizes.split("|").filter(Boolean);
        for (let si = 0; si < sizeParts.length; si++) {
          const [name, price] = sizeParts[si].split(":");
          if (name && price) {
            await prisma.itemSize.create({
              data: { itemId: newItem.id, nameAr: name.trim(), price: parseFloat(price), sortOrder: si },
            });
          }
        }
      }

      // Parse extras (format: "nameAr:price|nameAr:price")
      if (item.extras && typeof item.extras === "string") {
        const extraParts = item.extras.split("|").filter(Boolean);
        for (let ei = 0; ei < extraParts.length; ei++) {
          const [name, price] = extraParts[ei].split(":");
          if (name && price) {
            await prisma.itemExtra.create({
              data: { itemId: newItem.id, nameAr: name.trim(), price: parseFloat(price), sortOrder: ei },
            });
          }
        }
      }

      importedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    imported: importedCount,
    categories: categoriesMap.size,
  });
}
