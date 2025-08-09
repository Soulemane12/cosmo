import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/data/AuthContext";
import CleanupProvider from "./components/CleanupProvider";
import DebugProvider from "./components/DebugProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "cosmologo",
  description: "The premier marketplace for cosmetic services",
};

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
            <DebugProvider>
              {children}
            </DebugProvider>
          </CleanupProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
