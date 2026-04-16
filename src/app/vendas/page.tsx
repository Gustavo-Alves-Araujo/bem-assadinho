"use client";

import AppLayout from "@/components/AppLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SaleItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  product: { name: string };
}

interface Sale {
  id: string;
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  status: string;
  customerName: string | null;
  transactionId: string | null;
  createdAt: string;
  items: SaleItem[];
}

const paymentIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cash: Banknote,
  credit: CreditCard,
  debit: Smartphone,
  pix: QrCode,
};

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  pix: "PIX",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  completed: { label: "Concluída", color: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelada", color: "bg-red-50 text-red-600" },
  pending: { label: "Pendente", color: "bg-amber-50 text-amber-600" },
};

export default function VendasPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  const loadSales = async () => {
    const res = await fetch(`/api/sales?page=${page}&limit=20`);
    const data = await res.json();
    setSales(data.sales);
    setTotal(data.total);
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin") !== "1") {
      router.replace("/pdv");
      return;
    }
    setAuthed(true);
    loadSales();
  }, [page]);

  if (!authed) return null;

  const todaySales = sales.filter((s) => {
    const today = new Date();
    const saleDate = new Date(s.createdAt);
    return (
      saleDate.getDate() === today.getDate() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getFullYear() === today.getFullYear() &&
      s.status === "completed"
    );
  });

  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vendas</h1>
          <p className="text-sm text-muted mt-0.5">Histórico de todas as vendas realizadas</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          <div className="bg-white rounded-2xl border border-border p-5" style={{ boxShadow: "0 1px 4px rgb(0 0 0/0.05)" }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-3"
              style={{ boxShadow: "0 2px 8px rgb(0 0 0/0.12)" }}>
              <DollarSign size={18} className="text-white" />
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(todayTotal)}</p>
            <p className="text-xs text-muted mt-0.5">Vendas Hoje</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5" style={{ boxShadow: "0 1px 4px rgb(0 0 0/0.05)" }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-3"
              style={{ boxShadow: "0 2px 8px rgb(0 0 0/0.12)" }}>
              <ShoppingBag size={18} className="text-white" />
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{todaySales.length}</p>
            <p className="text-xs text-muted mt-0.5">Pedidos Hoje</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5" style={{ boxShadow: "0 1px 4px rgb(0 0 0/0.05)" }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-3"
              style={{ boxShadow: "0 2px 8px rgb(0 0 0/0.12)" }}>
              <Calendar size={18} className="text-white" />
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{total}</p>
            <p className="text-xs text-muted mt-0.5">Total Registradas</p>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 1px 4px rgb(0 0 0/0.05)" }}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Histórico de Vendas</h2>
            {total > 0 && <span className="text-xs text-muted bg-gray-100 px-2.5 py-1 rounded-full font-medium">{total} venda{total !== 1 ? "s" : ""}</span>}
          </div>
          <div className="divide-y divide-border/60">
            {sales.map((sale) => {
              const PaymentIcon = paymentIcons[sale.paymentMethod] || Receipt;
              const isExpanded = expandedSale === sale.id;
              const statusInfo = statusLabels[sale.status] || statusLabels.completed;
              const pmLabel = paymentLabels[sale.paymentMethod] || sale.paymentMethod;
              const pmColors: Record<string, string> = {
                cash: "bg-emerald-100 text-emerald-600",
                credit: "bg-blue-100 text-blue-600",
                debit: "bg-violet-100 text-violet-600",
                pix: "bg-teal-100 text-teal-600",
              };
              const pmColor = pmColors[sale.paymentMethod] || "bg-gray-100 text-muted";

              return (
                <div key={sale.id}>
                  <button
                    onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors text-left"
                  >
                    {/* Payment icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pmColor}`}>
                      <PaymentIcon size={17} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sale.items.slice(0, 2).map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                        {sale.items.length > 2 && (
                          <span className="text-muted"> +{sale.items.length - 2}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">{formatDate(sale.createdAt)}</span>
                        <span className="text-muted/30">•</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${pmColor}`}>{pmLabel}</span>
                        {sale.customerName && (
                          <>
                            <span className="text-muted/30">•</span>
                            <span className="text-xs text-muted">{sale.customerName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[15px] font-bold text-foreground tabular-nums">
                        {formatCurrency(sale.total)}
                      </span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isExpanded ? "bg-primary/10 text-primary" : "bg-gray-100 text-muted"}`}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 animate-slide-up">
                      <div className="bg-slate-50 rounded-xl overflow-hidden border border-border/60">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60">
                              <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wide">Produto</th>
                              <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wide">Qtd</th>
                              <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wide">Preço</th>
                              <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted uppercase tracking-wide">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.items.map((item) => (
                              <tr key={item.id} className="border-b border-border/40 last:border-none hover:bg-white/60 transition-colors">
                                <td className="py-2.5 px-4 font-medium text-foreground">{item.product.name}</td>
                                <td className="py-2.5 px-4 text-right text-muted tabular-nums">{item.quantity}</td>
                                <td className="py-2.5 px-4 text-right text-muted tabular-nums">{formatCurrency(item.price)}</td>
                                <td className="py-2.5 px-4 text-right font-semibold tabular-nums">{formatCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-4 py-3 border-t border-border/60 space-y-1.5">
                          {sale.discount > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted">Subtotal</span>
                              <span className="tabular-nums">{formatCurrency(sale.subtotal)}</span>
                            </div>
                          )}
                          {sale.discount > 0 && (
                            <div className="flex justify-between text-xs text-red-500">
                              <span>Desconto</span>
                              <span className="tabular-nums">-{formatCurrency(sale.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-foreground">
                            <span>Total</span>
                            <span className="text-primary tabular-nums">{formatCurrency(sale.total)}</span>
                          </div>
                          {sale.transactionId && (
                            <p className="text-[10px] text-muted/50 mt-2 font-mono pt-1.5 border-t border-border/40">ID: {sale.transactionId}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Receipt size={24} className="text-muted/40" />
              </div>
              <p className="text-sm font-medium text-muted">Nenhuma venda registrada</p>
            </div>
          )}

          {total > 20 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 border border-border rounded-xl text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 20 >= total}
                  className="px-4 py-1.5 border border-border rounded-xl text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
