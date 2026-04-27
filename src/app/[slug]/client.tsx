"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, X, Check, Search,
  Phone, User, MessageCircle, MapPin, ChevronDown,
  Loader2, ChefHat, Clock, Flame, Star, Info, Globe,
} from "lucide-react";

/* ─── Types ─── */
interface ItemSize { id: string; nameAr: string; price: number }
interface ItemExtra { id: string; nameAr: string; price: number }
interface ItemImage { id: string; imageUrl: string; sortOrder: number }
interface MenuItem {
  id: string; nameAr: string; nameEn?: string | null; descAr?: string | null;
  price: number; discountPrice?: number | null; badge?: string | null;
  calories?: number | null; prepTime?: number | null;
  sizes: ItemSize[]; extras: ItemExtra[]; images: ItemImage[];
}
interface Category {
  id: string; nameAr: string; nameEn?: string | null; emoji?: string | null;
  scheduleType?: string | null; scheduleStart?: string | null; scheduleEnd?: string | null;
  items: MenuItem[];
}
interface RestaurantData {
  id: string; nameAr: string; nameEn?: string | null; descAr?: string | null;
  logoUrl?: string | null;
  primaryColor: string; secondaryColor: string; currency: string;
  taxPercent: number; servicePercent: number;
  whatsapp?: string | null; phone?: string | null; address?: string | null;
  instagram?: string | null; facebook?: string | null; tiktok?: string | null;
  googleMapsUrl?: string | null;
  aboutAr?: string | null; aboutEn?: string | null;
  workingHours?: string | null;
  categories: Category[];
}
interface CartItem {
  itemId: string; itemName: string; quantity: number; unitPrice: number;
  sizeName?: string; extras?: string[];
}

/* ═══════ Main Component ═══════ */
export default function CustomerMenuClient({ slug }: { slug: string }) {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inactive, setInactive] = useState<{ nameAr: string; nameEn?: string | null; logoUrl?: string | null; primaryColor: string; secondaryColor: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Item detail
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [itemQty, setItemQty] = useState(1);

  // Order form
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderType, setOrderType] = useState("DINE_IN");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: number; total: number } | null>(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("menuDarkMode") === "true";
    }
    return false;
  });
  useEffect(() => {
    localStorage.setItem("menuDarkMode", darkMode.toString());
  }, [darkMode]);

  // Rating
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Analytics tracking helper (fire-and-forget)
  const trackEvent = useCallback((eventType: string, extra?: { categoryId?: string; itemId?: string }) => {
    if (!restaurant) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurant.id, eventType, ...extra }),
    }).catch(() => {}); // silent fail
  }, [restaurant]);

  // Load restaurant
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/menu/${slug}`);
        if (res.status === 403) {
          const data = await res.json();
          if (data.error === "inactive") {
            setInactive(data);
            setLoading(false);
            return;
          }
        }
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        setRestaurant(data);
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
      } catch {
        setError("المطعم غير موجود أو غير متاح");
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  // Track MENU_VIEW once restaurant loads
  useEffect(() => {
    if (restaurant) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, eventType: "MENU_VIEW" }),
      }).catch(() => {});
    }
  }, [restaurant]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(() => {
    if (!restaurant || !searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    const results: MenuItem[] = [];
    restaurant.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.nameAr.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
          (item.descAr && item.descAr.toLowerCase().includes(q))
        ) {
          results.push(item);
        }
      });
    });
    return results;
  }, [restaurant, searchQuery]);


  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Schedule-based category filtering (must be before early returns per Rules of Hooks)
  const filteredCategories = useMemo(() => {
    if (!restaurant) return [];
    const now = new Date();
    const currentHour = now.getHours();
    return restaurant.categories.filter((cat) => {
      if (!cat.scheduleType || cat.scheduleType === "ALL_DAY") return true;
      if (cat.scheduleType === "BREAKFAST") return currentHour >= 6 && currentHour < 11;
      if (cat.scheduleType === "LUNCH") return currentHour >= 11 && currentHour < 16;
      if (cat.scheduleType === "DINNER") return currentHour >= 16 && currentHour < 23;
      if (cat.scheduleType === "CUSTOM" && cat.scheduleStart && cat.scheduleEnd) {
        const [sh] = cat.scheduleStart.split(":").map(Number);
        const [eh] = cat.scheduleEnd.split(":").map(Number);
        return currentHour >= sh && currentHour < eh;
      }
      return true;
    });
  }, [restaurant]);

  const addToCart = () => {
    if (!selectedItem) return;

    let itemPrice = selectedItem.discountPrice || selectedItem.price;
    const sizeObj = selectedItem.sizes.find(s => s.id === selectedSize);
    if (sizeObj) itemPrice = sizeObj.price;

    const extrasCost = selectedExtras.reduce((sum, eId) => {
      const ext = selectedItem.extras.find(e => e.id === eId);
      return sum + (ext?.price || 0);
    }, 0);

    const totalUnitPrice = itemPrice + extrasCost;

    const existingIndex = cart.findIndex(
      c => c.itemId === selectedItem.id && c.sizeName === (sizeObj?.nameAr || undefined) &&
        JSON.stringify(c.extras?.sort()) === JSON.stringify(selectedExtras.map(eId => selectedItem.extras.find(e => e.id === eId)?.nameAr).sort())
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += itemQty;
      setCart(newCart);
    } else {
      setCart([...cart, {
        itemId: selectedItem.id,
        itemName: selectedItem.nameAr,
        quantity: itemQty,
        unitPrice: totalUnitPrice,
        sizeName: sizeObj?.nameAr,
        extras: selectedExtras.map(eId => selectedItem.extras.find(e => e.id === eId)?.nameAr || ""),
      }]);
    }

    setSelectedItem(null);
    setSelectedSize(null);
    setSelectedExtras([]);
    setItemQty(1);

    // Track add to cart
    trackEvent("ITEM_ADD_TO_CART", { itemId: selectedItem.id });
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) newCart.splice(index, 1);
    setCart(newCart);
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant!.id,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          orderType,
          tableId: undefined,
          notes: orderNotes || undefined,
          items: cart.map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sizeName: item.sizeName,
            extras: item.extras,
          })),
        }),
      });

      const result = await res.json();

      if (result.success) {
        setOrderSuccess({ orderNumber: result.orderNumber, total: result.total });
        setCart([]);
        setShowCart(false);
        setShowOrderForm(false);
        // Track order placed
        trackEvent("ORDER_PLACED");
      } else {
        alert(result.error || "حدث خطأ");
      }
    } catch {
      alert("حدث خطأ في الاتصال");
    }

    setSubmitting(false);
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: "#e57328" }} />
      </div>
    );
  }

  // ─── Inactive / Disabled Restaurant ───
  if (inactive) {
    const ipc = inactive.primaryColor;
    const isc = inactive.secondaryColor;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${ipc}12, ${isc}08, #f5f5f7)`, padding: 20 }} dir="rtl">
        <style>{`@keyframes floatPulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.04)}}@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ textAlign: "center", maxWidth: 420, width: "100%", animation: "fadeInUp 0.6s ease-out" }}>
          {/* Icon */}
          <div style={{
            width: 100, height: 100, borderRadius: 30, margin: "0 auto 28px",
            background: `linear-gradient(135deg, ${ipc}, ${isc})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 16px 48px ${ipc}30, 0 4px 16px rgba(0,0,0,0.08)`,
            animation: "floatPulse 3s ease-in-out infinite",
          }}>
            <span style={{ fontSize: 44 }}>🔒</span>
          </div>

          {/* Name */}
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            {inactive.nameAr}
          </h1>
          {inactive.nameEn && (
            <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 28px", fontWeight: 500 }}>{inactive.nameEn}</p>
          )}

          {/* Card */}
          <div style={{
            background: "#fff", borderRadius: 24, padding: "36px 28px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
              background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>
              المنيو غير متاح حالياً
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.8, margin: "0 0 24px" }}>
              هذا المطعم معطّل مؤقتاً ولا يمكن استعراض المنيو أو تقديم الطلبات. يرجى المحاولة لاحقاً.
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12,
              background: `linear-gradient(135deg, ${ipc}12, ${isc}08)`,
              border: `1px solid ${ipc}20`,
            }}>
              <Clock style={{ width: 16, height: 16, color: ipc }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: ipc }}>سيتم إعادة التشغيل قريباً</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", textAlign: "center", padding: 20 }}>
        <div>
          <ChefHat style={{ width: 64, height: 64, color: "#d1d5db", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>غير متاح</h2>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>{error}</p>
        </div>
      </div>
    );
  }

  const pc = restaurant.primaryColor;
  const sc = restaurant.secondaryColor;
  const currency = restaurant.currency === "JOD" ? "د.أ" : restaurant.currency === "SAR" ? "ر.س" : restaurant.currency;

  // Dark mode colors
  const dm = {
    bg: darkMode ? "#0f0f1a" : "#f5f5f7",
    card: darkMode ? "#1a1a2e" : "#fff",
    text: darkMode ? "#f5f5f7" : "#111827",
    textSec: darkMode ? "#9ca3af" : "#6b7280",
    border: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    inputBg: darkMode ? "#252540" : "#fafafa",
  };

  const currentCategory = filteredCategories.find(c => c.id === activeCategory);

  // Share function
  const handleShare = (item: MenuItem) => {
    const url = `${window.location.origin}/${slug}?item=${item.id}`;
    const text = `${item.nameAr}${item.nameEn ? ` — ${item.nameEn}` : ""}\n${restaurant.nameAr}`;
    if (navigator.share) {
      navigator.share({ title: item.nameAr, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("تم نسخ الرابط ✓");
    }
  };

  // Rating submit
  const handleSubmitRating = async () => {
    if (!restaurant) return;
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        stars: ratingStars,
        comment: ratingComment || null,
        customerName: customerName || null,
      }),
    }).catch(() => {});
    setRatingSubmitted(true);
  };

  // ─── ORDER SUCCESS ───
  if (orderSuccess) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${pc}15, ${sc}10)`, padding: 20 }} dir="rtl">
        <div style={{ background: "#fff", borderRadius: 24, padding: 48, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check style={{ width: 36, height: 36, color: "#10b981" }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>تم إرسال طلبك! 🎉</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px" }}>سيتم تحضير طلبك في أقرب وقت</p>

          <div style={{ background: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 4px" }}>رقم الطلب</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: pc, margin: "0 0 12px" }}>#{orderSuccess.orderNumber}</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 4px" }}>الإجمالي</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>{orderSuccess.total.toFixed(2)} {currency}</p>
          </div>

          {/* Rating Section */}
          {!ratingSubmitted ? (
            <div style={{ marginTop: 24, padding: 20, background: "#fafafa", borderRadius: 16, textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>كيف كانت تجربتك؟</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setRatingStars(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, filter: s <= ratingStars ? "none" : "grayscale(1) opacity(0.3)" }}
                  >⭐</button>
                ))}
              </div>
              <textarea
                placeholder="أضف تعليق (اختياري)..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.1)", fontSize: 13,
                  background: "#fff", outline: "none", resize: "vertical", minHeight: 50,
                }}
                dir="rtl"
              />
              <button onClick={handleSubmitRating}
                style={{
                  marginTop: 10, padding: "10px 24px", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${pc}, ${sc})`, color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >إرسال التقييم</button>
            </div>
          ) : (
            <p style={{ marginTop: 16, fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ شكراً لتقييمك!</p>
          )}

          <button
            onClick={() => { setOrderSuccess(null); setRatingSubmitted(false); setRatingComment(""); setRatingStars(5); }}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${pc}, ${sc})`, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16,
            }}
          >
            طلب مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: dm.bg, paddingBottom: cart.length > 0 ? 90 : 0, transition: "background 0.3s" }} dir="rtl">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .menu-item-card{transition:all 0.25s cubic-bezier(0.4,0,0.2,1)}
        .menu-item-card:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.08)!important}
        .menu-item-card:active{transform:scale(0.98)}
        .cat-tab{transition:all 0.25s ease}
        .cat-tab:hover{transform:translateY(-1px)}
      `}</style>

      {/* ─── Restaurant Header ─── */}
      <div style={{
        background: `linear-gradient(160deg, ${pc}, ${sc}, ${pc}dd)`,
        padding: "48px 20px 40px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: 30, left: "20%", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        {/* Dot pattern */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            position: "absolute", top: 16, left: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)", border: "none",
            backdropFilter: "blur(8px)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, transition: "transform 0.3s",
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.5s ease-out" }}>
          {restaurant.logoUrl ? (
            <img src={restaurant.logoUrl} alt={restaurant.nameAr} style={{
              width: 76, height: 76, borderRadius: 22, objectFit: "cover",
              boxShadow: "0 12px 32px rgba(0,0,0,0.2), 0 0 0 4px rgba(255,255,255,0.15)",
              animation: "scaleIn 0.4s ease-out",
            }} />
          ) : (
            <div style={{
              width: 76, height: 76, borderRadius: 22, background: "rgba(255,255,255,0.95)", margin: "0 auto 18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 800, color: pc,
              boxShadow: "0 12px 32px rgba(0,0,0,0.2), 0 0 0 4px rgba(255,255,255,0.15)",
              animation: "scaleIn 0.4s ease-out",
            }}>
              {restaurant.nameAr.charAt(0)}
            </div>
          )}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{restaurant.nameAr}</h1>
          {restaurant.nameEn && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "0 0 4px", fontWeight: 500, letterSpacing: "0.02em" }}>{restaurant.nameEn}</p>}
          {restaurant.descAr && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>{restaurant.descAr}</p>}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* ─── Search Bar ─── */}
        <div style={{ padding: "12px 0 4px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: dm.card, borderRadius: 14, padding: "10px 14px",
            border: `1px solid ${dm.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <Search style={{ width: 18, height: 18, color: "#9ca3af", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="ابحث في المنيو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 14, color: dm.text, width: "100%",
              }}
              dir="rtl"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
                <X style={{ width: 16, height: 16, color: "#9ca3af" }} />
              </button>
            )}
          </div>
        </div>

        {/* ─── Search Results ─── */}
        {searchResults !== null ? (
          <div style={{ padding: "16px 0 24px" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
              {searchResults.length > 0 ? `${searchResults.length} نتيجة` : "لا توجد نتائج"}
            </p>
            {searchResults.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                <Search style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>لم يتم العثور على أصناف</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {searchResults.map((item, idx) => (
                <div
                  key={item.id}
                  className="menu-item-card"
                  onClick={() => {
                    setSelectedItem(item);
                    setSelectedSize(item.sizes.length > 0 ? item.sizes[0].id : null);
                    setSelectedExtras([]);
                    setItemQty(1);
                    trackEvent("ITEM_VIEW", { itemId: item.id });
                  }}
                  style={{
                    background: dm.card, borderRadius: 16, padding: "16px 18px", cursor: "pointer",
                    border: `1px solid ${dm.border}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    borderRight: `3px solid ${pc}22`,
                    animation: `fadeUp 0.3s ease-out ${idx * 60}ms both`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: dm.text }}>{item.nameAr}</span>
                      {item.nameEn && <p style={{ fontSize: 11, color: dm.textSec, margin: "2px 0 0" }}>{item.nameEn}</p>}
                    </div>
                    <div style={{ textAlign: "left", flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: pc }}>{item.discountPrice || item.price}</span>
                      <span style={{ fontSize: 10, color: "#bbb", marginRight: 4 }}>{currency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ─── Category Tabs ─── */}
            <div style={{
              position: "sticky", top: 0, zIndex: 40, margin: "0 -16px", padding: "12px 16px",
              background: darkMode ? "rgba(15,15,26,0.9)" : "rgba(245,245,247,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              borderBottom: `1px solid ${dm.border}`,
            }}>
              <div style={{
                display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2,
                scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
              }}>
                {filteredCategories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      className="cat-tab"
                      onClick={() => { setActiveCategory(cat.id); trackEvent("CATEGORY_VIEW", { categoryId: cat.id }); }}
                      style={{
                        padding: "9px 20px", borderRadius: 24, border: "none", whiteSpace: "nowrap",
                        background: isActive ? `linear-gradient(135deg, ${pc}, ${sc})` : darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
                        color: isActive ? "#fff" : dm.textSec,
                        fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: "pointer",
                        boxShadow: isActive ? `0 4px 16px ${pc}35` : "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      {cat.emoji && <span style={{ marginLeft: 4 }}>{cat.emoji}</span>}{cat.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Items List ─── */}
            {currentCategory && (
              <div style={{ padding: "16px 0 24px" }}>
                {/* Category Title */}
                <h2 style={{
                  fontSize: 20, fontWeight: 800, color: dm.text,
                  margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8,
                }}>
                  {currentCategory.emoji && <span>{currentCategory.emoji}</span>}
                  {currentCategory.nameAr}
                </h2>

                {/* Grid Layout */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                }}>
                  {currentCategory.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="menu-item-card"
                      onClick={() => {
                        setSelectedItem(item);
                        setSelectedSize(item.sizes.length > 0 ? item.sizes[0].id : null);
                        setSelectedExtras([]);
                        setItemQty(1);
                        trackEvent("ITEM_VIEW", { itemId: item.id });
                      }}
                      style={{
                        background: dm.card, borderRadius: 16, cursor: "pointer",
                        border: `1px solid ${dm.border}`,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                        animation: `fadeUp 0.3s ease-out ${idx * 60}ms both`,
                        overflow: "hidden", position: "relative",
                      }}
                    >
                      {/* Item Image */}
                      <div style={{
                        width: "100%", aspectRatio: "4/3",
                        background: darkMode ? "#1e1e32" : "#f3f4f6",
                        position: "relative", overflow: "hidden",
                      }}>
                        {item.images.length > 0 ? (
                          <img src={item.images[0].imageUrl} alt={item.nameAr} style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            transition: "transform 0.4s ease",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                          />
                        ) : (
                          <div style={{
                            width: "100%", height: "100%", display: "flex", alignItems: "center",
                            justifyContent: "center", flexDirection: "column", gap: 6,
                          }}>
                            <ChefHat style={{ width: 32, height: 32, color: darkMode ? "#4b5563" : "#d1d5db" }} />
                          </div>
                        )}

                        {/* Discount ribbon */}
                        {item.discountPrice && (
                          <div style={{
                            position: "absolute", top: 8, left: 8,
                            background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
                            padding: "3px 10px", borderRadius: 8, letterSpacing: "0.02em",
                          }}>خصم</div>
                        )}

                        {/* Badge */}
                        {item.badge && (
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                            background: item.badge === "NEW" ? "rgba(255,255,255,0.95)" : item.badge === "POPULAR" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.95)",
                            color: item.badge === "NEW" ? pc : item.badge === "POPULAR" ? "#b45309" : "#15803d",
                            backdropFilter: "blur(8px)",
                          }}>
                            {item.badge === "NEW" ? "✨ جديد" : item.badge === "POPULAR" ? "⭐ مميز" : "🏷 عرض"}
                          </div>
                        )}

                        {/* Share button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                          style={{
                            position: "absolute", bottom: 8, left: 8, width: 30, height: 30,
                            borderRadius: "50%", border: "none", cursor: "pointer",
                            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, color: "#6b7280",
                          }}
                          title="مشاركة"
                        >↗️</button>
                      </div>

                      {/* Item Info */}
                      <div style={{ padding: "12px 14px 14px" }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, color: dm.text,
                          margin: "0 0 2px", lineHeight: 1.4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{item.nameAr}</p>

                        {item.descAr && (
                          <p style={{
                            fontSize: 11, color: dm.textSec, margin: "0 0 8px",
                            lineHeight: 1.5, display: "-webkit-box",
                            WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>{item.descAr}</p>
                        )}

                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4,
                        }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: pc }}>{item.discountPrice || item.price}</span>
                            <span style={{ fontSize: 10, color: dm.textSec }}>{currency}</span>
                            {item.discountPrice && (
                              <span style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>{item.price}</span>
                            )}
                          </div>

                          {/* Quick info */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {item.prepTime ? (
                              <span style={{
                                fontSize: 9, display: "inline-flex", alignItems: "center", gap: 2,
                                color: dm.textSec, background: darkMode ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                                padding: "2px 6px", borderRadius: 6,
                              }}>
                                <Clock style={{ width: 9, height: 9 }} /> {item.prepTime}د
                              </span>
                            ) : null}
                            {item.calories ? (
                              <span style={{
                                fontSize: 9, display: "inline-flex", alignItems: "center", gap: 2,
                                color: dm.textSec, background: darkMode ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                                padding: "2px 6px", borderRadius: 6,
                              }}>
                                <Flame style={{ width: 9, height: 9 }} /> {item.calories}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── About Section ─── */}
        {(restaurant.aboutAr || restaurant.workingHours || restaurant.whatsapp || restaurant.phone) && (
          <div style={{
            background: dm.card, borderRadius: 16, padding: 20, marginBottom: 24,
            border: `1px solid ${dm.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: dm.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Info style={{ width: 18, height: 18, color: pc }} /> عن المطعم
            </h3>

            {restaurant.aboutAr && (
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: "0 0 16px" }}>{restaurant.aboutAr}</p>
            )}

            {/* Working Hours */}
            {restaurant.workingHours && (() => {
              try {
                const hours = JSON.parse(restaurant.workingHours);
                return (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock style={{ width: 14, height: 14, color: pc }} /> ساعات العمل
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {Object.entries(hours).map(([day, time]) => (
                        <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", padding: "4px 0" }}>
                          <span style={{ fontWeight: 600 }}>{day}</span>
                          <span>{time as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Contact Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {restaurant.whatsapp && (
                <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 600,
                  textDecoration: "none",
                }}>
                  <MessageCircle style={{ width: 14, height: 14 }} /> واتساب
                </a>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 600,
                  textDecoration: "none",
                }}>
                  <Phone style={{ width: 14, height: 14 }} /> اتصل بنا
                </a>
              )}
              {restaurant.instagram && (
                <a href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, background: "#fce7f3", color: "#be185d", fontSize: 12, fontWeight: 600,
                  textDecoration: "none",
                }}>
                  انستقرام
                </a>
              )}
              {restaurant.googleMapsUrl && (
                <a href={restaurant.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, background: "#fef3c7", color: "#b45309", fontSize: 12, fontWeight: 600,
                  textDecoration: "none",
                }}>
                  <MapPin style={{ width: 14, height: 14 }} /> الموقع
                </a>
              )}
            </div>

            {/* Address */}
            {restaurant.address && (
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin style={{ width: 12, height: 12 }} /> {restaurant.address}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "12px 0 24px", fontSize: 11, color: "#ccc" }}>
          Powered by <span style={{ fontWeight: 700, color: pc }}>MenuPro</span>
        </div>
      </div>

      {/* ─── Floating Cart Button ─── */}
      {cart.length > 0 && !showCart && !selectedItem && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px",
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          animation: "fadeUp 0.3s ease-out",
        }}>
          <button
            onClick={() => setShowCart(true)}
            style={{
              width: "100%", maxWidth: 600, margin: "0 auto", display: "flex",
              alignItems: "center", justifyContent: "space-between",
              padding: "15px 22px", borderRadius: 18, border: "none",
              background: `linear-gradient(135deg, ${pc}, ${sc})`,
              color: "#fff", cursor: "pointer",
              boxShadow: `0 8px 30px ${pc}40, 0 2px 8px rgba(0,0,0,0.1)`,
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShoppingCart style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: 15, fontWeight: 700 }}>عرض السلة</span>
              <span style={{
                minWidth: 24, height: 24, borderRadius: 12, background: "rgba(255,255,255,0.25)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
              }}>
                {cartCount}
              </span>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{cartTotal.toFixed(2)} {currency}</span>
          </button>
        </div>
      )}

      {/* ─── Item Detail Bottom Sheet ─── */}
      {selectedItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={() => setSelectedItem(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease" }} />
          <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
            maxHeight: "82vh", overflowY: "auto", padding: "12px 20px 36px",
            animation: "sheetUp 0.35s cubic-bezier(0.32,0.72,0,1)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          }}>
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto 16px" }} />
            {/* Close */}
            <button onClick={() => setSelectedItem(null)} style={{ position: "absolute", top: 20, left: 20, background: "#f3f4f6", border: "none", borderRadius: 12, padding: 8, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
              onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}
            >
              <X style={{ width: 18, height: 18, color: "#6b7280" }} />
            </button>

            {/* Product Images */}
            {selectedItem.images.length > 0 && (
              <div style={{
                margin: "0 -20px 16px", overflow: "hidden",
              }}>
                <div style={{
                  display: "flex", gap: 8, overflowX: "auto", padding: "0 20px",
                  scrollSnapType: "x mandatory", scrollbarWidth: "none",
                }}>
                  {selectedItem.images.map((img) => (
                    <img key={img.id} src={img.imageUrl} alt={selectedItem.nameAr} style={{
                      width: selectedItem.images.length === 1 ? "100%" : 260,
                      height: 200, borderRadius: 16, objectFit: "cover",
                      flexShrink: 0, scrollSnapAlign: "start",
                    }} />
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>{selectedItem.nameAr}</h3>
            {selectedItem.descAr && <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 }}>{selectedItem.descAr}</p>}

            {/* Sizes */}
            {selectedItem.sizes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>الحجم</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedItem.sizes.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 12,
                        border: selectedSize === s.id ? `2px solid ${pc}` : "1px solid rgba(0,0,0,0.1)",
                        background: selectedSize === s.id ? `${pc}10` : "#fafafa",
                        color: selectedSize === s.id ? pc : "#374151",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {s.nameAr} — {s.price} {currency}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            {selectedItem.extras.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>إضافات</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedItem.extras.map(e => {
                    const isSelected = selectedExtras.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedExtras(isSelected ? selectedExtras.filter(id => id !== e.id) : [...selectedExtras, e.id])}
                        className="flex items-center justify-between"
                        style={{
                          padding: "10px 14px", borderRadius: 12, width: "100%",
                          border: isSelected ? `2px solid ${pc}` : "1px solid rgba(0,0,0,0.08)",
                          background: isSelected ? `${pc}10` : "#fafafa",
                          cursor: "pointer", textAlign: "right",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div style={{
                            width: 20, height: 20, borderRadius: 6,
                            border: isSelected ? `2px solid ${pc}` : "2px solid #d1d5db",
                            background: isSelected ? pc : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isSelected && <Check style={{ width: 12, height: 12, color: "#fff" }} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{e.nameAr}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: pc }}>+{e.price} {currency}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add */}
            <div className="flex items-center gap-4" style={{ marginTop: 20 }}>
              <div className="flex items-center" style={{ background: "#f3f4f6", borderRadius: 12, overflow: "hidden" }}>
                <button onClick={() => setItemQty(Math.max(1, itemQty - 1))} style={{ padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer" }}>
                  <Minus style={{ width: 16, height: 16, color: "#6b7280" }} />
                </button>
                <span style={{ padding: "0 12px", fontSize: 16, fontWeight: 700, color: "#111827", minWidth: 24, textAlign: "center" }}>{itemQty}</span>
                <button onClick={() => setItemQty(itemQty + 1)} style={{ padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer" }}>
                  <Plus style={{ width: 16, height: 16, color: "#6b7280" }} />
                </button>
              </div>
              <button
                onClick={addToCart}
                style={{
                  flex: 1, padding: "14px", borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${pc}, ${sc})`, color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 12px ${pc}40`,
                }}
              >
                إضافة للسلة — {(() => {
                  let p = selectedItem.discountPrice || selectedItem.price;
                  const sizeObj = selectedItem.sizes.find(s => s.id === selectedSize);
                  if (sizeObj) p = sizeObj.price;
                  const extrasC = selectedExtras.reduce((sum, eId) => {
                    const ext = selectedItem.extras.find(e => e.id === eId);
                    return sum + (ext?.price || 0);
                  }, 0);
                  return ((p + extrasC) * itemQty).toFixed(2);
                })()} {currency}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cart Bottom Sheet ─── */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={() => setShowCart(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease" }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
            maxHeight: "85vh", overflowY: "auto", padding: "12px 20px 36px",
            animation: "sheetUp 0.35s cubic-bezier(0.32,0.72,0,1)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>سلة الطلبات</h3>
              <button onClick={() => setShowCart(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 12, padding: 8, cursor: "pointer" }}>
                <X style={{ width: 18, height: 18, color: "#6b7280" }} />
              </button>
            </div>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between" style={{ padding: "12px 14px", borderRadius: 14, background: "#f9fafb" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{item.itemName}</p>
                    {item.sizeName && <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{item.sizeName}</p>}
                    {item.extras && item.extras.length > 0 && (
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>+ {item.extras.join(", ")}</p>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 700, color: pc, margin: "4px 0 0" }}>{(item.unitPrice * item.quantity).toFixed(2)} {currency}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCartQty(i, -1)} style={{ padding: 6, border: "none", background: "#e5e7eb", borderRadius: 6, cursor: "pointer" }}>
                      <Minus style={{ width: 12, height: 12, color: "#6b7280" }} />
                    </button>
                    <span style={{ padding: "0 8px", fontSize: 14, fontWeight: 700 }}>{item.quantity}</span>
                    <button onClick={() => updateCartQty(i, 1)} style={{ padding: 6, border: "none", background: "#e5e7eb", borderRadius: 6, cursor: "pointer" }}>
                      <Plus style={{ width: 12, height: 12, color: "#6b7280" }} />
                    </button>
                    <button onClick={() => removeFromCart(i)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer" }}>
                      <Trash2 style={{ width: 14, height: 14, color: "#dc2626" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ padding: "16px 0", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: "#6b7280" }}>المجموع</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{cartTotal.toFixed(2)} {currency}</span>
              </div>
              {restaurant!.taxPercent > 0 && (
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>الضريبة ({restaurant!.taxPercent}%)</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{(cartTotal * restaurant!.taxPercent / 100).toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="flex items-center justify-between" style={{ paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>الإجمالي</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: pc }}>
                  {(cartTotal + cartTotal * restaurant!.taxPercent / 100 + cartTotal * restaurant!.servicePercent / 100).toFixed(2)} {currency}
                </span>
              </div>
            </div>

            {/* Checkout */}
            <button
              onClick={() => { setShowCart(false); setShowOrderForm(true); }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${pc}, ${sc})`, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 12,
                boxShadow: `0 4px 12px ${pc}40`,
              }}
            >
              متابعة الطلب
            </button>
          </div>
        </div>
      )}

      {/* ─── Order Form ─── */}
      {showOrderForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div onClick={() => setShowOrderForm(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", animation: "fadeIn 0.2s ease" }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
            maxHeight: "82vh", overflowY: "auto", padding: "12px 20px 36px",
            animation: "sheetUp 0.35s cubic-bezier(0.32,0.72,0,1)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 20px" }}>تأكيد الطلب</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Order Type */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>نوع الطلب</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "DINE_IN", label: "🍽️ محلي" },
                    { value: "TAKEAWAY", label: "🥡 سفري" },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setOrderType(t.value)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 12, cursor: "pointer",
                        border: orderType === t.value ? `2px solid ${pc}` : "1px solid rgba(0,0,0,0.1)",
                        background: orderType === t.value ? `${pc}10` : "#fafafa",
                        color: orderType === t.value ? pc : "#6b7280",
                        fontSize: 14, fontWeight: 600,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>الاسم (اختياري)</label>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                  placeholder="اسمك"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>رقم الجوال (اختياري)</label>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none" }}
                  placeholder="05xxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ملاحظات</label>
                <textarea
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, background: "#fafafa", outline: "none", minHeight: 60, resize: "vertical" }}
                  placeholder="بدون بصل، مثلاً"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="flex items-center justify-center gap-2"
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, #10b981, #059669)`, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: submitting ? "wait" : "pointer", marginTop: 24,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              {submitting ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : <Check style={{ width: 18, height: 18 }} />}
              {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
