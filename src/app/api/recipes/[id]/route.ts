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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_versions(*, recipe_ingredients(*))")
    .eq("id", id)
    .order("version", { ascending: false, referencedTable: "recipe_versions" })
    .single();
  if (error) return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 });
  return NextResponse.json(mapRecipe(data));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase
    .from("recipes")
    .update({
      name: body.name,
      description: body.description || null,
      yield: parseFloat(body.yield || "1"),
      yield_unit: body.yieldUnit || "un",
      selling_price: parseFloat(body.sellingPrice || "0"),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toCamel(data));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
