-- Afghan Family Care — Seed Data (categories + products only — users already inserted)

-- Categories
INSERT INTO "Category" ("id","name","slug","description","sortOrder","isActive") VALUES
  (gen_random_uuid(),'Groceries','groceries','Rice, flour, cooking oil, sugar, tea, fruits and grocery packages.',1,true),
  (gen_random_uuid(),'Flowers','flowers','Birthday, wedding and sympathy flower bouquets.',2,true),
  (gen_random_uuid(),'Electronics','electronics','Smartphones, headphones, smart watches and home electronics.',3,true),
  (gen_random_uuid(),'Clothing','clothing','Clothing for men, women and children.',4,true),
  (gen_random_uuid(),'Gifts','gifts','Gift baskets and special occasion gifts.',5,true),
  (gen_random_uuid(),'Custom Requests','custom-requests','Anything not listed — submit a custom request.',6,true)
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-RICE-5KG','Premium Rice (5kg)','High quality long-grain rice, 5kg bag.',14.99,id,ARRAY['KABUL']::"DeliveryCity"[],500,'5kg bag',true,true,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-FLOUR-10KG','Wheat Flour (10kg)','Stone-milled wheat flour, 10kg bag.',16.50,id,ARRAY['KABUL']::"DeliveryCity"[],500,'10kg bag',true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-OIL-5L','Cooking Oil (5L)','Pure vegetable cooking oil, 5 liter container.',12.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,'5L',true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-SUGAR-5KG','White Sugar (5kg)','Refined white sugar, 5kg bag.',9.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,'5kg bag',true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-TEA-1KG','Black Tea (1kg)','Premium black tea leaves, 1kg pack.',8.50,id,ARRAY['KABUL']::"DeliveryCity"[],500,'1kg',true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-FRUIT-BASKET','Seasonal Fruit Basket','Assorted fresh seasonal fruits.',22.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,'basket',true,true,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GRO-PKG-FAMILY','Family Grocery Package','Bundle: rice, oil, flour, sugar, tea for a family of 5-6.',59.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,'package',true,true,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='groceries' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'FLW-BDAY-01','Birthday Bouquet','Colorful mixed flower bouquet for birthdays.',25.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='flowers' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'FLW-WED-01','Wedding Bouquet','Elegant white and red rose wedding bouquet.',45.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='flowers' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'FLW-SYM-01','Sympathy Flowers','White lily and chrysanthemum sympathy arrangement.',30.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='flowers' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'ELEC-PHONE-A55','Samsung Galaxy A55','Samsung Galaxy A55, 128GB, factory unlocked.',379.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,true,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='electronics' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'ELEC-HEADPH-01','Wireless Headphones','Over-ear Bluetooth headphones with noise cancellation.',49.99,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='electronics' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'ELEC-WATCH-01','Smart Watch','Fitness and notifications smart watch.',59.99,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='electronics' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'ELEC-HOME-KETTLE','Electric Kettle','1.7L stainless steel electric kettle, 220V.',24.99,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='electronics' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'CLO-SHAWL-01','Embroidered Shawl','Traditional embroidered shawl.',28.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,false,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='clothing' ON CONFLICT (sku) DO NOTHING;

INSERT INTO "Product" ("id","sku","name","description","priceUsd","categoryId","availableCities","stockQty","unit","isActive","isFeatured","images","tags","createdAt","updatedAt")
SELECT gen_random_uuid(),'GIFT-BASKET-01','Premium Gift Basket','Assorted sweets, dry fruits and tea in a gift basket.',39.00,id,ARRAY['KABUL']::"DeliveryCity"[],500,NULL,true,true,ARRAY[]::TEXT[],ARRAY[]::TEXT[],NOW(),NOW() FROM "Category" WHERE slug='gifts' ON CONFLICT (sku) DO NOTHING;
