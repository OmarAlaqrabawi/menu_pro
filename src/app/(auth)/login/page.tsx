"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const authErrors: Record<string, string> = {
  Configuration: "خطأ في إعدادات تسجيل الدخول، تواصل مع الدعم الفني",
  CredentialsSignin: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  Default: "حدث خطأ أثناء تسجيل الدخول",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // Handle NextAuth error redirects
  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      setError(authErrors[authError] || authErrors.Default);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // Sign in via POST
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: formData.email,
          password: formData.password,
          csrfToken,
          json: "true",
        }),
        redirect: "follow",
      });

      const url = new URL(res.url);
      if (url.searchParams.has("error")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
      setLoading(false);
    }
  };

  return (
    <div className="w-full" style={{ maxWidth: 420 }}>
      {/* Mobile logo */}
      <div className="lg:hidden text-center" style={{ marginBottom: 32 }}>
        <div className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-surface-900">MenuPro</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center lg:text-right" style={{ marginBottom: 36 }}>
        <h2 className="text-2xl font-bold text-surface-900">مرحباً بعودتك 👋</h2>
        <p className="text-surface-500" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>سجّل دخولك للوصول إلى لوحة التحكم</p>
      </div>

      {/* Form Card */}
      <Card className="shadow-soft border-surface-200/80">
        <CardContent style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div
                className="rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-3 scale-in"
                style={{ padding: 16, marginBottom: 28 }}
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-surface-700"
                style={{ marginBottom: 10 }}
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" style={{ right: 14 }}>
                  <Mail style={{ width: 18, height: 18 }} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@menupro.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-surface-300"
                  style={{ height: 48, paddingRight: 44, paddingLeft: 16 }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-surface-700"
                style={{ marginBottom: 10 }}
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" style={{ right: 14 }}>
                  <Lock style={{ width: 18, height: 18 }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-surface-300"
                  style={{ height: 48, paddingRight: 44, paddingLeft: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  style={{ left: 14, padding: 4 }}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 18, height: 18 }} />
                    : <Eye style={{ width: 18, height: 18 }} />
                  }
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between" style={{ marginBottom: 28 }}>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-surface-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  style={{ width: 18, height: 18 }}
                />
                <span className="text-sm text-surface-600">تذكرني</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              تسجيل الدخول
            </Button>
          </form>

        </CardContent>
      </Card>

      {/* Footer text */}
      <p className="text-center text-sm text-surface-400" style={{ marginTop: 32 }}>
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
          تواصل مع الإدارة
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#e57328", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
