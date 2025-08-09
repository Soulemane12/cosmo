"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/data/AuthContext";

type LogPayload = {
  level: "error" | "warn" | "info";
  type: string;
  message?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string | null;
  extra?: Record<string, unknown>;
  timestamp: string;
};

async function sendLog(payload: LogPayload) {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Ignore logging failures
  }
}

export default function DebugProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      sendLog({
        level: "error",
        type: "window_error",
        message: event.message,
        stack: event.error && (event.error as Error).stack || undefined,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        userId: currentUser?.id ?? null,
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        timestamp: new Date().toISOString(),
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as unknown as { message?: string; stack?: string } | string;
      const message = typeof reason === "string" ? reason : reason?.message;
      const stack = typeof reason === "string" ? undefined : reason?.stack;
      sendLog({
        level: "error",
        type: "unhandled_rejection",
        message,
        stack,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        userId: currentUser?.id ?? null,
        timestamp: new Date().toISOString(),
      });
    };

    // Mirror console.error to server logs as well (non-invasive)
    const originalConsoleError = console.error;
    const consoleErrorPatched: typeof console.error = (...args: unknown[]) => {
      try {
        const message = args.map(a => {
          if (a instanceof Error) return `${a.name}: ${a.message}`;
          if (typeof a === "string") return a;
          try { return JSON.stringify(a); } catch { return String(a); }
        }).join(" | ");
        const stackArg = args.find(a => a instanceof Error) as Error | undefined;
        sendLog({
          level: "error",
          type: "console_error",
          message,
          stack: stackArg?.stack,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          userId: currentUser?.id ?? null,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // ignore
      }
      originalConsoleError.apply(console, args as never);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    console.error = consoleErrorPatched;

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, [currentUser?.id]);

  return <>{children}</>;
}


