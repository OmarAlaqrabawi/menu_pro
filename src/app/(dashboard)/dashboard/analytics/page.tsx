import { getDashboardStats } from "@/actions/analytics";
import { getRestaurants } from "@/actions/restaurant";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import AnalyticsCharts from "@/components/analytics/charts";
import {
  TrendingUp, TrendingDown, Eye, ShoppingBag,
  DollarSign, Store, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity,
  PieChart, Calendar, Clock,
} from "lucide-react";

async function getAnalyticsData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = session.user as { id: string; role?: string };
  const isAdmin = user.role === "ADMIN";

  const restaurants = isAdmin
    ? await prisma.restaurant.findMany({ select: { id: true, nameAr: true } })
    : await prisma.restaurant.findMany({ where: { userId: user.id }, select: { id: true, nameAr: true } });
  const rIds = restaurants.map((r) => r.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOrders,
    todayOrders,
    weekOrders,
    monthOrdersList,
    ordersByStatus,
    topItems,
    eventsByType,
    dailyViews,
  ] = await Promise.all([
    prisma.order.count({ where: { restaurantId: { in: rIds } } }),
    prisma.order.count({ where: { restaurantId: { in: rIds }, createdAt: { gte: today } } }),
    prisma.order.count({ where: { restaurantId: { in: rIds }, createdAt: { gte: thisWeek } } }),
    prisma.order.findMany({
      where: { restaurantId: { in: rIds }, createdAt: { gte: thisMonth }, status: { not: "CANCELLED" } },
      select: { total: true, status: true, orderType: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { restaurantId: { in: rIds } },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["itemName"],
      where: { order: { restaurantId: { in: rIds } } },
      _count: true,
      _sum: { totalPrice: true },
      orderBy: { _count: { itemName: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: { restaurantId: { in: rIds }, createdAt: { gte: thisMonth } },
      _count: true,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["createdAt"],
      where: { restaurantId: { in: rIds }, eventType: "MENU_VIEW", createdAt: { gte: thisWeek } },
      _count: true,
    }),
  ]);

  const monthRevenue = monthOrdersList.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = monthOrdersList.length > 0 ? monthRevenue / monthOrdersList.length : 0;
  const dineInCount = monthOrdersList.filter((o) => o.orderType === "DINE_IN").length;
  const takeawayCount = monthOrdersList.filter((o) => o.orderType === "TAKEAWAY").length;

  // Aggregate daily data for charts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dailyOrders = await prisma.order.findMany({
    where: { restaurantId: { in: rIds }, createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
  });

  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  dailyOrders.forEach((o) => {
    const dateKey = o.createdAt.toISOString().split("T")[0].slice(5); // MM-DD
    const existing = dailyMap.get(dateKey) || { orders: 0, revenue: 0 };
    existing.orders++;
    existing.revenue += o.total;
    dailyMap.set(dateKey, existing);
  });
  const dailyData = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    restaurants,
    totalOrders,
    todayOrders,
    weekOrders,
    monthOrders: monthOrdersList.length,
    monthRevenue,
    avgOrderValue,
    dineInCount,
    takeawayCount,
    ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
    topItems: topItems.map((i) => ({
      name: i.itemName,
      count: i._count,
      revenue: i._sum.totalPrice ?? 0,
    })),
    eventsByType: eventsByType.map((e) => ({ type: e.eventType, count: e._count })),
    dailyData,
  };
}

const statusColors: Record<string, string> = {
  NEW: "#3b82f6",
  PREPARING: "#f59e0b",
  READY: "#10b981",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
};

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

const eventLabels: Record<string, string> = {
  MENU_VIEW: "مشاهدات المنيو",
  ITEM_VIEW: "مشاهدات العناصر",
  CATEGORY_VIEW: "مشاهدات الأقسام",
  QR_SCAN: "مسح QR",
  ITEM_ADD_TO_CART: "إضافة للسلة",
  ORDER_PLACED: "طلبات مكتملة",
};

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <BarChart3 style={{ width: 56, height: 56, color: "#d1d5db", margin: "0 auto 16px" }} />
        <p style={{ color: "#9ca3af" }}>يرجى تسجيل الدخول</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "إيرادات الشهر",
      value: `${data.monthRevenue.toFixed(0)}`,
      unit: "د.أ",
      icon: DollarSign,
      gradient: "linear-gradient(135deg, #10b981, #059669)",
      bg: "#ecfdf5",
      textColor: "#059669",
    },
    {
      title: "طلبات اليوم",
      value: `${data.todayOrders}`,
      unit: "طلب",
      icon: ShoppingBag,
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
      bg: "#eff6ff",
      textColor: "#2563eb",
    },
    {
      title: "طلبات الأسبوع",
      value: `${data.weekOrders}`,
      unit: "طلب",
      icon: Calendar,
      gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      bg: "#f5f3ff",
      textColor: "#7c3aed",
    },
    {
      title: "متوسط قيمة الطلب",
      value: `${data.avgOrderValue.toFixed(1)}`,
      unit: "د.أ",
      icon: TrendingUp,
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      bg: "#fffbeb",
      textColor: "#d97706",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>الإحصائيات</h1>
        <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>تحليل أداء المطاعم والطلبات</p>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
        {statCards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.06)",
              padding: 20,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, margin: 0 }}>{card.title}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{card.value}</span>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{card.unit}</span>
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: card.bg, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <card.icon style={{ width: 22, height: 22, color: card.textColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20 }}>

        {/* Order Status Distribution */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24,
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
            <PieChart style={{ width: 18, height: 18, color: "#e57328" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>توزيع حالات الطلبات</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.ordersByStatus.map((s) => {
              const pct = data.totalOrders > 0 ? (s.count / data.totalOrders) * 100 : 0;
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: statusColors[s.status] || "#6b7280",
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        {statusLabels[s.status] || s.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{s.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      background: statusColors[s.status] || "#6b7280",
                      width: `${pct}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Type */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>نوع الطلبات (هذا الشهر)</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" style={{ flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Store style={{ width: 18, height: 18, color: "#3b82f6" }} />
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{data.dineInCount}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>طاولة</p>
                </div>
              </div>
              <div className="flex items-center gap-2" style={{ flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ShoppingBag style={{ width: 18, height: 18, color: "#d97706" }} />
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{data.takeawayCount}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>سفري</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Events */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24,
        }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
            <Activity style={{ width: 18, height: 18, color: "#e57328" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>تفاعلات المنيو</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.eventsByType.map((e) => {
              const maxCount = Math.max(...data.eventsByType.map((x) => x.count), 1);
              const pct = (e.count / maxCount) * 100;
              return (
                <div key={e.type}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      {eventLabels[e.type] || e.type}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{e.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      background: "linear-gradient(90deg, #e57328, #f59e0b)",
                      width: `${pct}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {data.eventsByType.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
              <Eye style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>لا توجد تفاعلات هذا الشهر</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Top Items ─── */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24,
      }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
          <BarChart3 style={{ width: 18, height: 18, color: "#e57328" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>الأصناف الأكثر طلباً</h3>
        </div>

        {data.topItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>
            <ShoppingBag style={{ width: 32, height: 32, margin: "0 auto 8px", opacity: 0.3 }} />
            <p style={{ fontSize: 13 }}>لا توجد بيانات حتى الآن</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>#</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الصنف</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الكمية</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, i) => (
                  <tr key={item.name} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td style={{ padding: "12px", fontSize: 13 }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: i < 3 ? "linear-gradient(135deg, #e57328, #d4641c)" : "#f3f4f6",
                        color: i < 3 ? "#fff" : "#6b7280", fontSize: 11, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>
                      {item.count} طلب
                    </td>
                    <td style={{ padding: "12px", fontSize: 14, fontWeight: 700, color: "#10b981", textAlign: "left" }}>
                      {item.revenue.toFixed(0)} د.أ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Interactive Charts ─── */}
      <AnalyticsCharts data={{
        ordersByStatus: data.ordersByStatus,
        topItems: data.topItems,
        eventsByType: data.eventsByType,
        monthRevenue: data.monthRevenue,
        todayOrders: data.todayOrders,
        weekOrders: data.weekOrders,
        monthOrders: data.monthOrders,
        avgOrderValue: data.avgOrderValue,
        dailyData: data.dailyData,
      }} />
    </div>
  );
}
