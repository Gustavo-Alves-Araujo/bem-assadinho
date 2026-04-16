import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { data: latest } = await supabase
    .from("recipe_versions")
    .select("version")
    .eq("recipe_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const newVersionNumber = (latest?.version ?? 0) + 1;
  const totalCost = body.ingredients.reduce((s: number, i: { totalPrice: number }) => s + i.totalPrice, 0);

  const { data: recipe } = await supabase.from("recipes").select("yield").eq("id", id).single();
  if (!recipe) return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 });

  const costPerUnit = totalCost / recipe.yield;

  const { data: version, error: vErr } = await supabase
    .from("recipe_versions")
    .insert({
      recipe_id: id,
      version: newVersionNumber,
      notes: body.notes || `Versão ${newVersionNumber}`,
      total_cost: totalCost,
      cost_per_unit: costPerUnit,
    })
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

  return NextResponse.json({ ...toCamel<Record<string, unknown>>(version), ingredients: (ingredients ?? []).map(toCamel) });
}
