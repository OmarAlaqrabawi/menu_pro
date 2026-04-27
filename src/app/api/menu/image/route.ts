export const dynamic = "force-dynamic";
// src/app/api/menu/image/route.ts
// Create/delete item images
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { itemId, imageUrl } = await request.json();
    if (!itemId || !imageUrl) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // Get max sort order
    const last = await prisma.itemImage.findFirst({
      where: { itemId },
      orderBy: { sortOrder: "desc" },
    });

    const image = await prisma.itemImage.create({
      data: {
        itemId,
        imageUrl,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, id: image.id, imageUrl: image.imageUrl });
  } catch (error) {
    console.error("Image create error:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
