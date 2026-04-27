"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRestaurant } from "@/actions/restaurant";
import {
  Store, Globe, MapPin, Phone, Palette,
  ArrowRight, Check, Loader2, Info,
} from "lucide-react";
import Link from "next/link";

export default function CreateRestaurantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // Form data
  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    slug: "",
    descAr: "",
    descEn: "",
    primaryColor: "#FF6B35",
    secondaryColor: "#1A1A2E",
    whatsapp: "",
    phone: "",
    instagram: "",
    address: "",
    currency: "JOD",
    taxPercent: 0,
    servicePercent: 0,
    enabledLangs: "ar",
    defaultLang: "ar",
    menuViewMode: "LIST" as "LIST" | "GRID",
  });

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from Arabic name
    if (field === "nameEn" && !form.slug) {
      const slug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await createRestaurant({
      nameAr: form.nameAr,
      nameEn: form.nameEn || undefined,
      slug: form.slug,
      descAr: form.descAr || undefined,
      descEn: form.descEn || undefined,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      whatsapp: form.whatsapp || undefined,
      phone: form.phone || undefined,
      instagram: form.instagram || undefined,
      address: form.address || undefined,
      currency: form.currency,
      taxPercent: form.taxPercent,
      servicePercent: form.servicePercent,
      enabledLangs: form.enabledLangs,
      defaultLang: form.defaultLang,
      menuViewMode: form.menuViewMode,
    });

    setLoading(false);

    if (result.success) {
      router.push("/dashboard/restaurants");
      router.refresh();
    } else {
      setError(result.error || "حدث خطأ");
    }
  };

  const steps = [
    { num: 1, label: "المعلومات الأساسية", icon: Store },
    { num: 2, label: "المظهر والألوان", icon: Palette },
    { num: 3, label: "التواصل والموقع", icon: Phone },
    { num: 4, label: "الإعدادات", icon: Globe },
  ];

  const canNext = () => {
    if (step === 1) return form.nameAr.trim().length >= 2 && form.slug.trim().length >= 2;
    return true;
  };

  /* ─── Input style helpers ─── */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.1)",
    fontSize: 14,
    background: "#fafafa",
    outline: "none",
    transition: "all 0.2s ease",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 32 }}>
        <Link
          href="/dashboard/restaurants"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            textDecoration: "none",
          }}
        >
          <ArrowRight style={{ width: 20, height: 20 }} />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>إضافة مطعم جديد</h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, marginTop: 2 }}>أكمل جميع البيانات لإنشاء المطعم</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center" style={{ marginBottom: 36, gap: 4 }}>
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center" style={{ flex: 1 }}>
              <button
                onClick={() => { if (isDone) setStep(s.num); }}
                className="flex items-center gap-2"
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "none",
                  cursor: isDone ? "pointer" : "default",
                  background: isActive ? "linear-gradient(135deg, #e57328, #d4641c)" : isDone ? "#ecfdf5" : "#f9fafb",
                  color: isActive ? "#fff" : isDone ? "#059669" : "#9ca3af",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {isDone ? <Check style={{ width: 14, height: 14 }} /> : <StepIcon style={{ width: 14, height: 14 }} />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div style={{ width: 20, height: 2, background: isDone ? "#10b981" : "#e5e7eb", flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: "#fef2f2",
          color: "#dc2626",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <Info style={{ width: 16, height: 16 }} />
          {error}
        </div>
      )}

      {/* Form Card */}
      <div 
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.02)",
          padding: 32,
        }}
      >
        {/* ─── Step 1: Basic Info ─── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>المعلومات الأساسية</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>بيانات المطعم التي ستظهر في المنيو</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
              <div>
                <label style={labelStyle}>اسم المطعم بالعربي *</label>
                <input
                  style={inputStyle}
                  placeholder="مثال: مطعم الريف"
                  value={form.nameAr}
                  onChange={(e) => updateField("nameAr", e.target.value)}
                  dir="rtl"
                />
              </div>
              <div>
                <label style={labelStyle}>اسم المطعم بالإنجليزي</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Al Reef Restaurant"
                  value={form.nameEn}
                  onChange={(e) => updateField("nameEn", e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>الرابط المختصر (Slug) *</label>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: 13, color: "#9ca3af", whiteSpace: "nowrap" }}>menupro.com/</span>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="al-reef"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  dir="ltr"
                />
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>أحرف إنجليزية صغيرة وأرقام وشرطات فقط</p>
            </div>

            <div>
              <label style={labelStyle}>وصف المطعم بالعربي</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="وصف مختصر عن المطعم..."
                value={form.descAr}
                onChange={(e) => updateField("descAr", e.target.value)}
                dir="rtl"
              />
            </div>

            <div>
              <label style={labelStyle}>وصف المطعم بالإنجليزي</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="Brief description..."
                value={form.descEn}
                onChange={(e) => updateField("descEn", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        )}

        {/* ─── Step 2: Branding ─── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>المظهر والألوان</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>تخصيص ألوان المنيو الخاصة بالمطعم</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
              <div>
                <label style={labelStyle}>اللون الأساسي</label>
                <div className="flex items-center" style={{ gap: 12 }}>
                  <input 
                    type="color" 
                    value={form.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    style={{ width: 48, height: 48, borderRadius: 12, border: "2px solid rgba(0,0,0,0.1)", cursor: "pointer", padding: 2 }}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.primaryColor}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>اللون الثانوي</label>
                <div className="flex items-center" style={{ gap: 12 }}>
                  <input 
                    type="color" 
                    value={form.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    style={{ width: 48, height: 48, borderRadius: 12, border: "2px solid rgba(0,0,0,0.1)", cursor: "pointer", padding: 2 }}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label style={labelStyle}>معاينة</label>
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    height: 100,
                    background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    color: form.primaryColor,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}>
                    {form.nameAr.charAt(0) || "م"}
                  </div>
                  <div>
                    <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>{form.nameAr || "اسم المطعم"}</p>
                    {form.nameEn && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0 }}>{form.nameEn}</p>}
                  </div>
                </div>
                <div style={{ padding: 16, background: "#fff" }}>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>هذا هو شكل رأس المنيو الخاص بالمطعم</p>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>طريقة عرض المنيو</label>
              <div className="flex" style={{ gap: 12 }}>
                {[
                  { value: "LIST", label: "قائمة" },
                  { value: "GRID", label: "شبكة" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateField("menuViewMode", mode.value)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: form.menuViewMode === mode.value ? "2px solid #e57328" : "1px solid rgba(0,0,0,0.1)",
                      background: form.menuViewMode === mode.value ? "#fff7ed" : "#fafafa",
                      color: form.menuViewMode === mode.value ? "#e57328" : "#6b7280",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Contact & Location ─── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>معلومات التواصل والموقع</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>بيانات التواصل مع المطعم</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
              <div>
                <label style={labelStyle}>رقم الواتساب</label>
                <input
                  style={inputStyle}
                  placeholder="+962791234567"
                  value={form.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  dir="ltr"
                />
              </div>
              <div>
                <label style={labelStyle}>رقم الهاتف</label>
                <input
                  style={inputStyle}
                  placeholder="+962791234567"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>حساب الانستقرام</label>
              <input
                style={inputStyle}
                placeholder="restaurant_name"
                value={form.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                dir="ltr"
              />
            </div>

            <div>
              <label style={labelStyle}>عنوان المطعم</label>
              <input
                style={inputStyle}
                placeholder="مثال: شارع المدينة المنورة، عمّان"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
        )}

        {/* ─── Step 4: Settings ─── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>الإعدادات</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>العملة والضرائب واللغات</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 20 }}>
              <div>
                <label style={labelStyle}>العملة</label>
                <select
                  style={inputStyle}
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                >
                  <option value="JOD">دينار أردني (JOD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                  <option value="BHD">دينار بحريني (BHD)</option>
                  <option value="QAR">ريال قطري (QAR)</option>
                  <option value="OMR">ريال عماني (OMR)</option>
                  <option value="USD">دولار (USD)</option>
                  <option value="TRY">ليرة تركية (TRY)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>نسبة الضريبة %</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="15"
                  min={0}
                  max={100}
                  value={form.taxPercent}
                  onChange={(e) => updateField("taxPercent", Number(e.target.value))}
                  dir="ltr"
                />
              </div>
              <div>
                <label style={labelStyle}>نسبة الخدمة %</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="0"
                  min={0}
                  max={100}
                  value={form.servicePercent}
                  onChange={(e) => updateField("servicePercent", Number(e.target.value))}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>اللغات المفعلة</label>
              <div className="flex flex-wrap" style={{ gap: 10 }}>
                {[
                  { code: "ar", label: "العربية" },
                  { code: "en", label: "الإنجليزية" },
                  { code: "tr", label: "التركية" },
                ].map((lang) => {
                  const isSelected = form.enabledLangs.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        if (lang.code === "ar") return; // Arabic is always enabled
                        const langs = form.enabledLangs.split(",").filter(Boolean);
                        const newLangs = isSelected
                          ? langs.filter((l) => l !== lang.code)
                          : [...langs, lang.code];
                        updateField("enabledLangs", newLangs.join(","));
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: isSelected ? "2px solid #e57328" : "1px solid rgba(0,0,0,0.1)",
                        background: isSelected ? "#fff7ed" : "#fafafa",
                        color: isSelected ? "#e57328" : "#6b7280",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: lang.code === "ar" ? "default" : "pointer",
                        opacity: lang.code === "ar" ? 0.8 : 1,
                      }}
                    >
                      {isSelected && <span style={{ marginInlineEnd: 4 }}>✓</span>}
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Navigation Buttons ─── */}
        <div className="flex items-center justify-between" style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.1)",
                background: "#fff",
                color: "#374151",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              السابق
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              style={{
                padding: "10px 28px",
                borderRadius: 12,
                border: "none",
                background: canNext() ? "linear-gradient(135deg, #e57328, #d4641c)" : "#e5e7eb",
                color: canNext() ? "#fff" : "#9ca3af",
                fontSize: 14,
                fontWeight: 600,
                cursor: canNext() ? "pointer" : "not-allowed",
                boxShadow: canNext() ? "0 4px 12px rgba(229, 115, 40, 0.3)" : "none",
              }}
            >
              التالي
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canNext()}
              className="flex items-center gap-2"
              style={{
                padding: "10px 28px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              {loading ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : <Check style={{ width: 18, height: 18 }} />}
              {loading ? "جاري الإنشاء..." : "إنشاء المطعم"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
