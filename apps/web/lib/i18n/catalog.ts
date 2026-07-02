import { Lang } from "./translations";

// ─────────────────────────────────────────────────────────────────────────
// Catalog content translations (product & category names/descriptions).
//
// Product/category text lives in the database in English. This dictionary
// provides the Dari (fa) and Pashto (ps) versions, keyed by the stable SKU /
// category slug. Anything without a translation falls back to the English
// value from the database, so newly-added products simply show in English
// until their translation is added here.
// ─────────────────────────────────────────────────────────────────────────

interface Localized {
  name: string;
  description?: string;
  unit?: string;
}

type ProductLangMap = Partial<Record<Exclude<Lang, "en">, Localized>>;

export const PRODUCT_TRANSLATIONS: Record<string, ProductLangMap> = {
  "GRO-RICE-5KG": {
    fa: { name: "برنج درجه‌یک (۵ کیلو)", description: "برنج دانه‌بلند باکیفیت، کیسه ۵ کیلویی.", unit: "کیسه ۵ کیلویی" },
    ps: { name: "لوړ کیفیت وريجې (۵ کیلو)", description: "د لوړ کیفیت اوږد‌دانه وريجې، ۵ کیلو بوجۍ.", unit: "۵ کیلو بوجۍ" },
  },
  "GRO-FLOUR-10KG": {
    fa: { name: "آرد گندم (۱۰ کیلو)", description: "آرد گندم آسیاب‌سنگی، کیسه ۱۰ کیلویی.", unit: "کیسه ۱۰ کیلویی" },
    ps: { name: "د غنمو اوړه (۱۰ کیلو)", description: "د تیږې اوړه شوي غنم، ۱۰ کیلو بوجۍ.", unit: "۱۰ کیلو بوجۍ" },
  },
  "GRO-OIL-5L": {
    fa: { name: "روغن پخت‌وپز (۵ لیتر)", description: "روغن نباتی خالص، ظرف ۵ لیتری.", unit: "۵ لیتر" },
    ps: { name: "د پخلي تیل (۵ لیتره)", description: "خالص نباتي تیل، ۵ لیتره لوښی.", unit: "۵ لیتره" },
  },
  "GRO-SUGAR-5KG": {
    fa: { name: "شکر سفید (۵ کیلو)", description: "شکر سفید تصفیه‌شده، کیسه ۵ کیلویی.", unit: "کیسه ۵ کیلویی" },
    ps: { name: "سپینه بوره (۵ کیلو)", description: "تصفیه‌شوې سپینه بوره، ۵ کیلو بوجۍ.", unit: "۵ کیلو بوجۍ" },
  },
  "GRO-TEA-1KG": {
    fa: { name: "چای سیاه (۱ کیلو)", description: "برگ چای سیاه درجه‌یک، بسته ۱ کیلویی.", unit: "۱ کیلو" },
    ps: { name: "تور چای (۱ کیلو)", description: "د لوړ کیفیت تور چای پاڼې، ۱ کیلو پاکټ.", unit: "۱ کیلو" },
  },
  "GRO-FRUIT-BASKET": {
    fa: { name: "سبد میوه فصلی", description: "میوه‌های تازه فصلی متنوع.", unit: "سبد" },
    ps: { name: "د موسم میوې ټوکرۍ", description: "بیلابیل تازه موسمي میوې.", unit: "ټوکرۍ" },
  },
  "GRO-PKG-FAMILY": {
    fa: { name: "بسته خوراکی خانواده", description: "بسته: برنج، روغن، آرد، شکر، چای برای خانواده ۵ تا ۶ نفره.", unit: "بسته" },
    ps: { name: "د کورنۍ د خوراکي توکو بنډل", description: "بنډل: وريجې، تیل، اوړه، بوره، چای د ۵-۶ کسیزې کورنۍ لپاره.", unit: "بنډل" },
  },
  "FLW-BDAY-01": {
    fa: { name: "دسته‌گل تولد", description: "دسته‌گل رنگارنگ مخلوط برای تولد." },
    ps: { name: "د کلیزې ګلدسته", description: "د کلیزې لپاره رنګارنګ ګډ ګلدسته." },
  },
  "FLW-WED-01": {
    fa: { name: "دسته‌گل عروسی", description: "دسته‌گل شیک عروسی از رز سفید و سرخ." },
    ps: { name: "د واده ګلدسته", description: "د سپینو او سرو ګلابو ښکلې د واده ګلدسته." },
  },
  "FLW-SYM-01": {
    fa: { name: "گل‌های تسلیت", description: "آرایش تسلیت از سوسن سفید و گل داوودی." },
    ps: { name: "د خواخوږۍ ګلان", description: "د سپینې سوسن او ګل داودي د خواخوږۍ ترتیب." },
  },
  "ELEC-PHONE-A55": {
    fa: { name: "سامسونگ گلکسی A55", description: "سامسونگ گلکسی A55، ۱۲۸ گیگابایت، آنلاک کارخانه." },
    ps: { name: "سامسنګ ګلکسي A55", description: "سامسنګ ګلکسي A55، ۱۲۸ ګیګابایټ، فابریکه آنلاک." },
  },
  "ELEC-HEADPH-01": {
    fa: { name: "هدفون بی‌سیم", description: "هدفون بلوتوثی روگوشی با قابلیت حذف نویز." },
    ps: { name: "بې‌سیمه هیډفون", description: "د غوږ پر سر بلوتوث هیډفون د شور له حذف سره." },
  },
  "ELEC-WATCH-01": {
    fa: { name: "ساعت هوشمند", description: "ساعت هوشمند برای تناسب اندام و اعلان‌ها." },
    ps: { name: "سمارټ ساعت", description: "د فټنس او خبرتیاوو لپاره سمارټ ساعت." },
  },
  "ELEC-HOME-KETTLE": {
    fa: { name: "کتری برقی", description: "کتری برقی استیل ضدزنگ ۱.۷ لیتری، ۲۲۰ ولت." },
    ps: { name: "برقي کیتلي", description: "د زنګ‌مخنیوي اوسپنې برقي کیتلي ۱.۷ لیتره، ۲۲۰ ولټ." },
  },
  "CLO-SHAWL-01": {
    fa: { name: "شال گلدوزی‌شده", description: "شال سنتی گلدوزی‌شده." },
    ps: { name: "ګل‌دوزي شوی شال", description: "دودیز ګل‌دوزي شوی شال." },
  },
  "GIFT-BASKET-01": {
    fa: { name: "سبد هدیه ویژه", description: "شیرینی‌های متنوع، خشکبار و چای در یک سبد هدیه." },
    ps: { name: "ځانګړې ډالۍ ټوکرۍ", description: "بیلابیل خواږه، وچ میوه او چای په ډالۍ ټوکرۍ کې." },
  },
  // Two products you added while testing:
  "s23": {
    fa: { name: "برنج", description: "برنج درجه یک", unit: "۲۰" },
    ps: { name: "وريجې", description: "لومړۍ درجه وريجې", unit: "۲۰" },
  },
  "sp12": {
    fa: { name: "برنج", description: "برنج باسماتی نمبر ۱", unit: "۲۵ کیلو" },
    ps: { name: "وريجې", description: "باسماتي وريجې نمبر ۱", unit: "۲۵ کیلو" },
  },
};

export const CATEGORY_TRANSLATIONS: Record<string, Partial<Record<Exclude<Lang, "en">, { name: string; description?: string }>>> = {
  "groceries": {
    fa: { name: "مواد غذایی", description: "برنج، آرد، روغن، شکر، چای، میوه‌ها و بسته‌های مواد غذایی." },
    ps: { name: "خوراکي توکي", description: "وريجې، اوړه، تیل، بوره، چای، میوې او د خوراکي توکو بنډلونه." },
  },
  "flowers": {
    fa: { name: "گل‌ها", description: "دسته‌گل‌های تولد، عروسی و تسلیت." },
    ps: { name: "ګلان", description: "د کلیزې، واده او خواخوږۍ ګلان." },
  },
  "electronics": {
    fa: { name: "الکترونیک", description: "گوشی‌های هوشمند، هدفون، ساعت‌های هوشمند و لوازم برقی خانگی." },
    ps: { name: "برقي توکي", description: "سمارټ فونونه، هیډفونونه، سمارټ ساعتونه او د کور برقي توکي." },
  },
  "clothing": {
    fa: { name: "پوشاک", description: "پوشاک برای مردان، زنان و کودکان." },
    ps: { name: "کالي", description: "د نارینه‌و، ښځو او ماشومانو لپاره کالي." },
  },
  "gifts": {
    fa: { name: "هدایا", description: "سبدهای هدیه و هدایای مناسبتی." },
    ps: { name: "ډالۍ", description: "د ډالۍ ټوکرۍ او د ځانګړو مناسبتونو ډالۍ." },
  },
  "custom-requests": {
    fa: { name: "درخواست‌های ویژه", description: "هر چیزی که در لیست نیست — درخواست ویژه ثبت کنید." },
    ps: { name: "ځانګړې غوښتنې", description: "هر هغه څه چې په لیست کې نشته — ځانګړې غوښتنه وسپارئ." },
  },
};

interface LocalizableProduct {
  sku?: string;
  name: string;
  description?: string;
  unit?: string | null;
  nameFa?: string | null;
  namePs?: string | null;
  descriptionFa?: string | null;
  descriptionPs?: string | null;
  unitFa?: string | null;
  unitPs?: string | null;
}

/**
 * Returns the product's name/description/unit in the active language.
 * Priority: database translation fields (entered in the admin) → static
 * dictionary → the original English value.
 */
export function localizeProduct(
  product: LocalizableProduct,
  lang: Lang
): { name: string; description: string; unit: string | undefined } {
  const fallback = { name: product.name, description: product.description ?? "", unit: product.unit ?? undefined };
  if (lang === "en") return fallback;

  const dbName = lang === "fa" ? product.nameFa : product.namePs;
  const dbDesc = lang === "fa" ? product.descriptionFa : product.descriptionPs;
  const dbUnit = lang === "fa" ? product.unitFa : product.unitPs;
  const tr = product.sku ? PRODUCT_TRANSLATIONS[product.sku]?.[lang] : undefined;

  return {
    name: dbName || tr?.name || fallback.name,
    description: dbDesc || tr?.description || fallback.description,
    unit: dbUnit || tr?.unit || fallback.unit,
  };
}

/** Returns a category's name in the active language, falling back to English. */
export function localizeCategoryName(cat: { slug?: string; name: string } | undefined, lang: Lang): string {
  if (!cat) return "";
  if (lang === "en" || !cat.slug) return cat.name;
  return CATEGORY_TRANSLATIONS[cat.slug]?.[lang]?.name ?? cat.name;
}
