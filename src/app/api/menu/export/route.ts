export const dynamic = "force-dynamic";
// src/app/api/menu/export/route.ts
// Export menu data as JSON (can be converted to Excel on client)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId },
    include: {
      items: {
        include: {
          sizes: { orderBy: { sortOrder: "asc" } },
          extras: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Flatten to export format
  const exportData = categories.flatMap((cat) =>
    cat.items.map((item) => ({
      categoryNameAr: cat.nameAr,
      categoryNameEn: cat.nameEn || "",
      categoryEmoji: cat.emoji || "",
      itemNameAr: item.nameAr,
      itemNameEn: item.nameEn || "",
      descAr: item.descAr || "",
      price: item.price,
      discountPrice: item.discountPrice || "",
      calories: item.calories || "",
      prepTime: item.prepTime || "",
      badge: item.badge || "",
      isAvailable: item.isAvailable ? "نعم" : "لا",
      sizes: item.sizes.map((s) => `${s.nameAr}:${s.price}`).join("|"),
      extras: item.extras.map((e) => `${e.nameAr}:${e.price}`).join("|"),
    }))
  );

  return NextResponse.json({ categories, exportData });
}
