# Solaris Stock — Inventory Manager

Spreadsheet-killer inventory management for small teams. 50 products across 6 categories and 3 warehouses, with stock levels, reorder alerts, and a full add/edit/delete flow — all client-side, zero backend.

**Live demo:** https://shaisolaris.github.io/solaris-inventory-manager/

## What it shows

- **4 live KPI cards** — total SKUs, units on hand, inventory value ($), low-stock count
- **Stock-by-category breakdown** with horizontal bar meter
- **Low-stock alert card** with one-click filter to show only below-reorder items
- **Sortable product table** (click any column header) with live search, category filter, and warehouse filter
- **Click any row** to open a full add/edit modal — name, category, warehouse, cost, price, stock, reorder point, supplier
- **Add product** button creates a new row with sensible defaults
- **Delete** from the edit modal
- **Color-coded status badges** — OK (green), Low (amber), Out (red)
- **Dark mode** with localStorage persistence
- Fully responsive

## Stack

- Next.js 15 (App Router, static export)
- React 19 + TypeScript
- Tailwind CSS 3
- Deployed to GitHub Pages

## Run locally

```bash
npm install
npm run dev
```

## License

MIT.
