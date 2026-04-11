"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplier: string;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
  warehouse: "BOS" | "NYC" | "LAX";
};

const CATEGORIES = [
  "Apparel",
  "Accessories",
  "Home",
  "Electronics",
  "Outdoor",
  "Beauty",
];
const SUPPLIERS = [
  "Pacific Northwest Co.",
  "Kyoto Trading",
  "Atlas Goods",
  "Helsinki Works",
  "Solaris OEM",
];
const WAREHOUSES: Array<"BOS" | "NYC" | "LAX"> = ["BOS", "NYC", "LAX"];
const ADJECTIVES = ["Classic", "Modern", "Vintage", "Eco", "Pro", "Lite", "Deluxe", "Everyday", "Limited", "Essential"];
const NOUNS = [
  "T-Shirt",
  "Hoodie",
  "Mug",
  "Bottle",
  "Tote",
  "Cap",
  "Tumbler",
  "Notebook",
  "Candle",
  "Backpack",
  "Wallet",
  "Sunglasses",
  "Keychain",
  "Blanket",
  "Scarf",
  "Gloves",
  "Beanie",
  "Pen",
  "Pillow",
  "Apron",
];

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateProducts(): Product[] {
  const out: Product[] = [];
  for (let i = 0; i < 50; i++) {
    const adj = ADJECTIVES[Math.floor(seededRandom(i * 3 + 1) * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(seededRandom(i * 3 + 2) * NOUNS.length)];
    const cat = CATEGORIES[Math.floor(seededRandom(i * 3 + 3) * CATEGORIES.length)];
    const supplier = SUPPLIERS[Math.floor(seededRandom(i * 5 + 7) * SUPPLIERS.length)];
    const wh = WAREHOUSES[Math.floor(seededRandom(i * 7 + 11) * WAREHOUSES.length)];
    const cost = Math.round(5 + seededRandom(i * 11 + 17) * 85);
    const markup = 1.6 + seededRandom(i * 13 + 19) * 1.4;
    const price = Math.round(cost * markup);
    const stock = Math.floor(seededRandom(i * 17 + 23) * 220);
    const reorderPoint = 15 + Math.floor(seededRandom(i * 19 + 29) * 25);
    out.push({
      id: `p${String(i + 1).padStart(3, "0")}`,
      sku: `SK-${String(1000 + i)}`,
      name: `${adj} ${noun}`,
      category: cat,
      supplier,
      price,
      cost,
      stock,
      reorderPoint,
      warehouse: wh,
    });
  }
  return out;
}

const INITIAL_PRODUCTS = generateProducts();

type SortKey = "name" | "sku" | "stock" | "price" | "category";

export default function InventoryManager() {
  const [dark, setDark] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [warehouse, setWarehouse] = useState<"All" | "BOS" | "NYC" | "LAX">("All");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("solaris-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("solaris-theme", next ? "dark" : "light");
  };

  const totals = useMemo(() => {
    const totalSkus = products.length;
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const inventoryValue = products.reduce((s, p) => s + p.stock * p.cost, 0);
    const lowStock = products.filter((p) => p.stock <= p.reorderPoint).length;
    return { totalSkus, totalUnits, inventoryValue, lowStock };
  }, [products]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (warehouse !== "All" && p.warehouse !== warehouse) return false;
      if (onlyLowStock && p.stock > p.reorderPoint) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !p.supplier.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const av: string | number = (a as Record<string, unknown>)[sortKey] as string | number;
      const bv: string | number = (b as Record<string, unknown>)[sortKey] as string | number;
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [products, query, category, warehouse, onlyLowStock, sortKey, sortAsc]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + p.stock));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [products]);

  const maxCategoryValue = Math.max(...categoryBreakdown.map(([, v]) => v), 1);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openAdd = () => {
    setEditing({
      id: `p${String(products.length + 1).padStart(3, "0")}`,
      sku: `SK-${1000 + products.length}`,
      name: "",
      category: CATEGORIES[0],
      supplier: SUPPLIERS[0],
      price: 0,
      cost: 0,
      stock: 0,
      reorderPoint: 20,
      warehouse: "BOS",
    });
    setIsNew(true);
  };

  const saveEditing = () => {
    if (!editing) return;
    if (isNew) {
      setProducts((prev) => [editing, ...prev]);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? editing : p)));
    }
    setEditing(null);
    setIsNew(false);
  };

  const deleteEditing = () => {
    if (!editing || isNew) return;
    setProducts((prev) => prev.filter((p) => p.id !== editing.id));
    setEditing(null);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-lg font-bold text-white shadow-lg shadow-violet-500/30">
            📦
          </span>
          <div className="leading-tight">
            <div className="text-base font-semibold">Solaris Stock</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Inventory manager
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-fuchsia-500"
          >
            + Add product
          </button>
          <button
            type="button"
            onClick={toggleDark}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Toggle dark mode"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total SKUs" value={totals.totalSkus.toString()} tint="from-violet-500 to-purple-600" />
        <StatCard label="Units on hand" value={totals.totalUnits.toLocaleString()} tint="from-sky-500 to-indigo-600" />
        <StatCard
          label="Inventory value"
          value={`$${(totals.inventoryValue / 1000).toFixed(1)}K`}
          tint="from-emerald-500 to-teal-600"
        />
        <StatCard
          label="Low stock"
          value={totals.lowStock.toString()}
          tint="from-rose-500 to-red-600"
          alert={totals.lowStock > 0}
        />
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Stock by category
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Total units across all warehouses
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {categoryBreakdown.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {val.toLocaleString()} units
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${(val / maxCategoryValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              ⚠
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                {totals.lowStock} products below reorder point
              </div>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                Review and place purchase orders to avoid stockouts. Click any low-stock row to adjust the quantity.
              </p>
              <button
                type="button"
                onClick={() => setOnlyLowStock(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 underline-offset-4 hover:underline dark:text-rose-300"
              >
                Filter to low-stock only →
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, or supplier…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value as typeof warehouse)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="All">All warehouses</option>
          {WAREHOUSES.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
            className="h-4 w-4 accent-rose-500"
          />
          Low stock only
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <Th label="Product" onClick={() => toggleSort("name")} active={sortKey === "name"} asc={sortAsc} />
                <Th label="SKU" onClick={() => toggleSort("sku")} active={sortKey === "sku"} asc={sortAsc} />
                <Th label="Category" onClick={() => toggleSort("category")} active={sortKey === "category"} asc={sortAsc} />
                <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                <Th label="Stock" onClick={() => toggleSort("stock")} active={sortKey === "stock"} asc={sortAsc} right />
                <Th label="Price" onClick={() => toggleSort("price")} active={sortKey === "price"} asc={sortAsc} right />
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map((p) => {
                const low = p.stock <= p.reorderPoint;
                const out = p.stock === 0;
                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setEditing(p);
                      setIsNew(false);
                    }}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-violet-50/40 dark:border-slate-800 dark:hover:bg-violet-500/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300">
                          {p.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {p.warehouse}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {p.category}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {p.supplier}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${p.price}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          out
                            ? "bg-red-500/15 text-red-700 dark:text-red-400"
                            : low
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {out ? "Out" : low ? "Low" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {Math.min(30, filtered.length)} of {filtered.length} products
          <span>Click any row to edit</span>
        </div>
      </section>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setEditing(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <div className="font-semibold">
                  {isNew ? "Add product" : "Edit product"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {editing.sku}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product name
                </span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Category
                </span>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Warehouse
                </span>
                <select
                  value={editing.warehouse}
                  onChange={(e) =>
                    setEditing({ ...editing, warehouse: e.target.value as "BOS" | "NYC" | "LAX" })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {WAREHOUSES.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Cost ($)
                </span>
                <input
                  type="number"
                  value={editing.cost}
                  onChange={(e) =>
                    setEditing({ ...editing, cost: Number(e.target.value) })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Price ($)
                </span>
                <input
                  type="number"
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Stock on hand
                </span>
                <input
                  type="number"
                  value={editing.stock}
                  onChange={(e) =>
                    setEditing({ ...editing, stock: Number(e.target.value) })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Reorder point
                </span>
                <input
                  type="number"
                  value={editing.reorderPoint}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      reorderPoint: Number(e.target.value),
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Supplier
                </span>
                <select
                  value={editing.supplier}
                  onChange={(e) =>
                    setEditing({ ...editing, supplier: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {SUPPLIERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
              {!isNew ? (
                <button
                  type="button"
                  onClick={deleteEditing}
                  className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditing}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  {isNew ? "Create product" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-slate-400">
        Demo product — 50 generated products, all state is client-side. © {new Date().getFullYear()} Solaris Stock.
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  tint,
  alert,
}: {
  label: string;
  value: string;
  tint: string;
  alert?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tint} opacity-15`}
      />
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div
          className={`mt-2 text-2xl font-bold ${
            alert ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function Th({
  label,
  onClick,
  active,
  asc,
  right,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  asc: boolean;
  right?: boolean;
}) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none px-4 py-3 font-semibold ${
        right ? "text-right" : "text-left"
      } ${active ? "text-violet-600 dark:text-violet-400" : ""}`}
    >
      {label} {active ? (asc ? "↑" : "↓") : ""}
    </th>
  );
}
