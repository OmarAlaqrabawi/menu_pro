"use client";

import { useState, useEffect } from "react";
import { getRestaurants, updateRestaurant } from "@/actions/restaurant";
import {
  Settings, Store, Phone, MapPin, Info, Clock,
  AtSign, MessageCircle, Save, Check, Loader2,
  Shield, Languages, Globe,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface Restaurant {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  descAr?: string | null;
  descEn?: string | null;
  slug: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  taxPercent: number;
  whatsapp?: string | null;
  phone?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  address?: string | null;
  enabledLangs: string;
  isActive: boolean;
  ownerCanEditMenu: boolean;
  ownerCanEditBranding: boolean;
  aboutAr?: string | null;
  aboutEn?: string | null;
  workingHours?: string | null;
  googleMapsUrl?: string | null;
}

export default function SettingsPage() {
  const [restaurants, setRestaurants] = useState<{ id: string; nameAr: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [userRole, setUserRole] = useState<string>("RESTAURANT_OWNER");

  // Form state
  const [form, setForm] = useState({
    nameAr: "", nameEn: "", descAr: "", descEn: "",
    logoUrl: "" as string | null,
    primaryColor: "#e57328", secondaryColor: "#1A1A2E",
    currency: "JOD", taxPercent: 16,
    whatsapp: "", phone: "", instagram: "", facebook: "", tiktok: "",
    address: "", googleMapsUrl: "",
    enabledLangs: "ar",
    aboutAr: "", aboutEn: "",
    workingHours: "" as string,
  });

  useEffect(() => {
    async function load() {
      const data = await getRestaurants();
      const mapped = data.map((r: any) => ({ id: r.id, nameAr: r.nameAr }));
      setRestaurants(mapped);
      if (mapped.length > 0) setSelectedId(mapped[0].id);
      setLoading(false);
    }
    load();
    // Get user role
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (s?.user?.role) setUserRole(s.user.role);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    async function loadRestaurant() {
      setLoading(true);
      const data = await getRestaurants();
      const r = data.find((r: any) => r.id === selectedId) as Restaurant | undefined;
      if (r) {
        setRestaurant(r);
        setForm({
          nameAr: r.nameAr || "",
          nameEn: r.nameEn || "",
          descAr: r.descAr || "",
          descEn: r.descEn || "",
          logoUrl: r.logoUrl || null,
          primaryColor: r.primaryColor || "#e57328",
          secondaryColor: r.secondaryColor || "#1A1A2E",
          currency: r.currency || "JOD",
          taxPercent: r.taxPercent ?? 15,
          whatsapp: r.whatsapp || "",
          phone: r.phone || "",
          instagram: r.instagram || "",
          facebook: r.facebook || "",
          tiktok: r.tiktok || "",
          address: r.address || "",
          googleMapsUrl: r.googleMapsUrl || "",
          enabledLangs: r.enabledLangs || "ar",
          aboutAr: r.aboutAr || "",
          aboutEn: r.aboutEn || "",
          workingHours: r.workingHours || "",
        });
      }
      setLoading(false);
    }
    loadRestaurant();
  }, [selectedId]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSaved(false);
    await updateRestaurant(selectedId, {
      nameAr: form.nameAr,
      nameEn: form.nameEn || undefined,
      descAr: form.descAr || undefined,
      descEn: form.descEn || undefined,
      logoUrl: form.logoUrl || undefined,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      currency: form.currency,
      taxPercent: form.taxPercent,
      whatsapp: form.whatsapp || undefined,
      phone: form.phone || undefined,
      instagram: form.instagram || undefined,
      facebook: form.facebook || undefined,
      tiktok: form.tiktok || undefined,
      address: form.address || undefined,
      googleMapsUrl: form.googleMapsUrl || undefined,
      enabledLangs: form.enabledLangs,
      aboutAr: form.aboutAr || undefined,
      aboutEn: form.aboutEn || undefined,
      workingHours: form.workingHours || undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general", label: "عام", icon: Store },
    { id: "about", label: "عن المطعم", icon: Info },
    { id: "contact", label: "التواصل", icon: Phone },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 };

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
        <Settings style={{ width: 56, height: 56, color: "#d1d5db", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151" }}>لا توجد مطاعم</h2>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>أضف مطعم أولاً لتتمكن من إدارة الإعدادات</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>الإعدادات</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>إعدادات وتخصيص المطعم</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 14, fontWeight: 600, background: "#fff", cursor: "pointer", minWidth: 180,
            }}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.nameAr}</option>
            ))}
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 24px", borderRadius: 12, border: "none",
              background: saved ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #e57328, #d4641c)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s ease",
            }}
          >
            {saving ? (
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
            ) : saved ? (
              <Check style={{ width: 16, height: 16 }} />
            ) : (
              <Save style={{ width: 16, height: 16 }} />
            )}
            {saving ? "جاري الحفظ..." : saved ? "تم الحفظ!" : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4" style={{ gap: 20 }}>
        {/* Tabs - horizontal scroll on mobile, vertical on desktop */}
        <div style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden", padding: 8,
        }}>
          <div className="flex lg:flex-col" style={{ gap: 2, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 lg:gap-3 lg:w-full"
                style={{
                  padding: "10px 14px", borderRadius: 12, border: "none",
                  background: activeTab === tab.id ? "#fff7ed" : "transparent",
                  color: activeTab === tab.id ? "#e57328" : "#374151",
                  fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: "pointer", textAlign: "right",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <tab.icon style={{ width: 18, height: 18 }} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3" style={{
          background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 28,
        }}>

          {/* General Tab */}
          {activeTab === "general" && (
            <div style={{ position: "relative" }}>
              {/* Permission overlay for general settings */}
              {restaurant && !restaurant.ownerCanEditBranding && userRole !== "ADMIN" && (
                <div style={{
                  position: "absolute", inset: -28, zIndex: 10,
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                  borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    background: "#fff", borderRadius: 20, padding: "36px 40px",
                    textAlign: "center", maxWidth: 400, width: "90%",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: "#fef3c7", display: "flex", alignItems: "center",
                      justifyContent: "center", margin: "0 auto 16px",
                    }}>
                      <Shield style={{ width: 28, height: 28, color: "#d97706" }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
                      التعديل غير متاح
                    </h3>
                    <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.7 }}>
                      للتعديل على إعدادات المطعم، قم بالتواصل مع الإدارة للحصول على صلاحيات التعديل
                    </p>
                    <div style={{
                      padding: "12px 20px", borderRadius: 12,
                      background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
                      border: "1px solid rgba(229,115,40,0.2)",
                      fontSize: 13, fontWeight: 600, color: "#e57328",
                    }}>
                      📞 تواصل مع الإدارة
                    </div>
                  </div>
                </div>
              )}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                المعلومات الأساسية
              </h3>

              {/* Restaurant Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ImageUpload
                  value={form.logoUrl}
                  onChange={(url) => setForm({ ...form, logoUrl: url })}
                  shape="circle"
                  size={90}
                />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>شعار المطعم</p>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>يظهر في المنيو وصفحة المطعم — PNG أو JPG (حد أقصى 5MB)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                <div>
                  <label style={labelStyle}>اسم المطعم بالعربي</label>
                  <input style={inputStyle} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" />
                </div>
                <div>
                  <label style={labelStyle}>اسم المطعم بالإنجليزي</label>
                  <input style={inputStyle} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>وصف المطعم بالعربي</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={form.descAr}
                  onChange={(e) => setForm({ ...form, descAr: e.target.value })}
                  dir="rtl"
                />
              </div>

              <div>
                <label style={labelStyle}>وصف المطعم بالإنجليزي</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={form.descEn}
                  onChange={(e) => setForm({ ...form, descEn: e.target.value })}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                <div>
                  <label style={labelStyle}>العملة</label>
                  <select
                    style={inputStyle}
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="JOD">دينار أردني (JOD)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="KWD">دينار كويتي (KWD)</option>
                    <option value="QAR">ريال قطري (QAR)</option>
                    <option value="BHD">دينار بحريني (BHD)</option>
                    <option value="OMR">ريال عماني (OMR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.taxPercent}
                    onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
                    min={0} max={50} dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>اللغات المفعلة</label>
                <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                  {[
                    { code: "ar", label: "العربية" },
                    { code: "en", label: "English" },
                    { code: "tr", label: "Türkçe" },
                  ].map((lang) => {
                    const active = form.enabledLangs.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          const langs = form.enabledLangs.split(",").filter(Boolean);
                          if (active && langs.length > 1) {
                            setForm({ ...form, enabledLangs: langs.filter((l) => l !== lang.code).join(",") });
                          } else if (!active) {
                            setForm({ ...form, enabledLangs: [...langs, lang.code].join(",") });
                          }
                        }}
                        style={{
                          padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                          border: active ? "2px solid #e57328" : "1px solid rgba(0,0,0,0.1)",
                          background: active ? "#fff7ed" : "#fafafa",
                          color: active ? "#e57328" : "#6b7280",
                        }}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>العنوان</label>
                <input
                  style={inputStyle}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="عنوان المطعم"
                  dir="rtl"
                />
              </div>
            </div>
            </div>
          )}


          {/* About Tab */}
          {activeTab === "about" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                عن المطعم
              </h3>

              <div>
                <label style={labelStyle}>نبذة عن المطعم (عربي)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  value={form.aboutAr}
                  onChange={(e) => setForm({ ...form, aboutAr: e.target.value })}
                  placeholder="اكتب نبذة تعريفية عن المطعم..."
                  dir="rtl"
                />
              </div>

              <div>
                <label style={labelStyle}>نبذة عن المطعم (إنجليزي)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  value={form.aboutEn}
                  onChange={(e) => setForm({ ...form, aboutEn: e.target.value })}
                  placeholder="Write a brief about your restaurant..."
                  dir="ltr"
                />
              </div>

              {/* Working Hours */}
              <div>
                <label style={labelStyle}>
                  <span className="flex items-center gap-2"><Clock style={{ width: 14, height: 14 }} /> ساعات العمل</span>
                </label>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>
                  أدخل ساعات العمل بصيغة JSON — مثال: {`{"السبت-الخميس": "9:00 - 23:00", "الجمعة": "14:00 - 23:00"}`}
                </p>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                  placeholder='{"السبت-الخميس": "9:00 - 23:00", "الجمعة": "14:00 - 23:00"}'
                  dir="ltr"
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "يومياً 9-23", value: '{"كل يوم": "9:00 AM - 11:00 PM"}' },
                    { label: "سبت-خميس + جمعة", value: '{"السبت - الخميس": "9:00 AM - 11:00 PM", "الجمعة": "2:00 PM - 11:00 PM"}' },
                    { label: "24 ساعة", value: '{"كل يوم": "24 ساعة"}' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, workingHours: preset.value })}
                      style={{
                        padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)",
                        background: "#fafafa", fontSize: 11, cursor: "pointer", color: "#374151",
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Google Maps */}
              <div>
                <label style={labelStyle}>
                  <span className="flex items-center gap-2"><MapPin style={{ width: 14, height: 14 }} /> رابط Google Maps</span>
                </label>
                <input
                  style={inputStyle}
                  value={form.googleMapsUrl}
                  onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                معلومات التواصل
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
                <div>
                  <label style={labelStyle}>
                    <span className="flex items-center gap-2"><MessageCircle style={{ width: 14, height: 14 }} /> واتساب</span>
                  </label>
                  <input
                    style={inputStyle}
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+966XXXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <span className="flex items-center gap-2"><Phone style={{ width: 14, height: 14 }} /> هاتف</span>
                  </label>
                  <input
                    style={inputStyle}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+966XXXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  <span className="flex items-center gap-2"><AtSign style={{ width: 14, height: 14 }} /> انستقرام</span>
                </label>
                <input
                  style={inputStyle}
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="username"
                  dir="ltr"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
