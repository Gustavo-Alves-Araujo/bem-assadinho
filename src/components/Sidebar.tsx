"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Shield,
  Lock,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

const ADMIN_PASSWORD = "admin123";

const userItems = [
  { href: "/pdv", label: "PDV", icon: ShoppingCart },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
];

const adminItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendas", label: "Vendas", icon: History },
  { href: "/receitas", label: "Receitas", icon: Calculator },
];

const mobileUserItems = [
  { href: "/pdv", label: "PDV", icon: ShoppingCart },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
];

const mobileAdminItems = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/vendas", label: "Vendas", icon: History },
  { href: "/receitas", label: "Receitas", icon: Calculator },
];

function NavLink({ item, collapsed, isActive }: { item: { href: string; label: string; icon: React.ElementType }; collapsed: boolean; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-150 group relative",
        collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5",
        isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
      )}
      <item.icon size={18} className={cn("flex-shrink-0 transition-colors", isActive ? "text-primary-light" : "text-slate-500 group-hover:text-slate-300")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {isActive && collapsed && <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist admin state for the session
  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("admin") === "1");
  }, []);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setPassword("");
      setError("");
    }
  }, [showModal]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin", "1");
      setIsAdmin(true);
      setShowModal(false);
      router.push("/");
    } else {
      setError("Senha incorreta");
      setPassword("");
      inputRef.current?.focus();
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin");
    setIsAdmin(false);
    router.push("/pdv");
  };

  const visibleItems = isAdmin ? [...userItems, ...adminItems] : userItems;
  const mobileTabs = isAdmin ? [...mobileUserItems, ...mobileAdminItems] : mobileUserItems;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex bg-sidebar text-white flex-col transition-all duration-300 ease-in-out h-screen sticky top-0 flex-shrink-0",
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
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold tracking-tight leading-none text-orange-300">Bem Assadinho</h1>
              <p className="text-[10px] text-orange-900/50 mt-0.5">PDV · Sistema de Vendas</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
          {/* User section */}
          {!collapsed && <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 pb-1">Operação</p>}
          {userItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed}
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-white/8" />
              {!collapsed && <p className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-widest px-3 pb-1 flex items-center gap-1.5"><Shield size={10} />Admin</p>}
              {adminItems.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed}
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))} />
              ))}
            </>
          )}
        </nav>

        {/* Bottom: admin toggle + collapse */}
        <div className="px-2.5 py-3 border-t border-white/8 flex-shrink-0 space-y-1">
          {isAdmin ? (
            <button onClick={handleLogout}
              className={cn("flex items-center gap-3 rounded-xl text-[13px] text-amber-500 hover:text-amber-300 hover:bg-white/5 transition-all w-full",
                collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2")}>
              <LogOut size={15} />
              {!collapsed && <span>Sair do Admin</span>}
            </button>
          ) : (
            <button onClick={() => setShowModal(true)}
              className={cn("flex items-center gap-3 rounded-xl text-[13px] text-slate-500 hover:text-amber-300 hover:bg-white/5 transition-all w-full",
                collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2")}>
              <Shield size={15} />
              {!collapsed && <span>Painel Admin</span>}
            </button>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className={cn("flex items-center gap-3 rounded-xl text-[13px] text-slate-600 hover:text-slate-200 hover:bg-white/5 transition-all",
              collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2 w-full")}>
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      {/* ── Mobile top header ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            <Store size={13} className="text-white" />
          </div>
          <span className="text-[14px] font-bold text-orange-300 tracking-tight">Bem Assadinho</span>
        </div>
        {isAdmin ? (
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg">
            <LogOut size={12} /> Admin
          </button>
        ) : (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg">
            <Lock size={12} /> Admin
          </button>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-white/10 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {mobileTabs.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
                isActive ? "text-primary" : "text-slate-500")}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Admin password modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Painel Admin</h2>
                <p className="text-xs text-muted">Digite a senha para continuar</p>
              </div>
            </div>

            <div className="relative mb-3">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Senha"
                className={cn("w-full pl-9 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  error ? "border-red-400 bg-red-50" : "border-border")}
              />
              <button onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && <p className="text-xs text-red-500 mb-3 flex items-center gap-1"><Lock size={11} />{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleLogin}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all"
                style={{ boxShadow: "0 4px 12px rgb(249 115 22 / 0.35)" }}>
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
