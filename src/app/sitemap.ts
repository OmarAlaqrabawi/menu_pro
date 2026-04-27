// src/app/sitemap.ts
// Dynamic sitemap for all active restaurants
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const restaurantUrls = restaurants.map((r) => ({
    url: `${baseUrl}/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...restaurantUrls,
  ];
}
