import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  CreditCard, Check, X, Clock, Calendar,
  Crown, Zap, Star, AlertCircle,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغي",
  TRIAL: "تجريبي",
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e" },
  EXPIRED: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
  CANCELLED: { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  TRIAL: { bg: "#dbeafe", text: "#2563eb", dot: "#3b82f6" },
};

const cycleLabels: Record<string, string> = {
  MONTHLY: "شهري",
  YEARLY: "سنوي",
};

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { nameAr: true, nameEn: true, slug: true, priceMonthly: true, priceYearly: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length;
  const monthlyRevenue = subscriptions
    .filter(s => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (s.billingCycle === "YEARLY" ? (s.plan.priceYearly ?? 0) / 12 : (s.plan.priceMonthly ?? 0)), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>الاشتراكات</h1>
        <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>إدارة الخطط والاشتراكات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          padding: 20, display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check style={{ width: 22, height: 22, color: "#10b981" }} />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{activeCount}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>اشتراك نشط</p>
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          padding: 20, display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard style={{ width: 22, height: 22, color: "#3b82f6" }} />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{monthlyRevenue.toFixed(0)}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>إيرادات شهرية (د.أ)</p>
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          padding: 20, display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star style={{ width: 22, height: 22, color: "#d97706" }} />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>{plans.length}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>خطط متاحة</p>
          </div>
        </div>
      </div>

      {/* Plans Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
        {plans.map((plan, i) => (
          <div key={plan.id} style={{
            background: i === 1 ? "linear-gradient(135deg, #e57328, #d4641c)" : "#fff",
            borderRadius: 16, border: i === 1 ? "none" : "1px solid rgba(0,0,0,0.06)",
            padding: 24, boxShadow: i === 1 ? "0 8px 30px rgba(229,115,40,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
            color: i === 1 ? "#fff" : "#111827",
          }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              {i === 1 && <Crown style={{ width: 18, height: 18 }} />}
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{plan.nameAr}</h3>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 800 }}>{plan.priceMonthly}</span>
              <span style={{ fontSize: 14, opacity: 0.7 }}> د.أ/شهر</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              <p style={{ margin: "4px 0" }}>• {plan.maxItems ? `${plan.maxItems} عنصر` : "عناصر غير محدودة"}</p>
              <p style={{ margin: "4px 0" }}>• {plan.maxCategories ? `${plan.maxCategories} قسم` : "أقسام غير محدودة"}</p>
              {plan.orderSystem && <p style={{ margin: "4px 0" }}>• نظام الطلبات</p>}
              {plan.tableManagement && <p style={{ margin: "4px 0" }}>• إدارة الطاولات</p>}
              {plan.advancedAnalytics && <p style={{ margin: "4px 0" }}>• إحصائيات متقدمة</p>}
            </div>
            <p style={{ fontSize: 12, marginTop: 12, opacity: 0.5 }}>
              {subscriptions.filter(s => s.plan.slug === plan.slug && s.status === "ACTIVE").length} مشترك
            </p>
          </div>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>جميع الاشتراكات</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#fafafa" }}>
                <th style={{ textAlign: "right", padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>المستخدم</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الخطة</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الدورة</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>الحالة</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>تاريخ الانتهاء</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const sc = statusColors[sub.status] || statusColors.CANCELLED;
                return (
                  <tr key={sub.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{sub.user.name}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{sub.user.email}</p>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e57328" }}>{sub.plan.nameAr}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>
                      {cycleLabels[sub.billingCycle] || sub.billingCycle}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 8,
                        background: sc.bg, color: sc.text,
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
                        {statusLabels[sub.status] || sub.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString("ar-SA") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
