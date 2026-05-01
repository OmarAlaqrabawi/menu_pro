"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  createItem, updateItem, deleteItem, toggleItemAvailability,
  addItemSize, deleteItemSize, addItemExtra, deleteItemExtra, deleteItemImage,
  copyItem, copyCategory, reorderItems,
} from "@/actions/menu";
import { getRestaurants } from "@/actions/restaurant";
import {
  UtensilsCrossed, Plus, Trash2, Edit3, Check, X, ChevronDown,
  GripVertical, Eye, EyeOff, Loader2, Package, Tag,
  DollarSign, Store, ArrowRight, AlertCircle, Copy, Download, Upload, Image as ImageIcon, Trash2 as Trash2Icon,
} from "lucide-react";

/* ─── Types ─── */
interface ItemSize { id: string; nameAr: string; nameEn?: string | null; price: number }
interface ItemExtra { id: string; nameAr: string; nameEn?: string | null; price: number }
interface ItemImage { id: string; imageUrl: string; sortOrder: number }
interface MenuItem {
  id: string; nameAr: string; nameEn?: string | null; descAr?: string | null;
  price: number; discountPrice?: number | null; badge?: string | null;
  isAvailable: boolean; sortOrder: number; calories?: number | null; prepTime?: number | null;
  sizes: ItemSize[]; extras: ItemExtra[]; images: ItemImage[];
}
interface Category {
  id: string; nameAr: string; nameEn?: string | null; emoji?: string | null;
  isVisible: boolean; sortOrder: number; items: MenuItem[];
}
interface RestaurantOption { id: string; nameAr: string; ownerCanEditMenu?: boolean }

/* ═══════ Main Component ═══════ */
export default function MenuManagementPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Dialog state
  const [dialog, setDialog] = useState<null | "category" | "item" | "editItem">(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Load restaurants
  const [userRole, setUserRole] = useState<string>("RESTAURANT_OWNER");

  useEffect(() => {
    async function load() {
      const data = await getRestaurants();
      const mapped = data.map((r: any) => ({ id: r.id, nameAr: r.nameAr, ownerCanEditMenu: r.ownerCanEditMenu }));
      setRestaurants(mapped);
      if (mapped.length > 0) {
        setSelectedRestaurant(mapped[0].id);
      }
      setLoading(false);
    }
    load();
    // Get user role
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.role) setUserRole(s.user.role);
    }).catch(() => {});
  }, []);

  // Load categories when restaurant changes
  const loadCategories = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    const cats = await getCategories(selectedRestaurant);
    setCategories(cats as Category[]);
    if (cats.length > 0 && !activeCategory) {
      setActiveCategory(cats[0].id);
    }
    setLoading(false);
  }, [selectedRestaurant, activeCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const currentCategory = categories.find(c => c.id === activeCategory);

  /* ─── Input styles ─── */
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 };
  const btnPrimary: React.CSSProperties = {
    padding: "8px 18px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #e57328, #d4641c)", color: "#fff",
    fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  };
  const btnOutline: React.CSSProperties = {
    padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
    background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  };

  if (loading && restaurants.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#e57328" }} />
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Store style={{ width: 56, height: 56, color: "#d1d5db", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>لا توجد مطاعم</h2>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 24px" }}>أضف مطعم أولاً لتتمكن من إدارة المنيو</p>
        <Link href="/dashboard/restaurants/create" style={{ ...btnPrimary, display: "inline-flex", textDecoration: "none" }}>
          <Plus style={{ width: 16, height: 16 }} /> إضافة مطعم
        </Link>
      </div>
    );
  }

  const selectedRest = restaurants.find(r => r.id === selectedRestaurant);
  const canEdit = userRole === "ADMIN" || selectedRest?.ownerCanEditMenu !== false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

      {/* Permission overlay */}
      {!canEdit && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, padding: "48px 44px",
            textAlign: "center", maxWidth: 440, width: "90%",
            boxShadow: "0 25px 60px rgba(0,0,0,0.12)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#fef3c7", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px",
            }}>
              <AlertCircle style={{ width: 32, height: 32, color: "#d97706" }} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
              تعديل المنيو غير متاح
            </h3>
            <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.8 }}>
              للتعديل على المنيو، قم بالتواصل مع الإدارة للحصول على صلاحيات التعديل
            </p>
            <div style={{
              padding: "14px 24px", borderRadius: 14,
              background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
              border: "1px solid rgba(229,115,40,0.2)",
              fontSize: 15, fontWeight: 600, color: "#e57328",
            }}>
              📞 تواصل مع الإدارة
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>إدارة المنيو</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>إضافة وتعديل الأقسام والعناصر</p>
        </div>

        {/* Restaurant Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurant}
            onChange={(e) => { setSelectedRestaurant(e.target.value); setActiveCategory(null); }}
            style={{
              padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 14, fontWeight: 600, background: "#fff", cursor: "pointer", minWidth: 180,
            }}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.nameAr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Import/Export Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={async () => {
            if (!selectedRestaurant) return;
            const res = await fetch(`/api/menu/export?restaurantId=${selectedRestaurant}`);
            const data = await res.json();
            const ExcelJS = await import("exceljs");
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("المنيو");
            if (data.exportData.length > 0) {
              ws.addRow(Object.keys(data.exportData[0]));
              data.exportData.forEach((row: Record<string, unknown>) => ws.addRow(Object.values(row)));
            }
            const buf = await wb.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `menu_export_${new Date().toISOString().split("T")[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{ ...btnOutline, color: "#16a34a" }}
        >
          <Download style={{ width: 14, height: 14 }} /> تصدير Excel
        </button>
        <label style={{ ...btnOutline, color: "#3b82f6", cursor: "pointer" }}>
          <Upload style={{ width: 14, height: 14 }} /> استيراد
          <input type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !selectedRestaurant) return;
            const ExcelJS = await import("exceljs");
            const wb = new ExcelJS.Workbook();
            const arrayBuf = await file.arrayBuffer();
            await wb.xlsx.load(arrayBuf);
            const ws = wb.worksheets[0];
            if (!ws || ws.rowCount < 2) { alert("الملف فارغ"); return; }
            // Extract headers from row 1, data from remaining rows
            const headers: string[] = [];
            ws.getRow(1).eachCell((cell, colNumber) => { headers[colNumber - 1] = String(cell.value ?? ""); });
            const jsonData: Record<string, unknown>[] = [];
            ws.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return;
              const obj: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => { obj[headers[colNumber - 1]] = cell.value; });
              jsonData.push(obj);
            });
            if (jsonData.length === 0) { alert("الملف فارغ"); return; }
            if (!confirm(`سيتم استيراد ${jsonData.length} عنصر. متابعة؟`)) return;
            const res = await fetch("/api/menu/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ restaurantId: selectedRestaurant, items: jsonData }),
            });
            const result = await res.json();
            if (result.success) {
              alert(`✅ تم استيراد ${result.imported} عنصر في ${result.categories} قسم`);
              loadCategories();
            } else {
              alert(result.error || "خطأ في الاستيراد");
            }
            e.target.value = "";
          }} />
        </label>
      </div>

      {/* Main Layout: Sidebar Categories + Items */}
      <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: 20 }}>

        {/* ─── Categories Sidebar ─── */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
        }}>
          <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>الأقسام</h3>
            <button onClick={() => { setEditingCategory(null); setDialog("category"); }} style={{ ...btnPrimary, padding: "6px 12px", fontSize: 12 }}>
              <Plus style={{ width: 14, height: 14 }} /> إضافة
            </button>
          </div>

          <div style={{ padding: 8 }}>
            {categories.length === 0 ? (
              <p style={{ textAlign: "center", padding: 24, color: "#9ca3af", fontSize: 13 }}>لا توجد أقسام</p>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center justify-between w-full"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: activeCategory === cat.id ? "#fff7ed" : "transparent",
                    color: activeCategory === cat.id ? "#e57328" : "#374151",
                    fontSize: 14,
                    fontWeight: activeCategory === cat.id ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "right",
                    transition: "all 0.2s ease",
                    marginBottom: 2,
                  }}
                >
                  <span className="flex items-center gap-2">
                    {cat.emoji && <span style={{ fontSize: 16 }}>{cat.emoji}</span>}
                    <span>{cat.nameAr}</span>
                  </span>
                  <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 8 }}>
                    {cat.items.length}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ─── Items Panel ─── */}
        <div className="lg:col-span-3" style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
        }}>
          {!currentCategory ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#9ca3af" }}>
              <Package style={{ width: 48, height: 48, margin: "0 auto 12px", opacity: 0.3 }} />
              <p>اختر قسم من القائمة لعرض العناصر</p>
            </div>
          ) : (
            <>
              {/* Category Header */}
              <div className="flex items-center justify-between" style={{ padding: "16px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-3">
                  {currentCategory.emoji && <span style={{ fontSize: 20 }}>{currentCategory.emoji}</span>}
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{currentCategory.nameAr}</h3>
                    {currentCategory.nameEn && <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{currentCategory.nameEn}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingCategory(currentCategory); setDialog("category"); }}
                    style={btnOutline}
                  >
                    <Edit3 style={{ width: 14, height: 14 }} /> تعديل
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("هل تريد حذف هذا القسم وجميع عناصره؟")) {
                        await deleteCategory(currentCategory.id);
                        setActiveCategory(null);
                        loadCategories();
                      }
                    }}
                    style={{ ...btnOutline, color: "#dc2626", borderColor: "rgba(220,38,38,0.2)" }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} /> حذف
                  </button>
                  <button
                    onClick={async () => {
                      const result = await copyCategory(currentCategory.id);
                      if (result.success) { loadCategories(); alert("✅ تم نسخ القسم"); }
                      else alert(result.error || "خطأ");
                    }}
                    style={btnOutline}
                  >
                    <Copy style={{ width: 14, height: 14 }} /> نسخ
                  </button>
                  <button
                    onClick={() => { setEditingItem(null); setDialog("item"); }}
                    style={btnPrimary}
                  >
                    <Plus style={{ width: 16, height: 16 }} /> إضافة عنصر
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div style={{ padding: 16 }}>
                {currentCategory.items.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                    <UtensilsCrossed style={{ width: 40, height: 40, margin: "0 auto 8px", opacity: 0.3 }} />
                    <p>لا توجد عناصر في هذا القسم</p>
                    <button onClick={() => { setEditingItem(null); setDialog("item"); }} style={{ ...btnPrimary, display: "inline-flex", marginTop: 12 }}>
                      <Plus style={{ width: 14, height: 14 }} /> إضافة أول عنصر
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentCategory.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                        style={{
                          padding: "14px 18px",
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,0.05)",
                          background: item.isAvailable ? "#fff" : "#fafafa",
                          opacity: item.isAvailable ? 1 : 0.6,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div className="flex items-center gap-3" style={{ flex: 1 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1px solid rgba(0,0,0,0.04)", overflow: "hidden",
                          }}>
                            {item.images?.length > 0 ? (
                              <img src={item.images[0].imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <UtensilsCrossed style={{ width: 20, height: 20, color: "#6b7280" }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.nameAr}</span>
                              {item.badge && (
                                <span style={{
                                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                                  background: item.badge === "NEW" ? "#dbeafe" : item.badge === "POPULAR" ? "#fef3c7" : "#dcfce7",
                                  color: item.badge === "NEW" ? "#2563eb" : item.badge === "POPULAR" ? "#d97706" : "#16a34a",
                                }}>
                                  {item.badge === "NEW" ? "جديد" : item.badge === "POPULAR" ? "مميز" : "عرض"}
                                </span>
                              )}
                            </div>
                            {item.nameEn && <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{item.nameEn}</p>}
                            {item.sizes?.length > 0 && (
                              <span style={{ fontSize: 10, color: "#6b7280" }}>
                                {item.sizes.length} أحجام • 
                              </span>
                            )}
                            {item.extras?.length > 0 && (
                              <span style={{ fontSize: 10, color: "#6b7280" }}>
                                {item.extras.length} إضافات
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Price */}
                          <div style={{ textAlign: "left", minWidth: 70 }}>
                            {item.discountPrice ? (
                              <>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{item.discountPrice} د.أ</span>
                                <br />
                                <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>{item.price}</span>
                              </>
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.price} د.أ</span>
                            )}
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={async () => { await toggleItemAvailability(item.id); loadCategories(); }}
                            title={item.isAvailable ? "متاح" : "غير متاح"}
                            style={{
                              padding: 8, borderRadius: 8, border: "none",
                              background: "transparent", cursor: "pointer",
                              color: item.isAvailable ? "#10b981" : "#9ca3af",
                            }}
                          >
                            {item.isAvailable ? <Eye style={{ width: 18, height: 18 }} /> : <EyeOff style={{ width: 18, height: 18 }} />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => { setEditingItem(item); setDialog("editItem"); }}
                            style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                          >
                            <Edit3 style={{ width: 16, height: 16 }} />
                          </button>

                          {/* Copy Item */}
                          <button
                            onClick={async () => {
                              const result = await copyItem(item.id);
                              if (result.success) loadCategories();
                              else alert(result.error || "خطأ");
                            }}
                            style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                            title="نسخ العنصر"
                          >
                            <Copy style={{ width: 16, height: 16 }} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={async () => {
                              if (confirm("حذف هذا العنصر؟")) {
                                await deleteItem(item.id);
                                loadCategories();
                              }
                            }}
                            style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
                          >
                            <Trash2 style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════ Category Dialog ═══════ */}
      {dialog === "category" && (
        <CategoryDialog
          category={editingCategory}
          restaurantId={selectedRestaurant}
          onClose={() => setDialog(null)}
          onSave={() => { setDialog(null); loadCategories(); }}
        />
      )}

      {/* ═══════ Item Dialog ═══════ */}
      {(dialog === "item" || dialog === "editItem") && (
        <ItemDialog
          item={editingItem}
          categoryId={activeCategory || ""}
          onClose={() => setDialog(null)}
          onSave={() => { setDialog(null); loadCategories(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*            Category Dialog                  */
/* ═══════════════════════════════════════════ */
function CategoryDialog({ category, restaurantId, onClose, onSave }: {
  category: Category | null;
  restaurantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [nameAr, setNameAr] = useState(category?.nameAr || "");
  const [nameEn, setNameEn] = useState(category?.nameEn || "");
  const [emoji, setEmoji] = useState(category?.emoji || "");
  const [scheduleType, setScheduleType] = useState((category as any)?.scheduleType || "");
  const [scheduleStart, setScheduleStart] = useState((category as any)?.scheduleStart || "");
  const [scheduleEnd, setScheduleEnd] = useState((category as any)?.scheduleEnd || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");

    let result;
    const scheduleData = {
      scheduleType: scheduleType || undefined,
      scheduleStart: scheduleType === "CUSTOM" ? scheduleStart : undefined,
      scheduleEnd: scheduleType === "CUSTOM" ? scheduleEnd : undefined,
    };
    if (category) {
      result = await updateCategory(category.id, { nameAr, nameEn: nameEn || undefined, emoji: emoji || undefined, ...scheduleData });
    } else {
      result = await createCategory({ restaurantId, nameAr, nameEn: nameEn || undefined, emoji: emoji || undefined, sortOrder: 0, isVisible: true, ...scheduleData });
    }

    setLoading(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || "خطأ");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>
          {category ? "تعديل القسم" : "إضافة قسم جديد"}
        </h3>

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اسم القسم بالعربي *</label>
            <input style={inputStyle} placeholder="مثال: المشويات" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اسم القسم بالإنجليزي</label>
            <input style={inputStyle} placeholder="e.g. Grills" value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>أيقونة (Emoji)</label>
            <input style={inputStyle} placeholder="🍗" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>

          {/* Schedule */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>🕒 جدولة القسم</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              style={inputStyle}
            >
              <option value="">طوال اليوم (افتراضي)</option>
              <option value="ALL_DAY">طوال اليوم</option>
              <option value="BREAKFAST">فطور (6:00 - 11:00)</option>
              <option value="LUNCH">غداء (11:00 - 16:00)</option>
              <option value="DINNER">عشاء (16:00 - 23:00)</option>
              <option value="CUSTOM">وقت مخصص</option>
            </select>
            {scheduleType === "CUSTOM" && (
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#9ca3af" }}>من</label>
                  <input type="time" style={inputStyle} value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#9ca3af" }}>إلى</label>
                  <input type="time" style={inputStyle} value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 28 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>إلغاء</button>
          <button
            onClick={handleSave}
            disabled={loading || !nameAr.trim()}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none",
              background: nameAr.trim() ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
              color: nameAr.trim() ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
            {category ? "تحديث" : "إضافة"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*               Item Dialog                   */
/* ═══════════════════════════════════════════ */
function ItemDialog({ item, categoryId, onClose, onSave }: {
  item: MenuItem | null;
  categoryId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [nameAr, setNameAr] = useState(item?.nameAr || "");
  const [nameEn, setNameEn] = useState(item?.nameEn || "");
  const [descAr, setDescAr] = useState(item?.descAr || "");
  const [price, setPrice] = useState(item?.price ?? 0);
  const [discountPrice, setDiscountPrice] = useState(item?.discountPrice ?? 0);
  const [badge, setBadge] = useState(item?.badge || "");
  const [calories, setCalories] = useState(item?.calories ?? 0);
  const [prepTime, setPrepTime] = useState(item?.prepTime ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sizes & Extras management
  const [sizes, setSizes] = useState<ItemSize[]>(item?.sizes || []);
  const [extras, setExtras] = useState<ItemExtra[]>(item?.extras || []);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizePrice, setNewSizePrice] = useState(0);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item || !e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        // Create ItemImage in DB
        await fetch("/api/menu/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id, imageUrl: data.url }),
        });
        onSave();
      }
    } catch { /* ignore */ }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    let result;
    if (item) {
      result = await updateItem(item.id, {
        nameAr, nameEn: nameEn || undefined, descAr: descAr || undefined,
        price, discountPrice: discountPrice || undefined, badge: (badge || undefined) as "NEW" | "POPULAR" | "OFFER" | undefined,
        calories: calories || undefined, prepTime: prepTime || undefined,
      });
    } else {
      result = await createItem({
        categoryId, nameAr, nameEn: nameEn || undefined, descAr: descAr || undefined,
        price, discountPrice: discountPrice || undefined, badge: (badge || undefined) as "NEW" | "POPULAR" | "OFFER" | undefined,
        calories: calories || undefined, prepTime: prepTime || undefined, sortOrder: 0, isAvailable: true,
      });
    }

    setLoading(false);
    if (result.success) {
      onSave();
    } else {
      setError(result.error || "خطأ");
    }
  };

  const handleAddSize = async () => {
    if (!item || !newSizeName.trim()) return;
    await addItemSize({ itemId: item.id, nameAr: newSizeName, price: newSizePrice });
    // Reload
    setNewSizeName("");
    setNewSizePrice(0);
    onSave();
  };

  const handleAddExtra = async () => {
    if (!item || !newExtraName.trim()) return;
    await addItemExtra({ itemId: item.id, nameAr: newExtraName, price: newExtraPrice });
    setNewExtraName("");
    setNewExtraPrice(0);
    onSave();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", padding: 20 }}>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>
          {item ? "تعديل العنصر" : "إضافة عنصر جديد"}
        </h3>

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الاسم بالعربي *</label>
              <input style={inputStyle} placeholder="تشكن برجر" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الاسم بالإنجليزي</label>
              <input style={inputStyle} placeholder="Chicken Burger" value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الوصف</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="وصف العنصر..." value={descAr} onChange={(e) => setDescAr(e.target.value)} dir="rtl" />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>السعر *</label>
              <input type="number" style={inputStyle} value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step={0.5} dir="ltr" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>سعر الخصم</label>
              <input type="number" style={inputStyle} value={discountPrice} onChange={(e) => setDiscountPrice(Number(e.target.value))} min={0} step={0.5} dir="ltr" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>السعرات</label>
              <input type="number" style={inputStyle} value={calories} onChange={(e) => setCalories(Number(e.target.value))} min={0} dir="ltr" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>وقت التحضير (دقيقة)</label>
              <input type="number" style={inputStyle} value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} min={0} dir="ltr" />
            </div>
          </div>

          {/* Badge */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الشارة</label>
            <div className="flex" style={{ gap: 8 }}>
              {[
                { value: "", label: "بدون" },
                { value: "NEW", label: "جديد" },
                { value: "POPULAR", label: "مميز" },
                { value: "OFFER", label: "عرض" },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBadge(b.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: badge === b.value ? "2px solid #e57328" : "1px solid rgba(0,0,0,0.1)",
                    background: badge === b.value ? "#fff7ed" : "#fafafa",
                    color: badge === b.value ? "#e57328" : "#6b7280",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Images (only for editing) */}
          {item && (
            <div style={{ paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "block", marginBottom: 8 }}>صور المنتج</label>
              {item.images && item.images.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 8 }}>
                  {item.images.map((img) => (
                    <div key={img.id} style={{ position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                      <img src={img.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={async () => { await deleteItemImage(img.id); onSave(); }}
                        style={{ position: "absolute", top: 2, right: 2, width: 22, height: 22, borderRadius: 6, background: "rgba(220,38,38,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <X style={{ width: 12, height: 12, color: "#fff" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10, border: "1px dashed rgba(0,0,0,0.15)",
                background: "#fafafa", fontSize: 12, fontWeight: 600, color: "#6b7280",
                cursor: uploading ? "wait" : "pointer",
              }}>
                {uploading ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <ImageIcon style={{ width: 14, height: 14 }} />}
                {uploading ? "جاري الرفع..." : "إضافة صورة"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          )}

          {/* Sizes (only for editing) */}
          {item && (
            <div style={{ paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "block", marginBottom: 8 }}>الأحجام</label>
              {sizes.map((s) => (
                <div key={s.id} className="flex items-center justify-between" style={{ padding: "6px 0", fontSize: 13 }}>
                  <span>{s.nameAr} — {s.price} د.أ</span>
                  <button onClick={async () => { await deleteItemSize(s.id); onSave(); }} style={{ color: "#dc2626", border: "none", background: "transparent", cursor: "pointer" }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="اسم الحجم" value={newSizeName} onChange={(e) => setNewSizeName(e.target.value)} />
                <input type="number" style={{ ...inputStyle, width: 80 }} placeholder="السعر" value={newSizePrice} onChange={(e) => setNewSizePrice(Number(e.target.value))} dir="ltr" />
                <button onClick={handleAddSize} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer" }}>
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}

          {/* Extras (only for editing) */}
          {item && (
            <div style={{ paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "block", marginBottom: 8 }}>الإضافات</label>
              {extras.map((e) => (
                <div key={e.id} className="flex items-center justify-between" style={{ padding: "6px 0", fontSize: 13 }}>
                  <span>{e.nameAr} — {e.price} د.أ</span>
                  <button onClick={async () => { await deleteItemExtra(e.id); onSave(); }} style={{ color: "#dc2626", border: "none", background: "transparent", cursor: "pointer" }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="اسم الإضافة" value={newExtraName} onChange={(e) => setNewExtraName(e.target.value)} />
                <input type="number" style={{ ...inputStyle, width: 80 }} placeholder="السعر" value={newExtraPrice} onChange={(e) => setNewExtraPrice(Number(e.target.value))} dir="ltr" />
                <button onClick={handleAddExtra} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer" }}>
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3" style={{ marginTop: 28 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>إلغاء</button>
          <button
            onClick={handleSave}
            disabled={loading || !nameAr.trim() || price <= 0}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none",
              background: (nameAr.trim() && price > 0) ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
              color: (nameAr.trim() && price > 0) ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
            {item ? "تحديث" : "إضافة"}
          </button>
        </div>
      </div>
    </div>
  );
}
