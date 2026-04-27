// prisma/seed-pg.ts — Raw SQL seed using pg directly (bypasses Prisma Wasm)
import { Pool } from "pg";
import { hashSync } from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function uid(): string {
  return require("crypto").randomUUID();
}

async function main() {
  const client = await pool.connect();
  console.log("🌱 Seeding MenuPro database (raw pg)...\n");

  try {
    // ── 1. Users ──────────────────────────────────────────
    const adminId = uid();
    const owner1Id = uid();
    const owner2Id = uid();
    const owner3Id = uid();
    const now = new Date().toISOString();

    await client.query(`
      INSERT INTO users (id, name, email, "passwordHash", phone, role, "isActive", "createdAt", "updatedAt")
      VALUES
        ($1, 'عمر',      'admin@menupro.com', $5, '+966501234567', 'ADMIN',            true, $9, $9),
        ($2, 'محمد يوسف','moh@pizza.com',     $6, '+966509876543', 'RESTAURANT_OWNER', true, $9, $9),
        ($3, 'محمد أحمد','m@chicken.com',     $7, '+966507654321', 'RESTAURANT_OWNER', true, $9, $9),
        ($4, 'سارة علي', 'sara@cafe.com',     $8, '+966508765432', 'RESTAURANT_OWNER', true, $9, $9)
      ON CONFLICT (email) DO NOTHING
    `, [
      adminId, owner1Id, owner2Id, owner3Id,
      hashSync("Admin@123", 10),
      hashSync("Owner@123", 10),
      hashSync("Owner@123", 10),
      hashSync("Owner@123", 10),
      now,
    ]);
    console.log("✅ Users created");

    // ── 2. Plans ──────────────────────────────────────────
    const basicId = uid(), proId = uid(), entId = uid();
    await client.query(`
      INSERT INTO plans (id, "nameAr", "nameEn", slug, "priceMonthly", "priceYearly",
        "maxItems", "maxCategories", "noAds", "advancedAnalytics", "seoEnabled",
        "multiViewMode", "multiLanguage", "aboutPage", "workingHours", reviews,
        "orderSystem", "tableManagement", "multiCoverImages", "multiItemImages",
        "isActive", "sortOrder")
      VALUES
        ($1,'الأساسية',  'Basic',      'basic',     49, 490, 30,  5,  false,false,false,false,false,false,false,false,false,false,false,false,true,0),
        ($2,'الاحترافية','Pro',         'pro',       99, 990, 100,20, true, true, false,true, true, true, true, false,true, true, true, true, true,1),
        ($3,'المؤسسات',  'Enterprise', 'enterprise',199,1990,NULL,NULL,true, true, true, true, true, true, true, true, true, true, true, true, true,2)
      ON CONFLICT DO NOTHING
    `, [basicId, proId, entId]);
    console.log("✅ Plans created");

    // ── 3. Restaurants ────────────────────────────────────
    const r1Id = uid(), r2Id = uid(), r3Id = uid(), r4Id = uid();
    await client.query(`
      INSERT INTO restaurants (id, "userId", slug, "nameAr", "nameEn", "descAr",
        "primaryColor","secondaryColor", whatsapp, phone, instagram, address,
        currency, "taxPercent", "enabledLangs", "isActive",
        "ownerCanEditMenu","ownerCanEditBranding","ownerCanEditSettings","ownerCanManageTables",
        "menuViewMode","createdAt","updatedAt")
      VALUES
        ($1,$5,'pizza-home',  'بيتزا هوم',   'Pizza Home',   'أفضل بيتزا طازجة','#E74C3C','#1A1A2E','+966509876543','+966509876543','pizzahome_sa', 'شارع الملك فهد، الرياض','JOD',15,'ar,en',false,true, false,false,true,'LIST',$9,$9),
        ($2,$6,'super-chicken','سوبر تشكن',  'Super Chicken','دجاج مقرمش',      '#2980B9','#1A1A2E','+966507654321','+966507654321','superchicken_sa','شارع التحلية، جدة',   'JOD',15,'ar,en',true, true, true, false,true,'LIST',$9,$9),
        ($3,$7,'cafe-latte',  'كافيه لاتيه', 'Café Latté',  'قهوة مختصة',      '#FF6B35','#1A1A2E','+966508765432','+966508765432','cafelatte_sa',  'حي العليا، الرياض',   'JOD',15,'ar,en,tr',true,true, true, true, true,'LIST',$9,$9),
        ($4,$8,'al-reef',     'مطعم الريف',  'Al Reef',     'أكلات شعبية',     '#27AE60','#1A1A2E',NULL,            NULL,            NULL,           'شارع الأمير سلطان',   'JOD',15,'ar',     true, true, false,false,true,'LIST',$9,$9)
    `, [r1Id, r2Id, r3Id, r4Id, owner1Id, owner2Id, owner3Id, adminId, now]);
    console.log("✅ Restaurants created");

    // ── 4. Subscriptions ──────────────────────────────────
    const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    await client.query(`
      INSERT INTO subscriptions (id, "userId", "planId", status, "billingCycle", "startDate", "endDate", "createdAt", "updatedAt")
      VALUES
        ($1,$4,$7,'ACTIVE','MONTHLY',$10,$11,$10,$10),
        ($2,$5,$8,'ACTIVE','YEARLY', $10,$11,$10,$10),
        ($3,$6,$9,'ACTIVE','YEARLY', $10,$11,$10,$10)
    `, [uid(), uid(), uid(), owner1Id, owner2Id, owner3Id, basicId, proId, entId, now, oneYear]);
    console.log("✅ Subscriptions created");

    // ── 5. A few categories (Pizza Home) ──────────────────
    const catPizza = uid(), catPasta = uid(), catDrinks1 = uid();
    await client.query(`
      INSERT INTO categories (id, "restaurantId", "nameAr", "nameEn", emoji, "sortOrder", "isVisible", "createdAt", "updatedAt")
      VALUES
        ($1,$4,'بيتزا','Pizza','🍕',0,true,$5,$5),
        ($2,$4,'باستا','Pasta','🍝',1,true,$5,$5),
        ($3,$4,'مشروبات','Drinks','🥤',2,true,$5,$5)
    `, [catPizza, catPasta, catDrinks1, r1Id, now]);
    console.log("✅ Categories (sample) created");

    // ── 6. A few items ────────────────────────────────────
    const i1 = uid(), i2 = uid(), i3 = uid(), i4 = uid();
    await client.query(`
      INSERT INTO items (id, "categoryId", "nameAr", "nameEn", "descAr", price, "isAvailable", "sortOrder", "createdAt", "updatedAt")
      VALUES
        ($1,$5,'مارغريتا','Margherita','صلصة طماطم وجبنة موزاريلا',35,true,0,$8,$8),
        ($2,$5,'بيبروني','Pepperoni', 'صلصة طماطم وشرائح بيبروني', 40,true,1,$8,$8),
        ($3,$6,'فوتشيني ألفريدو','Fettuccine','صلصة كريمية غنية',  38,true,0,$8,$8),
        ($4,$7,'بيبسي','Pepsi','مشروب غازي بارد',5,true,0,$8,$8)
    `, [i1, i2, i3, i4, catPizza, catPasta, catDrinks1, now]);
    console.log("✅ Items (sample) created");

    console.log("\n🎉 Database seeded successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:   admin@menupro.com  /  Admin@123");
    console.log("Owner1:  moh@pizza.com      /  Owner@123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
