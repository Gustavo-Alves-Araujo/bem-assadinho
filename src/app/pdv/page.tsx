"use client";

import AppLayout from "@/components/AppLayout";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  ArrowLeft,
  Percent,
  User,
  Store,
  RotateCcw,
  X,
  Phone,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  barcode: string | null;
  category: { id: string; name: string; color: string } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

type PaymentMethod = "cash" | "credit" | "debit";

const BILLS = [
  { value: 200, label: "R$200" },
  { value: 100, label: "R$100" },
  { value: 50, label: "R$50" },
  { value: 20, label: "R$20" },
  { value: 10, label: "R$10" },
  { value: 5, label: "R$5" },
  { value: 2, label: "R$2" },
];

const COINS = [
  { value: 1, label: "R$1" },
  { value: 0.5, label: "50¢" },
  { value: 0.25, label: "25¢" },
  { value: 0.1, label: "10¢" },
  { value: 0.05, label: "5¢" },
];

export default function PDVPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; total: number; change: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    const res = await fetch(`/api/products?${params}&limit=100`);
    const data = await res.json();
    setProducts(data.products);
  }, [search, selectedCategory]);

  const searchCustomers = async (q: string) => {
    if (!q.trim()) { setCustomerSuggestions([]); return; }
    const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=6`);
    const data = await res.json();
    setCustomerSuggestions(data.customers || []);
  };

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, loadProducts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F4" && cart.length > 0) {
        e.preventDefault();
        setShowPayment(true);
      }
      if (e.key === "Escape") {
        if (showPayment) setShowPayment(false);
        if (saleComplete) resetSale();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, showPayment, saleComplete]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Estoque insuficiente");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      if (product.stock <= 0) {
        toast.error("Produto sem estoque");
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            toast.error("Estoque insuficiente");
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const total = subtotal - discount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const change = Math.round((receivedAmount - total) * 100) / 100;

  const handlePayment = async () => {
    if (cart.length === 0) return;
    if (!customerSearch.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    if (paymentMethod === "cash" && receivedAmount < total) {
      toast.error("Valor recebido insuficiente");
      return;
    }
    setProcessing(true);

    try {
      // Resolve or create customer
      let customerId = selectedCustomer?.id || null;
      if (!customerId && customerSearch.trim()) {
        const cRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customerSearch.trim(), phone: customerPhone.trim() || null }),
        });
        const cData = await cRes.json();
        customerId = cData.id;
      }

      // Register sale directly (no external payment processor)
      const saleRes = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          discount,
          paymentMethod,
          customerId,
          status: "completed",
        }),
      });

      const sale = await saleRes.json();
      setLastSale({ id: sale.id, total: sale.total, change: paymentMethod === "cash" ? change : 0 });
      setSaleComplete(true);
      toast.success("Venda registrada!");
    } catch {
      toast.error("Erro ao registrar venda");
    }

    setProcessing(false);
  };

  const resetSale = () => {
    setCart([]);
    setDiscount(0);
    setCustomerSearch("");
    setCustomerPhone("");
    setSelectedCustomer(null);
    setCustomerSuggestions([]);
    setShowCustomerDrop(false);
    setReceivedAmount(0);
    setPaymentMethod("cash");
    setShowPayment(false);
    setSaleComplete(false);
    setLastSale(null);
    loadProducts();
  };

  // Sale Complete Screen
  if (saleComplete && lastSale) {
    return (
      <AppLayout>
      <div className="h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#c2410c)" }}>
        <div className="text-center text-white animate-scale-in max-w-sm px-6">
          <div className="w-28 h-28 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-white/20">
            <Check size={52} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Venda Registrada!</h1>
          <p className="text-xl text-white/75 mb-1">Total</p>
          <p className="text-5xl font-bold mb-4 tabular-nums">{formatCurrency(lastSale.total)}</p>
          {lastSale.change > 0 && (
            <div className="bg-white/20 rounded-2xl px-6 py-4 mb-6 border border-white/20">
              <p className="text-sm text-white/70 mb-1">Troco a devolver</p>
              <p className="text-4xl font-bold text-yellow-200 tabular-nums">{formatCurrency(lastSale.change)}</p>
            </div>
          )}
          <p className="text-xs text-white/40 mb-8 font-mono tracking-wider">#{lastSale.id.slice(0, 8).toUpperCase()}</p>
          <button
            onClick={resetSale}
            className="bg-white text-orange-700 px-10 py-3.5 rounded-2xl font-bold text-base hover:bg-white/95 transition-all shadow-xl shadow-black/10 hover:-translate-y-0.5"
          >
            Nova Venda (ESC)
          </button>
        </div>
      </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-[52px] bg-white border-b border-border flex items-center justify-between px-5 flex-shrink-0">
        <h1 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <Store size={15} className="text-primary" />
          PDV
        </h1>
        <div className="flex items-center gap-2">
          {["F2 Buscar", "F4 Pagar", "ESC Cancelar"].map((k) => (
            <span key={k} className="hidden sm:inline-flex text-[11px] font-medium text-muted bg-gray-100 rounded-md px-2.5 py-1">{k}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-border bg-card">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto ou digitar código de barras... (F2)"
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                autoFocus
              />
            </div>
            {/* Categories */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  !selectedCategory
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                )}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === c.id ? "" : c.id)
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    selectedCategory === c.id
                      ? "text-white"
                      : "bg-gray-100 text-muted hover:bg-gray-200"
                  )}
                  style={
                    selectedCategory === c.id
                      ? { backgroundColor: c.color }
                      : undefined
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className={cn(
                    "bg-white border border-border rounded-xl p-4 text-left transition-all duration-150 group relative overflow-hidden",
                    p.stock <= 0
                      ? "opacity-45 cursor-not-allowed"
                      : "hover:border-primary/40 hover:shadow-md hover:-translate-y-px active:scale-[0.98] active:shadow-none cursor-pointer"
                  )}
                  style={{ boxShadow: "0 1px 3px rgb(0 0 0 / 0.05)" }}
                >
                  {/* Category color strip */}
                  {p.category && (
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 opacity-70"
                      style={{ backgroundColor: p.category.color }}
                    />
                  )}
                  <div className="flex items-start justify-between mb-3">
                    {p.category ? (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold leading-none"
                        style={{ backgroundColor: p.category.color }}
                      >
                        {p.category.name}
                      </span>
                    ) : <span />}
                    <span className={cn(
                      "text-[10px] font-medium tabular-nums",
                      p.stock === 0 ? "text-red-500" : p.stock <= 3 ? "text-amber-500" : "text-muted/70"
                    )}>
                      {p.stock} {p.unit}
                    </span>
                  </div>
                  <h3 className="font-medium text-[13px] text-foreground line-clamp-2 leading-snug mb-2.5">
                    {p.name}
                  </h3>
                  <p className="text-[17px] font-bold text-primary tabular-nums">
                    {formatCurrency(p.price)}
                  </p>
                </button>
              ))}
            </div>
            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search size={36} className="text-muted/20 mb-3" />
                <p className="text-sm font-medium text-muted">Nenhum produto encontrado</p>
                <p className="text-xs text-muted/50 mt-1">Tente outro termo de busca</p>
              </div>
            )}
          </div>
        </div>

        {/* Right - Cart */}
        <div className="w-[400px] bg-card border-l border-border flex flex-col flex-shrink-0">
          {!showPayment ? (
            <>
              {/* Cart Header */}
              <div className="px-4 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={17} className="text-primary" />
                    <h2 className="font-semibold text-[14px] text-foreground">Carrinho</h2>
                  </div>
                  <span className="text-xs font-medium text-muted bg-gray-100 px-2.5 py-1 rounded-full">
                    {totalItems} {totalItems === 1 ? "item" : "itens"}
                  </span>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart
                      size={40}
                      className="mx-auto text-muted/20 mb-3"
                    />
                    <p className="text-sm text-muted">Carrinho vazio</p>
                    <p className="text-xs text-muted/60 mt-1">
                      Clique em um produto para adicionar
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 py-3 border-b border-border last:border-0 animate-fade-in"
                    >
                      {/* Category color dot */}
                      {item.product.category && (
                        <div
                          className="w-1 h-10 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.product.category.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted mt-0.5">{formatCurrency(item.product.price)} / {item.product.unit}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-[13px] font-bold w-7 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-bold text-foreground tabular-nums">{formatCurrency(item.product.price * item.quantity)}</p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-red-400 hover:text-red-600 transition-colors mt-0.5"
                        >
                          remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              <div className="border-t border-border p-4 space-y-3 flex-shrink-0">
                {/* Discount */}
                <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                  <Percent size={13} className="text-muted flex-shrink-0" />
                  <input
                    type="number"
                    step="0.01"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="Desconto (R$)"
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted/40"
                  />
                </div>

                <div className="bg-orange-50 rounded-xl px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>Desconto</span>
                      <span className="tabular-nums">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[18px] font-bold text-foreground pt-1.5 border-t border-orange-200">
                    <span>Total</span>
                    <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPayment(true)}
                  disabled={cart.length === 0}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ boxShadow: cart.length > 0 ? "0 4px 14px rgb(249 115 22 / 0.4)" : undefined }}
                >
                  <CreditCard size={17} />
                  Registrar Venda (F4)
                </button>
              </div>
            </>
          ) : (
            /* Payment Panel */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-orange-50 rounded-lg transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="font-semibold text-foreground">Registrar Venda</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Total display */}
                <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 8px 24px rgb(249 115 22/0.35)" }}>
                  <p className="text-sm text-white/75 mb-1">Total</p>
                  <p className="text-5xl font-bold text-white tabular-nums">{formatCurrency(total)}</p>
                </div>

                {/* Customer */}
                <div className="relative">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                    <User size={14} /> Cliente <span className="text-red-500">*</span>
                  </label>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between px-3 py-2.5 border-2 border-primary/30 bg-primary/5 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selectedCustomer.name}</p>
                        {selectedCustomer.phone && <p className="text-xs text-muted flex items-center gap-1"><Phone size={10} />{selectedCustomer.phone}</p>}
                      </div>
                      <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setCustomerPhone(""); }} className="p-1 hover:bg-red-50 rounded-lg text-muted hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDrop(true);
                            searchCustomers(e.target.value);
                          }}
                          onFocus={() => { if (customerSearch) setShowCustomerDrop(true); }}
                          onBlur={() => setTimeout(() => setShowCustomerDrop(false), 150)}
                          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Nome do cliente (obrigatório)"
                          autoFocus
                        />
                      </div>
                      {showCustomerDrop && customerSearch.trim() && (
                        <div className="absolute z-50 left-0 right-0 bg-white border border-border rounded-xl shadow-xl mt-1 overflow-hidden">
                          {customerSuggestions.map((c) => (
                            <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors flex items-center justify-between group"
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDrop(false); }}>
                              <span className="text-sm font-medium">{c.name}</span>
                              {c.phone && <span className="text-xs text-muted group-hover:text-orange-600 flex items-center gap-1"><Phone size={10} />{c.phone}</span>}
                            </button>
                          ))}
                          <button className="w-full text-left px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-sm font-semibold text-primary transition-colors flex items-center gap-2"
                            onClick={() => { setShowCustomerDrop(false); }}>
                            <Plus size={14} /> Criar "{customerSearch.trim()}" como novo cliente
                          </button>
                        </div>
                      )}
                      {!selectedCustomer && (
                        <div className="mt-2">
                          <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              placeholder="Telefone (opcional)"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Forma de Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { method: "cash" as const, label: "Dinheiro", icon: Banknote },
                      { method: "debit" as const, label: "Débito", icon: Smartphone },
                      { method: "credit" as const, label: "Crédito", icon: CreditCard },
                    ]).map((pm) => (
                      <button key={pm.method} onClick={() => { setPaymentMethod(pm.method); setReceivedAmount(0); }}
                        className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold",
                          paymentMethod === pm.method ? "border-primary bg-primary/5 text-primary" : "border-border text-muted hover:border-orange-200")}>
                        <pm.icon size={20} />{pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Troco UI */}
                {paymentMethod === "cash" && (
                  <div className="space-y-3">
                    <div className={cn("rounded-xl p-4 text-center border-2 transition-all",
                      receivedAmount === 0 ? "border-dashed border-border bg-orange-50/50" :
                      receivedAmount >= total ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50")}>
                      {receivedAmount === 0 ? (
                        <p className="text-sm text-muted">Toque nas notas e moedas recebidas</p>
                      ) : receivedAmount >= total ? (
                        <>
                          <p className="text-xs text-emerald-600 font-medium mb-1">Troco a devolver</p>
                          <p className="text-3xl font-bold text-emerald-600 tabular-nums">{formatCurrency(change)}</p>
                          <p className="text-xs text-emerald-500 mt-1">Recebido: {formatCurrency(receivedAmount)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-amber-600 font-medium mb-1">Falta receber</p>
                          <p className="text-3xl font-bold text-amber-600 tabular-nums">{formatCurrency(total - receivedAmount)}</p>
                          <p className="text-xs text-amber-500 mt-1">Recebido: {formatCurrency(receivedAmount)}</p>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">Notas</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {BILLS.map((bill) => (
                          <button key={bill.value} onClick={() => setReceivedAmount((v) => Math.round((v + bill.value) * 100) / 100)}
                            className="py-2.5 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200 rounded-lg text-xs font-bold text-amber-800 transition-all">
                            {bill.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">Moedas</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {COINS.map((coin) => (
                          <button key={coin.value} onClick={() => setReceivedAmount((v) => Math.round((v + coin.value) * 100) / 100)}
                            className="py-2.5 bg-stone-50 hover:bg-stone-100 active:scale-95 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-700 transition-all">
                            {coin.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {receivedAmount > 0 && (
                      <button onClick={() => setReceivedAmount(0)} className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition-colors">
                        <RotateCcw size={12} /> Zerar valor recebido
                      </button>
                    )}
                  </div>
                )}

                {(paymentMethod === "credit" || paymentMethod === "debit") && (
                  <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                    <Smartphone size={28} className="mx-auto text-orange-400 mb-2" />
                    <p className="text-sm font-semibold text-orange-800">
                      {paymentMethod === "credit" ? "Cartão de Crédito" : "Cartão de Débito"}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Registro para controle interno</p>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="p-4 border-t border-border space-y-2">
                <button onClick={handlePayment}
                  disabled={processing || (paymentMethod === "cash" && receivedAmount < total)}
                  className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-semibold text-base hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  {processing ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registrando...</>
                  ) : (
                    <><Check size={20} />Registrar — {formatCurrency(total)}</>
                  )}
                </button>
                {paymentMethod === "cash" && receivedAmount > 0 && receivedAmount < total && (
                  <p className="text-center text-xs text-amber-600">Falta {formatCurrency(total - receivedAmount)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
