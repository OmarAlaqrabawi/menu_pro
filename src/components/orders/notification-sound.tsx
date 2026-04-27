"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, BellOff, Volume2 } from "lucide-react";

interface OrderNotificationProps {
  restaurantId: string;
  onNewOrder?: (order: any) => void;
}

export default function OrderNotificationSound({ restaurantId, onNewOrder }: OrderNotificationProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [newOrderNum, setNewOrderNum] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create audio element for notification sound
  useEffect(() => {
    // Use Web Audio API to generate a pleasant notification sound
    const createNotificationSound = () => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1); // ~C#6
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2); // A5

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    };

    // Store the function for later use
    (window as any).__playNotifSound = createNotificationSound;
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      (window as any).__playNotifSound?.();
    } catch {
      // Fallback: try HTML5 audio beep
    }
  }, [soundEnabled]);

  // Poll for new orders every 10 seconds
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const res = await fetch(`/api/orders/check?restaurantId=${restaurantId}`);
        if (!res.ok) return;
        const data = await res.json();
        const currentCount = data.count;

        if (lastOrderCount !== null && currentCount > lastOrderCount) {
          // New order detected!
          playSound();
          setNewOrderNum(data.latestOrderNumber || currentCount);
          setShowNotif(true);
          onNewOrder?.(data);

          // Also try browser notification
          if (Notification.permission === "granted") {
            new Notification("🔔 طلب جديد!", {
              body: `طلب رقم #${data.latestOrderNumber || currentCount}`,
              icon: "/favicon.ico",
            });
          }

          // Auto-hide notification after 5 seconds
          setTimeout(() => setShowNotif(false), 5000);
        }
        setLastOrderCount(currentCount);
      } catch {
        // ignore network errors
      }
    };

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    checkNewOrders(); // Initial check
    intervalRef.current = setInterval(checkNewOrders, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restaurantId, lastOrderCount, playSound, onNewOrder]);

  return (
    <>
      {/* Sound Toggle Button */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? "إيقاف صوت الإشعارات" : "تفعيل صوت الإشعارات"}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 12px", borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.1)",
          background: soundEnabled ? "#ecfdf5" : "#fef2f2",
          color: soundEnabled ? "#059669" : "#dc2626",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        {soundEnabled ? <Volume2 style={{ width: 16, height: 16 }} /> : <BellOff style={{ width: 16, height: 16 }} />}
        {soundEnabled ? "الصوت مفعّل" : "الصوت معطّل"}
      </button>

      {/* Notification Toast */}
      {showNotif && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "#fff", borderRadius: 16,
          padding: "16px 24px", boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          border: "2px solid #10b981", display: "flex", alignItems: "center", gap: 12,
          animation: "slideDown 0.3s ease-out",
          minWidth: 280,
        }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell style={{ width: 22, height: 22, color: "#10b981" }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>🔔 طلب جديد!</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>طلب #{newOrderNum}</p>
          </div>
          <button
            onClick={() => setShowNotif(false)}
            style={{
              marginRight: "auto", background: "none", border: "none",
              cursor: "pointer", fontSize: 16, color: "#9ca3af",
            }}
          >✕</button>
        </div>
      )}
    </>
  );
}
