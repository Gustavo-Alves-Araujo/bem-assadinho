"use client";

import AppLayout from "@/components/AppLayout";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  BarChart3,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  color: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string | null;
  active: boolean;
  categoryId: string | null;
  category: Category | null;
}

const emptyProduct = {
  name: "",
  description: "",
  barcode: "",
  price: "",
  cost: "",
  stock: "",
  minStock: "5",
  unit: "un",
  categoryId: "",
  imageUrl: "",
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [stockForm, setStockForm] = useState({ type: "in", quantity: "", reason: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#6366f1" });
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products);
  }, [search, selectedCategory]);

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, loadProducts]);

  const openCreateProduct = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      barcode: p.barcode || "",
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      minStock: String(p.minStock),
      unit: p.unit,
      categoryId: p.categoryId || "",
      imageUrl: p.imageUrl || "",
    });
    setShowProductModal(true);
  };

  const openStockModal = (p: Product) => {
    setStockProduct(p);
    setStockForm({ type: "in", quantity: "", reason: "" });
    setShowStockModal(true);
  };

  const handleSaveProduct = async () => {
    if (!form.name || !form.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }
    setLoading(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
        setShowProductModal(false);
        loadProducts();
      } else {
        toast.error("Erro ao salvar produto");
      }
    } catch {
      toast.error("Erro ao salvar produto");
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Deseja desativar este produto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    toast.success("Produto desativado");
    loadProducts();
  };

  const handleStockMovement = async () => {
    if (!stockForm.quantity || !stockProduct) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${stockProduct.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: stockForm.type,
          quantity: parseInt(stockForm.quantity),
          reason: stockForm.reason,
        }),
      });
      if (res.ok) {
        toast.success("Estoque atualizado!");
        setShowStockModal(false);
        loadProducts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar estoque");
      }
    } catch {
      toast.error("Erro ao atualizar estoque");
    }
    setLoading(false);
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    toast.success("Categoria criada!");
    setShowCategoryModal(false);
    setCategoryForm({ name: "", color: "#6366f1" });
    loadCategories();
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
            <p className="text-sm text-muted mt-0.5">Gerencie seu catálogo e estoque</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-white rounded-xl text-sm font-medium text-foreground hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Filter size={15} />
              Categoria
            </button>
            <button
              onClick={openCreateProduct}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
              style={{ boxShadow: "0 2px 8px rgb(99 102 241 / 0.3)" }}
            >
              <Plus size={15} />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setSelectedCategory("")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !selectedCategory ? "bg-primary text-white shadow-sm" : "bg-white border border-border text-muted hover:border-primary/40 hover:text-primary"
              }`}
            >
              Todos
              <span className={`text-[10px] font-bold ${!selectedCategory ? "text-white/70" : "text-muted"}`}>{products.length}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.id ? "" : c.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === c.id ? "text-white shadow-sm" : "bg-white border border-border text-muted hover:border-gray-300"
                }`}
                style={selectedCategory === c.id ? { backgroundColor: c.color } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedCategory === c.id ? "rgba(255,255,255,0.5)" : c.color }}
                />
                {c.name}
                {c._count && <span className={`text-[10px] ${selectedCategory === c.id ? "text-white/70" : "text-muted"}`}>{c._count.products}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome ou código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-shadow"
            />
          </div>
          {products.length > 0 && (
            <span className="self-center text-xs text-muted whitespace-nowrap">
              {products.length} produto{products.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => {
            const margin = p.cost > 0 ? (((p.price - p.cost) / p.price) * 100) : null;
            const stockPct = Math.min(100, (p.stock / Math.max(p.minStock, 1)) * 100);
            const stockStatus = p.stock === 0 ? "empty" : p.stock <= p.minStock ? "low" : "ok";
            const stockColors = { empty: "bg-red-500", low: "bg-amber-500", ok: "bg-emerald-500" };
            const stockTrack = { empty: "bg-red-100", low: "bg-amber-100", ok: "bg-emerald-100" };

            return (
              <div
                key={p.id}
                className="bg-white border border-border rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                style={{ boxShadow: "0 1px 3px rgb(0 0 0 / 0.05)" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[15px] text-foreground">{p.name}</h3>
                      {p.category && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: p.category.color }}
                        >
                          {p.category.name}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-1">{p.description}</p>
                    )}
                    {p.barcode && (
                      <p className="text-[10px] text-muted/60 mt-0.5 font-mono">{p.barcode}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={() => openEditProduct(p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-muted hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"
                      title="Desativar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Price row */}
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(p.price)}</p>
                    {p.cost > 0 && (
                      <p className="text-xs text-muted mt-0.5">
                        Custo {formatCurrency(p.cost)}
                        {margin !== null && (
                          <span className="ml-2 text-emerald-600 font-semibold">{margin.toFixed(0)}% margem</span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openStockModal(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      stockStatus !== "ok"
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <Package size={13} />
                    {p.stock} {p.unit}
                  </button>
                </div>

                {/* Stock bar */}
                <div className="mt-3">
                  <div className={`h-1 ${stockTrack[stockStatus]} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${stockColors[stockStatus]} rounded-full transition-all`}
                      style={{ width: `${stockPct}%` }}
                    />
                  </div>
                  {stockStatus !== "ok" && (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">
                      {stockStatus === "empty" ? "Sem estoque" : `Abaixo do mínimo (${p.minStock} ${p.unit})`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Package size={28} className="text-muted/40" />
            </div>
            <p className="text-base font-semibold text-muted">Nenhum produto encontrado</p>
            <p className="text-sm text-muted/60 mt-1 mb-5">Adicione produtos ao seu catálogo</p>
            <button
              onClick={openCreateProduct}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
            >
              <Plus size={15} />
              Criar produto
            </button>
          </div>
        )}

        {/* Product Modal */}
        <Modal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          title={editingProduct ? "Editar Produto" : "Novo Produto"}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nome *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nome do produto"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Descrição
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Descrição opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) =>
                    setForm({ ...form, barcode: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="EAN-13"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Categoria
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Preço de Venda *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Custo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Unidade
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pct">Pacote (pct)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : editingProduct ? "Atualizar" : "Criar Produto"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Stock Modal */}
        <Modal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          title={`Movimentar Estoque - ${stockProduct?.name || ""}`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-muted">Estoque Atual</span>
              <span className="text-lg font-bold text-foreground">
                {stockProduct?.stock} {stockProduct?.unit}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tipo de Movimentação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "in", label: "Entrada", icon: ArrowUpCircle, color: "emerald" },
                  { value: "out", label: "Saída", icon: ArrowDownCircle, color: "red" },
                  { value: "adjustment", label: "Ajuste", icon: BarChart3, color: "blue" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setStockForm({ ...stockForm, type: t.value })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      stockForm.type === t.value
                        ? `border-${t.color}-500 bg-${t.color}-50 text-${t.color}-600`
                        : "border-border text-muted hover:border-gray-300"
                    }`}
                  >
                    <t.icon size={20} />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {stockForm.type === "adjustment" ? "Novo Estoque" : "Quantidade"}
              </label>
              <input
                type="number"
                value={stockForm.quantity}
                onChange={(e) =>
                  setStockForm({ ...stockForm, quantity: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={stockForm.reason}
                onChange={(e) =>
                  setStockForm({ ...stockForm, reason: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: Compra de fornecedor"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStockMovement}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title="Nova Categoria"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nome
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Cor
              </label>
              <div className="flex gap-2">
                {["#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#ec4899", "#8b5cf6", "#f97316"].map(
                  (color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setCategoryForm({ ...categoryForm, color })
                      }
                      className={`w-8 h-8 rounded-full transition-all ${
                        categoryForm.color === color
                          ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
