import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// ===== CSS GLOBAL (WAJIB) =====
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "admin-lte/dist/css/adminlte.min.css";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import RoleGuard from "@/context/RoleGuard";

// ===== CLIENT PROVIDER =====
import AdminLTEProvider from "./components/AdminLTEProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Sekolah",
  description: "Admin Panel",
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body
        className={`
          layout-fixed fixed-header fixed-footer sidebar-expand-lg bg-body-tertiary

    ${geistSans.variable}
    ${geistMono.variable}
    antialiased
  `}
      >

        <AuthProvider>
          <AdminLTEProvider>
            {children}
          </AdminLTEProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
