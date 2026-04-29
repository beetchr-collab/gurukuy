"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth(); // ambil user + role + username

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      {/* BRAND */}
      <div className="sidebar-brand">
        <Link
          href="/"
          className="brand-link d-flex align-items-center justify-content-center"
          style={{ background: "transparent" }}
        >
          <img
            src="/images/logo_sidebar.png"
            alt="GuruKuy Logo"
            className="brand-image"
            style={{
              maxHeight: 55,
              width: "auto",
              objectFit: "contain"
            }}
          />
        </Link>
      </div>

      {/* SIDEBAR */}
      <div className="sidebar-wrapper">
        <nav>
          <ul
            className="nav sidebar-menu flex-column"
            data-lte-toggle="treeview"
            role="menu"
            data-accordion="false"
          >

            {/* DASHBOARD — SUPERADMIN */}
            {user?.role === "superadmin" && (
              <li className="nav-item">
                <Link
                  href="/admin/dashboard"
                  className={`nav-link ${isActive("/admin/dashboard") ? "active" : ""}`}
                >
                  <i className="nav-icon fas fa-home"></i>
                  <p>Menu Utama</p>
                </Link>
              </li>
            )}

            {/* DASHBOARD — ADMIN */}
            {user?.role === "admin" && (
              <>
                <li className="nav-item">
                  <Link
                    href="/admin/adminsekolah/dashboard"
                    className={`nav-link ${isActive("/admin/adminsekolah/dashboard") ? "active" : ""}`}
                  >
                    <i className="nav-icon fas fa-chalkboard-teacher"></i>
                    <p>Dashboard Admin</p>
                  </Link>
                </li>

                <li className="nav-header">MENU UTAMA</li>
                <li className="nav-item">
                  <Link
                    href="/admin/adminsekolah/sekolah"
                    className={`nav-link ${isActive("/admin/adminsekolah/sekolah") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-school"></i>
                    <p>Data Sekolah</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/adminsekolah/listguru"
                    className={`nav-link ${isActive("/admin/adminsekolah/listguru") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-list"></i>
                    <p>Daftar Guru</p>
                  </Link>
                </li>


              </>
            )}

            {/* MENU GURU */}
            {user?.role === "guru" && (
              <>
                <li className="nav-item">
                  <Link
                    href="/admin/guru/dashboard"
                    className={`nav-link ${isActive("/admin/guru/dashboard") ? "active" : ""}`}
                  >
                    <i className="nav-icon fas fa-chalkboard-teacher"></i>
                    <p>Dashboard Guru</p>
                  </Link>
                </li>
                <li className="nav-header">MENU UTAMA</li>
                <li className="nav-item">
                  <Link
                    href="/admin/guru/profil"
                    className={`nav-link ${isActive("/admin/guru/profil") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-user"></i>
                    <p>Profil</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/guru/sekolah"
                    className={`nav-link ${isActive("/admin/guru/sekolah") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-school"></i>
                    <p>Data Sekolah</p>
                  </Link>
                </li>

              </>
            )}

          </ul>
        </nav>
      </div>
    </aside>
  );
}
