import { NextRequest, NextResponse } from "next/server";
import { supabase, mapProduct } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  let query = supabase
    .from("products")
    .select("*, categories(id, name, color)", { count: "exact" })
    .eq("active", true)
    .order("name")
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    products: (data ?? []).map(mapProduct),
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const stock = parseInt(body.stock || "0");

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      description: body.description || null,
      barcode: body.barcode || null,
      price: parseFloat(body.price),
      cost: parseFloat(body.cost || "0"),
      stock,
      min_stock: parseInt(body.minStock || "5"),
      unit: body.unit || "un",
      category_id: body.categoryId || null,
      image_url: body.imageUrl || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (stock > 0) {
    await supabase.from("stock_movements").insert({
      product_id: data.id,
      type: "in",
      quantity: stock,
      reason: "Estoque inicial",
    });
  }

  return NextResponse.json(mapProduct(data));
}
