import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solaris Stock — Inventory Manager",
  description:
    "Track products, stock levels, and suppliers across warehouses. Built for small teams who outgrew spreadsheets.",
  openGraph: {
    title: "Solaris Stock — Inventory Manager",
    description: "Modern inventory management for small teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
