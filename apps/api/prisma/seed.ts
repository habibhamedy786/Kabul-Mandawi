import { PrismaClient, Role, DeliveryCity } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Afghan Family Care database...");

  // ── Admin users ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  await prisma.user.upsert({
    where: { email: "superadmin@afghanfamilycare.com" },
    update: {},
    create: {
      email: "superadmin@afghanfamilycare.com",
      fullName: "Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
      emailVerified: true,
      country: "US",
    },
  });

  await prisma.user.upsert({
    where: { email: "procurement@afghanfamilycare.com" },
    update: {},
    create: {
      email: "procurement@afghanfamilycare.com",
      fullName: "Procurement Officer",
      passwordHash,
      role: Role.PROCUREMENT_OFFICER,
      emailVerified: true,
      country: "AF",
    },
  });

  await prisma.user.upsert({
    where: { email: "delivery@afghanfamilycare.com" },
    update: {},
    create: {
      email: "delivery@afghanfamilycare.com",
      fullName: "Delivery Staff",
      passwordHash,
      role: Role.DELIVERY_STAFF,
      emailVerified: true,
      country: "AF",
    },
  });

  await prisma.user.upsert({
    where: { email: "support@afghanfamilycare.com" },
    update: {},
    create: {
      email: "support@afghanfamilycare.com",
      fullName: "Customer Support",
      passwordHash,
      role: Role.CUSTOMER_SUPPORT,
      emailVerified: true,
      country: "US",
    },
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: "demo.customer@example.com" },
    update: {},
    create: {
      email: "demo.customer@example.com",
      fullName: "Demo Customer",
      passwordHash,
      role: Role.CUSTOMER,
      emailVerified: true,
      country: "US",
    },
  });

  await prisma.savedAddress.upsert({
    where: { id: "seed-address-1" },
    update: {},
    create: {
      id: "seed-address-1",
      userId: demoCustomer.id,
      label: "Father's House",
      receiverName: "Abdul Rahimi",
      phone: "+93 70 123 4567",
      city: DeliveryCity.KABUL,
      addressLine: "House 12, Street 4, Karte Naw, Kabul",
      isDefault: true,
    },
  });

  // ── Categories ───────────────────────────────────────────────
  const categories = [
    { name: "Groceries", slug: "groceries", description: "Rice, flour, cooking oil, sugar, tea, fruits and grocery packages." },
    { name: "Flowers", slug: "flowers", description: "Birthday, wedding and sympathy flower bouquets." },
    { name: "Electronics", slug: "electronics", description: "Smartphones, headphones, smart watches and home electronics." },
    { name: "Clothing", slug: "clothing", description: "Clothing for men, women and children." },
    { name: "Gifts", slug: "gifts", description: "Gift baskets and special occasion gifts." },
    { name: "Custom Requests", slug: "custom-requests", description: "Anything not listed — submit a custom request." },
  ];

  const categoryRecords: Record<string, string> = {};
  for (const c of categories) {
    const rec = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categoryRecords[c.slug] = rec.id;
  }

  // ── Products ─────────────────────────────────────────────────
  const products: Array<{
    sku: string; name: string; description: string; priceUsd: number;
    categorySlug: string; unit?: string; isFeatured?: boolean;
  }> = [
    { sku: "GRO-RICE-5KG", name: "Premium Rice (5kg)", description: "High quality long-grain rice, 5kg bag.", priceUsd: 14.99, categorySlug: "groceries", unit: "5kg bag", isFeatured: true },
    { sku: "GRO-FLOUR-10KG", name: "Wheat Flour (10kg)", description: "Stone-milled wheat flour, 10kg bag.", priceUsd: 16.5, categorySlug: "groceries", unit: "10kg bag" },
    { sku: "GRO-OIL-5L", name: "Cooking Oil (5L)", description: "Pure vegetable cooking oil, 5 liter container.", priceUsd: 12.0, categorySlug: "groceries", unit: "5L" },
    { sku: "GRO-SUGAR-5KG", name: "White Sugar (5kg)", description: "Refined white sugar, 5kg bag.", priceUsd: 9.0, categorySlug: "groceries", unit: "5kg bag" },
    { sku: "GRO-TEA-1KG", name: "Black Tea (1kg)", description: "Premium black tea leaves, 1kg pack.", priceUsd: 8.5, categorySlug: "groceries", unit: "1kg" },
    { sku: "GRO-FRUIT-BASKET", name: "Seasonal Fruit Basket", description: "Assorted fresh seasonal fruits.", priceUsd: 22.0, categorySlug: "groceries", unit: "basket", isFeatured: true },
    { sku: "GRO-PKG-FAMILY", name: "Family Grocery Package", description: "Bundle: rice, oil, flour, sugar, tea for a family of 5-6.", priceUsd: 59.0, categorySlug: "groceries", unit: "package", isFeatured: true },
    { sku: "FLW-BDAY-01", name: "Birthday Bouquet", description: "Colorful mixed flower bouquet for birthdays.", priceUsd: 25.0, categorySlug: "flowers" },
    { sku: "FLW-WED-01", name: "Wedding Bouquet", description: "Elegant white and red rose wedding bouquet.", priceUsd: 45.0, categorySlug: "flowers" },
    { sku: "FLW-SYM-01", name: "Sympathy Flowers", description: "White lily and chrysanthemum sympathy arrangement.", priceUsd: 30.0, categorySlug: "flowers" },
    { sku: "ELEC-PHONE-A55", name: "Samsung Galaxy A55", description: "Samsung Galaxy A55, 128GB, factory unlocked.", priceUsd: 379.0, categorySlug: "electronics", isFeatured: true },
    { sku: "ELEC-HEADPH-01", name: "Wireless Headphones", description: "Over-ear Bluetooth headphones with noise cancellation.", priceUsd: 49.99, categorySlug: "electronics" },
    { sku: "ELEC-WATCH-01", name: "Smart Watch", description: "Fitness and notifications smart watch.", priceUsd: 59.99, categorySlug: "electronics" },
    { sku: "ELEC-HOME-KETTLE", name: "Electric Kettle", description: "1.7L stainless steel electric kettle, 220V.", priceUsd: 24.99, categorySlug: "electronics" },
    { sku: "CLO-SHAWL-01", name: "Embroidered Shawl", description: "Traditional embroidered shawl.", priceUsd: 28.0, categorySlug: "clothing" },
    { sku: "GIFT-BASKET-01", name: "Premium Gift Basket", description: "Assorted sweets, dry fruits and tea in a gift basket.", priceUsd: 39.0, categorySlug: "gifts", isFeatured: true },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        priceUsd: p.priceUsd,
        unit: p.unit,
        isFeatured: p.isFeatured ?? false,
        categoryId: categoryRecords[p.categorySlug],
        availableCities: [DeliveryCity.KABUL],
        stockQty: 500,
        images: [],
        tags: [],
      },
    });
  }

  console.log("Seed complete.");
  console.log("Default password for all seeded staff accounts: ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
