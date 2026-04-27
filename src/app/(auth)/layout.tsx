import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول — MenuPro",
  description: "تسجيل الدخول إلى لوحة التحكم",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-800 to-primary-900">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/5 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full h-full">
          {/* Logo — top right, pushed down a bit */}
          <div style={{ paddingTop: 8 }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight">MenuPro</span>
            </div>
          </div>

          {/* Main text — centered */}
          <div className="text-center self-center" style={{ maxWidth: 480 }}>
            <h1 className="text-4xl font-bold leading-tight">
              أنشئ منيوهات إلكترونية
              <br />
              <span className="text-primary-400">احترافية وتفاعلية</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed" style={{ marginTop: 20 }}>
              منصة متكاملة لإدارة المنيوهات الرقمية، استقبال الطلبات في الوقت الحقيقي، وتتبع الإحصائيات.
            </p>
          </div>

          {/* Footer — bottom right */}
          <div className="text-sm text-white/30">
            © {new Date().getFullYear()} MenuPro. جميع الحقوق محفوظة.
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        {children}
      </div>
    </div>
  );
}
