"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,           // ✅ TAMBAHAN
  where,            // ✅ TAMBAHAN
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/pagination/Pagination";

export default function AdminGuruPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  /* =========================
     AMBIL SCHOOL ADMIN
  ========================= */
  useEffect(() => {
    if (!user?.uid) return;

    const fetchAdmin = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const data = snap.data();

        console.log("ADMIN DATA:", data);

        setSchoolId(data.schoolId || null);
      }

      setLoading(false);
    };

    fetchAdmin();
  }, [user]);

  /* =========================
     REALTIME (FIX RULES)
  ========================= */
  useEffect(() => {
    if (!schoolId) {
      console.log("❌ schoolId belum ada");
      return;
    }

    console.log("✅ schoolId dipakai:", schoolId);

    // 🔥 FIX QUERY (WAJIB)
    const q = query(
      collection(db, "users"),
      where("role", "==", "guru"),
      where("schoolId", "==", schoolId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("DATA GURU:", list);

      setGuruList(list);
    });

    return () => unsubscribe();
  }, [schoolId]);

  /* =========================
      STATUS ONLINE/OFLINE
   ========================= */
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(async () => {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          lastActive: serverTimestamp(),
        });
      } catch (err) {
        console.log(err);
      }
    }, 30000); // tiap 30 detik

    return () => clearInterval(interval);
  }, [user]);

  const isOnline = (lastActive: any) => {
    if (!lastActive) return false;

    const last = lastActive.toDate();
    const now = new Date();

    const diff = (now.getTime() - last.getTime()) / 1000;

    return diff < 120; // 2 menit = online
  };
  /* =========================
     SEARCH DAN STATUS
  ========================= */
  const filteredGuru = guruList.filter((g: any) => {
    const keyword = search.toLowerCase();

    const matchSearch =
      (g.username || "").toLowerCase().includes(keyword) ||
      (g.email || "").toLowerCase().includes(keyword);

    const matchStatus =
      filterStatus === "all" ||
      (g.status || "").toLowerCase() === filterStatus;

    return matchSearch && matchStatus;
  });

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    currentData,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: filteredGuru,
    pageSize: 10,
    resetDeps: [search, filterStatus],
  });

  /* =========================
  HAPUS GURU + MODAL
  ========================= */
  const handleDeleteClick = (guru: any) => {
    setSelectedGuru(guru);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGuru) return;

    setDeleting(true);

    try {
      await updateDoc(doc(db, "users", selectedGuru.id), {
        schoolId: "",
        kodeSekolah: "",
      });

      setShowDeleteModal(false);
      setSelectedGuru(null);
    } catch (err) {
      console.log(err);
      alert("Gagal menghapus guru");
    } finally {
      setDeleting(false);
    }
  };

  /* =========================
  CHAT WA
  ========================= */
  const handleChatWA = (wa: string) => {
    if (!wa) {
      alert("Nomor WA tidak tersedia");
      return;
    }

    // 🔥 format ke 62 (Indonesia)
    const nomor = wa.replace(/^0/, "62").replace(/\D/g, "");

    const pesan = `Halo 👋

Saya dari admin sekolah.

Ingin menghubungi terkait data di sistem.`;

    const url = `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;

    window.open(url, "_blank");
  };

  if (loading) return <p className="p-3">Loading...</p>;

  return (
    <main className="app-main py-3">
      <div className="container-fluid">

        <h4 className="mb-3">Daftar Guru</h4>

        <div className="callout callout-info mb-3">
          <h5>Informasi</h5>
          <p className="mb-1">
            Halaman ini menampilkan daftar guru berdasarkan sekolah Anda secara realtime.
          </p>
          <ul className="mb-0 small">
            <li>Gunakan fitur <b>pencarian</b> untuk menemukan guru dengan cepat</li>
            <li>Filter status untuk melihat guru aktif atau nonaktif</li>
            <li>Ikon <span className="badge bg-success">● Online</span> menandakan guru sedang aktif</li>
            <li>Anda dapat menghapus atau menghubungi guru melalui WhatsApp</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header text-bg-primary">
            List Guru (Realtime)
          </div>

          <div className="card-body">
            <div className="">
              <div className="p-3 border-bottom d-flex flex-wrap gap-2">

                {/* 🔍 SEARCH */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari nama / email..."
                  style={{ maxWidth: 250 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {/* 🎯 FILTER STATUS */}
                <select
                  className="form-select"
                  style={{ maxWidth: 200 }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Semua</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>

              </div>

            </div>

            {filteredGuru.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>

                <h5 className="text-muted">
                  Tidak ada data guru
                </h5>

                <p className="text-muted mb-0">
                  Data guru belum tersedia atau tidak sesuai dengan filter yang dipilih.
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>No</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>No Telpon</th>
                        <th>Kode Sekolah</th>
                        <th style={{ width: "120px" }}>Status</th>
                        <th style={{ width: "120px" }}>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentData.map((g, i) => (
                        <tr key={g.id}>
                          <td>{startIndex + i + 1}</td>

                          <td>{g.username || g.nama || "-"}</td>

                          <td>{g.email || "-"}</td>

                          <td>{g.whatsapp || "-"}</td>

                          <td className="text-muted small">
                            {g.kodeSekolah || "-"}
                          </td>

                          <td className="text-center">
                            {isOnline(g.lastActive) ? (
                              <span className="badge bg-success">
                                ● Online
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                ● Offline
                              </span>
                            )}
                          </td>

                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteClick(g)}
                                title="Hapus Guru"
                              >
                                <i className="fas fa-user-times"></i>
                              </button>

                              {g.whatsapp ? (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleChatWA(g.whatsapp)}
                                  title="Chat WhatsApp"
                                >
                                  <i className="fab fa-whatsapp"></i>
                                </button>
                              ) : (
                                <span className="text-muted small">-</span>
                              )}

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 p-3 border-top">

                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">
                      Tampilkan
                    </span>

                    <select
                      className="form-select form-select-sm"
                      style={{ width: "80px" }}
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>

                    <span className="small text-muted">
                      data
                    </span>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />

                </div>
              </>
            )}

          </div>
        </div>

      </div>

      {/*MODAL HAPUS GURU*/}
      {showDeleteModal && (
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Hapus Guru</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>

              <div className="modal-body text-center">
                <p>
                  Yakin ingin menghapus guru:
                </p>
                <b>{selectedGuru?.username || selectedGuru?.email}</b>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Batal
                </button>

                <button
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Menghapus..." : "Hapus"}
                </button>
              </div>

            </div>
          </div>

          {/* backdrop */}
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </main>
  );
}