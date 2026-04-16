import { NextResponse } from "next/server";
import { supabase, toCamel, mapSale } from "@/lib/supabase";

export async function GET() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    { data: todaySalesData },
    { data: weeklySalesData },
    { data: monthlySalesData },
    { count: totalProducts },
    { data: allProducts },
    { data: recentSalesRaw },
    { data: allSaleIds },
  ] = await Promise.all([
    supabase.from("sales").select("total, payment_method").eq("status", "completed").gte("created_at", today.toISOString()),
    supabase.from("sales").select("total, payment_method, created_at").eq("status", "completed").gte("created_at", weekStart.toISOString()),
    supabase.from("sales").select("total, payment_method").eq("status", "completed").gte("created_at", monthStart.toISOString()),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("products").select("id, name, stock, min_stock").eq("active", true),
    supabase.from("sales").select("*, sale_items(*, products(name))").eq("status", "completed").order("created_at", { ascending: false }).limit(8),
    supabase.from("sales").select("id").eq("status", "completed"),
  ]);

  const lowStock = (allProducts ?? []).filter((p) => p.stock <= p.min_stock);

  // Payment method breakdown (current month)
  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  for (const sale of monthlySalesData ?? []) {
    const pm = sale.payment_method || "cash";
    if (!paymentBreakdown[pm]) paymentBreakdown[pm] = { count: 0, total: 0 };
    paymentBreakdown[pm].count += 1;
    paymentBreakdown[pm].total += sale.total;
  }

  // Top products by revenue
  let topProducts: { id: string; name: string; qty: number; revenue: number }[] = [];
  const saleIds = (allSaleIds ?? []).map((s) => s.id);
  if (saleIds.length > 0) {
    const { data: topItemsRaw } = await supabase
      .from("sale_items")
      .select("quantity, price, product_id, products(id, name)")
      .in("sale_id", saleIds);

    const productRevenue: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const item of topItemsRaw ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = item.products as any;
      const pid = prod?.id ?? item.product_id;
      if (!productRevenue[pid]) productRevenue[pid] = { name: prod?.name ?? pid, qty: 0, revenue: 0 };
      productRevenue[pid].qty += item.quantity;
      productRevenue[pid].revenue += item.price * item.quantity;
    }
    topProducts = Object.entries(productRevenue)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  // 7-day daily sales
  const dailySales: { date: string; total: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dEnd = new Date(d);
    dEnd.setDate(d.getDate() + 1);
    const dayLabel = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });
    const daySales = (weeklySalesData ?? []).filter((s) => {
      const sd = new Date(s.created_at);
      return sd >= d && sd < dEnd;
    });
    dailySales.push({ date: dayLabel, total: daySales.reduce((s, x) => s + x.total, 0), orders: daySales.length });
  }

  return NextResponse.json({
    todaySales: (todaySalesData ?? []).reduce((s, x) => s + x.total, 0),
    todayOrders: (todaySalesData ?? []).length,
    weeklySales: (weeklySalesData ?? []).reduce((s, x) => s + x.total, 0),
    weeklyOrders: (weeklySalesData ?? []).length,
    monthlySales: (monthlySalesData ?? []).reduce((s, x) => s + x.total, 0),
    monthlyOrders: (monthlySalesData ?? []).length,
    totalProducts: totalProducts ?? 0,
    lowStockProducts: lowStock.slice(0, 10).map(toCamel),
    recentSales: (recentSalesRaw ?? []).map(mapSale),
    paymentBreakdown,
    topProducts,
    dailySales,
  });
}
