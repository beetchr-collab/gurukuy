"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);

  // ✅ CEK PROFIL
  const isProfilLengkap = (data: any) => {
    return (
      data.nip &&
      data.tanggalLahir &&
      data.jenisKelamin &&
      data.whatsapp &&
      data.status &&
      data.jenjang &&
      data.mapel &&
      data.alamat?.alamat &&
      data.alamat?.desa &&
      data.alamat?.kecamatan &&
      data.alamat?.kabupaten
    );
  };

  useEffect(() => {
    const checkProfil = async () => {
      if (!user?.uid) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        const sudahDitampilkan = sessionStorage.getItem("profilWarning");

        if (!isProfilLengkap(data) && !sudahDitampilkan) {
          setTimeout(() => {
            setShowModal(true);
          }, 500);

          sessionStorage.setItem("profilWarning", "true");
        }
      }
    };

    checkProfil();
  }, [user]);

  return (
    <>
      <main className="app-main">
        {/* HEADER */}
        <div className="app-content-header">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Dashboard</h4>

              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item active">Dashboard</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="app-content">
          <div className="container-fluid">

            {/* WELCOME CARD */}
            <div className="callout callout-info mb-3">
              <div className="card-body">
                <h5 className="fw-bold mb-2">Selamat Datang 👋</h5>
                <p className="text-muted mb-0">
                  Portal ini merupakan media informasi dan komunikasi sekolah
                  yang memberikan layanan cepat, transparan, dan mudah diakses.
                </p>
              </div>

            </div>

            {/* FITUR LIST */}
            <div className="card shadow-sm border-0">
              <div className="card-body bg-warning">
                <h6 className="fw-bold mb-3">Fitur Utama</h6>

                <ul className="mb-0">
                  <li>📊 Melihat ringkasan aktivitas mengajar</li>
                  <li>👤 Mengelola profil dan data pribadi</li>
                  <li>📢 Mengakses informasi sekolah terbaru</li>
                  <li>📝 Memantau tugas dan laporan pembelajaran</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 🔥 MODAL PROFIL */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title text-warning">
                    ⚠️ Profil Belum Lengkap
                  </h5>
                </div>

                <div className="modal-body text-center">
                  <p>
                    Data profil Anda belum lengkap.
                    Silakan lengkapi terlebih dahulu agar semua fitur dapat digunakan dengan optimal.
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Nanti Saja
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => router.push("/admin/guru/profil")}
                  >
                    Lengkapi Profil
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}