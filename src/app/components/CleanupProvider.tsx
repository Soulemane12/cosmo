"use client";

import { useEffect } from "react";
import { startCleanupScheduler } from "@/lib/cleanup";

export default function CleanupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the cleanup scheduler
    startCleanupScheduler();
  }, []);

  return <>{children}</>;
} 