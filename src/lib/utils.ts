import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "JOD"): string {
  const currencyMap: Record<string, { symbol: string; locale: string }> = {
    SAR: { symbol: "ر.س", locale: "ar-SA" },
    USD: { symbol: "$", locale: "en-US" },
    AED: { symbol: "د.إ", locale: "ar-AE" },
    JOD: { symbol: "د.أ", locale: "ar-JO" },
    EGP: { symbol: "ج.م", locale: "ar-EG" },
    TRY: { symbol: "₺", locale: "tr-TR" },
  };

  const config = currencyMap[currency] || currencyMap.JOD;
  return `${price.toFixed(2)} ${config.symbol}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isRestaurantOpen(workingHours: Record<string, { open: string; close: string } | null> | null): boolean {
  if (!workingHours) return true;

  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const todayHours = workingHours[dayKey];

  if (!todayHours) return false;

  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "الآن";
  if (seconds < 3600) return `قبل ${Math.floor(seconds / 60)} دقيقة`;
  if (seconds < 86400) return `قبل ${Math.floor(seconds / 3600)} ساعة`;
  return `قبل ${Math.floor(seconds / 86400)} يوم`;
}
