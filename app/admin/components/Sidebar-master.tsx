"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth(); // ambil user + role + username

  const isActive = (path: string) => pathname === path;

  const isParentActive = (path: string) =>
    pathname.startsWith(path);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  useEffect(() => {
    if (!pathname.startsWith("/admin/adminsekolah")) {
      setOpenMenu(null); // 🔥 tutup otomatis
    }
  }, [pathname]);

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
                <li className={`nav-item ${openMenu === "sekolah" ? "menu-open" : ""}`}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenMenu(openMenu === "sekolah" ? null : "sekolah");
                    }}
                    className={`nav-link ${isParentActive("/admin/adminsekolah") ? "active" : ""}`}
                  >
                    <i className="nav-icon fas fa-school"></i>
                    <p>
                      Sekolah
                      <i className="right fas fa-angle-right"></i>
                    </p>
                  </a>

                  <ul className="nav nav-treeview">

                    <li className="nav-item">
                      <Link
                        href="/admin/adminsekolah/sekolah"
                        className={`nav-link ${isActive("/admin/adminsekolah/sekolah")
                          ? "active bg-primary text-white"
                          : ""
                          }`}
                      >
                        <i className="far fa-circle nav-icon"></i>
                        <p>Data Sekolah</p>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        href="/admin/adminsekolah/setting-sekolah"
                        className={`nav-link ${isActive("/admin/adminsekolah/setting-sekolah")
                          ? "active bg-primary text-white"
                          : ""
                          }`}
                      >
                        <i className="far fa-circle nav-icon"></i>
                        <p>Setting Sekolah</p>
                      </Link>
                    </li>

                  </ul>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/adminsekolah/listguru"
                    className={`nav-link ${isActive("/admin/adminsekolah/listguru") ? "active bg-primary text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-list"></i>
                    <p>Daftar Guru</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/adminsekolah/siswa/daftarsiswa"
                    className={`nav-link ${isActive("/admin/adminsekolah/siswa/daftarsiswa") ? "active bg-primary text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-user-graduate"></i>
                    <p>Peserta Didik</p>
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
                    className={`nav-link ${isActive("/admin/guru/profil") ? "active bg-primary text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-user"></i>
                    <p>Profil</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/guru/sekolah"
                    className={`nav-link ${isActive("/admin/guru/sekolah") ? "active bg-primary text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-school"></i>
                    <p>Data Sekolah</p>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/admin/guru/kelas"
                    className={`nav-link ${isActive("/admin/guru/kelas") ? "active bg-primary text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-door-open"></i>
                    <p>Kelas</p>
                  </Link>
                </li>

                {/* Menu Presensi */}
                <li className={`nav-item ${openMenu === "presensi" ? "menu-open" : ""}`}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenMenu(openMenu === "presensi" ? null : "presensi");
                    }}
                    className={`nav-link ${isParentActive("/admin/guru/presensi") ? "active" : ""
                      }`}
                  >
                    <i className="nav-icon fas fa-user-check"></i>
                    <p className="d-flex align-items-center w-100 mb-0">
                      <span>Presensi</span>

                      <i
                        className={`fas ${openMenu === "presensi"
                            ? "fa-angle-down"
                            : "fa-angle-right"
                          } ms-auto`}
                      ></i>
                    </p>
                  </a>

                  <ul className="nav nav-treeview" style={{ paddingLeft: "15px" }}>
                    <li className="nav-item">
                      <Link
                        href="/admin/guru/presensi/input-presensi"
                        className={`nav-link ${isActive("/admin/guru/presensi/input-presensi")
                            ? "active bg-primary text-white"
                            : ""
                          }`}
                      >
                        <i className="nav-icon fas fa-user-edit"></i>
                        <p>Input Presensi Harian</p>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        href="/admin/guru/presensi/list-presensi"
                        className={`nav-link ${isActive("/admin/guru/presensi/list-presensi")
                            ? "active bg-primary text-white"
                            : ""
                          }`}
                      >
                        <i className="nav-icon fas fa-list-check"></i>
                        <p>List Presensi</p>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        href="/admin/guru/presensi/rekap-presensi"
                        className={`nav-link ${isActive("/admin/guru/presensi/rekap-presensi")
                            ? "active bg-primary text-white"
                            : ""
                          }`}
                      >
                        <i className="nav-icon fas fa-calendar-check"></i>
                        <p>Rekap Presensi</p>
                      </Link>
                    </li>
                  </ul>
                </li>


                {/* Menu nilai */}
                <li className={`nav-item ${openMenu === "penilaian" ? "menu-open" : ""}`}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenMenu(openMenu === "penilaian" ? null : "penilaian");
                    }}
                    className={`nav-link ${isParentActive("/admin/guru/penilaian") ? "active" : ""}`}
                  >
                    <i className="nav-icon fas fa-clipboard-check"></i>
                    <p className="d-flex align-items-center w-100 mb-0">
                      <span>Penilaian</span>

                      <i
                        className={`fas ${openMenu === "penilaian"
                          ? "fa-angle-down"
                          : "fa-angle-right"
                          } ms-auto`}
                      ></i>
                    </p>
                  </a>

                  <ul className="nav nav-treeview" style={{ paddingLeft: "15px" }}>

                    <li className="nav-item">
                      <Link
                        href="/admin/guru/penilaian"
                        className={`nav-link ${isActive("/admin/guru/penilaian")
                          ? "active bg-primary text-white"
                          : ""
                          }`}
                      >
                        <i className="far fa-chart-bar nav-icon"></i>
                        <p>Progres Nilai</p>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        href="/admin/guru/penilaian/tambah"
                        className={`nav-link ${isActive("/admin/guru/penilaian/tambah")
                          ? "active bg-primary text-white"
                          : ""
                          }`}
                      >
                        <i className="far fa-edit nav-icon"></i>
                        <p>Topik/Input Nilai</p>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        href="/admin/guru/penilaian/rekap"
                        className={`nav-link ${isActive("/admin/guru/penilaian/rekap")
                          ? "active bg-primary text-white"
                          : ""
                          }`}
                      >
                        <i className="far fa-file-alt nav-icon"></i>
                        <p>Rekap</p>
                      </Link>
                    </li>

                  </ul>
                </li>


                <li className="nav-item">
                  <Link
                    href="/admin/guru/eujian"
                    className={`nav-link ${isActive("/admin/guru/eujian") ? "active bg-primary text-white" : ""}`}
                  >
                    <i className="nav-icon fas fa-laptop"></i>
                    <p>E-Ujian</p>
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
