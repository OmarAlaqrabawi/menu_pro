"use client";
// src/app/global-error.tsx
// Global error boundary — captures unhandled errors and reports to Sentry
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            maxWidth: 440,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            حدث خطأ غير متوقع
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>
            نعتذر عن هذا الخطأ. تم إرسال تقرير تلقائي لفريق الدعم.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #e57328, #d4641c)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
