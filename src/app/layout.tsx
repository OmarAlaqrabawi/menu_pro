import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MenuPro — منصة المنيو الإلكتروني الاحترافية",
    template: "%s — MenuPro",
  },
  description: "أنشئ منيوهات إلكترونية تفاعلية واحترافية لمطعمك. استقبل الطلبات في الوقت الحقيقي وتابع إحصائياتك.",
  keywords: ["منيو إلكتروني", "QR code menu", "digital menu", "مطعم", "طلبات"],
  authors: [{ name: "MenuPro" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: "MenuPro",
    title: "MenuPro — منصة المنيو الإلكتروني الاحترافية",
    description: "أنشئ منيوهات إلكترونية تفاعلية واحترافية لمطعمك",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
