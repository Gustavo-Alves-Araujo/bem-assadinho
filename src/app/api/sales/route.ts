import { NextRequest, NextResponse } from "next/server";
import { supabase, toCamel, mapSale } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";

  let query = supabase
    .from("sales")
    .select("*, sale_items(*, products(name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    sales: (data ?? []).map(mapSale),
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const subtotal = body.items.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0
  );
  const discount = parseFloat(body.discount || "0");
  const total = subtotal - discount;

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      subtotal,
      discount,
      total,
      payment_method: body.paymentMethod,
      customer_id: body.customerId || null,
      customer_name: body.customerName || null,
      transaction_id: body.transactionId || null,
      status: body.status || "completed",
    })
    .select()
    .single();
  if (saleErr) return NextResponse.json({ error: saleErr.message }, { status: 500 });

  const { error: itemsErr } = await supabase.from("sale_items").insert(
    body.items.map((item: { productId: string; quantity: number; price: number }) => ({
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    }))
  );
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  for (const item of body.items) {
    const { data: prod } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.productId)
      .single();
    if (prod) {
      await supabase
        .from("products")
        .update({ stock: prod.stock - item.quantity })
        .eq("id", item.productId);
    }
    await supabase.from("stock_movements").insert({
      product_id: item.productId,
      type: "out",
      quantity: item.quantity,
      reason: `Venda #${sale.id.slice(0, 8)}`,
    });
  }

  return NextResponse.json(toCamel(sale));
}
