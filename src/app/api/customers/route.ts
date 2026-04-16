import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customers = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    createdAt: c.created_at,
  }));

  return NextResponse.json({ customers, total: count || 0 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phone } = body;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ name: name.trim(), phone: phone?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    name: data.name,
    phone: data.phone,
    createdAt: data.created_at,
  });
}
