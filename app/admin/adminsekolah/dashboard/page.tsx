"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [jumlahGuru, setJumlahGuru] = useState(0);
  const [jumlahSiswa, setJumlahSiswa] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        // ======================
        // Ambil Data User Login
        // ======================
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error("User tidak ditemukan");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        if (!userData.schoolId) {
          console.error("User belum memiliki schoolId");
          setLoading(false);
          return;
        }

        // ======================
        // Ambil Data Sekolah
        // ======================
        const sekolahRef = doc(
          db,
          "sekolah",
          userData.schoolId
        );

        const sekolahSnap = await getDoc(sekolahRef);

        if (!sekolahSnap.exists()) {
          console.error("Sekolah tidak ditemukan");
          setLoading(false);
          return;
        }

        const sekolahData = {
          id: sekolahSnap.id,
          ...sekolahSnap.data(),
        } as Sekolah;

        setSekolah(sekolahData);

        console.log("School ID:", sekolahSnap.id);

        // ======================
        // Hitung Guru
        // ======================
        const guruQuery = query(
          collection(db, "guru"),
          where("schoolId", "==", sekolahSnap.id)
        );

        const guruSnap = await getDocs(guruQuery);

        setJumlahGuru(guruSnap.size);

        console.log(
          "Guru:",
          guruSnap.docs.map((doc) => doc.data())
        );

        // ======================
        // Hitung Siswa
        // ======================
        const siswaQuery = query(
          collection(db, "students"),
          where("schoolId", "==", sekolahSnap.id)
        );

        const siswaSnap = await getDocs(siswaQuery);

        setJumlahSiswa(siswaSnap.size);

        console.log(
          "Siswa:",
          siswaSnap.docs.map((doc) => doc.data())
        );

        // ======================
        // Debug Semua User
        // ======================
        const allUsers = await getDocs(
          collection(db, "users")
        );

        console.log(
          "SEMUA USER:",
          allUsers.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <main className="app-main">
        <div className="app-content">
          <div className="container-fluid">
            <p>Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main">
      {/* HEADER */}
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Dashboard</h4>

            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item active">
                  Dashboard
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="app-content">
        <div className="container-fluid">

          {/* Welcome */}
          <div className="callout callout-info mb-3">
            <div className="card-body">
              <h5 className="fw-bold mb-2">
                Selamat Datang 👋
              </h5>
              <p className="text-muted mb-0">
                Portal ini merupakan media informasi dan
                komunikasi sekolah yang memberikan layanan
                cepat, transparan, dan mudah diakses.
              </p>
            </div>
          </div>

          <div className="row">

            {/* Data Sekolah */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">

                {sekolah ? (
                  <>
                    <div
                      className="p-3 text-white"
                      style={{
                        background:
                          "linear-gradient(135deg,#4e73df,#224abe)",
                      }}
                    >
                      <h5 className="mb-0 fw-bold">
                        <i className="fas fa-school me-2"></i>
                        {sekolah.namaSekolah}
                      </h5>
                    </div>

                    <div className="card-body">
                      <div className="row">

                        <div className="col-md-6">
                          <small className="text-muted">
                            NPSN
                          </small>
                          <div className="fw-semibold">
                            {sekolah.npsn}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <small className="text-muted">
                            Alamat
                          </small>
                          <div className="fw-semibold">
                            {sekolah.alamat}
                            {" "}Dusun {sekolah.dusun}
                            {" "}RT {sekolah.rt}
                            {" "}RW {sekolah.rw}
                            {" "}Desa {sekolah.desa}
                            {" "}Kec. {sekolah.kecamatan}
                          </div>
                        </div>

                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card-body text-center py-5">
                    <i className="fas fa-school fa-2x text-warning mb-3"></i>
                    <h5>Sekolah Belum Tersedia</h5>

                    <p className="text-muted">
                      Silakan buat data sekolah terlebih dahulu.
                    </p>

                    <a
                      href="/admin/sekolah"
                      className="btn btn-primary"
                    >
                      + Tambah Sekolah
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Statistik */}
            <div className="col-lg-4">

              <div className="info-box text-bg-warning mb-3">
                <span className="info-box-icon">
                  <i className="fas fa-chalkboard-teacher"></i>
                </span>

                <div className="info-box-content">
                  <span className="info-box-text">
                    Jumlah Guru
                  </span>

                  <span className="info-box-number">
                    {jumlahGuru}
                  </span>
                </div>
              </div>

              <div className="info-box text-bg-danger">
                <span className="info-box-icon">
                  <i className="fas fa-user-graduate"></i>
                </span>

                <div className="info-box-content">
                  <span className="info-box-text">
                    Jumlah Siswa
                  </span>

                  <span className="info-box-number">
                    {jumlahSiswa}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Fitur */}
          <div className="card mt-3 border-0 shadow-sm">
            <div className="card-body bg-warning">
              <h6 className="fw-bold mb-3">
                Fitur Utama
              </h6>

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
  );
}