import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CustomerMenuClient from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { nameAr: true, nameEn: true, descAr: true, descEn: true, logoUrl: true, primaryColor: true },
  });

  if (!restaurant) {
    return { title: "المنيو غير موجود" };
  }

  const title = `${restaurant.nameAr}${restaurant.nameEn ? ` — ${restaurant.nameEn}` : ""} | المنيو`;
  const description = restaurant.descAr || restaurant.descEn || "القائمة الإلكترونية — اطلب الآن";
  const ogImage = restaurant.logoUrl || `${baseUrl}/og-default.png`;

  return {
    title,
    description,
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
      apple: "/icon.svg",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${slug}`,
      siteName: "MenuPro",
      images: [{ url: ogImage, width: 600, height: 600, alt: restaurant.nameAr }],
      locale: "ar_SA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "theme-color": restaurant.primaryColor,
    },
  };
}

// JSON-LD Structured Data for SEO
async function getStructuredData(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      nameAr: true, nameEn: true, descAr: true, logoUrl: true,
      phone: true, address: true, whatsapp: true,
    },
  });

  if (!restaurant) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.nameAr,
    alternateName: restaurant.nameEn || undefined,
    description: restaurant.descAr || undefined,
    image: restaurant.logoUrl || undefined,
    url: `${baseUrl}/${slug}`,
    telephone: restaurant.phone || restaurant.whatsapp || undefined,
    address: restaurant.address ? {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
    } : undefined,
    hasMenu: {
      "@type": "Menu",
      url: `${baseUrl}/${slug}`,
    },
  };
}

export default async function CustomerMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const structuredData = await getStructuredData(slug);

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <CustomerMenuClient slug={slug} />
    </>
  );
}
