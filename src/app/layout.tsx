"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/data/AuthContext";
import { useEffect } from "react";
import { startCleanupScheduler } from "@/lib/cleanup";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "cosmologo",
  description: "The premier marketplace for cosmetic services",
};

function CleanupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the cleanup scheduler
    startCleanupScheduler();
  }, []);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>
          <CleanupProvider>
            {children}
          </CleanupProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
