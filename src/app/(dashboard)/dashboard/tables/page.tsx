"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTables, createTable, bulkCreateTables,
  updateTable, deleteTable, generateTableQrUrl,
} from "@/actions/table";
import { getRestaurants } from "@/actions/restaurant";
import {
  Armchair, Plus, Trash2, QrCode, Download,
  Loader2, Store, Power, Copy, Check, Hash,
} from "lucide-react";

interface TableItem {
  id: string;
  tableNumber: string;
  qrCodeUrl?: string | null;
  isActive: boolean;
  _count?: { orders: number };
}
interface RestaurantOption { id: string; nameAr: string; slug: string }

export default function TablesPage() {
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dialog
  const [showDialog, setShowDialog] = useState<null | "single" | "bulk">(null);
  const [tableNumber, setTableNumber] = useState("");
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkStart, setBulkStart] = useState(1);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // QR Modal
  const [qrModal, setQrModal] = useState<{ url: string; tableNum: string } | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getRestaurants();
      const mapped = data.map((r: { id: string; nameAr: string; slug: string }) => ({
        id: r.id, nameAr: r.nameAr, slug: r.slug,
      }));
      setRestaurants(mapped);
      if (mapped.length > 0) setSelectedRestaurant(mapped[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const loadTables = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    const data = await getTables(selectedRestaurant);
    setTables(data as TableItem[]);
    setLoading(false);
  }, [selectedRestaurant]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const handleCreateSingle = async () => {
    setDialogLoading(true);
    setDialogError("");
    const result = await createTable({ restaurantId: selectedRestaurant, tableNumber });
    setDialogLoading(false);
    if (result.success) {
      setShowDialog(null);
      setTableNumber("");
      loadTables();
    } else {
      setDialogError(result.error || "خطأ");
    }
  };

  const handleCreateBulk = async () => {
    setDialogLoading(true);
    setDialogError("");
    const result = await bulkCreateTables({ restaurantId: selectedRestaurant, count: bulkCount, startNumber: bulkStart });
    setDialogLoading(false);
    if (result.success) {
      setShowDialog(null);
      loadTables();
    } else {
      setDialogError(result.error || "خطأ");
    }
  };

  const handleGenerateQr = async (tableId: string) => {
    const result = await generateTableQrUrl(tableId);
    if (result.success && result.url) {
      loadTables();
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };
  const btnPrimary: React.CSSProperties = {
    padding: "8px 18px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #e57328, #d4641c)", color: "#fff",
    fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  };

  if (restaurants.length === 0 && !loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Store style={{ width: 56, height: 56, color: "#d1d5db", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>لا توجد مطاعم</h2>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>أضف مطعم أولاً</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>إدارة الطاولات</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>إضافة الطاولات وتوليد أكواد QR</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, fontWeight: 600, background: "#fff", cursor: "pointer", minWidth: 180 }}
          >
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.nameAr}</option>)}
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Armchair style={{ width: 22, height: 22, color: "#8b5cf6" }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>إجمالي الطاولات</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }} className="tabular-nums">{tables.length}</p>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Armchair style={{ width: 22, height: 22, color: "#10b981" }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>طاولات نشطة</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }} className="tabular-nums">{tables.filter(t => t.isActive).length}</p>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCode style={{ width: 22, height: 22, color: "#3b82f6" }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>QR جاهز</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }} className="tabular-nums">{tables.filter(t => t.qrCodeUrl).length}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button onClick={() => setShowDialog("single")} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> إضافة طاولة
        </button>
        <button onClick={() => setShowDialog("bulk")} style={{ ...btnPrimary, background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
          <Hash style={{ width: 16, height: 16 }} /> إضافة مجموعة
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#e57328", margin: "0 auto" }} />
        </div>
      ) : tables.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "80px 20px", textAlign: "center", border: "1px solid rgba(0,0,0,0.06)" }}>
          <Armchair style={{ width: 56, height: 56, color: "#d1d5db", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>لا توجد طاولات</h3>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>أضف الطاولات لبدء استقبال الطلبات عبر QR</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 16 }}>
          {tables.map((table) => (
            <div
              key={table.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                overflow: "hidden",
                opacity: table.isActive ? 1 : 0.6,
              }}
            >
              {/* Table header */}
              <div style={{
                padding: "20px 20px 16px",
                textAlign: "center",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
                  background: table.isActive ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 20, fontWeight: 800,
                  boxShadow: table.isActive ? "0 4px 12px rgba(229, 115, 40, 0.3)" : "none",
                }}>
                  {table.tableNumber}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                  طاولة #{table.tableNumber}
                </h4>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  {table._count?.orders ?? 0} طلب
                </p>
              </div>

              {/* QR Section */}
              <div style={{ padding: 16 }}>
                {table.qrCodeUrl ? (
                  <div>
                    <div className="flex items-center gap-2" style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>
                      <Check style={{ width: 14, height: 14 }} /> QR جاهز
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyUrl(table.qrCodeUrl!, table.id)}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)",
                          background: "#f9fafb", fontSize: 12, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4, color: "#6b7280",
                        }}
                      >
                        {copiedId === table.id ? <Check style={{ width: 12, height: 12, color: "#10b981" }} /> : <Copy style={{ width: 12, height: 12 }} />}
                        {copiedId === table.id ? "تم النسخ!" : "نسخ الرابط"}
                      </button>
                      <button
                        onClick={() => setQrModal({ url: table.qrCodeUrl!, tableNum: table.tableNumber })}
                        style={{
                          padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)",
                          background: "#f9fafb", fontSize: 12, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4, color: "#6b7280",
                        }}
                      >
                        <QrCode style={{ width: 12, height: 12 }} /> عرض
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateQr(table.id)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed rgba(229, 115, 40, 0.3)",
                      background: "#fff7ed", color: "#e57328", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <QrCode style={{ width: 16, height: 16 }} /> توليد QR Code
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <button
                  onClick={async () => { await updateTable(table.id, { isActive: !table.isActive }); loadTables(); }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: table.isActive ? "#ecfdf5" : "#fef2f2",
                    color: table.isActive ? "#059669" : "#dc2626", fontSize: 11, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Power style={{ width: 12, height: 12 }} /> {table.isActive ? "نشط" : "معطل"}
                </button>
                <button
                  onClick={async () => { if (confirm("حذف هذه الطاولة؟")) { await deleteTable(table.id); loadTables(); } }}
                  style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ Create Dialog ═══════ */}
      {showDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setShowDialog(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>
              {showDialog === "single" ? "إضافة طاولة" : "إضافة مجموعة طاولات"}
            </h3>

            {dialogError && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{dialogError}</p>}

            {showDialog === "single" ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>رقم الطاولة</label>
                <input style={inputStyle} placeholder="1" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} dir="ltr" />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>عدد الطاولات</label>
                  <input type="number" style={inputStyle} value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} min={1} max={50} dir="ltr" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>يبدأ من رقم</label>
                  <input type="number" style={inputStyle} value={bulkStart} onChange={(e) => setBulkStart(Number(e.target.value))} min={1} dir="ltr" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3" style={{ marginTop: 28 }}>
              <button onClick={() => setShowDialog(null)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
              <button
                onClick={showDialog === "single" ? handleCreateSingle : handleCreateBulk}
                disabled={dialogLoading}
                style={{
                  ...btnPrimary, cursor: dialogLoading ? "wait" : "pointer",
                }}
              >
                {dialogLoading && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ QR Modal ═══════ */}
      {qrModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setQrModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>طاولة #{qrModal.tableNum}</h3>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 24px" }}>امسح الكود لفتح المنيو</p>

            {/* QR Code using external API */}
            <div style={{ margin: "0 auto 20px", width: 200, height: 200, borderRadius: 16, overflow: "hidden", border: "4px solid #f3f4f6" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModal.url)}`}
                alt={`QR Code - Table ${qrModal.tableNum}`}
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <p style={{ fontSize: 11, color: "#9ca3af", wordBreak: "break-all", margin: "0 0 20px" }}>{qrModal.url}</p>

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setQrModal(null)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, cursor: "pointer" }}>إغلاق</button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrModal.url)}&format=png`}
                download={`table-${qrModal.tableNum}-qr.png`}
                style={{ ...btnPrimary, textDecoration: "none" }}
              >
                <Download style={{ width: 14, height: 14 }} /> تحميل
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
