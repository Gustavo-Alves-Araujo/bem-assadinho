import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [customerRes, salesRes] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("sales")
      .select(`
        id,
        total,
        payment_method,
        status,
        created_at,
        sale_items (
          quantity,
          price,
          products ( name )
        )
      `)
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (customerRes.error || !customerRes.data) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const c = customerRes.data;
  const sales = (salesRes.data || []).map((s) => ({
    id: s.id,
    total: s.total,
    paymentMethod: s.payment_method,
    status: s.status,
    createdAt: s.created_at,
    items: (s.sale_items || []).map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = item.products as any;
      return {
        productName: (Array.isArray(p) ? p[0]?.name : p?.name) || "?",
        quantity: item.quantity,
        unitPrice: item.price,
      };
    }),
  }));

  const totalSpent = sales.reduce((acc, s) => acc + (s.total || 0), 0);

  return NextResponse.json({
    customer: {
      id: c.id,
      name: c.name,
      phone: c.phone,
      createdAt: c.created_at,
    },
    sales,
    totalSpent,
    totalOrders: sales.length,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, phone } = body;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("customers")
    .update({ name: name.trim(), phone: phone?.trim() || null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, name: data.name, phone: data.phone });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
