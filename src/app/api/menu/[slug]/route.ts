// src/app/api/menu/[slug]/route.ts
// Public API — no auth required. Returns menu data for customer-facing page.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isVisible: true },
        include: {
          items: {
            where: { isAvailable: true },
            include: {
              sizes: { orderBy: { sortOrder: "asc" } },
              extras: { orderBy: { sortOrder: "asc" } },
              images: { orderBy: { sortOrder: "asc" } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },

    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "المطعم غير موجود" }, { status: 404 });
  }

  if (!restaurant.isActive) {
    return NextResponse.json({
      error: "inactive",
      nameAr: restaurant.nameAr,
      nameEn: restaurant.nameEn,
      logoUrl: restaurant.logoUrl,
      primaryColor: restaurant.primaryColor,
      secondaryColor: restaurant.secondaryColor,
    }, { status: 403 });
  }

  return NextResponse.json({
    id: restaurant.id,
    nameAr: restaurant.nameAr,
    nameEn: restaurant.nameEn,
    descAr: restaurant.descAr,
    descEn: restaurant.descEn,
    logoUrl: restaurant.logoUrl,
    primaryColor: restaurant.primaryColor,
    secondaryColor: restaurant.secondaryColor,
    currency: restaurant.currency,
    taxPercent: restaurant.taxPercent,
    servicePercent: restaurant.servicePercent,
    enabledLangs: restaurant.enabledLangs,
    defaultLang: restaurant.defaultLang,
    menuViewMode: restaurant.menuViewMode,
    whatsapp: restaurant.whatsapp,
    phone: restaurant.phone,
    instagram: restaurant.instagram,
    facebook: restaurant.facebook,
    tiktok: restaurant.tiktok,
    address: restaurant.address,
    googleMapsUrl: restaurant.googleMapsUrl,
    aboutAr: restaurant.aboutAr,
    aboutEn: restaurant.aboutEn,
    workingHours: restaurant.workingHours,
    categories: restaurant.categories,
  });
}
