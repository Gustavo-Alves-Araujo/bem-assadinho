"use client";

import AppLayout from "@/components/AppLayout";
import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Search,
  Phone,
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
  X,
  Banknote,
  CreditCard,
  Smartphone,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: SaleItem[];
}

interface CustomerDetail {
  customer: Customer;
  sales: Sale[];
  totalSpent: number;
  totalOrders: number;
}

const paymentIcon = (method: string) => {
  if (method === "cash") return <Banknote size={13} className="text-amber-600" />;
  if (method === "credit") return <CreditCard size={13} className="text-blue-500" />;
  return <Smartphone size={13} className="text-purple-500" />;
};

const paymentLabel = (method: string) => {
  if (method === "cash") return "Dinheiro";
  if (method === "credit") return "Crédito";
  return "Débito";
};

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 250);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const openCustomer = async (id: string) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) { toast.error("Erro ao carregar cliente"); return; }
      setSelected(await res.json());
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <AppLayout>
    <div className="flex h-full overflow-hidden">
      {/* Left column — list */}
      <div className="w-[380px] flex flex-col border-r border-border bg-card flex-shrink-0">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary" />
            <h1 className="text-lg font-bold text-foreground">Clientes</h1>
            <span className="ml-auto text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">{total}</span>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && customers.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted text-sm">Carregando...</div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Users size={36} className="text-muted/20 mb-3" />
              <p className="text-sm font-medium text-muted">Nenhum cliente encontrado</p>
              <p className="text-xs text-muted/50 mt-1">Clientes são criados ao registrar uma venda</p>
            </div>
          ) : (
            customers.map((c) => (
              <button
                key={c.id}
                onClick={() => openCustomer(c.id)}
                className={`w-full text-left px-5 py-3.5 border-b border-border hover:bg-orange-50 transition-colors flex items-center gap-3 group ${selected?.customer.id === c.id ? "bg-orange-50 border-l-2 border-l-primary" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Phone size={10} />{c.phone}
                    </p>
                  )}
                </div>
                <ChevronRight size={15} className="text-muted/30 group-hover:text-muted transition-colors flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right column — detail */}
      <div className="flex-1 overflow-y-auto bg-background">
        {loadingDetail && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loadingDetail && !selected && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <Users size={48} className="text-muted/15 mb-4" />
            <p className="text-base font-medium text-muted">Selecione um cliente</p>
            <p className="text-sm text-muted/50 mt-1">para ver o histórico de compras</p>
          </div>
        )}

        {!loadingDetail && selected && (
          <div className="max-w-2xl mx-auto px-6 py-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary">{selected.customer.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{selected.customer.name}</h2>
                {selected.customer.phone && (
                  <p className="text-sm text-muted flex items-center gap-1.5 mt-1">
                    <Phone size={13} />{selected.customer.phone}
                  </p>
                )}
                <p className="text-xs text-muted/50 mt-1">
                  Cliente desde {new Date(selected.customer.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(selected.totalSpent)}</p>
                <p className="text-xs text-muted mt-1">Total gasto</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{selected.totalOrders}</p>
                <p className="text-xs text-muted mt-1">Pedidos</p>
              </div>
              <div className="bg-white border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {selected.totalOrders > 0 ? formatCurrency(selected.totalSpent / selected.totalOrders) : "—"}
                </p>
                <p className="text-xs text-muted mt-1">Ticket médio</p>
              </div>
            </div>

            {/* Purchase history */}
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShoppingBag size={15} className="text-primary" />
              Histórico de compras
            </h3>

            {selected.sales.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <ShoppingBag size={28} className="mx-auto text-muted/20 mb-2" />
                <p className="text-sm text-muted">Nenhuma compra registrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selected.sales.map((sale) => (
                  <div key={sale.id} className="bg-white border border-border rounded-xl overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-orange-50 transition-colors"
                      onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        {paymentIcon(sale.paymentMethod)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(sale.total)}</span>
                          <span className="text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">{paymentLabel(sale.paymentMethod)}</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                          <Calendar size={10} />{formatDate(sale.createdAt)}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted/40">#{sale.id.slice(0, 8).toUpperCase()}</span>
                      <ChevronRight size={14} className={`text-muted transition-transform ${expandedSale === sale.id ? "rotate-90" : ""}`} />
                    </button>
                    {expandedSale === sale.id && (
                      <div className="border-t border-border bg-orange-50/30 px-4 py-3">
                        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Itens</p>
                        <div className="space-y-1.5">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{item.productName}</span>
                              <div className="flex items-center gap-3 text-muted text-xs">
                                <span>{item.quantity}× {formatCurrency(item.unitPrice)}</span>
                                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(item.quantity * item.unitPrice)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
