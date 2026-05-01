// sentry.client.config.ts
// Sentry client-side configuration for MenuPro
// Captures frontend errors, performance, and user interactions
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring — sample 20% of transactions
  tracesSampleRate: 0.2,

  // Session replay — capture 10% of sessions, 100% of errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "ChunkLoadError",
    "Loading chunk",
    /Network Error/i,
  ],

  // Environment tag
  environment: process.env.NEXT_PUBLIC_ENV || "production",
});
