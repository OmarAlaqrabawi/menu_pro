import { getDashboardStats } from "@/actions/analytics";
import { getOrders } from "@/actions/order";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Store, ShoppingBag, TrendingUp, Eye,
  ArrowUpRight, ArrowDownRight, Clock, Calendar,
  Zap, ChevronLeft,
} from "lucide-react";
import { OrderStatusLabel, OrderTypeLabel } from "@/types";
import Link from "next/link";

export default async function DashboardPage() {
  const [stats, ordersData] = await Promise.all([
    getDashboardStats(),
    getOrders({ limit: 5 }),
  ]);

  const statCards = [
    {
      title: "إجمالي الإيرادات",
      value: `${(stats?.totalRevenue ?? 0).toFixed(0)}`,
      unit: "د.أ",
      sub: stats?.revenueChange
        ? `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}% مقارنة بالشهر الماضي`
        : "هذا الشهر",
      trend: (stats?.revenueChange ?? 0) >= 0 ? "up" : "down",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "الطلبات",
      value: String(stats?.todayOrders ?? 0),
      unit: "طلب",
      sub: `${stats?.monthlyRevenue?.toFixed(0) ?? 0} د.أ إيرادات اليوم`,
      trend: "up" as const,
      icon: ShoppingBag,
      gradient: "from-blue-500 to-indigo-600",
      bgGlow: "bg-blue-500/10",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "المطاعم النشطة",
      value: String(stats?.totalRestaurants ?? 0),
      unit: "مطعم",
      sub: `${stats?.activeRestaurants ?? 0} نشط من أصل ${stats?.totalRestaurants ?? 0}`,
      trend: "up" as const,
      icon: Store,
      gradient: "from-violet-500 to-purple-600",
      bgGlow: "bg-violet-500/10",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      title: "زيارات المنيو",
      value: String(stats?.menuViews ?? 0),
      unit: "زيارة",
      sub: stats?.viewsChange
        ? `${stats.viewsChange > 0 ? "+" : ""}${stats.viewsChange}% مقارنة بالشهر الماضي`
        : "هذا الشهر",
      trend: (stats?.viewsChange ?? 0) >= 0 ? "up" : "down",
      icon: Eye,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    NEW: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    PREPARING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    READY: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    COMPLETED: { bg: "bg-surface-100", text: "text-surface-600", dot: "bg-surface-400" },
    CANCELLED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };

  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ─────── Welcome Header ─────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderRadius: 20,
          padding: "28px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute",
          top: -40,
          left: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(229, 115, 40, 0.15)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute",
          bottom: -30,
          right: "20%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(229, 115, 40, 0.08)",
          filter: "blur(40px)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>
                  مرحباً بك 👋
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  متصل
                </Badge>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
                نظرة عامة على أداء منصتك · {today}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "10px 18px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Calendar style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)" }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  {new Date().toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────── Stats Cards ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 20 }}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px 24px 20px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.02)",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              className="hover-lift"
            >
              {/* Subtle glow */}
              <div
                className={stat.bgGlow}
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  filter: "blur(30px)",
                  opacity: 0.6,
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Title row */}
                <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                    {stat.title}
                  </span>
                  <div
                    className={stat.iconBg}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon className={`w-[20px] h-[20px] ${stat.iconColor}`} />
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1, letterSpacing: "-0.02em" }}
                    className="tabular-nums"
                  >
                    {stat.value}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>
                    {stat.unit}
                  </span>
                </div>

                {/* Trend */}
                <div className="flex items-center gap-1.5">
                  {stat.trend === "up" ? (
                    <div className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>
                      <ArrowUpRight style={{ width: 14, height: 14 }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>
                      <ArrowDownRight style={{ width: 14, height: 14 }} />
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{stat.sub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────── Bottom Section: Orders + Quick Actions ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>

        {/* Recent Orders — takes 2 columns */}
        <div
          className="lg:col-span-2"
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.02)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <ShoppingBag style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>آخر الطلبات</h2>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>آخر 5 طلبات واردة</p>
              </div>
            </div>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 transition-colors"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              عرض الكل
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </Link>
          </div>

          {/* Orders List */}
          <div style={{ padding: "0" }}>
            {ordersData.orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                <ShoppingBag style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.3 }} />
                <p>لا توجد طلبات حتى الآن</p>
              </div>
            ) : (
              ordersData.orders.map((order, i) => {
                const style = statusStyles[order.status] || statusStyles.NEW;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between hover:bg-surface-50/80 transition-colors"
                    style={{
                      padding: "16px 28px",
                      borderBottom: i < ordersData.orders.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Order icon */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(0,0,0,0.04)",
                        }}
                      >
                        <ShoppingBag style={{ width: 20, height: 20, color: "#6b7280" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                            طلب #{order.orderNumber}
                          </span>
                          {order.customerName && (
                            <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>— {order.customerName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{order.restaurant?.nameAr}</span>
                          <span style={{ fontSize: 12, color: "#d1d5db" }}>•</span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{OrderTypeLabel[order.orderType] || order.orderType}</span>
                          <span style={{ fontSize: 12, color: "#d1d5db" }}>•</span>
                          <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#9ca3af" }}>
                            <Clock style={{ width: 12, height: 12 }} />
                            {new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status badge */}
                      <div
                        className={`${style.bg} ${style.text}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <span className={style.dot} style={{ width: 6, height: 6, borderRadius: "50%" }} />
                        {OrderStatusLabel[order.status] || order.status}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", minWidth: 80, textAlign: "left" }}
                        className="tabular-nums"
                      >
                        {order.total.toFixed(2)} د.أ
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions / Summary — 1 column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Actions */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.02)",
              padding: 24,
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 20 }}>
              <Zap style={{ width: 18, height: 18, color: "#f59e0b" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>إجراءات سريعة</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "إضافة مطعم جديد", href: "/dashboard/restaurants", icon: Store, color: "#8b5cf6" },
                { label: "إدارة الطلبات", href: "/dashboard/orders", icon: ShoppingBag, color: "#3b82f6" },
                { label: "عرض الإحصائيات", href: "/dashboard/analytics", icon: TrendingUp, color: "#10b981" },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 transition-all duration-200 hover:translate-x-[-4px]"
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "#fafafa",
                    border: "1px solid rgba(0,0,0,0.04)",
                    textDecoration: "none",
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${action.color}12`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <action.icon style={{ width: 18, height: 18, color: action.color }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", flex: 1 }}>
                    {action.label}
                  </span>
                  <ChevronLeft style={{ width: 16, height: 16, color: "#d1d5db" }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              borderRadius: 16,
              padding: 24,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute",
              top: -20,
              left: -20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(229, 115, 40, 0.2)",
              filter: "blur(30px)",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>ملخص الأداء</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>معدل إتمام الطلبات</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>92%</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{ width: "92%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #34d399, #10b981)" }} />
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>رضا العملاء</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>4.8/5</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{ width: "96%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }} />
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>متوسط وقت التحضير</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>18 دقيقة</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{ width: "75%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #60a5fa, #3b82f6)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
