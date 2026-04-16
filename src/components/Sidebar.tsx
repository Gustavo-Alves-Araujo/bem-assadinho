"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Calculator,
  LayoutDashboard,
  History,
  ChevronLeft,
  ChevronRight,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pdv", label: "PDV", icon: ShoppingCart },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/receitas", label: "Precificação", icon: Calculator },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/vendas", label: "Vendas", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-white flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 flex-shrink-0",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-[60px] border-b border-white/8 flex-shrink-0 transition-all", collapsed ? "justify-center px-3" : "gap-3 px-5")}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 2px 8px rgb(249 115 22 / 0.5)" }}>
          <Store size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <h1 className="text-[13px] font-bold tracking-tight leading-none text-orange-300">Bem Assadinho</h1>
            <p className="text-[10px] text-orange-900/50 mt-0.5">PDV · Sistema de Vendas</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {menuItems.map((item, i) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <>
              {/* Divider before Vendas */}
              {i === 4 && (
                <div key="div" className="my-2 border-t border-white/8" />
              )}
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-150 group relative",
                  collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                {/* Active left indicator */}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isActive ? "text-primary-light" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {!collapsed && (
                  <span className="animate-fade-in truncate">{item.label}</span>
                )}
                {/* Active dot for collapsed */}
                {isActive && collapsed && (
                  <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Link>
            </>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2.5 py-3 border-t border-white/8 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl text-[13px] text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all",
            collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5 w-full"
          )}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

