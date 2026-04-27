// prisma/seed.ts
// Comprehensive seed data for MenuPro platform

import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashSync } from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding MenuPro database...\n");

  // ═══════════════════════════════════════════════════════
  // 1. Users
  // ═══════════════════════════════════════════════════════
  const admin = await prisma.user.upsert({
    where: { email: "admin@menupro.com" },
    update: {},
    create: {
      name: "عمر",
      email: "admin@menupro.com",
      passwordHash: hashSync("Admin@123", 10),
      phone: "+966501234567",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  const owner1 = await prisma.user.upsert({
    where: { email: "moh@pizza.com" },
    update: {},
    create: {
      name: "محمد يوسف",
      email: "moh@pizza.com",
      passwordHash: hashSync("Owner@123", 10),
      phone: "+966509876543",
      role: "RESTAURANT_OWNER",
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: "m@chicken.com" },
    update: {},
    create: {
      name: "محمد أحمد",
      email: "m@chicken.com",
      passwordHash: hashSync("Owner@123", 10),
      phone: "+966507654321",
      role: "RESTAURANT_OWNER",
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { email: "sara@cafe.com" },
    update: {},
    create: {
      name: "سارة علي",
      email: "sara@cafe.com",
      passwordHash: hashSync("Owner@123", 10),
      phone: "+966508765432",
      role: "RESTAURANT_OWNER",
    },
  });
  console.log("✅ Restaurant owners created");

  // ═══════════════════════════════════════════════════════
  // 2. Subscription Plans
  // ═══════════════════════════════════════════════════════
  const basicPlan = await prisma.plan.upsert({
    where: { slug: "basic" },
    update: {},
    create: {
      nameAr: "الأساسية",
      nameEn: "Basic",
      slug: "basic",
      priceMonthly: 49,
      priceYearly: 490,
      maxItems: 30,
      maxCategories: 5,
      sortOrder: 0,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      nameAr: "الاحترافية",
      nameEn: "Pro",
      slug: "pro",
      priceMonthly: 99,
      priceYearly: 990,
      maxItems: 100,
      maxCategories: 20,
      noAds: true,
      advancedAnalytics: true,
      multiViewMode: true,
      multiLanguage: true,
      aboutPage: true,
      workingHours: true,
      orderSystem: true,
      tableManagement: true,
      multiCoverImages: true,
      multiItemImages: true,
      sortOrder: 1,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { slug: "enterprise" },
    update: {},
    create: {
      nameAr: "المؤسسات",
      nameEn: "Enterprise",
      slug: "enterprise",
      priceMonthly: 199,
      priceYearly: 1990,
      noAds: true,
      advancedAnalytics: true,
      seoEnabled: true,
      multiViewMode: true,
      multiLanguage: true,
      aboutPage: true,
      workingHours: true,
      reviews: true,
      orderSystem: true,
      tableManagement: true,
      multiCoverImages: true,
      multiItemImages: true,
      sortOrder: 2,
    },
  });
  console.log("✅ Subscription plans created");

  // ═══════════════════════════════════════════════════════
  // 3. Restaurants
  // ═══════════════════════════════════════════════════════
  const pizzaHome = await prisma.restaurant.create({
    data: {
      userId: owner1.id,
      slug: "pizza-home",
      nameAr: "بيتزا هوم",
      nameEn: "Pizza Home",
      descAr: "أفضل بيتزا طازجة بمكونات إيطالية أصلية",
      descEn: "Best fresh pizza with authentic Italian ingredients",
      primaryColor: "#E74C3C",
      secondaryColor: "#1A1A2E",
      whatsapp: "+966509876543",
      phone: "+966509876543",
      instagram: "pizzahome_sa",
      address: "شارع الملك فهد، الرياض",
      currency: "JOD",
      taxPercent: 15,
      enabledLangs: "ar,en",
      isActive: false,
      ownerCanEditMenu: true,
      ownerCanEditBranding: false,
      ownerCanEditSettings: false,
      ownerCanManageTables: true,
    },
  });

  const superChicken = await prisma.restaurant.create({
    data: {
      userId: owner2.id,
      slug: "super-chicken",
      nameAr: "سوبر تشكن",
      nameEn: "Super Chicken",
      descAr: "دجاج مقرمش ووجبات عائلية متنوعة",
      descEn: "Crispy chicken and diverse family meals",
      primaryColor: "#2980B9",
      secondaryColor: "#1A1A2E",
      whatsapp: "+966507654321",
      phone: "+966507654321",
      instagram: "superchicken_sa",
      address: "شارع التحلية، جدة",
      currency: "JOD",
      taxPercent: 15,
      enabledLangs: "ar,en",
      ownerCanEditMenu: true,
      ownerCanEditBranding: true,
      ownerCanEditSettings: false,
      ownerCanManageTables: true,
    },
  });

  const cafeLatte = await prisma.restaurant.create({
    data: {
      userId: owner3.id,
      slug: "cafe-latte",
      nameAr: "كافيه لاتيه",
      nameEn: "Café Latté",
      descAr: "قهوة مختصة ومشروبات ساخنة وباردة",
      descEn: "Specialty coffee and hot & cold beverages",
      primaryColor: "#FF6B35",
      secondaryColor: "#1A1A2E",
      whatsapp: "+966508765432",
      phone: "+966508765432",
      instagram: "cafelatte_sa",
      address: "حي العليا، الرياض",
      currency: "JOD",
      taxPercent: 15,
      enabledLangs: "ar,en,tr",
      ownerCanEditMenu: true,
      ownerCanEditBranding: true,
      ownerCanEditSettings: true,
      ownerCanManageTables: true,
    },
  });

  const alReef = await prisma.restaurant.create({
    data: {
      userId: admin.id,
      slug: "al-reef",
      nameAr: "مطعم الريف",
      nameEn: "Al Reef Restaurant",
      descAr: "أكلات شعبية وأطباق تراثية أصيلة",
      descEn: "Traditional and authentic folk dishes",
      primaryColor: "#27AE60",
      secondaryColor: "#1A1A2E",
      address: "شارع الأمير سلطان، المدينة المنورة",
      currency: "JOD",
      taxPercent: 15,
      enabledLangs: "ar",
    },
  });
  console.log("✅ Restaurants created");

  // ═══════════════════════════════════════════════════════
  // 4. Subscriptions
  // ═══════════════════════════════════════════════════════
  const now = new Date();
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  await prisma.subscription.createMany({
    data: [
      { userId: owner1.id, planId: basicPlan.id, status: "ACTIVE", billingCycle: "MONTHLY", endDate: oneYearLater },
      { userId: owner2.id, planId: proPlan.id, status: "ACTIVE", billingCycle: "YEARLY", endDate: oneYearLater },
      { userId: owner3.id, planId: enterprisePlan.id, status: "ACTIVE", billingCycle: "YEARLY", endDate: oneYearLater },
    ],
  });
  console.log("✅ Subscriptions created");

  // ═══════════════════════════════════════════════════════
  // 5. Categories & Items — Pizza Home
  // ═══════════════════════════════════════════════════════
  const pizzaCat = await prisma.category.create({
    data: { restaurantId: pizzaHome.id, nameAr: "بيتزا", nameEn: "Pizza", emoji: "🍕", sortOrder: 0 },
  });
  const pastasCat = await prisma.category.create({
    data: { restaurantId: pizzaHome.id, nameAr: "باستا", nameEn: "Pasta", emoji: "🍝", sortOrder: 1 },
  });
  const drinksCatPizza = await prisma.category.create({
    data: { restaurantId: pizzaHome.id, nameAr: "مشروبات", nameEn: "Drinks", emoji: "🥤", sortOrder: 2 },
  });

  // Pizza items
  const margherita = await prisma.item.create({
    data: {
      categoryId: pizzaCat.id, nameAr: "مارغريتا", nameEn: "Margherita",
      descAr: "صلصة طماطم، جبنة موزاريلا، ريحان طازج", price: 35, calories: 850, prepTime: 15, badge: "POPULAR",
    },
  });
  await prisma.itemSize.createMany({
    data: [
      { itemId: margherita.id, nameAr: "صغير", nameEn: "Small", price: 25, sortOrder: 0 },
      { itemId: margherita.id, nameAr: "وسط", nameEn: "Medium", price: 35, sortOrder: 1 },
      { itemId: margherita.id, nameAr: "كبير", nameEn: "Large", price: 45, sortOrder: 2 },
    ],
  });
  await prisma.itemExtra.createMany({
    data: [
      { itemId: margherita.id, nameAr: "جبنة إضافية", nameEn: "Extra Cheese", price: 5, sortOrder: 0 },
      { itemId: margherita.id, nameAr: "زيتون", nameEn: "Olives", price: 3, sortOrder: 1 },
    ],
  });

  const pepperoni = await prisma.item.create({
    data: {
      categoryId: pizzaCat.id, nameAr: "بيبروني", nameEn: "Pepperoni",
      descAr: "صلصة طماطم، جبنة، شرائح بيبروني", price: 40, calories: 1020, prepTime: 15,
    },
  });
  await prisma.itemSize.createMany({
    data: [
      { itemId: pepperoni.id, nameAr: "صغير", price: 30, sortOrder: 0 },
      { itemId: pepperoni.id, nameAr: "وسط", price: 40, sortOrder: 1 },
      { itemId: pepperoni.id, nameAr: "كبير", price: 55, sortOrder: 2 },
    ],
  });

  await prisma.item.create({
    data: {
      categoryId: pizzaCat.id, nameAr: "رانش تشكن", nameEn: "Ranch Chicken",
      descAr: "صلصة رانش، دجاج مشوي، فلفل رومي", price: 42, calories: 930, prepTime: 18, badge: "NEW",
    },
  });

  await prisma.item.create({
    data: {
      categoryId: pizzaCat.id, nameAr: "بيتزا الخضار", nameEn: "Veggie Pizza",
      descAr: "فلفل، بصل، فطر، زيتون، طماطم", price: 32, calories: 720, prepTime: 15,
    },
  });

  await prisma.item.create({
    data: {
      categoryId: pizzaCat.id, nameAr: "بيتزا اللحم", nameEn: "Meat Lovers",
      descAr: "بيبروني، لحم بقري، سجق إيطالي", price: 48, calories: 1150, prepTime: 20, badge: "POPULAR",
    },
  });

  // Pasta items
  await prisma.item.create({
    data: {
      categoryId: pastasCat.id, nameAr: "فوتشيني ألفريدو", nameEn: "Fettuccine Alfredo",
      descAr: "صلصة كريمية غنية مع جبنة بارميزان", price: 38, calories: 780, prepTime: 12,
    },
  });
  await prisma.item.create({
    data: {
      categoryId: pastasCat.id, nameAr: "بيني أرابياتا", nameEn: "Penne Arrabbiata",
      descAr: "صلصة طماطم حارة مع الفلفل الأحمر", price: 32, prepTime: 10,
    },
  });

  // Drinks
  await prisma.item.create({ data: { categoryId: drinksCatPizza.id, nameAr: "بيبسي", nameEn: "Pepsi", price: 5 } });
  await prisma.item.create({ data: { categoryId: drinksCatPizza.id, nameAr: "ماء معدني", nameEn: "Water", price: 3 } });
  await prisma.item.create({ data: { categoryId: drinksCatPizza.id, nameAr: "عصير برتقال", nameEn: "Orange Juice", price: 10 } });

  // ═══════════════════════════════════════════════════════
  // 6. Categories & Items — Super Chicken
  // ═══════════════════════════════════════════════════════
  const chickenCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "دجاج مقرمش", nameEn: "Crispy Chicken", emoji: "🍗", sortOrder: 0 },
  });
  const burgerCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "برجر", nameEn: "Burgers", emoji: "🍔", sortOrder: 1 },
  });
  const sidesCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "أطباق جانبية", nameEn: "Sides", emoji: "🍟", sortOrder: 2 },
  });
  const mealsCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "وجبات عائلية", nameEn: "Family Meals", emoji: "👨‍👩‍👧‍👦", sortOrder: 3 },
  });
  const drinksCatChicken = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "مشروبات", nameEn: "Drinks", emoji: "🥤", sortOrder: 4 },
  });
  const saucesCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "صوصات", nameEn: "Sauces", emoji: "🫙", sortOrder: 5 },
  });
  const dessertCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "حلويات", nameEn: "Desserts", emoji: "🍰", sortOrder: 6 },
  });
  const saladCat = await prisma.category.create({
    data: { restaurantId: superChicken.id, nameAr: "سلطات", nameEn: "Salads", emoji: "🥗", sortOrder: 7 },
  });

  const superChickenItem = await prisma.item.create({
    data: {
      categoryId: chickenCat.id, nameAr: "سوبر تشكن (كبير)", nameEn: "Super Chicken (Large)",
      descAr: "دجاج مقرمش مع البهارات السرية", price: 30, calories: 650, prepTime: 10, badge: "POPULAR",
    },
  });
  await prisma.itemExtra.createMany({
    data: [
      { itemId: superChickenItem.id, nameAr: "جبنة إضافية", nameEn: "Extra Cheese", price: 3 },
      { itemId: superChickenItem.id, nameAr: "كول سلو", nameEn: "Coleslaw", price: 4 },
      { itemId: superChickenItem.id, nameAr: "صوص حار", nameEn: "Hot Sauce", price: 2 },
    ],
  });

  await prisma.item.create({
    data: {
      categoryId: chickenCat.id, nameAr: "سبايسي تشكن", nameEn: "Spicy Chicken",
      descAr: "دجاج مقرمش حار", price: 28, calories: 620, prepTime: 10,
    },
  });
  await prisma.item.create({
    data: {
      categoryId: chickenCat.id, nameAr: "تندر (5 قطع)", nameEn: "Tenders (5 pcs)",
      descAr: "قطع دجاج طرية مقرمشة", price: 22, calories: 480, prepTime: 8, badge: "NEW",
    },
  });

  // Burgers
  const classicBurger = await prisma.item.create({
    data: {
      categoryId: burgerCat.id, nameAr: "كلاسيك برجر", nameEn: "Classic Burger",
      descAr: "لحم أنجوس، خس، طماطم، بصل، صوص خاص", price: 25, calories: 750, prepTime: 8,
    },
  });
  await prisma.item.create({
    data: {
      categoryId: burgerCat.id, nameAr: "ماشروم برجر", nameEn: "Mushroom Burger",
      descAr: "لحم أنجوس، فطر مشوي، جبنة سويسرية", price: 30, calories: 820, prepTime: 10,
    },
  });

  // Sides
  await prisma.item.create({ data: { categoryId: sidesCat.id, nameAr: "بطاطس مقلية", nameEn: "French Fries", price: 10, prepTime: 5 } });
  await prisma.item.create({ data: { categoryId: sidesCat.id, nameAr: "حلقات بصل", nameEn: "Onion Rings", price: 12, prepTime: 5 } });
  await prisma.item.create({ data: { categoryId: sidesCat.id, nameAr: "ناتشوز مكسيكي", nameEn: "Mexican Nachos", price: 15, prepTime: 7, badge: "NEW" } });

  // Family meals
  await prisma.item.create({ data: { categoryId: mealsCat.id, nameAr: "وجبة عائلية (4 أشخاص)", price: 89, descAr: "8 قطع دجاج + 2 بطاطس كبير + كول سلو + 4 مشروبات", prepTime: 15 } });
  await prisma.item.create({ data: { categoryId: mealsCat.id, nameAr: "وجبة عائلية (6 أشخاص)", price: 129, descAr: "12 قطع دجاج + 3 بطاطس كبير + 2 كول سلو + 6 مشروبات", prepTime: 20 } });

  // Drinks
  await prisma.item.create({ data: { categoryId: drinksCatChicken.id, nameAr: "بيبسي", price: 5 } });
  await prisma.item.create({ data: { categoryId: drinksCatChicken.id, nameAr: "ماونتن ديو", price: 5 } });
  await prisma.item.create({ data: { categoryId: drinksCatChicken.id, nameAr: "عصير مانجو", price: 8 } });

  // Sauces
  await prisma.item.create({ data: { categoryId: saucesCat.id, nameAr: "كاتشب", price: 1 } });
  await prisma.item.create({ data: { categoryId: saucesCat.id, nameAr: "صوص ثوم", price: 2 } });
  await prisma.item.create({ data: { categoryId: saucesCat.id, nameAr: "صوص باربيكيو", price: 2 } });

  // Desserts
  await prisma.item.create({ data: { categoryId: dessertCat.id, nameAr: "تشيز كيك", price: 18, badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: dessertCat.id, nameAr: "براوني بالشوكولاتة", price: 15 } });

  // Salads
  await prisma.item.create({ data: { categoryId: saladCat.id, nameAr: "سلطة سيزر", price: 18, descAr: "خس روماني، صوص سيزر، خبز محمص، بارميزان" } });
  await prisma.item.create({ data: { categoryId: saladCat.id, nameAr: "سلطة يونانية", price: 16 } });

  // ═══════════════════════════════════════════════════════
  // 7. Categories & Items — Café Latté
  // ═══════════════════════════════════════════════════════
  const hotDrinksCat = await prisma.category.create({
    data: { restaurantId: cafeLatte.id, nameAr: "مشروبات ساخنة", nameEn: "Hot Drinks", emoji: "☕", sortOrder: 0 },
  });
  const coldDrinksCat = await prisma.category.create({
    data: { restaurantId: cafeLatte.id, nameAr: "مشروبات باردة", nameEn: "Cold Drinks", emoji: "🧊", sortOrder: 1 },
  });
  const sweets = await prisma.category.create({
    data: { restaurantId: cafeLatte.id, nameAr: "حلويات", nameEn: "Sweets", emoji: "🍰", sortOrder: 2 },
  });
  const breakfastCat = await prisma.category.create({
    data: { restaurantId: cafeLatte.id, nameAr: "فطور", nameEn: "Breakfast", emoji: "🍳", sortOrder: 3 },
  });
  const sandwichesCat = await prisma.category.create({
    data: { restaurantId: cafeLatte.id, nameAr: "ساندويشات", nameEn: "Sandwiches", emoji: "🥪", sortOrder: 4 },
  });

  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "إسبريسو", nameEn: "Espresso", price: 12, badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "لاتيه", nameEn: "Latte", price: 18 } });
  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "كابتشينو", nameEn: "Cappuccino", price: 18 } });
  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "فلات وايت", nameEn: "Flat White", price: 20, badge: "NEW" } });
  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "موكا", nameEn: "Mocha", price: 22 } });
  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "شاي أخضر", nameEn: "Green Tea", price: 10 } });
  await prisma.item.create({ data: { categoryId: hotDrinksCat.id, nameAr: "هوت شوكليت", nameEn: "Hot Chocolate", price: 20 } });

  await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "آيس لاتيه", nameEn: "Iced Latte", price: 20 } });
  await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "آيس أمريكانو", nameEn: "Iced Americano", price: 18 } });
  await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "سموذي مانجو", nameEn: "Mango Smoothie", price: 22 } });
  await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "ميلك شيك فراولة", nameEn: "Strawberry Milkshake", price: 24, badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: coldDrinksCat.id, nameAr: "موهيتو", nameEn: "Mojito", price: 18 } });

  await prisma.item.create({ data: { categoryId: sweets.id, nameAr: "تشيز كيك توت", nameEn: "Berry Cheesecake", price: 25, badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: sweets.id, nameAr: "كرواسون", nameEn: "Croissant", price: 12 } });
  await prisma.item.create({ data: { categoryId: sweets.id, nameAr: "بان كيك", nameEn: "Pancakes", price: 28 } });
  await prisma.item.create({ data: { categoryId: sweets.id, nameAr: "وافل بالنوتيلا", nameEn: "Nutella Waffle", price: 30 } });

  await prisma.item.create({ data: { categoryId: breakfastCat.id, nameAr: "فطور إنجليزي", nameEn: "English Breakfast", price: 35 } });
  await prisma.item.create({ data: { categoryId: breakfastCat.id, nameAr: "أفوكادو توست", nameEn: "Avocado Toast", price: 28, badge: "NEW" } });
  await prisma.item.create({ data: { categoryId: breakfastCat.id, nameAr: "فول مدمس", nameEn: "Foul Medames", price: 18 } });

  await prisma.item.create({ data: { categoryId: sandwichesCat.id, nameAr: "كلوب ساندويش", nameEn: "Club Sandwich", price: 32 } });
  await prisma.item.create({ data: { categoryId: sandwichesCat.id, nameAr: "ساندويش حلوم", nameEn: "Halloumi Sandwich", price: 28 } });

  // ═══════════════════════════════════════════════════════
  // 8. Categories & Items — Al Reef
  // ═══════════════════════════════════════════════════════
  const mainCat = await prisma.category.create({
    data: { restaurantId: alReef.id, nameAr: "أطباق رئيسية", emoji: "🍖", sortOrder: 0 },
  });
  const grillCat = await prisma.category.create({
    data: { restaurantId: alReef.id, nameAr: "مشويات", emoji: "🔥", sortOrder: 1 },
  });
  const appetizersCat = await prisma.category.create({
    data: { restaurantId: alReef.id, nameAr: "مقبلات", emoji: "🥙", sortOrder: 2 },
  });
  const drinksCatReef = await prisma.category.create({
    data: { restaurantId: alReef.id, nameAr: "مشروبات", emoji: "🥤", sortOrder: 3 },
  });

  await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "كبسة لحم", price: 45, descAr: "أرز بسمتي مع لحم خروف طازج", badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "مندي دجاج", price: 35, descAr: "دجاج مدخن على الحطب مع أرز مندي" } });
  await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "مظبي", price: 55, descAr: "لحم خروف كامل مع أرز بخاري", badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: mainCat.id, nameAr: "كبسة دجاج", price: 30 } });

  await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "مشكل مشاوي", price: 65, badge: "POPULAR" } });
  await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "كباب لحم", price: 35 } });
  await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "شيش طاووق", price: 30 } });
  await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "ريش غنم", price: 55 } });
  await prisma.item.create({ data: { categoryId: grillCat.id, nameAr: "كفتة مشوية", price: 25 } });

  await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "حمص", price: 10 } });
  await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "متبل", price: 10 } });
  await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "فتوش", price: 12 } });
  await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "تبولة", price: 12 } });
  await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "سمبوسة (5 قطع)", price: 15, badge: "NEW" } });
  await prisma.item.create({ data: { categoryId: appetizersCat.id, nameAr: "ورق عنب", price: 18 } });

  await prisma.item.create({ data: { categoryId: drinksCatReef.id, nameAr: "عصير ليمون بالنعناع", price: 8 } });
  await prisma.item.create({ data: { categoryId: drinksCatReef.id, nameAr: "شاي", price: 5 } });
  await prisma.item.create({ data: { categoryId: drinksCatReef.id, nameAr: "قهوة عربي", price: 8 } });

  console.log("✅ Menu categories and items created");

  // ═══════════════════════════════════════════════════════
  // 9. Tables
  // ═══════════════════════════════════════════════════════
  for (const rest of [pizzaHome, superChicken, cafeLatte, alReef]) {
    const count = rest.id === cafeLatte.id ? 8 : 5;
    await prisma.table.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        restaurantId: rest.id,
        tableNumber: String(i + 1),
        isActive: true,
      })),
    });
  }
  console.log("✅ Tables created");

  // ═══════════════════════════════════════════════════════
  // 10. Orders
  // ═══════════════════════════════════════════════════════
  const tables = await prisma.table.findMany();
  const chickenTable1 = tables.find(t => t.restaurantId === superChicken.id && t.tableNumber === "5")!;
  const chickenTable2 = tables.find(t => t.restaurantId === superChicken.id && t.tableNumber === "2")!;

  // Order 1: New order at Super Chicken
  const order1 = await prisma.order.create({
    data: {
      restaurantId: superChicken.id,
      orderNumber: 1045,
      customerName: "أحمد محمد",
      customerPhone: "+966501234567",
      orderType: "DINE_IN",
      tableId: chickenTable1.id,
      subtotal: 85,
      taxAmount: 12.75,
      total: 97.75,
      status: "NEW",
      notes: "بدون بصل",
    },
  });
  await prisma.orderItem.createMany({
    data: [
      { orderId: order1.id, itemId: superChickenItem.id, itemName: "سوبر تشكن (كبير)", quantity: 2, unitPrice: 30, totalPrice: 60, extras: '["جبنة إضافية"]' },
      { orderId: order1.id, itemId: classicBurger.id, itemName: "ناتشوز مكسيكي (وسط)", quantity: 1, unitPrice: 25, totalPrice: 25, extras: '["كول سلو"]' },
    ],
  });

  // Order 2: Preparing
  const order2 = await prisma.order.create({
    data: {
      restaurantId: cafeLatte.id,
      orderNumber: 1044,
      customerName: "سارة علي",
      orderType: "TAKEAWAY",
      subtotal: 48,
      taxAmount: 7.2,
      total: 55.2,
      status: "PREPARING",
      createdAt: new Date(Date.now() - 12 * 60 * 1000),
    },
  });

  // Order 3: Ready
  const order3 = await prisma.order.create({
    data: {
      restaurantId: alReef.id,
      orderNumber: 1043,
      customerName: "فيد خالد",
      customerPhone: "+966505551234",
      orderType: "TAKEAWAY",
      subtotal: 76,
      taxAmount: 11.4,
      total: 87.4,
      status: "READY",
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
  });

  // Order 4: Completed
  const order4 = await prisma.order.create({
    data: {
      restaurantId: superChicken.id,
      orderNumber: 1042,
      customerName: "نورة سعد",
      orderType: "DINE_IN",
      tableId: chickenTable2.id,
      subtotal: 40,
      taxAmount: 6,
      total: 46,
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
  });

  // Order 5: Completed (older)
  const order5 = await prisma.order.create({
    data: {
      restaurantId: pizzaHome.id,
      orderNumber: 1041,
      customerName: "محمد يوسف",
      orderType: "DINE_IN",
      subtotal: 74,
      taxAmount: 11.1,
      total: 85.1,
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  });

  // More older orders for stats
  for (let i = 0; i < 5; i++) {
    await prisma.order.create({
      data: {
        restaurantId: [superChicken.id, cafeLatte.id, alReef.id][i % 3],
        orderNumber: 1036 + i,
        customerName: ["خالد", "فاطمة", "عبدالله", "ريم", "سلطان"][i],
        orderType: ["DINE_IN", "TAKEAWAY", "DINE_IN", "TAKEAWAY", "DINE_IN"][i],
        subtotal: [55, 42, 88, 30, 65][i],
        taxAmount: [8.25, 6.3, 13.2, 4.5, 9.75][i],
        total: [63.25, 48.3, 101.2, 34.5, 74.75][i],
        status: "COMPLETED",
        createdAt: new Date(Date.now() - (2 + i) * 60 * 60 * 1000),
      },
    });
  }
  console.log("✅ Orders created");

  // ═══════════════════════════════════════════════════════
  // 11. Analytics Events (sample data)
  // ═══════════════════════════════════════════════════════
  const eventTypes = ["MENU_VIEW", "ITEM_VIEW", "CATEGORY_VIEW", "QR_SCAN", "ITEM_ADD_TO_CART", "ORDER_PLACED"];
  for (const rest of [superChicken, cafeLatte, alReef, pizzaHome]) {
    const count = rest.id === superChicken.id ? 120 : rest.id === cafeLatte.id ? 80 : 50;
    for (let i = 0; i < count; i++) {
      await prisma.analyticsEvent.create({
        data: {
          restaurantId: rest.id,
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          visitorIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log("✅ Analytics events created");

  // ═══════════════════════════════════════════════════════
  // 12. Notifications
  // ═══════════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, type: "NEW_ORDER", title: "طلب جديد #1045", body: "طلب جديد من أحمد محمد في سوبر تشكن", restaurantId: superChicken.id },
      { userId: admin.id, type: "NEW_ORDER", title: "طلب جديد #1044", body: "طلب جديد من سارة علي في كافيه لاتيه", restaurantId: cafeLatte.id },
      { userId: owner2.id, type: "NEW_ORDER", title: "طلب جديد #1045", body: "طلب جديد من أحمد محمد", restaurantId: superChicken.id },
      { userId: admin.id, type: "SYSTEM", title: "مرحباً بك في MenuPro", body: "تم إنشاء حسابك بنجاح. ابدأ بإضافة مطعمك الأول!", isRead: true },
    ],
  });
  console.log("✅ Notifications created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin login:    admin@menupro.com / Admin@123");
  console.log("Owner 1 login:  moh@pizza.com / Owner@123");
  console.log("Owner 2 login:  m@chicken.com / Owner@123");
  console.log("Owner 3 login:  sara@cafe.com / Owner@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
