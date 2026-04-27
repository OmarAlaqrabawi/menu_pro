"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { getUnreadCount } from "@/actions/notification";
import {
  LayoutDashboard, Store, UtensilsCrossed, ShoppingBag,
  BarChart3, Palette, QrCode, Settings,
  Users, LogOut, Bell, Menu, X, Search, ChevronLeft,
} from "lucide-react";

/* ─── Types ─── */
interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNav: NavItem[] = [
  { title: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { title: "المطاعم", href: "/dashboard/restaurants", icon: Store },
  { title: "المستخدمين", href: "/dashboard/users", icon: Users },
];

const menuNav: NavItem[] = [
  { title: "إدارة المنيو", href: "/dashboard/menu", icon: UtensilsCrossed },
  { title: "الطلبات", href: "/dashboard/orders", icon: ShoppingBag },
  { title: "الإحصائيات", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "المظهر", href: "/dashboard/branding", icon: Palette },
  { title: "QR Code", href: "/dashboard/qr", icon: QrCode },
  { title: "الإعدادات", href: "/dashboard/settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/dashboard/restaurants": "المطاعم",
  "/dashboard/users": "المستخدمين",
  "/dashboard/menu": "إدارة المنيو",
  "/dashboard/orders": "الطلبات",
  "/dashboard/analytics": "الإحصائيات",
  "/dashboard/branding": "المظهر",
  "/dashboard/qr": "QR Code",
  "/dashboard/settings": "الإعدادات",
};

/* ─── NavLink Component (Dark Theme) ─── */
function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`sidebar-nav-link ${active ? "active" : ""}`}
    >
      <Icon className="nav-icon" />
      <span style={{ flex: 1, lineHeight: 1.5 }}>{item.title}</span>
      {item.badge && (
        <span
          style={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 6px",
            background: active ? "rgba(255,255,255,0.25)" : "#ef4444",
            color: "#fff",
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Main Layout ─── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const isActive = (href: string) => pathname === href;
  const pageTitle = pageTitles[pathname] || "";

  // Fetch session info
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user) {
          setCurrentUser({
            name: session.user.name || session.user.email?.split("@")[0] || "مستخدم",
            role: session.user.role || "RESTAURANT_OWNER",
          });
        }
      } catch {
        // Session not available
      }
    }
    loadSession();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    async function loadUnread() {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch {
        // Ignore
      }
    }
    loadUnread();
    const interval = setInterval(loadUnread, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  const userName = currentUser?.name || "...";
  const userRole = currentUser?.role || "RESTAURANT_OWNER";

  return (
    <div className="min-h-screen bg-surface-50/60">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─────────── Sidebar (Dark) ─────────── */}
      <aside className="sidebar-nav" data-open={sidebarOpen}>

        {/* Logo */}
        <div
          style={{
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Link href="/dashboard" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #e57328, #d4641c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(229, 115, 40, 0.35)",
              }}
            >
              <svg style={{ width: 20, height: 20, color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", display: "block", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                MenuPro
              </span>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                لوحة الإدارة
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{
              padding: 6,
              borderRadius: 8,
              color: "rgba(255,255,255,0.4)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: 20, paddingBottom: 20 }}>
          {/* Main section */}
          <div style={{ marginBottom: 24 }}>
            <p className="sidebar-section-label">الرئيسية</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {mainNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="sidebar-separator" />

          {/* Menu management section */}
          <div style={{ marginTop: 16 }}>
            <p className="sidebar-section-label">إدارة المنيو</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {menuNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        </nav>

        {/* User footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "16px",
          }}
        >
          <div
            className="flex items-center gap-3"
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #e57328, #d4641c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(229, 115, 40, 0.3)",
              }}
            >
              {userName.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.3, margin: 0 }}>
                {userName}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, margin: 0 }}>
                {userRole === "ADMIN" ? "مدير النظام" : "صاحب مطعم"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: 8,
                borderRadius: 10,
                color: "rgba(255,255,255,0.35)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="تسجيل خروج"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────── Main Area ─────────── */}
      <div className="dashboard-content min-h-screen flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30" style={{ height: 60, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="h-full flex items-center justify-between" style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
                style={{ padding: 8, marginInlineStart: -8, borderRadius: 12, color: "#374151", background: "transparent", border: "none", cursor: "pointer" }}
              >
                <Menu style={{ width: 20, height: 20 }} />
              </button>

              {/* Breadcrumb */}
              {pageTitle && (
                <div className="hidden lg:flex items-center gap-2" style={{ fontSize: 14 }}>
                  <span style={{ color: "#9ca3af" }}>الرئيسية</span>
                  <ChevronLeft style={{ width: 14, height: 14, color: "#d1d5db" }} />
                  <span style={{ fontWeight: 600, color: "#374151" }}>{pageTitle}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                className="hidden sm:flex items-center gap-2.5"
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 12,
                  background: "#f9fafb",
                  border: "1px solid rgba(0,0,0,0.06)",
                  color: "#9ca3af",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <Search style={{ width: 16, height: 16 }} />
                <span>بحث...</span>
                <kbd style={{ marginInlineStart: 16, fontSize: 10, fontFamily: "monospace", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "2px 6px", color: "#9ca3af" }}>⌘K</kbd>
              </button>

              {/* Notifications */}
              <button
                style={{
                  position: "relative",
                  padding: 10,
                  borderRadius: 12,
                  color: "#6b7280",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Bell style={{ width: 20, height: 20 }} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      insetInlineEnd: 4,
                      minWidth: 18,
                      height: 18,
                      background: "#ef4444",
                      borderRadius: 9,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      boxShadow: "0 0 0 2px #fff",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="hidden sm:block" style={{ width: 1, height: 32, background: "rgba(0,0,0,0.06)", margin: "0 4px" }} />

              {/* User avatar */}
              <div className="hidden sm:flex items-center gap-3" style={{ paddingInlineStart: 4, cursor: "pointer" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #e57328, #d4641c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(229, 115, 40, 0.25)",
                  }}
                >
                  {userName.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", lineHeight: 1.3, margin: 0 }}>{userName}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1, margin: 0 }}>{userRole === "ADMIN" ? "مدير النظام" : "صاحب مطعم"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
