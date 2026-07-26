/**
 * Tiny CSV helpers for the admin bulk-product import. No dependencies — a small
 * state machine that correctly handles quoted fields, embedded commas/newlines,
 * and escaped double-quotes ("").
 */

/** Parse CSV text into rows of string cells. Strips a leading UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM (Excel)
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  // Drop fully-empty lines.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** "لبنیات / Dairy" -> "Dairy"; "Grains" -> "Grains". Takes the part after "/". */
export function categoryDisplayName(raw: string): string {
  const parts = raw.split("/");
  return (parts[parts.length - 1] ?? raw).trim();
}

/** Turn a category name into a URL-safe slug. */
export function slugify(s: string): string {
  const base = s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (base || "category").slice(0, 60);
}
