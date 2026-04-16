import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

function snakeToCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Recursively convert all object keys from snake_case to camelCase */
export function toCamel<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map((v) => toCamel(v)) as unknown as T;
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        snakeToCamel(k),
        toCamel(v),
      ])
    ) as T;
  }
  return obj as T;
}

/** Map a raw sale row (with sale_items → items, products → product) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSale(sale: Record<string, any>) {
  const { sale_items, ...rest } = sale;
  return {
    ...toCamel<Record<string, unknown>>(rest),
    items: ((sale_items ?? []) as Record<string, unknown>[]).map((item) => {
      const { products, ...itemRest } = item;
      return {
        ...toCamel<Record<string, unknown>>(itemRest),
        product: products ? toCamel(products) : null,
      };
    }),
  };
}

/** Map a raw product row (categories → category) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProduct(p: Record<string, any>) {
  const { categories, ...rest } = p;
  return {
    ...toCamel<Record<string, unknown>>(rest),
    category: categories ? toCamel(categories) : null,
  };
}
