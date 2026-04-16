"use client";

import AppLayout from "@/components/AppLayout";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Calculator,
  ChefHat,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  Edit2,
  BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CatalogProduct {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

interface Ingredient {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

interface RecipeVersion {
  id: string;
  version: number;
  notes: string;
  totalCost: number;
  costPerUnit: number;
  createdAt: string;
  ingredients: Ingredient[];
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  yield: number;
  yieldUnit: string;
  sellingPrice: number;
  createdAt: string;
  updatedAt: string;
  versions: RecipeVersion[];
}

const emptyIngredient: Ingredient = {
  name: "",
  quantity: 0,
  unit: "kg",
  pricePerUnit: 0,
  totalPrice: 0,
};

export default function ReceitasPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    yield: "1",
    yieldUnit: "un",
    sellingPrice: "",
    notes: "",
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { ...emptyIngredient },
  ]);

  const loadRecipes = async () => {
    const res = await fetch("/api/recipes");
    setRecipes(await res.json());
  };

  const loadCatalog = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setCatalogProducts((data.products || []).map((p: { id: string; name: string; unit: string; cost: number }) => ({ id: p.id, name: p.name, unit: p.unit, cost: p.cost })));
  };

  useEffect(() => {
    loadRecipes();
    loadCatalog();
  }, []);

  const openCreateRecipe = () => {
    setEditingRecipe(null);
    setForm({
      name: "",
      description: "",
      yield: "1",
      yieldUnit: "un",
      sellingPrice: "",
      notes: "",
    });
    setIngredients([{ ...emptyIngredient }]);
    setShowRecipeModal(true);
  };

  const openNewVersion = async (recipe: Recipe) => {
    // Load full recipe with all versions
    const res = await fetch(`/api/recipes/${recipe.id}`);
    const fullRecipe = await res.json();
    setSelectedRecipe(fullRecipe);

    // Pre-fill with latest version ingredients
    const latestVersion = fullRecipe.versions[0];
    if (latestVersion) {
      setIngredients(
        latestVersion.ingredients.map((ing: Ingredient) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          pricePerUnit: ing.pricePerUnit,
          totalPrice: ing.totalPrice,
        }))
      );
    }
    setForm({
      ...form,
      notes: "",
    });
    setShowVersionModal(true);
  };

  const openDetail = async (recipe: Recipe) => {
    const res = await fetch(`/api/recipes/${recipe.id}`);
    const fullRecipe = await res.json();
    setSelectedRecipe(fullRecipe);
    setShowDetailModal(true);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { ...emptyIngredient }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const updated = [...ingredients];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    // Auto-calculate totalPrice
    updated[index].totalPrice =
      updated[index].quantity * updated[index].pricePerUnit;
    setIngredients(updated);
  };

  const totalCost = ingredients.reduce((sum, ing) => sum + ing.totalPrice, 0);
  const costPerUnit = totalCost / (parseFloat(form.yield) || 1);
  const sellingPrice = parseFloat(form.sellingPrice) || 0;
  const profit = sellingPrice - costPerUnit;
  const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const handleSaveRecipe = async () => {
    if (!form.name || ingredients.some((i) => !i.name)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ingredients: ingredients.map((ing) => ({
            name: ing.name,
            quantity: parseFloat(String(ing.quantity)),
            unit: ing.unit,
            pricePerUnit: parseFloat(String(ing.pricePerUnit)),
            totalPrice: parseFloat(String(ing.totalPrice)),
          })),
        }),
      });
      if (res.ok) {
        toast.success("Receita criada!");
        setShowRecipeModal(false);
        loadRecipes();
      }
    } catch {
      toast.error("Erro ao salvar receita");
    }
    setLoading(false);
  };

  const handleSaveVersion = async () => {
    if (!selectedRecipe) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/recipes/${selectedRecipe.id}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: form.notes || undefined,
            ingredients: ingredients.map((ing) => ({
              name: ing.name,
              quantity: parseFloat(String(ing.quantity)),
              unit: ing.unit,
              pricePerUnit: parseFloat(String(ing.pricePerUnit)),
              totalPrice: parseFloat(String(ing.totalPrice)),
            })),
          }),
        }
      );
      if (res.ok) {
        toast.success("Nova versão criada!");
        setShowVersionModal(false);
        loadRecipes();
      }
    } catch {
      toast.error("Erro ao criar versão");
    }
    setLoading(false);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Deseja excluir esta receita?")) return;
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    toast.success("Receita excluída");
    loadRecipes();
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Precificação</h1>
            <p className="text-sm text-muted mt-0.5">Controle os custos das suas receitas e defina preços com precisão</p>
          </div>
          <button
            onClick={openCreateRecipe}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
            style={{ boxShadow: "0 2px 8px rgb(99 102 241 / 0.3)" }}
          >
            <Plus size={16} />
            Nova Receita
          </button>
        </div>

        {/* Recipes List */}
        <div className="space-y-4">
          {recipes.map((recipe) => {
            const latestVersion = recipe.versions[0];
            const recipeProfit = latestVersion
              ? recipe.sellingPrice - latestVersion.costPerUnit
              : 0;
            const recipeMargin =
              recipe.sellingPrice > 0
                ? (recipeProfit / recipe.sellingPrice) * 100
                : 0;
            const isExpanded = expandedRecipe === recipe.id;

            return (
              <div
                key={recipe.id}
                className="bg-white border border-border rounded-2xl overflow-hidden transition-all hover:border-slate-300"
                style={{ boxShadow: "0 1px 4px rgb(0 0 0/0.05)" }}
              >
                {/* Recipe Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center flex-shrink-0"
                        style={{ boxShadow: "0 2px 6px rgb(0 0 0/0.12)" }}>
                        <ChefHat size={18} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground leading-tight">{recipe.name}</h3>
                        <p className="text-xs text-muted mt-0.5">
                          Rendimento: <span className="font-medium text-foreground/70">{recipe.yield} {recipe.yieldUnit}</span>
                          {latestVersion && (
                            <> &middot; <span className="font-medium">v{latestVersion.version}</span> &middot; {latestVersion.ingredients.length} ingredientes</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openNewVersion(recipe)}
                        className="px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Copy size={11} />
                        Nova Versão
                      </button>
                      <button
                        onClick={() => openDetail(recipe)}
                        className="px-2.5 py-1.5 text-xs font-medium text-muted bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <BookOpen size={11} />
                        Detalhes
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-400 transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-border/60">
                      <p className="text-[10px] text-muted uppercase tracking-wide font-medium">Custo Total</p>
                      <p className="text-sm font-bold text-foreground mt-1 tabular-nums">
                        {latestVersion ? formatCurrency(latestVersion.totalCost) : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-border/60">
                      <p className="text-[10px] text-muted uppercase tracking-wide font-medium">Custo/Un</p>
                      <p className="text-sm font-bold text-foreground mt-1 tabular-nums">
                        {latestVersion ? formatCurrency(latestVersion.costPerUnit) : "—"}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wide font-medium">Preço Venda</p>
                      <p className="text-sm font-bold text-primary mt-1 tabular-nums">
                        {formatCurrency(recipe.sellingPrice)}
                      </p>
                    </div>
                    <div className={`rounded-xl p-3 border ${recipeProfit >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                      <p className={`text-[10px] uppercase tracking-wide font-medium ${recipeProfit >= 0 ? "text-emerald-500" : "text-red-400"}`}>Lucro/Un</p>
                      <p className={`text-sm font-bold mt-1 tabular-nums ${recipeProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatCurrency(recipeProfit)}
                      </p>
                    </div>
                    <div className={`rounded-xl p-3 border ${recipeMargin >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                      <p className={`text-[10px] uppercase tracking-wide font-medium ${recipeMargin >= 0 ? "text-emerald-500" : "text-red-400"}`}>Margem</p>
                      <div className="flex items-center gap-1 mt-1">
                        {recipeMargin >= 0 ? (
                          <TrendingUp size={13} className="text-emerald-500" />
                        ) : (
                          <TrendingDown size={13} className="text-red-500" />
                        )}
                        <p className={`text-sm font-bold tabular-nums ${recipeMargin >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {recipeMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  {latestVersion && (
                    <button
                      onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium mt-3 hover:text-primary-dark transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? "Ocultar ingredientes" : "Ver ingredientes"}
                    </button>
                  )}
                </div>

                {/* Expanded Ingredients */}
                {isExpanded && latestVersion && (
                  <div className="border-t border-border animate-slide-up">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border/60">
                          <th className="text-left py-2.5 px-5 text-xs font-semibold text-muted uppercase tracking-wide">Ingrediente</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted uppercase tracking-wide">Qtd</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted uppercase tracking-wide">Preço/Un</th>
                          <th className="text-right py-2.5 px-5 text-xs font-semibold text-muted uppercase tracking-wide">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestVersion.ingredients.map((ing: Ingredient, idx: number) => (
                          <tr key={idx} className="border-b border-border/40 last:border-none hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-5 font-medium text-foreground">{ing.name}</td>
                            <td className="py-2.5 px-5 text-right text-muted tabular-nums">{ing.quantity} {ing.unit}</td>
                            <td className="py-2.5 px-5 text-right text-muted tabular-nums">{formatCurrency(ing.pricePerUnit)}</td>
                            <td className="py-2.5 px-5 text-right font-semibold tabular-nums">{formatCurrency(ing.totalPrice)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/80 border-t border-border">
                          <td className="py-3 px-5 text-sm font-bold text-foreground" colSpan={3}>Total</td>
                          <td className="py-3 px-5 text-right text-sm font-bold text-primary tabular-nums">
                            {formatCurrency(latestVersion.totalCost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-border" style={{ boxShadow: "0 1px 4px rgb(0 0 0/0.05)" }}>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Calculator size={24} className="text-muted/40" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nenhuma receita cadastrada</p>
            <p className="text-xs text-muted mt-1">Crie sua primeira receita para controlar custos</p>
            <button
              onClick={openCreateRecipe}
              className="mt-5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
              style={{ boxShadow: "0 2px 8px rgb(99 102 241 / 0.25)" }}
            >
              Criar primeira receita
            </button>
          </div>
        )}

        {/* Create Recipe Modal */}
        <Modal
          isOpen={showRecipeModal}
          onClose={() => setShowRecipeModal(false)}
          title="Nova Receita"
          size="xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nome da Receita *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ex: Bolo de Chocolate"
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
                  Rendimento
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={form.yield}
                    onChange={(e) =>
                      setForm({ ...form, yield: e.target.value })
                    }
                    className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <select
                    value={form.yieldUnit}
                    onChange={(e) =>
                      setForm({ ...form, yieldUnit: e.target.value })
                    }
                    className="px-3 py-2.5 border border-border rounded-xl text-sm bg-white"
                  >
                    <option value="un">unidades</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">litros</option>
                    <option value="ml">ml</option>
                    <option value="fatias">fatias</option>
                    <option value="porções">porções</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Preço de Venda (por unidade)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Ingredientes
                </h3>
                <button
                  onClick={addIngredient}
                  className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 bg-gray-50 rounded-xl p-3"
                  >
                    {/* Catalog product picker */}
                    <div>
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Produto do catálogo (opcional)
                        </label>
                      )}
                      <select
                        value={ing.productId || ""}
                        onChange={(e) => {
                          const pid = e.target.value;
                          if (!pid) {
                            updateIngredient(idx, "productId", "");
                            return;
                          }
                          const prod = catalogProducts.find((p) => p.id === pid);
                          if (prod) {
                            const updated = [...ingredients];
                            updated[idx] = {
                              ...updated[idx],
                              productId: pid,
                              name: prod.name,
                              unit: prod.unit,
                              pricePerUnit: prod.cost,
                              totalPrice: Math.round(updated[idx].quantity * prod.cost * 1000) / 1000,
                            };
                            setIngredients(updated);
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white"
                      >
                        <option value="">— digitar manualmente —</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Nome
                        </label>
                      )}
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) =>
                          updateIngredient(idx, "name", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm"
                        placeholder="Ingrediente"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Qtd
                        </label>
                      )}
                      <input
                        type="number"
                        step="0.001"
                        value={ing.quantity || ""}
                        onChange={(e) =>
                          updateIngredient(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Unidade
                        </label>
                      )}
                      <select
                        value={ing.unit}
                        onChange={(e) =>
                          updateIngredient(idx, "unit", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                        <option value="cx">cx</option>
                        <option value="pct">pct</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          R$/Un
                        </label>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={ing.pricePerUnit || ""}
                        onChange={(e) =>
                          updateIngredient(
                            idx,
                            "pricePerUnit",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Total
                        </label>
                      )}
                      <div className="px-2 py-1.5 bg-white border border-border rounded-lg text-sm font-medium text-emerald-600">
                        {formatCurrency(ing.totalPrice)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                        disabled={ingredients.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    </div> {/* closes grid cols-12 */}
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-primary/5 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted">Custo Total</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Custo por Unidade</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(costPerUnit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Lucro por Unidade</p>
                  <p
                    className={`text-lg font-bold ${
                      profit >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(profit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Margem</p>
                  <p
                    className={`text-lg font-bold ${
                      margin >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowRecipeModal(false)}
                className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Criar Receita"}
              </button>
            </div>
          </div>
        </Modal>

        {/* New Version Modal */}
        <Modal
          isOpen={showVersionModal}
          onClose={() => setShowVersionModal(false)}
          title={`Nova Versão - ${selectedRecipe?.name || ""}`}
          size="xl"
        >
          <div className="space-y-5">
            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
              <p className="font-medium mb-1">
                💡 Criando nova versão da receita
              </p>
              <p className="text-xs">
                Ajuste os preços dos ingredientes para refletir as mudanças.
                A versão anterior será mantida no histórico para comparação.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Observações da versão
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: Preço da farinha aumentou"
              />
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Ingredientes
                </h3>
                <button
                  onClick={addIngredient}
                  className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-xl p-3"
                  >
                    <div className="col-span-3">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Nome
                        </label>
                      )}
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) =>
                          updateIngredient(idx, "name", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Qtd
                        </label>
                      )}
                      <input
                        type="number"
                        step="0.001"
                        value={ing.quantity || ""}
                        onChange={(e) =>
                          updateIngredient(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Un
                        </label>
                      )}
                      <select
                        value={ing.unit}
                        onChange={(e) =>
                          updateIngredient(idx, "unit", e.target.value)
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          R$/Un
                        </label>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={ing.pricePerUnit || ""}
                        onChange={(e) =>
                          updateIngredient(
                            idx,
                            "pricePerUnit",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && (
                        <label className="text-[10px] text-muted uppercase tracking-wide">
                          Total
                        </label>
                      )}
                      <div className="px-2 py-1.5 bg-white border border-border rounded-lg text-sm font-medium text-emerald-600">
                        {formatCurrency(ing.totalPrice)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                        disabled={ingredients.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/5 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted">Custo Total (Nova Versão)</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Custo/Unidade</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(
                      totalCost / (selectedRecipe?.yield || 1)
                    )}
                  </p>
                </div>
              </div>
              {selectedRecipe?.versions[0] && (
                <div className="mt-3 pt-3 border-t border-primary/10 text-xs">
                  <span className="text-muted">Versão anterior: </span>
                  <span className="font-medium">
                    {formatCurrency(
                      selectedRecipe.versions[0].totalCost
                    )}
                  </span>
                  <span className="mx-2">→</span>
                  <span
                    className={`font-bold ${
                      totalCost > selectedRecipe.versions[0].totalCost
                        ? "text-red-500"
                        : "text-emerald-600"
                    }`}
                  >
                    {totalCost > selectedRecipe.versions[0].totalCost
                      ? "+"
                      : ""}
                    {formatCurrency(
                      totalCost - selectedRecipe.versions[0].totalCost
                    )}{" "}
                    (
                    {(
                      ((totalCost - selectedRecipe.versions[0].totalCost) /
                        selectedRecipe.versions[0].totalCost) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar Versão"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Detail Modal - Version History */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Histórico - ${selectedRecipe?.name || ""}`}
          size="xl"
        >
          {selectedRecipe && (
            <div className="space-y-4">
              {selectedRecipe.versions.map((ver, vIdx) => {
                const prevVersion = selectedRecipe.versions[vIdx + 1];
                const costDiff = prevVersion
                  ? ver.totalCost - prevVersion.totalCost
                  : 0;

                return (
                  <div
                    key={ver.id}
                    className={`border rounded-xl p-4 ${
                      vIdx === 0
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            vIdx === 0
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-muted"
                          }`}
                        >
                          v{ver.version}
                        </span>
                        {vIdx === 0 && (
                          <span className="text-xs text-primary font-medium">
                            Atual
                          </span>
                        )}
                        {ver.notes && (
                          <span className="text-xs text-muted">
                            — {ver.notes}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-muted" />
                        <span className="text-xs text-muted">
                          {new Date(ver.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {/* Ingredients table */}
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted uppercase tracking-wide">
                          <th className="text-left pb-1">Ingrediente</th>
                          <th className="text-right pb-1">Qtd</th>
                          <th className="text-right pb-1">R$/Un</th>
                          <th className="text-right pb-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ver.ingredients.map((ing, iIdx) => {
                          // Find same ingredient in previous version for comparison
                          const prevIng = prevVersion?.ingredients.find(
                            (pi: Ingredient) => pi.name === ing.name
                          );
                          const priceDiff = prevIng
                            ? ing.pricePerUnit - prevIng.pricePerUnit
                            : 0;

                          return (
                            <tr
                              key={iIdx}
                              className="border-t border-border/50"
                            >
                              <td className="py-1.5 font-medium text-foreground">
                                {ing.name}
                              </td>
                              <td className="py-1.5 text-right text-muted">
                                {ing.quantity} {ing.unit}
                              </td>
                              <td className="py-1.5 text-right">
                                <span className="text-muted">
                                  {formatCurrency(ing.pricePerUnit)}
                                </span>
                                {priceDiff !== 0 && (
                                  <span
                                    className={`ml-1 text-[10px] font-medium ${
                                      priceDiff > 0
                                        ? "text-red-500"
                                        : "text-emerald-500"
                                    }`}
                                  >
                                    {priceDiff > 0 ? "↑" : "↓"}
                                    {Math.abs(priceDiff).toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 text-right font-medium">
                                {formatCurrency(ing.totalPrice)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-sm">
                      <span className="font-semibold">
                        Total: {formatCurrency(ver.totalCost)}
                      </span>
                      <span className="text-muted">
                        Custo/un: {formatCurrency(ver.costPerUnit)}
                      </span>
                      {costDiff !== 0 && (
                        <span
                          className={`text-xs font-bold ${
                            costDiff > 0 ? "text-red-500" : "text-emerald-600"
                          }`}
                        >
                          {costDiff > 0 ? "+" : ""}
                          {formatCurrency(costDiff)} vs anterior
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
