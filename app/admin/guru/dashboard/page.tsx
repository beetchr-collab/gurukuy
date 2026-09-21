"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { MATA_PELAJARAN } from "@/lib/mata-pelajaran";
import {
  KepalaSekolah,
  getKepalaSekolahBySchool,
} from "@/services/kepalaSekolah.service";
import {
  getJumlahKelas,
} from "@/services/kelas.service";

type JurnalHariIni = {
  id: string;
  mapelId: string;
  materi: string;
  tujuanPembelajaran: string;
  kegiatanPembelajaran: string;
  jamKe?: string;
};

const getTodayInputValue = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
};

const mapelLabelMap = new Map(
  MATA_PELAJARAN.map((item) => [item.idMataPelajaran, item.namaMataPelajaran]),
);

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
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

  // State untuk mengambil data kepala sekolah dan tahun ajaran aktif
  const [kepalaSekolah, setKepalaSekolah] = useState<KepalaSekolah | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [loading, setLoading] = useState(true);
  const [jurnalHariIni, setJurnalHariIni] = useState<JurnalHariIni[]>([]);
  const [jurnalLoading, setJurnalLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;

    const schoolId = user?.schoolId;

    if (!schoolId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const result = await getKepalaSekolahBySchool(schoolId);

        console.log("School ID :", schoolId);
        console.log("Kepala Sekolah :", result);

        // Cari data yang aktif
        const aktif = result.find((item) => item.aktif);

        if (aktif) {
          setKepalaSekolah(aktif);
          setTahunAjaran(aktif.tahunAjaran);
        } else {
          setKepalaSekolah(null);
          setTahunAjaran("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading]);

  useEffect(() => {
    const loadJurnalHariIni = async () => {
      if (!user?.uid || !user.schoolId) {
        setJurnalHariIni([]);
        setJurnalLoading(false);
        return;
      }

      setJurnalLoading(true);

      try {
        const jurnalQuery = query(
          collection(db, "jurnal_mengajar"),
          where("ownerId", "==", user.uid),
          where("schoolId", "==", user.schoolId),
          where("tanggal", "==", getTodayInputValue()),
        );
        const snapshot = await getDocs(jurnalQuery);

        setJurnalHariIni(
          snapshot.docs
            .map((jurnalDoc) => ({
              id: jurnalDoc.id,
              ...(jurnalDoc.data() as Omit<JurnalHariIni, "id">),
            }))
            .sort((a, b) => (a.jamKe || "").localeCompare(b.jamKe || "")),
        );
      } catch (error) {
        console.error("Gagal memuat jurnal hari ini:", error);
        setJurnalHariIni([]);
      } finally {
        setJurnalLoading(false);
      }
    };

    if (!authLoading) {
      loadJurnalHariIni();
    }
  }, [user, authLoading]);

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
        <div className="app-content mb-3">
          <div className="container-fluid">

            {/* WELCOME CARD */}
            <div className="callout callout-info">
              <div className="card-body">
                <h5 className="fw-bold mb-2">Selamat Datang 👋</h5>
                <p className="text-muted mb-0">
                  Portal ini merupakan media informasi dan komunikasi sekolah
                  yang memberikan layanan cepat, transparan, dan mudah diakses.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Kepala Sekolah Aktif */}
        <div className="app-content mb-3">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm h-100 rounded-4">

                  {/* Header */}
                  <div className="card-header bg-primary text-white border-0 rounded-top-4 py-3">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-user-tie fs-4 me-2"></i>
                      <h5 className="mb-0 fw-semibold">Kepala Sekolah Aktif</h5>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="card-body">

                    {/* Profil */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                      {/* Foto & Nama */}
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "72px",
                            height: "72px",
                            fontSize: "30px",
                          }}
                        >
                          <i className="fas fa-user"></i>
                        </div>

                        <div className="ms-3">
                          <small className="text-muted d-block">
                            Kepala Sekolah
                          </small>

                          <h6 className="fw-bold mb-2">
                            {kepalaSekolah?.nama ?? "-"}
                          </h6>

                          <p className="mb-1">
                            <span className="text-muted">NIP. <span className="fw-semibold">{kepalaSekolah?.nip ?? "-"}</span></span><br />

                          </p>

                          <p className="mb-0">
                            <span className="text-muted">Tahun Ajaran :  <span className="fw-semibold">{kepalaSekolah?.tahunAjaran ?? "-"}</span></span><br />

                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="text-md-end">
                        <small className="text-muted d-block mb-1">
                          Status
                        </small>

                        <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">
                          <i className="fas fa-check-circle me-1"></i>
                          Aktif
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JURNAL MENGAJAR HARI INI */}
        <div className="app-content mb-3">
          <div className="container-fluid">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-success text-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <h5 className="mb-0 fw-semibold">
                    <i className="fas fa-book-open me-2"></i>
                    Jurnal Mengajar Hari Ini
                  </h5>
                  <span className="badge bg-white text-success">
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date())}
                  </span>
                </div>
              </div>

              <div className="card-body">
                {jurnalLoading ? (
                  <p className="text-muted mb-0">Memuat jurnal...</p>
                ) : jurnalHariIni.length === 0 ? (
                  <p className="text-muted mb-0">
                    Belum ada jurnal mengajar untuk hari ini.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle mb-0">
                      <thead className="table-light text-center">
                        <tr>
                          <th>Mata Pelajaran</th>
                          <th>Materi/Topik</th>
                          <th>Tujuan Pembelajaran</th>
                          <th>Kegiatan Pembelajaran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jurnalHariIni.map((jurnal) => (
                          <tr key={jurnal.id}>
                            <td className="fw-semibold">
                              {mapelLabelMap.get(jurnal.mapelId) || jurnal.mapelId || "-"}
                            </td>
                            <td>{jurnal.materi || "-"}</td>
                            <td>{jurnal.tujuanPembelajaran || "-"}</td>
                            <td>{jurnal.kegiatanPembelajaran || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FITUR LIST */}
        <div className="app-content">
          <div className="containet-fluid">
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