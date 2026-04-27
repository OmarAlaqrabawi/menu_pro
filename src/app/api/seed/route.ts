export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

export async function GET(request: Request) {
  // Simple secret check
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== "menupro-seed-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if already seeded
    const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@menupro.com" } });
    if (existingAdmin) {
      return NextResponse.json({ message: "Database already seeded!" });
    }

    // 1. Users
    const admin = await prisma.user.create({
      data: { name: "عمر", email: "admin@menupro.com", passwordHash: hashSync("Admin@123", 10), phone: "+966501234567", role: "ADMIN" },
    });
    const owner1 = await prisma.user.create({
      data: { name: "محمد يوسف", email: "moh@pizza.com", passwordHash: hashSync("Owner@123", 10), phone: "+966509876543", role: "RESTAURANT_OWNER" },
    });
    const owner2 = await prisma.user.create({
      data: { name: "محمد أحمد", email: "m@chicken.com", passwordHash: hashSync("Owner@123", 10), phone: "+966507654321", role: "RESTAURANT_OWNER" },
    });
    const owner3 = await prisma.user.create({
      data: { name: "سارة علي", email: "sara@cafe.com", passwordHash: hashSync("Owner@123", 10), phone: "+966508765432", role: "RESTAURANT_OWNER" },
    });

    // 2. Plans
    const basicPlan = await prisma.plan.create({
      data: { nameAr: "الأساسية", nameEn: "Basic", slug: "basic", priceMonthly: 49, priceYearly: 490, maxItems: 30, maxCategories: 5, sortOrder: 0 },
    });
    const proPlan = await prisma.plan.create({
      data: { nameAr: "الاحترافية", nameEn: "Pro", slug: "pro", priceMonthly: 99, priceYearly: 990, maxItems: 100, maxCategories: 20, noAds: true, advancedAnalytics: true, multiViewMode: true, multiLanguage: true, aboutPage: true, workingHours: true, orderSystem: true, tableManagement: true, multiCoverImages: true, multiItemImages: true, sortOrder: 1 },
    });
    const enterprisePlan = await prisma.plan.create({
      data: { nameAr: "المؤسسات", nameEn: "Enterprise", slug: "enterprise", priceMonthly: 199, priceYearly: 1990, noAds: true, advancedAnalytics: true, seoEnabled: true, multiViewMode: true, multiLanguage: true, aboutPage: true, workingHours: true, reviews: true, orderSystem: true, tableManagement: true, multiCoverImages: true, multiItemImages: true, sortOrder: 2 },
    });

    // 3. Restaurants
    const pizzaHome = await prisma.restaurant.create({
      data: { userId: owner1.id, slug: "pizza-home", nameAr: "بيتزا هوم", nameEn: "Pizza Home", descAr: "أفضل بيتزا طازجة بمكونات إيطالية أصلية", primaryColor: "#E74C3C", secondaryColor: "#1A1A2E", whatsapp: "+966509876543", currency: "JOD", taxPercent: 15, enabledLangs: "ar,en", isActive: false },
    });
    const superChicken = await prisma.restaurant.create({
      data: { userId: owner2.id, slug: "super-chicken", nameAr: "سوبر تشكن", nameEn: "Super Chicken", descAr: "دجاج مقرمش ووجبات عائلية متنوعة", primaryColor: "#2980B9", secondaryColor: "#1A1A2E", whatsapp: "+966507654321", currency: "JOD", taxPercent: 15, enabledLangs: "ar,en" },
    });
    const cafeLatte = await prisma.restaurant.create({
      data: { userId: owner3.id, slug: "cafe-latte", nameAr: "كافيه لاتيه", nameEn: "Café Latté", descAr: "قهوة مختصة ومشروبات ساخنة وباردة", primaryColor: "#FF6B35", secondaryColor: "#1A1A2E", whatsapp: "+966508765432", currency: "JOD", taxPercent: 15, enabledLangs: "ar,en,tr" },
    });
    const alReef = await prisma.restaurant.create({
      data: { userId: admin.id, slug: "al-reef", nameAr: "مطعم الريف", nameEn: "Al Reef Restaurant", descAr: "أكلات شعبية وأطباق تراثية أصيلة", primaryColor: "#27AE60", secondaryColor: "#1A1A2E", currency: "JOD", taxPercent: 15, enabledLangs: "ar" },
    });

    // 4. Subscriptions
    const oneYearLater = new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate());
    await prisma.subscription.createMany({
      data: [
        { userId: owner1.id, planId: basicPlan.id, status: "ACTIVE", billingCycle: "MONTHLY", endDate: oneYearLater },
        { userId: owner2.id, planId: proPlan.id, status: "ACTIVE", billingCycle: "YEARLY", endDate: oneYearLater },
        { userId: owner3.id, planId: enterprisePlan.id, status: "ACTIVE", billingCycle: "YEARLY", endDate: oneYearLater },
      ],
    });

    // 5. Categories & Items — Al Reef
    const mainCat = await prisma.category.create({ data: { restaurantId: alReef.id, nameAr: "أطباق رئيسية", emoji: "🍖", sortOrder: 0 } });
    const grillCat = await prisma.category.create({ data: { restaurantId: alReef.id, nameAr: "مشويات", emoji: "🔥", sortOrder: 1 } });
    const appetizersCat = await prisma.category.create({ data: { restaurantId: alReef.id, nameAr: "مقبلات", emoji: "🥙", sortOrder: 2 } });
    const drinksCatReef = await prisma.category.create({ data: { restaurantId: alReef.id, nameAr: "مشروبات", emoji: "🥤", sortOrder: 3 } });

    await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "كبسة لحم", price: 45, descAr: "أرز بسمتي مع لحم خروف طازج", badge: "POPULAR" } });
    await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "مندي دجاج", price: 35, descAr: "دجاج مدخن على الحطب مع أرز مندي" } });
    await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "مظبي", price: 55, descAr: "لحم خروف كامل مع أرز بخاري", badge: "POPULAR" } });
    await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "كبسة دجاج", price: 30 } });

    await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "مشكل مشاوي", price: 65, badge: "POPULAR" } });
    await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "كباب لحم", price: 35 } });
    await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "شيش طاووق", price: 30 } });
    await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "ريش غنم", price: 55 } });

    await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "حمص", price: 10 } });
    await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "متبل", price: 10 } });
    await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "فتوش", price: 12 } });
    await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "تبولة", price: 12 } });

    await prisma.item.create({ data: { categoryId: drinksCatReef.id, nameAr: "عصير ليمون بالنعناع", price: 8 } });
    await prisma.item.create({ data: { categoryId: drinksCatReef.id, nameAr: "شاي", price: 5 } });
    await prisma.item.create({ data: { categoryId: drinksCatReef.id, nameAr: "قهوة عربي", price: 8 } });

    // 6. Categories & Items — Super Chicken
    const chickenCat = await prisma.category.create({ data: { restaurantId: superChicken.id, nameAr: "دجاج مقرمش", nameEn: "Crispy Chicken", emoji: "🍗", sortOrder: 0 } });
    const burgerCat = await prisma.category.create({ data: { restaurantId: superChicken.id, nameAr: "برجر", nameEn: "Burgers", emoji: "🍔", sortOrder: 1 } });

    await prisma.item.create({ data: { categoryId: chickenCat.id, nameAr: "سوبر تشكن (كبير)", nameEn: "Super Chicken", descAr: "دجاج مقرمش مع البهارات السرية", price: 30, badge: "POPULAR" } });
    await prisma.item.create({ data: { categoryId: chickenCat.id, nameAr: "سبايسي تشكن", nameEn: "Spicy Chicken", price: 28 } });
    await prisma.item.create({ data: { categoryId: burgerCat.id, nameAr: "كلاسيك برجر", nameEn: "Classic Burger", price: 25 } });

    // 7. Categories & Items — Café Latté
    const hotDrinksCat = await prisma.category.create({ data: { restaurantId: cafeLatte.id, nameAr: "مشروبات ساخنة", nameEn: "Hot Drinks", emoji: "☕", sortOrder: 0 } });
    const coldDrinksCat = await prisma.category.create({ data: { restaurantId: cafeLatte.id, nameAr: "مشروبات باردة", nameEn: "Cold Drinks", emoji: "🧊", sortOrder: 1 } });

    await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "إسبريسو", nameEn: "Espresso", price: 12, badge: "POPULAR" } });
    await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "لاتيه", nameEn: "Latte", price: 18 } });
    await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "كابتشينو", nameEn: "Cappuccino", price: 18 } });
    await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "آيس لاتيه", nameEn: "Iced Latte", price: 20 } });
    await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "سموذي مانجو", nameEn: "Mango Smoothie", price: 22 } });

    // 8. Categories & Items — Pizza Home
    const pizzaCat = await prisma.category.create({ data: { restaurantId: pizzaHome.id, nameAr: "بيتزا", nameEn: "Pizza", emoji: "🍕", sortOrder: 0 } });
    await prisma.item.create({ data: { categoryId: pizzaCat.id, nameAr: "مارغريتا", nameEn: "Margherita", price: 35, badge: "POPULAR" } });
    await prisma.item.create({ data: { categoryId: pizzaCat.id, nameAr: "بيبروني", nameEn: "Pepperoni", price: 40 } });

    return NextResponse.json({
      message: "✅ Database seeded successfully!",
      credentials: {
        admin: "admin@menupro.com / Admin@123",
        owner1: "moh@pizza.com / Owner@123",
        owner2: "m@chicken.com / Owner@123",
        owner3: "sara@cafe.com / Owner@123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
