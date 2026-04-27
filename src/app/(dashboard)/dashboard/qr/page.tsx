"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getRestaurants } from "@/actions/restaurant";
import {
  QrCode, Download, Loader2, Copy, Check,
  ExternalLink, FileText, Palette,
} from "lucide-react";

export default function QRCodePage() {
  const [restaurants, setRestaurants] = useState<{ id: string; nameAr: string; slug: string; logoUrl?: string | null; primaryColor?: string | null }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrColor, setQrColor] = useState("e57328");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function load() {
      const data = await getRestaurants();
      const mapped = data.map((r: any) => ({ id: r.id, nameAr: r.nameAr, slug: r.slug, logoUrl: r.logoUrl, primaryColor: r.primaryColor }));
      setRestaurants(mapped);
      if (mapped.length > 0) {
        setSelectedId(mapped[0].id);
        setQrColor(mapped[0].primaryColor?.replace('#', '') || 'e57328');
      }
      setLoading(false);
    }
    load();
  }, []);

  const selectedRestaurant = restaurants.find(r => r.id === selectedId);
  const menuUrl = selectedRestaurant ? `${typeof window !== "undefined" ? window.location.origin : ""}/${selectedRestaurant.slug}` : "";

  const qrImageUrl = (text: string, color?: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}&color=${color || qrColor}&margin=1`;

  // Generate QR with logo overlay on canvas
  const drawQRWithLogo = useCallback(async () => {
    if (!canvasRef.current || !selectedRestaurant) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 500;

    // Draw QR code
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.src = qrImageUrl(menuUrl);
    await new Promise((resolve) => { qrImg.onload = resolve; });
    ctx.drawImage(qrImg, 0, 0, 500, 500);

    // Draw logo in center if available
    if (selectedRestaurant.logoUrl) {
      const logoSize = 80;
      const logoX = (500 - logoSize) / 2;
      const logoY = (500 - logoSize) / 2;

      // White background circle for logo
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(250, 250, logoSize / 2 + 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw logo
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = selectedRestaurant.logoUrl;
      try {
        await new Promise((resolve, reject) => { logoImg.onload = resolve; logoImg.onerror = reject; });
        ctx.save();
        ctx.beginPath();
        ctx.arc(250, 250, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch {
        // Logo failed to load, skip
      }
    }
  }, [selectedRestaurant, menuUrl, qrColor]);

  useEffect(() => {
    if (selectedRestaurant) drawQRWithLogo();
  }, [selectedRestaurant, drawQRWithLogo]);

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!selectedRestaurant) return;
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Background
    doc.setFillColor(255, 247, 237);
    doc.rect(0, 0, 210, 297, "F");

    // Title
    doc.setFontSize(24);
    doc.text(selectedRestaurant.nameAr, 105, 40, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128);
    doc.text("Scan to view menu", 105, 52, { align: "center" });

    // QR Code image from canvas
    if (canvasRef.current) {
      const qrDataUrl = canvasRef.current.toDataURL("image/png");
      doc.addImage(qrDataUrl, "PNG", 35, 65, 140, 140);
    }

    // URL below QR
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(menuUrl, 105, 220, { align: "center" });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text("Powered by MenuPro", 105, 280, { align: "center" });

    doc.save(`${selectedRestaurant.slug}-qr-menu.pdf`);
  };

  // Download QR as PNG from canvas
  const handleDownloadPNG = () => {
    if (!canvasRef.current || !selectedRestaurant) return;
    const link = document.createElement("a");
    link.download = `${selectedRestaurant.slug}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  if (loading && restaurants.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#e57328" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>أكواد QR</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>رمز QR للمنيو الخاص بكل مطعم</p>
        </div>

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
      </div>

      {/* Main Menu QR */}
      {selectedRestaurant && (
        <div style={{
          background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
          borderRadius: 20, border: "1px solid rgba(229,115,40,0.15)",
          padding: 40,
        }}>
          <div className="flex items-center gap-8 flex-wrap" style={{ justifyContent: "center" }}>
            {/* QR Code */}
            <div style={{
              width: 240, height: 240, borderRadius: 24, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
              padding: 16, position: "relative",
            }}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
                رمز QR — {selectedRestaurant.nameAr}
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
                امسح هذا الرمز لفتح المنيو الإلكتروني مباشرة
              </p>

              {/* Link display */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#fff", borderRadius: 12, padding: "12px 16px",
                border: "1px solid rgba(0,0,0,0.06)", marginBottom: 20,
              }}>
                <span style={{ fontSize: 14, color: "#374151", flex: 1, direction: "ltr", textAlign: "left", fontWeight: 500 }}>
                  {menuUrl}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(menuUrl); setCopiedId("main"); setTimeout(() => setCopiedId(null), 2000); }}
                  style={{
                    padding: "8px 14px", borderRadius: 10, border: "none",
                    background: copiedId === "main" ? "#10b981" : "#e57328",
                    color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.2s ease",
                  }}
                >
                  {copiedId === "main" ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                  {copiedId === "main" ? "تم النسخ!" : "نسخ الرابط"}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleDownloadPNG}
                  style={{
                    padding: "10px 20px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #e57328, #d4641c)", color: "#fff",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 7,
                    boxShadow: "0 4px 14px rgba(229, 115, 40, 0.3)",
                  }}
                >
                  <Download style={{ width: 16, height: 16 }} /> تحميل QR (PNG)
                </button>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(220,38,38,0.2)",
                    background: "#fff", color: "#dc2626",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 7,
                  }}
                >
                  <FileText style={{ width: 16, height: 16 }} /> تحميل PDF
                </button>
                <a
                  href={menuUrl}
                  target="_blank"
                  style={{
                    padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)",
                    background: "#fff", color: "#374151",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none",
                  }}
                >
                  <ExternalLink style={{ width: 16, height: 16 }} /> معاينة المنيو
                </a>
              </div>

              {/* Color Picker */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Palette style={{ width: 16, height: 16, color: "#9ca3af" }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>لون الـ QR:</span>
                <input
                  type="color"
                  value={`#${qrColor}`}
                  onChange={(e) => { setQrColor(e.target.value.replace('#', '')); }}
                  style={{ width: 32, height: 32, border: "none", cursor: "pointer", borderRadius: 6 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All restaurants QR overview */}
      {restaurants.length > 1 && (
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
            جميع المطاعم ({restaurants.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
            {restaurants.map((r) => {
              const rUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${r.slug}`;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    background: r.id === selectedId ? "#fff7ed" : "#fff",
                    borderRadius: 16,
                    border: r.id === selectedId ? "2px solid #e57328" : "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div className="flex items-center gap-4" style={{ padding: 16 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 12, background: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: 8, flexShrink: 0,
                    }}>
                      <img
                        src={qrImageUrl(rUrl)}
                        alt={`QR ${r.nameAr}`}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                        {r.nameAr}
                      </p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px", direction: "ltr", textAlign: "left" }}>
                        /{r.slug}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(rUrl);
                            setCopiedId(r.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          style={{
                            padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)",
                            background: copiedId === r.id ? "#dcfce7" : "#fff",
                            fontSize: 11, cursor: "pointer",
                            color: copiedId === r.id ? "#16a34a" : "#6b7280",
                            display: "flex", alignItems: "center", gap: 3,
                          }}
                        >
                          {copiedId === r.id ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                          {copiedId === r.id ? "تم!" : "نسخ"}
                        </button>
                        <a
                          href={qrImageUrl(rUrl)}
                          download={`${r.slug}-qr.png`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.1)",
                            background: "#fff", fontSize: 11, cursor: "pointer", color: "#6b7280",
                            display: "flex", alignItems: "center", gap: 3, textDecoration: "none",
                          }}
                        >
                          <Download style={{ width: 12, height: 12 }} /> حفظ
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
