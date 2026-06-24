/**
 * Layout CBT / Ujian
 * Path: app/cbt/layout.tsx
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// ===== CSS =====
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "admin-lte/dist/css/adminlte.min.css";
import "@/app/globals.css";

// ===== FONT =====
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ===== METADATA =====
export const metadata: Metadata = {
  title: "CBT E-Ujian",
  description: "Platform ujian online modern",
};

interface UjianLayoutProps {
  children: React.ReactNode;
}

export default function UjianLayout({
  children,
}: UjianLayoutProps) {
  return (
    <div
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ujian-layout
      `}
      suppressHydrationWarning
    >
      {/* ===== CONTENT ===== */}
      {children}
    </div>
  );
}