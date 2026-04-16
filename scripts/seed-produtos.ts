import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dcxftfdltjhkddsisdaa.supabase.co",
  "sb_publishable_GkPn4soAFvODvEJwiPNuJw__0yYVKUP"
);

const categorias = [
  { name: "Salgados", color: "#f97316" },
  { name: "Doces",    color: "#ec4899" },
  { name: "Bebidas",  color: "#3b82f6" },
];

const produtos = [
  // Salgados
  { categoria: "Salgados", name: "Coxinha de frango com cream cheese", price: 10.00, unit: "un" },
  { categoria: "Salgados", name: "Coxinha com orégano e carne seca",   price: 10.00, unit: "un" },
  { categoria: "Salgados", name: "Joelho de queijo com presunto",       price:  8.00, unit: "un" },
  { categoria: "Salgados", name: "Joelho de peito de peru com queijo",  price:  8.00, unit: "un" },
  { categoria: "Salgados", name: "Joelho de frango",                    price:  8.00, unit: "un" },
  { categoria: "Salgados", name: "Hambúrguer",                          price:  8.00, unit: "un" },
  { categoria: "Salgados", name: "Cachorro-quente de forno",            price:  8.00, unit: "un" },
  { categoria: "Salgados", name: "Brioche de pizza",                    price: 15.90, unit: "un" },
  // Doces
  { categoria: "Doces", name: "Torta de morango",           price: 10.00, unit: "un" },
  { categoria: "Doces", name: "Torta triplo chocolate",     price: 10.00, unit: "un" },
  { categoria: "Doces", name: "Carolina / Bomba de chocolate", price: 5.00, unit: "un" },
  { categoria: "Doces", name: "Pudim",                      price:  5.00, unit: "un" },
  // Bebidas
  { categoria: "Bebidas", name: "Refrigerante 2L",          price: 15.00, unit: "un" },
  { categoria: "Bebidas", name: "Refrigerante 1,5L",        price: 10.00, unit: "un" },
  { categoria: "Bebidas", name: "Água mineral",             price:  2.00, unit: "un" },
  { categoria: "Bebidas", name: "Suco natural de goiaba",   price:  5.00, unit: "un" },
];

async function seed() {
  console.log("Criando categorias...");
  const catMap: Record<string, string> = {};

  for (const cat of categorias) {
    const { data, error } = await supabase
      .from("categories")
      .insert(cat)
      .select()
      .single();
    if (error) { console.error("Erro categoria:", cat.name, error.message); process.exit(1); }
    catMap[cat.name] = data.id;
    console.log(`  ✓ ${cat.name}`);
  }

  console.log("\nCriando produtos...");
  for (const p of produtos) {
    const { error } = await supabase.from("products").insert({
      name: p.name,
      price: p.price,
      cost: 0,
      stock: 999,
      min_stock: 0,
      unit: p.unit,
      active: true,
      category_id: catMap[p.categoria],
    });
    if (error) { console.error("Erro produto:", p.name, error.message); process.exit(1); }
    console.log(`  ✓ ${p.name} — R$ ${p.price.toFixed(2)}`);
  }

  console.log("\n✅ Todos os produtos cadastrados!");
}

seed();
