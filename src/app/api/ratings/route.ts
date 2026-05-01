export const dynamic = "force-dynamic";
// src/app/api/ratings/route.ts
// Public API — submit and fetch ratings with basic spam protection
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple in-memory rate limiter (resets on cold start, which is fine for basic protection)
const rateLimit = new Map<string, number>();
const COOLDOWN_MS = 30_000; // 30 seconds between ratings per IP

function getRateLimitKey(request: Request): string {
  return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
}

// POST — Submit a rating
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getRateLimitKey(request);
    const lastSubmit = rateLimit.get(ip) || 0;
    if (Date.now() - lastSubmit < COOLDOWN_MS) {
      return NextResponse.json({ error: "يرجى الانتظار قبل إرسال تقييم جديد" }, { status: 429 });
    }

    const body = await request.json();
    const { restaurantId, itemId, orderId, stars, comment, customerName } = body;

    if (!restaurantId || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "invalid data" }, { status: 400 });
    }

    // Sanitize inputs
    const safeComment = comment ? String(comment).slice(0, 500).replace(/<[^>]*>/g, '') : null;
    const safeName = customerName ? String(customerName).slice(0, 100).replace(/<[^>]*>/g, '') : null;

    const rating = await prisma.rating.create({
      data: {
        restaurantId,
        itemId: itemId || null,
        orderId: orderId || null,
        stars: Math.round(stars),
        comment: safeComment,
        customerName: safeName,
      },
    });

    // Record rate limit
    rateLimit.set(ip, Date.now());

    return NextResponse.json({ success: true, id: rating.id });
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

// GET — Fetch average rating for a restaurant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const ratings = await prisma.rating.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const avg = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : 0;

  return NextResponse.json({
    average: Math.round(avg * 10) / 10,
    count: ratings.length,
    ratings: ratings.slice(0, 10),
  });
}
