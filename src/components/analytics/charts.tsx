"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface ChartData {
  ordersByStatus: { status: string; count: number }[];
  topItems: { name: string; count: number; revenue: number }[];
  eventsByType: { type: string; count: number }[];
  monthRevenue: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  avgOrderValue: number;
  dailyData: { date: string; orders: number; revenue: number }[];
}

const COLORS = ["#e57328", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

const statusLabels: Record<string, string> = {
  NEW: "جديد", PREPARING: "قيد التحضير", READY: "جاهز",
  COMPLETED: "مكتمل", CANCELLED: "ملغي",
};

const eventLabels: Record<string, string> = {
  MENU_VIEW: "مشاهدات المنيو", ITEM_VIEW: "مشاهدات العناصر",
  CATEGORY_VIEW: "مشاهدات الأقسام", QR_SCAN: "مسح QR",
  ITEM_ADD_TO_CART: "إضافة للسلة", ORDER_PLACED: "طلبات",
};

export default function AnalyticsCharts({ data }: { data: ChartData }) {
  const [activeChart, setActiveChart] = useState<"orders" | "revenue" | "items" | "events">("orders");

  // Prepare pie data for order status
  const pieData = data.ordersByStatus.map((s) => ({
    name: statusLabels[s.status] || s.status,
    value: s.count,
  }));

  // Prepare bar data for top items
  const barData = data.topItems.slice(0, 8).map((item) => ({
    name: item.name.length > 12 ? item.name.slice(0, 12) + "..." : item.name,
    الكمية: item.count,
    الإيرادات: item.revenue,
  }));

  // Events data for horizontal bar
  const eventsBarData = data.eventsByType.map((e) => ({
    name: eventLabels[e.type] || e.type,
    العدد: e.count,
  }));

  // Export to Excel
  const handleExportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ["المقياس", "القيمة"],
      ["إيرادات الشهر", data.monthRevenue],
      ["طلبات اليوم", data.todayOrders],
      ["طلبات الأسبوع", data.weekOrders],
      ["طلبات الشهر", data.monthOrders],
      ["متوسط قيمة الطلب", data.avgOrderValue],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "ملخص");

    // Sheet 2: Top Items
    const itemsData = [
      ["الصنف", "الكمية", "الإيرادات"],
      ...data.topItems.map((i) => [i.name, i.count, i.revenue]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, ws2, "الأصناف");

    // Sheet 3: Order Status
    const statusData = [
      ["الحالة", "العدد"],
      ...data.ordersByStatus.map((s) => [statusLabels[s.status] || s.status, s.count]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, ws3, "حالات الطلبات");

    XLSX.writeFile(wb, `analytics_report_${new Date().toISOString().split("T")[0]}.xlsx`);
  }, [data]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Title
    doc.setFontSize(20);
    doc.text("Analytics Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US")}`, 105, 28, { align: "center" });

    // Summary
    doc.setFontSize(14);
    doc.text("Summary", 20, 45);
    doc.setFontSize(11);
    const summaryLines = [
      `Monthly Revenue: ${data.monthRevenue.toFixed(0)} JOD`,
      `Today Orders: ${data.todayOrders}`,
      `Week Orders: ${data.weekOrders}`,
      `Month Orders: ${data.monthOrders}`,
      `Avg Order Value: ${data.avgOrderValue.toFixed(1)} JOD`,
    ];
    summaryLines.forEach((line, i) => {
      doc.text(line, 20, 55 + i * 8);
    });

    // Top Items
    doc.setFontSize(14);
    doc.text("Top Items", 20, 105);
    doc.setFontSize(10);
    data.topItems.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name} - ${item.count} orders - ${item.revenue.toFixed(0)} JOD`, 20, 115 + i * 7);
    });

    doc.save(`analytics_report_${new Date().toISOString().split("T")[0]}.pdf`);
  }, [data]);

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 10, border: "none",
    background: isActive ? "#e57328" : "#f3f4f6",
    color: isActive ? "#fff" : "#6b7280",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Export Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(["orders", "revenue", "items", "events"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveChart(tab)}
              style={tabStyle(activeChart === tab)}
            >
              {tab === "orders" ? "الطلبات" : tab === "revenue" ? "الإيرادات" : tab === "items" ? "الأصناف" : "التفاعلات"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2"
            style={{
              padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
              background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#16a34a",
            }}
          >
            <FileSpreadsheet style={{ width: 14, height: 14 }} /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2"
            style={{
              padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
              background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#dc2626",
            }}
          >
            <FileText style={{ width: 14, height: 14 }} /> PDF
          </button>
        </div>
      </div>

      {/* Charts */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 24,
      }}>
        {/* Orders Status Pie Chart */}
        {activeChart === "orders" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
              📊 توزيع حالات الطلبات
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>لا توجد بيانات</p>
            )}
          </div>
        )}

        {/* Revenue Area Chart */}
        {activeChart === "revenue" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
              💰 الإيرادات اليومية
            </h3>
            {data.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={data.dailyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e57328" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e57328" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#e57328" strokeWidth={2} fill="url(#colorRevenue)" name="الإيرادات" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>لا توجد بيانات يومية</p>
            )}
          </div>
        )}

        {/* Top Items Bar Chart */}
        {activeChart === "items" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
              🏆 الأصناف الأكثر طلباً
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="الكمية" fill="#e57328" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>لا توجد بيانات</p>
            )}
          </div>
        )}

        {/* Events Bar Chart */}
        {activeChart === "events" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
              📈 تفاعلات المنيو
            </h3>
            {eventsBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={eventsBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="العدد" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {eventsBarData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>لا توجد تفاعلات</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
