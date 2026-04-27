"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Clock, ChevronDown, ChevronUp,
  User, Phone, MapPin, FileText,
  Flame, CheckCircle2, XCircle, Loader2,
  Package, TrendingUp, DollarSign, RefreshCw, Trash2,
} from "lucide-react";
import { getOrders, updateOrderStatus, deleteOrder } from "@/actions/order";
import { OrderStatusLabel, OrderTypeLabel, OrderStatusFlow } from "@/types";
import { PrintOrderButton } from "@/components/orders/print-order";
import OrderNotificationSound from "@/components/orders/notification-sound";

type Order = Awaited<ReturnType<typeof getOrders>>["orders"][number];

const statusTabs = [
  { key: "ALL", label: "الكل", icon: Package },
  { key: "NEW", label: "جديد", icon: ShoppingBag },
  { key: "PREPARING", label: "قيد التحضير", icon: Flame },
  { key: "READY", label: "جاهز", icon: CheckCircle2 },
  { key: "COMPLETED", label: "مكتمل", icon: CheckCircle2 },
  { key: "CANCELLED", label: "ملغي", icon: XCircle },
];

const statusConfig: Record<string, {
  bg: string; text: string; border: string; icon: string;
  dot: string; gradient: string; badgeBg: string;
}> = {
  NEW: {
    bg: "rgba(59,130,246,0.08)", text: "#2563eb", border: "#3b82f6",
    icon: "#3b82f6", dot: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)",
    badgeBg: "#eff6ff",
  },
  PREPARING: {
    bg: "rgba(245,158,11,0.08)", text: "#d97706", border: "#f59e0b",
    icon: "#f59e0b", dot: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    badgeBg: "#fffbeb",
  },
  READY: {
    bg: "rgba(16,185,129,0.08)", text: "#059669", border: "#10b981",
    icon: "#10b981", dot: "#10b981", gradient: "linear-gradient(135deg,#10b981,#059669)",
    badgeBg: "#ecfdf5",
  },
  COMPLETED: {
    bg: "rgba(107,114,128,0.06)", text: "#6b7280", border: "#9ca3af",
    icon: "#6b7280", dot: "#9ca3af", gradient: "linear-gradient(135deg,#6b7280,#4b5563)",
    badgeBg: "#f3f4f6",
  },
  CANCELLED: {
    bg: "rgba(239,68,68,0.08)", text: "#dc2626", border: "#ef4444",
    icon: "#ef4444", dot: "#ef4444", gradient: "linear-gradient(135deg,#ef4444,#dc2626)",
    badgeBg: "#fef2f2",
  },
};

const statusIcons: Record<string, React.ElementType> = {
  NEW: ShoppingBag, PREPARING: Flame, READY: CheckCircle2,
  COMPLETED: CheckCircle2, CANCELLED: XCircle,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const result = await getOrders({ status: activeTab, limit: 50 });
    setOrders(result.orders);
    setTotal(result.total);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) await loadOrders();
    setUpdatingId(null);
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);
  const getNextStatuses = (s: string) => OrderStatusFlow[s] || [];

  const nextStatusLabels: Record<string, { label: string; gradient: string; icon: React.ElementType }> = {
    PREPARING: { label: "بدء التحضير", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", icon: Flame },
    READY: { label: "جاهز للتسليم", gradient: "linear-gradient(135deg,#10b981,#059669)", icon: CheckCircle2 },
    COMPLETED: { label: "تم التسليم", gradient: "linear-gradient(135deg,#6b7280,#4b5563)", icon: CheckCircle2 },
    CANCELLED: { label: "إلغاء", gradient: "linear-gradient(135deg,#ef4444,#dc2626)", icon: XCircle },
  };

  // Compute stats
  const newCount = orders.filter(o => o.status === "NEW").length;
  const preparingCount = orders.filter(o => o.status === "PREPARING").length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const stats = [
    { title: "إجمالي الطلبات", value: `${total}`, unit: "طلب", icon: Package, color: "#3b82f6", bg: "#eff6ff" },
    { title: "طلبات جديدة", value: `${newCount}`, unit: "طلب", icon: ShoppingBag, color: "#f59e0b", bg: "#fffbeb" },
    { title: "قيد التحضير", value: `${preparingCount}`, unit: "طلب", icon: Flame, color: "#e57328", bg: "#fff7ed" },
    { title: "الإيرادات", value: `${totalRevenue.toFixed(0)}`, unit: "د.أ", icon: DollarSign, color: "#10b981", bg: "#ecfdf5" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>الطلبات</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>إدارة ومتابعة جميع الطلبات</p>
        </div>
        <button
          onClick={() => loadOrders()}
          style={{
            width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)",
            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
          }}
          title="تحديث"
        >
          <RefreshCw style={{ width: 16, height: 16, color: "#64748b" }} />
        </button>
        <OrderNotificationSound restaurantId="" onNewOrder={() => loadOrders()} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
        {stats.map((s) => (
          <div key={s.title} className="slide-up" style={{
            background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
            padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <s.icon style={{ width: 20, height: 20, color: s.color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, margin: 0, whiteSpace: "nowrap" }}>{s.title}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{s.value}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: isActive ? 700 : 500,
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                border: isActive ? "none" : "1px solid rgba(0,0,0,0.08)",
                background: isActive ? "linear-gradient(135deg, #e57328, #d4641c)" : "#fff",
                color: isActive ? "#fff" : "#64748b", cursor: "pointer",
                boxShadow: isActive ? "0 4px 14px rgba(229,115,40,0.3)" : "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                transform: isActive ? "scale(1.02)" : "scale(1)",
              }}
            >
              <TabIcon style={{ width: 14, height: 14 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 20px" }}>
          <Loader2 style={{ width: 36, height: 36, color: "#e57328", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#94a3b8" }}>جاري تحميل الطلبات...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid rgba(0,0,0,0.06)",
          padding: "64px 20px", textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "#fff7ed",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <ShoppingBag style={{ width: 32, height: 32, color: "#e57328", opacity: 0.6 }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>لا توجد طلبات</h3>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {activeTab === "ALL" ? "لم يتم استلام أي طلبات بعد" : `لا توجد طلبات بحالة "${statusTabs.find(t => t.key === activeTab)?.label}"`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map((order, idx) => {
            const isExpanded = expandedId === order.id;
            const StatusIcon = statusIcons[order.status] || ShoppingBag;
            const cfg = statusConfig[order.status] || statusConfig.COMPLETED;
            const nextStatuses = getNextStatuses(order.status);

            return (
              <div
                key={order.id}
                className="slide-up"
                style={{
                  background: "#fff", borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: isExpanded ? "0 8px 25px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                  overflow: "hidden", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                  borderRight: `4px solid ${cfg.border}`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Order Row */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  style={{
                    width: "100%", padding: "16px 20px", display: "flex",
                    alignItems: "center", justifyContent: "space-between",
                    background: "transparent", border: "none", cursor: "pointer",
                    textAlign: "right", transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.015)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Status Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: cfg.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, position: "relative",
                    }}>
                      <StatusIcon style={{ width: 20, height: 20, color: cfg.icon }} />
                      {order.status === "NEW" && (
                        <span style={{
                          position: "absolute", top: -2, left: -2, width: 10, height: 10,
                          borderRadius: "50%", background: "#3b82f6", border: "2px solid #fff",
                          animation: "pulse-soft 2s ease-in-out infinite",
                        }} />
                      )}
                    </div>
                    {/* Order Info */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", fontFamily: "inherit" }}>
                          #{order.orderNumber}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 8,
                          background: cfg.badgeBg, color: cfg.text, letterSpacing: "0.01em",
                        }}>
                          {OrderStatusLabel[order.status] || order.status}
                        </span>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6, marginTop: 4,
                        fontSize: 12, color: "#94a3b8", flexWrap: "wrap",
                      }}>
                        <span>{order.restaurant?.nameAr}</span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>{OrderTypeLabel[order.orderType] || order.orderType}</span>
                        {order.table && (
                          <><span style={{ opacity: 0.4 }}>•</span><span>طاولة {order.table.tableNumber}</span></>
                        )}
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Clock style={{ width: 11, height: 11 }} />
                          {new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Price & Toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                        {order.total.toFixed(2)}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8", marginRight: 3 }}>د.أ</span>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: isExpanded ? cfg.bg : "#f8fafc",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                      {isExpanded
                        ? <ChevronUp style={{ width: 16, height: 16, color: cfg.text }} />
                        : <ChevronDown style={{ width: 16, height: 16, color: "#94a3b8" }} />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid rgba(0,0,0,0.05)", padding: "20px",
                    background: "linear-gradient(180deg, rgba(248,250,252,0.5) 0%, rgba(255,255,255,0) 100%)",
                    animation: "slideDown 0.25s ease-out",
                  }}>
                    <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

                    {/* Customer Info */}
                    {(order.customerName || order.customerPhone || order.deliveryAddress || order.notes) && (
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16,
                        padding: "12px 16px", borderRadius: 12,
                        background: "rgba(248,250,252,0.8)", border: "1px solid rgba(0,0,0,0.04)",
                      }}>
                        {order.customerName && (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                            <User style={{ width: 14, height: 14, color: "#94a3b8" }} /> {order.customerName}
                          </span>
                        )}
                        {order.customerPhone && (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                            <Phone style={{ width: 14, height: 14, color: "#94a3b8" }} /> {order.customerPhone}
                          </span>
                        )}
                        {order.deliveryAddress && (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                            <MapPin style={{ width: 14, height: 14, color: "#94a3b8" }} /> {order.deliveryAddress}
                          </span>
                        )}
                        {order.notes && (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                            <FileText style={{ width: 14, height: 14, color: "#94a3b8" }} /> {order.notes}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Items Table */}
                    <div style={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", background: "#fff" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 12 }}>العنصر</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 12 }}>الكمية</th>
                            <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "#64748b", fontSize: 12 }}>السعر</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                              <td style={{ padding: "12px 16px" }}>
                                <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>{item.itemName}</p>
                                {item.sizeName && <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>الحجم: {item.sizeName}</p>}
                                {item.extras && <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>إضافات: {JSON.parse(item.extras).join("، ")}</p>}
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center", color: "#475569", fontVariantNumeric: "tabular-nums" }}>{item.quantity}</td>
                              <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                                {item.totalPrice.toFixed(2)} د.أ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f8fafc", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            <td colSpan={2} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#334155" }}>الإجمالي</td>
                            <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800, color: "#0f172a", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                              {order.total.toFixed(2)} د.أ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                      {nextStatuses.length > 0 && nextStatuses.map((status) => {
                          const info = nextStatusLabels[status];
                          if (!info) return null;
                          const ActionIcon = info.icon;
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(order.id, status)}
                              disabled={updatingId === order.id}
                              style={{
                                padding: "8px 18px", borderRadius: 10, border: "none",
                                background: info.gradient, color: "#fff", fontSize: 13,
                                fontWeight: 600, cursor: "pointer", display: "flex",
                                alignItems: "center", gap: 6,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                opacity: updatingId === order.id ? 0.7 : 1,
                                transition: "all 0.2s",
                              }}
                            >
                              {updatingId === order.id
                                ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                                : <ActionIcon style={{ width: 14, height: 14 }} />}
                              {info.label}
                            </button>
                          );
                        })}

                      {/* Delete button — shown for completed/cancelled orders */}
                      {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
                        <button
                          onClick={async () => {
                            if (!confirm(`هل أنت متأكد من حذف الطلب #${order.orderNumber}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
                            setDeletingId(order.id);
                            const result = await deleteOrder(order.id);
                            if (result.success) {
                              await loadOrders();
                            } else {
                              alert(result.error || "حدث خطأ");
                            }
                            setDeletingId(null);
                          }}
                          disabled={deletingId === order.id}
                          style={{
                            padding: "8px 18px", borderRadius: 10,
                            border: "1px solid rgba(239,68,68,0.3)",
                            background: "rgba(239,68,68,0.06)", color: "#dc2626", fontSize: 13,
                            fontWeight: 600, cursor: "pointer", display: "flex",
                            alignItems: "center", gap: 6,
                            opacity: deletingId === order.id ? 0.7 : 1,
                            transition: "all 0.2s",
                          }}
                        >
                          {deletingId === order.id
                            ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                            : <Trash2 style={{ width: 14, height: 14 }} />}
                          حذف الطلب
                        </button>
                      )}

                      {/* Print Button */}
                      <PrintOrderButton order={{
                        orderNumber: order.orderNumber,
                        customerName: order.customerName || "زبون",
                        customerPhone: order.customerPhone,
                        orderType: order.orderType,
                        status: order.status,
                        subtotal: order.subtotal,
                        tax: (order as any).tax || 0,
                        serviceCharge: (order as any).serviceCharge || 0,
                        total: order.total,
                        notes: order.notes,
                        createdAt: order.createdAt.toISOString(),
                        items: order.items.map((i: any) => ({
                          itemName: i.itemName,
                          quantity: i.quantity,
                          unitPrice: i.unitPrice,
                          totalPrice: i.totalPrice,
                          sizeName: i.sizeName,
                          extras: i.extras,
                        })),
                        restaurantName: order.restaurant?.nameAr || "المطعم",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
