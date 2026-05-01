"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getRestaurants, toggleRestaurantStatus, updateOwnerPermissions, deleteRestaurant,
  updateRestaurant,
} from "@/actions/restaurant";
import {
  Store, UtensilsCrossed, ShoppingBag, Globe, MapPin,
  ExternalLink, Plus, Search, Settings, Trash2, Power,
  Shield, Edit3, AlertTriangle, X, Check, Loader2,
  Image as ImageIcon, Save, Phone as PhoneIcon,
} from "lucide-react";
import Link from "next/link";

interface Restaurant {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  ownerCanEditMenu: boolean;
  ownerCanEditBranding: boolean;
  ownerCanDeleteOrders: boolean;
  enabledLangs: string;
  address?: string | null;
  descAr?: string | null;
  descEn?: string | null;
  logoUrl?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  instagram?: string | null;
  currency?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
  _count?: { categories?: number; orders?: number };
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string>("RESTAURANT_OWNER");
  const isAdmin = userRole === "ADMIN";

  // Settings modal
  const [settingsRest, setSettingsRest] = useState<Restaurant | null>(null);
  const [toggling, setToggling] = useState(false);
  const [permUpdating, setPermUpdating] = useState(false);

  // Delete modal
  const [deleteRest, setDeleteRest] = useState<Restaurant | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Settings tab + edit state
  const [settingsTab, setSettingsTab] = useState<"edit" | "permissions">("edit");
  const [editForm, setEditForm] = useState<{
    nameAr: string; nameEn: string; slug: string; descAr: string;
    primaryColor: string; secondaryColor: string; logoUrl: string;
    whatsapp: string; phone: string; instagram: string; address: string; currency: string;
  }>({
    nameAr: "", nameEn: "", slug: "", descAr: "",
    primaryColor: "#FF6B35", secondaryColor: "#1A1A2E", logoUrl: "",
    whatsapp: "", phone: "", instagram: "", address: "", currency: "JOD",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadRestaurants();
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.role) setUserRole(s.user.role);
    }).catch(() => {});
  }, []);

  async function loadRestaurants() {
    setLoading(true);
    const data = await getRestaurants();
    setRestaurants(data as Restaurant[]);
    setLoading(false);
  }

  const filtered = restaurants.filter(r =>
    r.nameAr.includes(searchTerm) || (r.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalOrders = restaurants.reduce((sum, r) => sum + (r._count?.orders ?? 0), 0);
  const activeCount = restaurants.filter(r => r.isActive).length;

  // ─── Toggle Active ───
  async function handleToggleActive(id: string) {
    setToggling(true);
    await toggleRestaurantStatus(id);
    await loadRestaurants();
    setSettingsRest(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    setToggling(false);
  }

  // ─── Toggle Permission ───
  async function handleTogglePerm(id: string, field: "ownerCanEditMenu" | "ownerCanEditBranding" | "ownerCanDeleteOrders", currentValue: boolean) {
    setPermUpdating(true);
    await updateOwnerPermissions(id, { [field]: !currentValue });
    await loadRestaurants();
    setSettingsRest(prev => prev ? { ...prev, [field]: !currentValue } : null);
    setPermUpdating(false);
  }

  // ─── Delete ───
  async function handleDelete() {
    if (!deleteRest) return;
    setDeleting(true);
    setDeleteError("");
    const result = await deleteRestaurant(deleteRest.id, deleteConfirmName);
    if (result.success) {
      setDeleteRest(null);
      setDeleteConfirmName("");
      await loadRestaurants();
    } else {
      setDeleteError(result.error || "حدث خطأ");
    }
    setDeleting(false);
  }

  // ─── Open Settings and populate edit form ───
  function openSettings(rest: Restaurant) {
    setSettingsRest(rest);
    setSettingsTab("edit");
    setEditForm({
      nameAr: rest.nameAr || "", nameEn: rest.nameEn || "", slug: rest.slug || "",
      descAr: rest.descAr || "", primaryColor: rest.primaryColor || "#FF6B35",
      secondaryColor: rest.secondaryColor || "#1A1A2E", logoUrl: rest.logoUrl || "",
      whatsapp: rest.whatsapp || "", phone: rest.phone || "",
      instagram: rest.instagram || "", address: rest.address || "",
      currency: rest.currency || "JOD",
    });
  }

  // ─── Save Restaurant Edit ───
  async function handleSaveEdit() {
    if (!settingsRest) return;
    setSaving(true);
    const result = await updateRestaurant(settingsRest.id, {
      nameAr: editForm.nameAr,
      nameEn: editForm.nameEn || undefined,
      slug: editForm.slug,
      descAr: editForm.descAr || undefined,
      primaryColor: editForm.primaryColor,
      secondaryColor: editForm.secondaryColor,
      logoUrl: editForm.logoUrl || undefined,
      whatsapp: editForm.whatsapp || undefined,
      phone: editForm.phone || undefined,
      instagram: editForm.instagram || undefined,
      address: editForm.address || undefined,
      currency: editForm.currency || "JOD",
    });
    setSaving(false);
    if (result.success) {
      await loadRestaurants();
      alert("✅ تم حفظ التعديلات");
    } else {
      alert(result.error || "خطأ");
    }
  }

  // ─── Upload Logo ───
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert("خطأ في رفع الصورة: " + (data.error || res.statusText));
      } else if (data.url) {
        setEditForm(prev => ({ ...prev, logoUrl: data.url }));
      }
    } catch (err) {
      alert("فشل رفع الصورة — تأكد من الاتصال بالإنترنت");
      console.error("Upload error:", err);
    }
    setUploadingLogo(false);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#e57328" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>المطاعم</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6 }}>
            إدارة وتتبع جميع المطاعم المسجلة في المنصة
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/restaurants/create"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12,
              background: "linear-gradient(135deg, #e57328, #d4641c)",
              color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(229, 115, 40, 0.35)",
            }}
          >
            <Plus style={{ width: 18, height: 18 }} /> إضافة مطعم
          </Link>
        )}
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
        {[
          { label: "إجمالي المطاعم", value: String(restaurants.length), icon: Store, color: "#8b5cf6", bg: "#f5f3ff" },
          { label: "مطاعم نشطة", value: String(activeCount), icon: Store, color: "#10b981", bg: "#ecfdf5" },
          { label: "إجمالي الطلبات", value: String(totalOrders), icon: ShoppingBag, color: "#3b82f6", bg: "#eff6ff" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "#fff", borderRadius: 14, padding: "20px 24px",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: stat.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <stat.icon style={{ width: 22, height: 22, color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }} className="tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "4px 20px",
        border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12,
      }}>
        <Search style={{ width: 20, height: 20, color: "#9ca3af" }} />
        <input
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "12px 0", background: "transparent" }}
          placeholder="البحث في المطاعم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir="rtl"
        />
      </div>

      {/* ─── Restaurant Grid ─── */}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "80px 40px", textAlign: "center", border: "1px solid rgba(0,0,0,0.06)" }}>
          <Store style={{ width: 56, height: 56, color: "#d1d5db", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>لا توجد مطاعم</h3>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>لم يتم إضافة أي مطعم بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 20 }}>
          {filtered.map((restaurant) => {
            const owner = restaurant.user;
            return (
              <div key={restaurant.id} style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.02)",
                overflow: "hidden", transition: "all 0.3s ease",
              }}>
                {/* Gradient header */}
                <div style={{
                  height: 80,
                  background: `linear-gradient(135deg, ${restaurant.primaryColor}, ${restaurant.secondaryColor})`,
                  position: "relative", display: "flex", alignItems: "flex-end", padding: "0 24px",
                }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)` }} />

                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 800, color: restaurant.primaryColor,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "3px solid #fff",
                    position: "relative", bottom: -28, zIndex: 2,
                  }}>
                    {restaurant.nameAr.charAt(0)}
                  </div>

                  {/* Status badge */}
                  <div style={{
                    position: "absolute", top: 12, left: 16,
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 20,
                    background: restaurant.isActive ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)",
                    color: "#fff", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)",
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                    {restaurant.isActive ? "نشط" : "معطل"}
                  </div>

                  {/* Settings button — admin only */}
                  {isAdmin && (
                    <button
                      onClick={() => openSettings(restaurant)}
                      style={{
                        position: "absolute", top: 12, right: 16,
                        padding: "6px 10px", borderRadius: 8,
                        background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                        border: "none", color: "#fff", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 600,
                      }}
                    >
                      <Settings style={{ width: 14, height: 14 }} /> إعدادات
                    </button>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: "36px 24px 24px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                      {restaurant.nameAr}
                    </h3>
                    {restaurant.nameEn && <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{restaurant.nameEn}</p>}
                    {owner && (
                      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 13 }}>👤</span> {owner.name || owner.email}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2" style={{ gap: 10, marginBottom: 16 }}>
                    {[
                      { icon: UtensilsCrossed, value: restaurant._count?.categories ?? 0, label: "أقسام", color: "#8b5cf6", bg: "#f5f3ff" },
                      { icon: ShoppingBag, value: restaurant._count?.orders ?? 0, label: "طلبات", color: "#3b82f6", bg: "#eff6ff" },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 12, background: s.bg }}>
                        <s.icon style={{ width: 16, height: 16, color: s.color, margin: "0 auto 6px" }} />
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }} className="tabular-nums">{s.value}</p>
                        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Permissions badges — admin only */}
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                        background: restaurant.ownerCanEditMenu ? "#ecfdf5" : "#fef2f2",
                        color: restaurant.ownerCanEditMenu ? "#059669" : "#dc2626",
                      }}>
                        {restaurant.ownerCanEditMenu ? "✓ تعديل المنيو" : "✕ المنيو مقفل"}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                        background: restaurant.ownerCanEditBranding ? "#ecfdf5" : "#fef2f2",
                        color: restaurant.ownerCanEditBranding ? "#059669" : "#dc2626",
                      }}>
                        {restaurant.ownerCanEditBranding ? "✓ تعديل البراند" : "✕ البراند مقفل"}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.05)",
                    fontSize: 12, color: "#6b7280",
                  }}>
                    <span className="flex items-center gap-1">
                      <Globe style={{ width: 14, height: 14 }} /> {restaurant.enabledLangs.split(",").length} لغة
                    </span>
                    {restaurant.address && (
                      <span className="flex items-center gap-1" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} /> {restaurant.address}
                      </span>
                    )}
                    <Link
                      href={`/${restaurant.slug}`}
                      className="flex items-center gap-1"
                      style={{ marginInlineStart: "auto", color: "#e57328", fontWeight: 600, fontSize: 12, textDecoration: "none", flexShrink: 0 }}
                    >
                      <ExternalLink style={{ width: 14, height: 14 }} /> المنيو
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── Settings Modal ─── */}
      {/* ═══════════════════════════════════════════ */}
      {settingsRest && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={() => setSettingsRest(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520,
            maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "24px 28px", borderBottom: "1px solid rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>
                  إعدادات {settingsRest.nameAr}
                </h2>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>تعديل بيانات وصلاحيات المطعم</p>
              </div>
              <button onClick={() => setSettingsRest(null)} style={{
                padding: 8, borderRadius: 10, border: "none", background: "#f3f4f6",
                cursor: "pointer", color: "#6b7280",
              }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "0 28px" }}>
              {([
                { key: "edit" as const, label: "تعديل البيانات", icon: Edit3 },
                { key: "permissions" as const, label: "الصلاحيات", icon: Shield },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSettingsTab(tab.key)}
                  style={{
                    padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: "none", background: "transparent",
                    color: settingsTab === tab.key ? "#e57328" : "#9ca3af",
                    borderBottom: settingsTab === tab.key ? "2px solid #e57328" : "2px solid transparent",
                    display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                  }}
                >
                  <tab.icon style={{ width: 14, height: 14 }} /> {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ═══ Edit Tab ═══ */}
              {settingsTab === "edit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Logo */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>شعار المطعم</label>
                    <div className="flex items-center gap-4">
                      <div style={{
                        width: 72, height: 72, borderRadius: 16, overflow: "hidden",
                        border: "2px dashed rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#fafafa",
                      }}>
                        {editForm.logoUrl ? (
                          <img src={editForm.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <ImageIcon style={{ width: 28, height: 28, color: "#d1d5db" }} />
                        )}
                      </div>
                      <label style={{
                        padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
                        background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151",
                        cursor: uploadingLogo ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        {uploadingLogo ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <ImageIcon style={{ width: 14, height: 14 }} />}
                        {uploadingLogo ? "جاري الرفع..." : "تغيير الشعار"}
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo} />
                      </label>
                      {editForm.logoUrl && (
                        <button onClick={() => setEditForm(prev => ({ ...prev, logoUrl: "" }))}
                          style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>إزالة</button>
                      )}
                    </div>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اسم المطعم بالعربي *</label>
                      <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                        value={editForm.nameAr} onChange={(e) => setEditForm(prev => ({ ...prev, nameAr: e.target.value }))} dir="rtl" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اسم المطعم بالإنجليزي</label>
                      <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                        value={editForm.nameEn} onChange={(e) => setEditForm(prev => ({ ...prev, nameEn: e.target.value }))} dir="ltr" />
                    </div>
                  </div>

                  {/* Slug */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الرابط المختصر (slug)</label>
                    <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                      value={editForm.slug} onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} dir="ltr" placeholder="my-restaurant" />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>الوصف</label>
                    <textarea style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none", minHeight: 60, resize: "vertical" }}
                      value={editForm.descAr} onChange={(e) => setEditForm(prev => ({ ...prev, descAr: e.target.value }))} dir="rtl" />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2" style={{ gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اللون الرئيسي</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={editForm.primaryColor} onChange={(e) => setEditForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                          style={{ width: 40, height: 36, border: "none", borderRadius: 8, cursor: "pointer" }} />
                        <input style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13, background: "#fafafa", outline: "none" }}
                          value={editForm.primaryColor} onChange={(e) => setEditForm(prev => ({ ...prev, primaryColor: e.target.value }))} dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>اللون الثانوي</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={editForm.secondaryColor} onChange={(e) => setEditForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          style={{ width: 40, height: 36, border: "none", borderRadius: 8, cursor: "pointer" }} />
                        <input style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13, background: "#fafafa", outline: "none" }}
                          value={editForm.secondaryColor} onChange={(e) => setEditForm(prev => ({ ...prev, secondaryColor: e.target.value }))} dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>واتساب</label>
                      <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                        value={editForm.whatsapp} onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))} dir="ltr" placeholder="+962..." />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>هاتف</label>
                      <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                        value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} dir="ltr" placeholder="+962..." />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>انستغرام</label>
                      <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                        value={editForm.instagram} onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))} dir="ltr" placeholder="@restaurant" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>العنوان</label>
                      <input style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                        value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))} dir="rtl" placeholder="عمّان، الأردن" />
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>العملة</label>
                    <select value={editForm.currency} onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}>
                      <option value="JOD">دينار أردني (JOD)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="AED">درهم إماراتي (AED)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>

                  {/* Save */}
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editForm.nameAr.trim() || !editForm.slug.trim()}
                    style={{
                      padding: "10px 24px", borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #e57328, #d4641c)",
                      color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: (!editForm.nameAr.trim() || !editForm.slug.trim()) ? 0.5 : 1,
                    }}
                  >
                    {saving ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <Save style={{ width: 16, height: 16 }} />}
                    حفظ التعديلات
                  </button>
                </div>
              )}

              {/* ═══ Permissions Tab ═══ */}
              {settingsTab === "permissions" && (<>

              {/* ─── Active/Inactive Toggle ─── */}
              <div style={{
                padding: 20, borderRadius: 16,
                background: settingsRest.isActive ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${settingsRest.isActive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: settingsRest.isActive ? "#10b981" : "#ef4444",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Power style={{ width: 20, height: 20, color: "#fff" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>حالة المطعم</p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                        {settingsRest.isActive ? "المطعم نشط ومتاح للعملاء" : "المطعم معطل ولا يمكن الوصول إليه"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(settingsRest.id)}
                    disabled={toggling}
                    style={{
                      padding: "8px 20px", borderRadius: 10, border: "none",
                      background: settingsRest.isActive ? "#ef4444" : "#10b981",
                      color: "#fff", fontSize: 13, fontWeight: 600, cursor: toggling ? "wait" : "pointer",
                    }}
                  >
                    {toggling ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> :
                      settingsRest.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                </div>
              </div>

              {/* ─── Permissions ─── */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Shield style={{ width: 18, height: 18, color: "#8b5cf6" }} /> صلاحيات صاحب المطعم
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Menu edit */}
                  <div style={{
                    padding: 16, borderRadius: 14, background: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Edit3 style={{ width: 18, height: 18, color: "#6b7280" }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>تعديل المنيو</p>
                          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>السماح بإضافة وتعديل الأصناف والأقسام</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePerm(settingsRest.id, "ownerCanEditMenu", settingsRest.ownerCanEditMenu)}
                        disabled={permUpdating}
                        style={{
                          width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                          background: settingsRest.ownerCanEditMenu ? "#10b981" : "#d1d5db",
                          position: "relative", transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", background: "#fff",
                          position: "absolute", top: 3,
                          left: settingsRest.ownerCanEditMenu ? 3 : undefined,
                          right: settingsRest.ownerCanEditMenu ? undefined : 3,
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }} />
                      </button>
                    </div>
                  </div>

                  {/* Branding edit */}
                  <div style={{
                    padding: 16, borderRadius: 14, background: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Store style={{ width: 18, height: 18, color: "#6b7280" }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>تعديل البراند</p>
                          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>السماح بتغيير اسم المطعم والألوان والشعار</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePerm(settingsRest.id, "ownerCanEditBranding", settingsRest.ownerCanEditBranding)}
                        disabled={permUpdating}
                        style={{
                          width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                          background: settingsRest.ownerCanEditBranding ? "#10b981" : "#d1d5db",
                          position: "relative", transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", background: "#fff",
                          position: "absolute", top: 3,
                          left: settingsRest.ownerCanEditBranding ? 3 : undefined,
                          right: settingsRest.ownerCanEditBranding ? undefined : 3,
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }} />
                      </button>
                    </div>
                  </div>

                  {/* Delete orders */}
                  <div style={{
                    padding: 16, borderRadius: 14, background: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trash2 style={{ width: 18, height: 18, color: "#6b7280" }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>حذف الطلبات</p>
                          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>السماح بحذف الطلبات القديمة (المكتملة/الملغاة)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePerm(settingsRest.id, "ownerCanDeleteOrders", settingsRest.ownerCanDeleteOrders)}
                        disabled={permUpdating}
                        style={{
                          width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                          background: settingsRest.ownerCanDeleteOrders ? "#10b981" : "#d1d5db",
                          position: "relative", transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", background: "#fff",
                          position: "absolute", top: 3,
                          left: settingsRest.ownerCanDeleteOrders ? 3 : undefined,
                          right: settingsRest.ownerCanDeleteOrders ? undefined : 3,
                          transition: "all 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Danger Zone ─── */}
              <div style={{
                padding: 20, borderRadius: 16,
                background: "#fef2f2", border: "1px solid rgba(239,68,68,0.2)",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle style={{ width: 16, height: 16 }} /> منطقة الخطر
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
                  حذف المطعم سيؤدي لحذف جميع البيانات نهائياً (المنيو، الطلبات، الإحصائيات)
                </p>
                <button
                  onClick={() => { setDeleteRest(settingsRest); setSettingsRest(null); }}
                  style={{
                    padding: "8px 16px", borderRadius: 10,
                    border: "1px solid #dc2626", background: "#fff",
                    color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> حذف المطعم نهائياً
                </button>
              </div>
              </>)}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── Delete Confirmation Modal ─── */}
      {/* ═══════════════════════════════════════════ */}
      {deleteRest && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110 }}>
          <div onClick={() => { setDeleteRest(null); setDeleteConfirmName(""); setDeleteError(""); }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460,
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)", overflow: "hidden",
          }}>
            {/* Red header */}
            <div style={{
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              padding: "28px", textAlign: "center",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <AlertTriangle style={{ width: 32, height: 32, color: "#fff" }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>تأكيد حذف المطعم</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>هذا الإجراء لا يمكن التراجع عنه!</p>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Warning list */}
              <div style={{
                padding: 16, borderRadius: 14, background: "#fef2f2",
                border: "1px solid rgba(239,68,68,0.15)", marginBottom: 20,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", margin: "0 0 10px" }}>سيتم حذف التالي نهائياً:</p>
                <ul style={{ margin: 0, padding: "0 16px", fontSize: 13, color: "#6b7280", lineHeight: 2 }}>
                  <li>المنيو بالكامل (الأقسام والأصناف)</li>
                  <li>جميع الطلبات والسجلات</li>
                  <li>رمز QR الخاص بالمطعم</li>
                  <li>الإحصائيات والتحليلات</li>
                  <li>جميع البيانات المرتبطة</li>
                </ul>
              </div>

              {/* Confirm by name */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>
                  للتأكيد، أدخل اسم المطعم: <span style={{ color: "#dc2626", fontWeight: 800 }}>{deleteRest.nameAr}</span>
                </p>
                <input
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    border: deleteError ? "2px solid #dc2626" : "1px solid rgba(0,0,0,0.1)",
                    fontSize: 15, fontWeight: 600, outline: "none", textAlign: "center",
                    background: "#fafafa",
                  }}
                  placeholder="أدخل اسم المطعم هنا..."
                  value={deleteConfirmName}
                  onChange={(e) => { setDeleteConfirmName(e.target.value); setDeleteError(""); }}
                  dir="rtl"
                />
                {deleteError && (
                  <p style={{ fontSize: 12, color: "#dc2626", margin: "6px 0 0", fontWeight: 500 }}>{deleteError}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setDeleteRest(null); setDeleteConfirmName(""); setDeleteError(""); }}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
                    color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirmName !== deleteRest.nameAr}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12,
                    border: "none",
                    background: deleteConfirmName === deleteRest.nameAr
                      ? "linear-gradient(135deg, #dc2626, #991b1b)"
                      : "#e5e7eb",
                    color: deleteConfirmName === deleteRest.nameAr ? "#fff" : "#9ca3af",
                    fontSize: 14, fontWeight: 700,
                    cursor: deleteConfirmName === deleteRest.nameAr && !deleting ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {deleting ? (
                    <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> جاري الحذف...</>
                  ) : (
                    <><Trash2 style={{ width: 16, height: 16 }} /> تأكيد الحذف</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
