import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipeVersion.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Categories
  const bebidas = await prisma.category.create({ data: { name: "Bebidas", color: "#06b6d4" } });
  const lanches = await prisma.category.create({ data: { name: "Lanches", color: "#f59e0b" } });
  const doces = await prisma.category.create({ data: { name: "Doces", color: "#ec4899" } });
  const salgados = await prisma.category.create({ data: { name: "Salgados", color: "#f97316" } });
  const outros = await prisma.category.create({ data: { name: "Outros", color: "#8b5cf6" } });

  console.log("✅ Categories created");

  const products = await Promise.all([
    prisma.product.create({ data: { name: "Café Espresso", description: "Café espresso tradicional", price: 6.5, cost: 1.2, stock: 100, minStock: 20, unit: "un", categoryId: bebidas.id, barcode: "7891234560001" } }),
    prisma.product.create({ data: { name: "Cappuccino", description: "Cappuccino cremoso com canela", price: 9.9, cost: 2.5, stock: 80, minStock: 15, unit: "un", categoryId: bebidas.id, barcode: "7891234560002" } }),
    prisma.product.create({ data: { name: "Suco Natural Laranja", description: "Suco de laranja natural 300ml", price: 8.0, cost: 3.0, stock: 50, minStock: 10, unit: "un", categoryId: bebidas.id, barcode: "7891234560003" } }),
    prisma.product.create({ data: { name: "Água Mineral 500ml", price: 3.5, cost: 1.0, stock: 200, minStock: 30, unit: "un", categoryId: bebidas.id, barcode: "7891234560004" } }),
    prisma.product.create({ data: { name: "Refrigerante Lata", price: 5.5, cost: 2.8, stock: 120, minStock: 20, unit: "un", categoryId: bebidas.id, barcode: "7891234560005" } }),
    prisma.product.create({ data: { name: "Pão de Queijo", description: "Pão de queijo mineiro assado na hora", price: 5.0, cost: 1.5, stock: 60, minStock: 15, unit: "un", categoryId: lanches.id, barcode: "7891234560006" } }),
    prisma.product.create({ data: { name: "Coxinha", description: "Coxinha de frango cremosa", price: 7.0, cost: 2.0, stock: 40, minStock: 10, unit: "un", categoryId: salgados.id, barcode: "7891234560007" } }),
    prisma.product.create({ data: { name: "Empada de Palmito", price: 6.5, cost: 2.2, stock: 30, minStock: 8, unit: "un", categoryId: salgados.id, barcode: "7891234560008" } }),
    prisma.product.create({ data: { name: "Bolo de Chocolate (fatia)", description: "Fatia generosa de bolo de chocolate", price: 12.0, cost: 3.5, stock: 20, minStock: 5, unit: "un", categoryId: doces.id, barcode: "7891234560009" } }),
    prisma.product.create({ data: { name: "Brigadeiro Gourmet", description: "Brigadeiro artesanal", price: 4.5, cost: 1.2, stock: 45, minStock: 12, unit: "un", categoryId: doces.id, barcode: "7891234560010" } }),
    prisma.product.create({ data: { name: "Torta de Limão (fatia)", price: 14.0, cost: 4.5, stock: 15, minStock: 5, unit: "un", categoryId: doces.id, barcode: "7891234560011" } }),
    prisma.product.create({ data: { name: "Sanduíche Natural", description: "Sanduíche natural com peito de peru", price: 12.0, cost: 5.0, stock: 25, minStock: 8, unit: "un", categoryId: lanches.id, barcode: "7891234560012" } }),
    prisma.product.create({ data: { name: "Croissant", description: "Croissant amanteigado", price: 8.5, cost: 2.8, stock: 3, minStock: 5, unit: "un", categoryId: lanches.id, barcode: "7891234560013" } }),
    prisma.product.create({ data: { name: "Cookie Artesanal", price: 6.0, cost: 1.8, stock: 35, minStock: 10, unit: "un", categoryId: doces.id, barcode: "7891234560014" } }),
    prisma.product.create({ data: { name: "Combo Café + Pão de Queijo", description: "Café espresso + 2 pães de queijo", price: 14.9, cost: 4.2, stock: 50, minStock: 10, unit: "un", categoryId: outros.id, barcode: "7891234560015" } }),
  ]);

  console.log("✅ Products created:", products.length);

  // Sales
  const saleData = [
    { items: [{ productId: products[0].id, quantity: 2, price: products[0].price }, { productId: products[5].id, quantity: 3, price: products[5].price }], paymentMethod: "pix" },
    { items: [{ productId: products[8].id, quantity: 1, price: products[8].price }, { productId: products[1].id, quantity: 1, price: products[1].price }], paymentMethod: "credit" },
    { items: [{ productId: products[6].id, quantity: 2, price: products[6].price }, { productId: products[3].id, quantity: 1, price: products[3].price }, { productId: products[9].id, quantity: 3, price: products[9].price }], paymentMethod: "cash" },
    { items: [{ productId: products[14].id, quantity: 2, price: products[14].price }], paymentMethod: "debit" },
  ];

  for (const sd of saleData) {
    const subtotal = sd.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await prisma.sale.create({
      data: {
        subtotal, discount: 0, total: subtotal, paymentMethod: sd.paymentMethod, status: "completed",
        transactionId: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        items: { create: sd.items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price, total: item.price * item.quantity })) },
      },
    });
  }

  console.log("✅ Sales created:", saleData.length);

  // Recipes
  await prisma.recipe.create({
    data: {
      name: "Bolo de Chocolate", description: "Receita clássica de bolo de chocolate caseiro", yield: 12, yieldUnit: "fatias", sellingPrice: 12.0,
      versions: {
        create: [
          { version: 1, notes: "Receita original", totalCost: 28.3, costPerUnit: 28.3 / 12, ingredients: { create: [
            { name: "Farinha de Trigo", quantity: 0.5, unit: "kg", pricePerUnit: 5.0, totalPrice: 2.5 },
            { name: "Açúcar", quantity: 0.3, unit: "kg", pricePerUnit: 4.5, totalPrice: 1.35 },
            { name: "Chocolate em Pó", quantity: 0.2, unit: "kg", pricePerUnit: 32.0, totalPrice: 6.4 },
            { name: "Ovos", quantity: 4, unit: "un", pricePerUnit: 1.2, totalPrice: 4.8 },
            { name: "Leite", quantity: 0.5, unit: "l", pricePerUnit: 5.5, totalPrice: 2.75 },
            { name: "Óleo", quantity: 0.2, unit: "l", pricePerUnit: 9.0, totalPrice: 1.8 },
            { name: "Fermento", quantity: 0.02, unit: "kg", pricePerUnit: 45.0, totalPrice: 0.9 },
            { name: "Cobertura chocolate", quantity: 0.3, unit: "kg", pricePerUnit: 26.0, totalPrice: 7.8 },
          ]}},
          { version: 2, notes: "Chocolate em pó ficou mais caro", totalCost: 31.9, costPerUnit: 31.9 / 12, ingredients: { create: [
            { name: "Farinha de Trigo", quantity: 0.5, unit: "kg", pricePerUnit: 5.0, totalPrice: 2.5 },
            { name: "Açúcar", quantity: 0.3, unit: "kg", pricePerUnit: 4.5, totalPrice: 1.35 },
            { name: "Chocolate em Pó", quantity: 0.2, unit: "kg", pricePerUnit: 50.0, totalPrice: 10.0 },
            { name: "Ovos", quantity: 4, unit: "un", pricePerUnit: 1.2, totalPrice: 4.8 },
            { name: "Leite", quantity: 0.5, unit: "l", pricePerUnit: 5.5, totalPrice: 2.75 },
            { name: "Óleo", quantity: 0.2, unit: "l", pricePerUnit: 9.0, totalPrice: 1.8 },
            { name: "Fermento", quantity: 0.02, unit: "kg", pricePerUnit: 45.0, totalPrice: 0.9 },
            { name: "Cobertura chocolate", quantity: 0.3, unit: "kg", pricePerUnit: 26.0, totalPrice: 7.8 },
          ]}},
        ],
      },
    },
  });

  await prisma.recipe.create({
    data: {
      name: "Brigadeiro Gourmet", description: "Brigadeiro artesanal com chocolate belga", yield: 30, yieldUnit: "un", sellingPrice: 4.5,
      versions: { create: { version: 1, notes: "Versão inicial", totalCost: 45.0, costPerUnit: 1.5, ingredients: { create: [
        { name: "Leite Condensado", quantity: 2, unit: "un", pricePerUnit: 6.5, totalPrice: 13.0 },
        { name: "Chocolate Belga", quantity: 0.2, unit: "kg", pricePerUnit: 80.0, totalPrice: 16.0 },
        { name: "Creme de Leite", quantity: 0.2, unit: "l", pricePerUnit: 10.0, totalPrice: 2.0 },
        { name: "Manteiga", quantity: 0.05, unit: "kg", pricePerUnit: 40.0, totalPrice: 2.0 },
        { name: "Granulado", quantity: 0.3, unit: "kg", pricePerUnit: 20.0, totalPrice: 6.0 },
        { name: "Forminhas", quantity: 30, unit: "un", pricePerUnit: 0.2, totalPrice: 6.0 },
      ]}}},
    },
  });

  await prisma.recipe.create({
    data: {
      name: "Torta de Limão", description: "Torta de limão siciliano com merengue", yield: 8, yieldUnit: "fatias", sellingPrice: 14.0,
      versions: { create: { version: 1, notes: "Versão inicial", totalCost: 36.85, costPerUnit: 36.85 / 8, ingredients: { create: [
        { name: "Biscoito maisena", quantity: 0.3, unit: "kg", pricePerUnit: 12.0, totalPrice: 3.6 },
        { name: "Manteiga", quantity: 0.1, unit: "kg", pricePerUnit: 40.0, totalPrice: 4.0 },
        { name: "Leite Condensado", quantity: 2, unit: "un", pricePerUnit: 6.5, totalPrice: 13.0 },
        { name: "Limão siciliano", quantity: 6, unit: "un", pricePerUnit: 1.5, totalPrice: 9.0 },
        { name: "Ovos (claras)", quantity: 4, unit: "un", pricePerUnit: 1.2, totalPrice: 4.8 },
        { name: "Açúcar", quantity: 0.1, unit: "kg", pricePerUnit: 4.5, totalPrice: 0.45 },
        { name: "Creme de leite", quantity: 0.2, unit: "l", pricePerUnit: 10.0, totalPrice: 2.0 },
      ]}}},
    },
  });

  console.log("✅ Recipes created with versions");
  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
