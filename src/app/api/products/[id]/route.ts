import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, mapProduct } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name, color), stock_movements(id, type, quantity, reason, created_at)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const { stock_movements, ...rest } = data;
  return NextResponse.json({
    ...mapProduct(rest),
    stockMovements: (stock_movements ?? []).map(toCamel),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: body.name,
      description: body.description || null,
      barcode: body.barcode || null,
      price: parseFloat(body.price),
      cost: parseFloat(body.cost || "0"),
      stock: parseInt(body.stock),
      min_stock: parseInt(body.minStock || "5"),
      unit: body.unit || "un",
      category_id: body.categoryId || null,
      image_url: body.imageUrl || null,
    })
    .eq("id", id)
    .select("*, categories(id, name, color)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapProduct(data));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("products").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
