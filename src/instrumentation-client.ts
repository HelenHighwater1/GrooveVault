import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // v11 collects user info, cookies, headers, bodies, and query params by
  // default — these flags are load-bearing, removing them re-enables collection.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    // Optional: user feedback widget
    // Sentry.feedbackIntegration({ colorScheme: "system" }),
  ],
});

// Hook into App Router navigation transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
