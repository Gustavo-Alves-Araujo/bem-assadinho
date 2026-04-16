"use client";

import AppLayout from "@/components/AppLayout";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRight,
  Receipt,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface DashboardData {
  todaySales: number;
  todayOrders: number;
  weeklySales: number;
  weeklyOrders: number;
  monthlySales: number;
  monthlyOrders: number;
  totalProducts: number;
  lowStockProducts: { id: string; name: string; stock: number; minStock: number }[];
  recentSales: {
    id: string;
    total: number;
    paymentMethod: string;
    createdAt: string;
    items: { product: { name: string }; quantity: number }[];
  }[];
  paymentBreakdown: Record<string, { count: number; total: number }>;
  topProducts: { id: string; name: string; qty: number; revenue: number }[];
  dailySales: { date: string; total: number; orders: number }[];
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
};

const paymentIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cash: Banknote,
  credit: CreditCard,
  debit: Smartphone,
};

const paymentColors: Record<string, string> = {
  cash:   "bg-emerald-100 text-emerald-600",
  credit: "bg-blue-100 text-blue-600",
  debit:  "bg-violet-100 text-violet-600",
};

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin") !== "1") {
      router.replace("/pdv");
    } else {
      setAuthed(true);
      fetch("/api/dashboard").then((r) => r.json()).then(setData);
    }
  }, [router]);

  if (!authed) return null;

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const maxDailyTotal = data ? Math.max(...data.dailySales.map((d) => d.total), 1) : 1;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-widest mb-1 capitalize">{today}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          </div>
          <Link
            href="/pdv"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px"
          >
            <ShoppingCart size={16} />
            Abrir PDV
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Faturamento Hoje"
            value={data ? formatCurrency(data.todaySales) : null}
            icon={DollarSign}
            accent="from-emerald-400 to-emerald-600"
            sub={data ? `${data.todayOrders} venda${data.todayOrders !== 1 ? "s" : ""}` : undefined}
          />
          <StatCard
            title="Esta Semana"
            value={data ? formatCurrency(data.weeklySales) : null}
            icon={Calendar}
            accent="from-orange-400 to-orange-600"
            sub={data ? `${data.weeklyOrders} vendas (7 dias)` : undefined}
          />
          <StatCard
            title="Este Mês"
            value={data ? formatCurrency(data.monthlySales) : null}
            icon={TrendingUp}
            accent="from-amber-400 to-amber-600"
            sub={data ? `${data.monthlyOrders} vendas` : undefined}
          />
          <StatCard
            title="Estoque Baixo"
            value={data ? String(data.lowStockProducts.length) : null}
            icon={AlertTriangle}
            accent={data && data.lowStockProducts.length > 0 ? "from-red-400 to-red-600" : "from-slate-300 to-slate-500"}
            sub={data && data.lowStockProducts.length === 0 ? "Tudo em dia ✓" : "itens críticos"}
          />
        </div>

        {/* 7-day chart */}
        <div className="bg-white rounded-2xl border border-border p-6" style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}>
          <h2 className="font-semibold text-foreground mb-5">Faturamento — Últimos 7 Dias</h2>
          {!data ? (
            <div className="h-32 flex items-end gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 skeleton rounded-t-lg" style={{ height: `${30 + Math.random() * 60}%` }} />
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {data.dailySales.map((d) => {
                const pct = (d.total / maxDailyTotal) * 100;
                const isToday = d === data.dailySales[data.dailySales.length - 1];
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatCurrency(d.total)}
                    </span>
                    <div className="w-full relative" style={{ height: "90px" }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${isToday ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/50"}`}
                        style={{ height: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted text-center leading-tight">{d.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Sales */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Vendas Recentes</h2>
              <Link href="/vendas" className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
                Ver todas <ArrowRight size={13} />
              </Link>
            </div>

            {!data ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3.5 w-2/3 rounded" />
                      <div className="skeleton h-3 w-1/3 rounded" />
                    </div>
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Receipt size={22} className="text-muted/50" />
                </div>
                <p className="text-sm font-medium text-muted">Nenhuma venda ainda</p>
                <p className="text-xs text-muted/60 mt-1">As vendas aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.recentSales.map((sale) => {
                  const Icon = paymentIcons[sale.paymentMethod] || Receipt;
                  const iconCls = paymentColors[sale.paymentMethod] || "bg-gray-100 text-muted";
                  const items = sale.items.slice(0, 2).map((i) => `${i.quantity}× ${i.product.name}`).join(", ");
                  const more = sale.items.length > 2 ? ` +${sale.items.length - 2}` : "";
                  const time = new Date(sale.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={sale.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-orange-50/40 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{items}{more}</p>
                        <p className="text-xs text-muted mt-0.5">{paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod} · {time}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(sale.total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Payment Breakdown */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}>
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Formas de Pagamento</h2>
                <p className="text-[11px] text-muted mt-0.5">mês atual</p>
              </div>
              {!data ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="skeleton h-3.5 w-1/3 rounded" />
                      <div className="skeleton h-3.5 w-1/4 rounded" />
                    </div>
                  ))}
                </div>
              ) : Object.keys(data.paymentBreakdown).length === 0 ? (
                <p className="text-sm text-muted text-center py-8">Sem dados</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {Object.entries(data.paymentBreakdown)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([pm, stats]) => {
                      const Icon = paymentIcons[pm] || Receipt;
                      const cls = paymentColors[pm] || "bg-gray-100 text-muted";
                      return (
                        <div key={pm} className="flex items-center gap-3 px-6 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{paymentMethodLabels[pm] || pm}</p>
                            <p className="text-[11px] text-muted">{stats.count} venda{stats.count !== 1 ? "s" : ""}</p>
                          </div>
                          <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(stats.total)}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}>
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Top Produtos</h2>
                <p className="text-[11px] text-muted mt-0.5">por receita gerada</p>
              </div>
              {!data ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="skeleton h-3.5 w-2/3 rounded" />
                      <div className="skeleton h-3.5 w-1/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : data.topProducts.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">Sem dados</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {data.topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 px-6 py-3">
                      <span className="text-[11px] font-bold text-muted w-4 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted">{p.qty} un. vendidas</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock */}
        {data && data.lowStockProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" />Estoque Baixo</h2>
              <Link href="/produtos" className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
                Gerenciar <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              {data.lowStockProducts.map((p) => {
                const pct = Math.min(100, (p.stock / p.minStock) * 100);
                return (
                  <div key={p.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground truncate flex-1">{p.name}</p>
                      <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 whitespace-nowrap">
                        {p.stock}/{p.minStock}
                      </span>
                    </div>
                    <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Acesso Rápido</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/pdv"
              className="group flex items-center gap-4 p-5 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl hover:from-orange-600 hover:to-orange-800 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                <ShoppingCart size={22} />
              </div>
              <div>
                <p className="font-semibold text-[15px]">Abrir PDV</p>
                <p className="text-xs text-white/65 mt-0.5">Iniciar nova venda</p>
              </div>
              <ArrowRight size={16} className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/produtos"
              className="group flex items-center gap-4 p-5 bg-white border border-border rounded-2xl hover:border-amber-200 hover:bg-amber-50/30 transition-all"
              style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors flex-shrink-0">
                <Package size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-[15px] text-foreground">Produtos</p>
                <p className="text-xs text-muted mt-0.5">Gerenciar estoque</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/receitas"
              className="group flex items-center gap-4 p-5 bg-white border border-border rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
              style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                <TrendingUp size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-[15px] text-foreground">Precificação</p>
                <p className="text-xs text-muted mt-0.5">Calcular custos</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-muted/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  title: string;
  value: string | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  sub?: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all"
      style={{ boxShadow: "0 1px 4px rgb(0 0 0 / 0.06)" }}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-4`}
        style={{ boxShadow: "0 2px 8px rgb(0 0 0 / 0.15)" }}>
        <Icon size={18} className="text-white" />
      </div>
      {value === null ? (
        <div className="space-y-2">
          <div className="skeleton h-7 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
          <p className="text-xs text-muted mt-1 truncate">{title}</p>
          {sub && <p className="text-[11px] text-muted/60 mt-0.5 truncate">{sub}</p>}
        </>
      )}
    </div>
  );
}
