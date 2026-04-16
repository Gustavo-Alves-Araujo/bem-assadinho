import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, mapProduct } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { type, quantity, reason } = body;

  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("stock")
    .eq("id", id)
    .single();
  if (fetchErr) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  let newStock = product.stock;
  if (type === "in") newStock += quantity;
  else if (type === "out") newStock -= quantity;
  else if (type === "adjustment") newStock = quantity;

  if (newStock < 0) return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 });

  const [{ data: updated }, { data: movement }] = await Promise.all([
    supabase.from("products").update({ stock: newStock }).eq("id", id).select("*, categories(id, name, color)").single(),
    supabase.from("stock_movements").insert({ product_id: id, type, quantity, reason }).select().single(),
  ]);

  return NextResponse.json({ product: updated ? mapProduct(updated) : null, movement: movement ? toCamel(movement) : null });
}
