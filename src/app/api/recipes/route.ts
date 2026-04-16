import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";

function mapRecipe(r: Record<string, unknown>) {
  const { recipe_versions, ...rest } = r;
  return {
    ...toCamel<Record<string, unknown>>(rest),
    versions: ((recipe_versions ?? []) as Record<string, unknown>[]).map((v) => {
      const { recipe_ingredients, ...vRest } = v;
      return { ...toCamel<Record<string, unknown>>(vRest), ingredients: ((recipe_ingredients ?? []) as unknown[]).map(toCamel) };
    }),
  };
}

export async function GET() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_versions(*, recipe_ingredients(*))")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapRecipe));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const recipeYield = parseFloat(body.yield || "1");
  const totalCost = body.ingredients.reduce((s: number, i: { totalPrice: number }) => s + i.totalPrice, 0);
  const costPerUnit = totalCost / recipeYield;

  const { data: recipe, error: rErr } = await supabase
    .from("recipes")
    .insert({
      name: body.name,
      description: body.description || null,
      yield: recipeYield,
      yield_unit: body.yieldUnit || "un",
      selling_price: parseFloat(body.sellingPrice || "0"),
    })
    .select()
    .single();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const { data: version, error: vErr } = await supabase
    .from("recipe_versions")
    .insert({ recipe_id: recipe.id, version: 1, notes: body.notes || "Versão inicial", total_cost: totalCost, cost_per_unit: costPerUnit })
    .select()
    .single();
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

  const { data: ingredients, error: iErr } = await supabase
    .from("recipe_ingredients")
    .insert(body.ingredients.map((ing: { name: string; quantity: number; unit: string; pricePerUnit: number; totalPrice: number }) => ({
      recipe_version_id: version.id,
      name: ing.name, quantity: ing.quantity, unit: ing.unit,
      price_per_unit: ing.pricePerUnit, total_price: ing.totalPrice,
    })))
    .select();
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  return NextResponse.json({
    ...toCamel<Record<string, unknown>>(recipe),
    versions: [{ ...toCamel<Record<string, unknown>>(version), ingredients: (ingredients ?? []).map(toCamel) }],
  });
}
