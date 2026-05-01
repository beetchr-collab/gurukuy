"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Sekolah = {
  id: string;
  namaSekolah: string;
  npsn: string;
  alamat: string;
  dusun: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
};

export default function DashboardSekolah() {
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [loading, setLoading] = useState(true);
  const [jumlahGuru, setJumlahGuru] = useState(0);

  useEffect(() => {
    const fetchSekolah = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sekolah"));

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setSekolah({
            id: doc.id,
            ...doc.data(),
          } as Sekolah);
        } else {
          setSekolah(null);
        }
      } catch (error) {
        console.error("Error ambil sekolah:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSekolah();
  }, []);

  {/* Jumlah Guru */ }
  useEffect(() => {
    const fetchGuru = async () => {
      try {
        if (!sekolah?.id) return;

        const q = query(
          collection(db, "users"),
          where("schoolId", "==", sekolah.id),
          where("role", "==", "guru")
        );

        const snapshot = await getDocs(q);
        setJumlahGuru(snapshot.size);

      } catch (err) {
        console.error("Error ambil guru:", err);
      }
    };

    fetchGuru();
  }, [sekolah]);

  if (loading) {
    return <p>Loading...</p>;
  }

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

            <div className="row">
              <div className="col-8">
                {/* Data Sekolah */}
                <div className="card sekolah-card mb-3 border-0">
                  {sekolah ? (
                    <>
                      {/* HEADER */}
                      <div
                        className="p-3 text-white"
                        style={{
                          background: "linear-gradient(135deg, #4e73df, #224abe)",
                          borderTopLeftRadius: "0.5rem",
                          borderTopRightRadius: "0.5rem",
                        }}
                      >
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <i className="fas fa-school"></i>
                          {sekolah.namaSekolah}
                        </h5>
                      </div>

                      {/* BODY */}
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fas fa-id-card text-primary"></i>
                              <div>
                                <small className="text-muted d-block">NPSN</small>
                                <span className="fw-semibold">{sekolah.npsn}</span>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6 mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <i className="fas fa-map-marker-alt text-danger"></i>
                              <div>
                                <small className="text-muted d-block">Alamat</small>
                                <span className="fw-semibold">{sekolah.alamat} Dusun {sekolah.dusun} RT. {sekolah.rt} RW. {sekolah.rw} Desa {sekolah.desa} Kec. {sekolah.kecamatan}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="card-body">
                      <div className="text-center py-4">
                        <i className="fas fa-school fa-2x text-warning mb-3"></i>
                        <h5 className="fw-bold">Sekolah Belum Tersedia</h5>
                        <p className="text-muted mb-3">
                          Silahkan buat data sekolah terlebih dahulu sebelum menggunakan sistem.
                        </p>

                        <a href="/admin/sekolah" className="btn btn-primary btn-sm">
                          + Tambah Sekolah
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-4">
                {/* STATISTIK */}
                {sekolah && (
                  <div className="">

                    {/* JUMLAH GURU */}
                    <div className="info-box text-bg-warning">
                      <span className="info-box-icon">
                        <i className="fas fa-chalkboard-teacher"></i>
                      </span>

                      <div className="info-box-content">
                        <span className="info-box-text">Jumlah Guru</span>
                        <span className="info-box-number"><h5>{jumlahGuru}</h5></span>

                        <div className="progress">
                          <div className="progress-bar" style={{ width: "100%" }}></div>
                        </div>
                      </div>
                    </div>

                     {/* JUMLAH Siswa */}
                    <div className="info-box text-bg-danger">
                      <span className="info-box-icon">
                        <i className="fas fa-chalkboard-teacher"></i>
                      </span>

                      <div className="info-box-content">
                        <span className="info-box-text">Jumlah Siswa</span>
                        <span className="info-box-number"><h5>{jumlahGuru}</h5></span>

                        <div className="progress">
                          <div className="progress-bar" style={{ width: "100%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

    </>
  );
}