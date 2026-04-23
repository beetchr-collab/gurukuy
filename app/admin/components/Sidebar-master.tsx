"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth(); // ambil user + role + username

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");

    // 🔥 auto close sidebar di mobile saat klik menu
    const closeSidebarMobile = () => {
      if (window.innerWidth < 992) {
        document.body.classList.remove("sidebar-open");
        document.body.classList.remove("sidebar-collapse");
      }
    }
  };

  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      {/* BRAND */}
      <div className="sidebar-brand">
        <Link href="/admin/dashboard" className="brand-link">
          <span className="brand-text fw-semibold">
            SDN Tunjung 02
          </span>
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

            {/* DASHBOARD — ADMIN SAJA */}
            {user?.role === "admin" && (
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

            {/* MASTER — ADMIN */}
            {user?.role === "admin" && (
              <>
                <li className="nav-item">
                  <Link
                    href="/admin/master"
                    className={`nav-link ${isActive("/admin/master") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-chart-line"></i>
                    <p>Beranda</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/master/users"
                    className={`nav-link ${isActive("/admin/master/users") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-users"></i>
                    <p>Pengguna</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/master/sekolah"
                    className={`nav-link ${isActive("/admin/master/sekolah") ? "active bg-danger text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-school"></i>
                    <p>Data Sekolah</p>
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
                    <i className="nav-icon fas fa-users"></i>
                    <p>Profil</p>
                  </Link>
                </li>
              </>
            )}

            {/* LOGOUT */}
            <li className="nav-item mt-3">
              <button onClick={handleLogout} className="nav-link text-danger">
                <i className="nav-icon fas fa-sign-out-alt"></i>
                <p>Logout</p>
              </button>
            </li>

          </ul>
        </nav>
      </div>
    </aside>
  );
}
