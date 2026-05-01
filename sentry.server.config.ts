// sentry.server.config.ts
// Sentry server-side configuration for MenuPro
// Captures API errors, server actions, and database issues
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring — sample 10% of server transactions
  tracesSampleRate: 0.1,

  // Filter out expected errors
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],

  // Environment tag
  environment: process.env.NEXT_PUBLIC_ENV || "production",

  // Add user context from server actions
  beforeSend(event) {
    // Remove any sensitive data
    if (event.request?.headers) {
      delete event.request.headers["cookie"];
      delete event.request.headers["authorization"];
    }
    return event;
  },
});
