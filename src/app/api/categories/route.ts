import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(id)")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (data ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
    _count: { products: Array.isArray(cat.products) ? cat.products.length : 0 },
  }));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: body.name, color: body.color || "#f97316" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toCamel(data));
}
