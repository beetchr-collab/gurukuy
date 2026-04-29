"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [kode, setKode] = useState("");
  const [school, setSchool] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [checking, setChecking] = useState(false);
  const [previewSchool, setPreviewSchool] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // 🔥 normalisasi kode
  const normalizeKode = (val: string) => val.toUpperCase().trim();

  /* =========================
     REALTIME USER + SEKOLAH
  ========================= */
  useEffect(() => {
    if (!user?.uid) return;

    // 🔥 listen user
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (userSnap) => {
      if (!userSnap.exists()) {
        setSchool(null);
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (!userData.schoolId) {
        setSchool(null);
        setLoading(false);
        return;
      }

      // 🔥 listen sekolah
      const unsubSekolah = onSnapshot(
        doc(db, "sekolah", userData.schoolId),
        (sekolahSnap) => {
          if (sekolahSnap.exists()) {
            setSchool(sekolahSnap.data());
          } else {
            setSchool(null);
          }

          setLoading(false);
        }
      );

      return () => unsubSekolah();
    });

    return () => unsubUser();
  }, [user]);

  /* =========================
     PREVIEW SEKOLAH
  ========================= */
  const checkSekolah = async (kodeInput: string) => {
    const cleanKode = normalizeKode(kodeInput);

    if (cleanKode.length < 5) {
      setPreviewSchool(null);
      return;
    }

    setChecking(true);

    try {
      const q = query(
        collection(db, "sekolah"),
        where("kodeSekolah", "==", cleanKode)
      );

      const res = await getDocs(q);

      if (res.empty) {
        setPreviewSchool(null);
      } else {
        setPreviewSchool(res.docs[0].data());
      }
    } catch (err) {
      console.log(err);
    } finally {
      setChecking(false);
    }
  };

  /* =========================
     JOIN SEKOLAH
  ========================= */
  const handleJoin = async () => {
    if (!user?.uid) return;

    if (joining) return;

    if (school) {
      setModalMessage("Kamu sudah tergabung dalam sekolah");
      setShowModal(true);
      return;
    }

    if (!previewSchool) {
      setModalMessage("Kode sekolah tidak valid");
      setShowModal(true);
      return;
    }

    setJoining(true);

    try {
      const q = query(
        collection(db, "sekolah"),
        where("kodeSekolah", "==", normalizeKode(kode))
      );

      const res = await getDocs(q);
      const sekolahDoc = res.docs[0];

      await setDoc(
        doc(db, "users", user.uid),
        {
          role: "guru",
          schoolId: sekolahDoc.id,
          kodeSekolah: normalizeKode(kode),
        },
        { merge: true }
      );

      // ❗ tidak perlu setSchool → realtime yang handle

      setPreviewSchool(null);
      setKode("");

      setModalMessage(`Berhasil gabung ke ${previewSchool.namaSekolah} 🎉`);
      setShowModal(true);

    } catch (err) {
      console.log(err);
      setModalMessage("Gagal join sekolah");
      setShowModal(true);
    } finally {
      setJoining(false);
    }
  };

  /* =========================
     KELUAR SEKOLAH
  ========================= */
  const handleLeave = async () => {
    if (!user?.uid) return;

    if (!confirm("Yakin ingin keluar?")) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        schoolId: "",
        kodeSekolah: "",
      });

      setModalMessage("Berhasil keluar dari sekolah");
      setShowModal(true);
    } catch (err) {
      console.log(err);
      setModalMessage("Gagal keluar dari sekolah");
      setShowModal(true);
    }
  };

  if (loading) return <p className="p-3">Memuat data...</p>;

  return (
    <main className="app-main">
      <div className="container-fluid">
        {/* HEADER */}
        <div className="app-content-header">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Data Sekolah</h4>
            </div>
          </div>
        </div>

        <div className="callout callout-info">
          <div className="card-body">
            <h5 className="fw-bold mb-2">Informasi Data Sekolah</h5>

            <p className="mb-2 text-muted">
              Halaman ini digunakan untuk bergabung dan melihat informasi sekolah tempat Anda mengajar.
            </p>

            <ul className="mb-0 small">
              <li>
                Masukkan <b>kode sekolah</b> yang diberikan oleh admin untuk bergabung ke sekolah.
              </li>
              <li>
                Pastikan kode sekolah yang dimasukkan benar agar sistem dapat menemukan sekolah yang sesuai.
              </li>
              <li>
                Setelah berhasil bergabung, data sekolah akan ditampilkan secara otomatis.
              </li>
              <li>
                Jika terjadi kesalahan, Anda dapat keluar dari sekolah dan memasukkan kode yang benar kembali.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="card mt-3">
          <div className="card-header text-bg-primary">
            <h5 className="mb-0">Data Sekolah</h5>
          </div>

          <div className="card-body">

            {/* ================= BELUM JOIN ================= */}
            {!school && (
              <>
                <h6>Gabung ke Sekolah</h6>

                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Masukkan Kode Sekolah"
                  value={kode}
                  onChange={(e) => {
                    const val = normalizeKode(e.target.value);
                    setKode(val);
                    checkSekolah(val);
                  }}
                />

                {checking && <div className="text-muted small">Mengecek...</div>}

                {previewSchool && (
                  <div className="alert alert-info">
                    <b>{previewSchool.namaSekolah}</b><br />
                    <small>{previewSchool.kabupaten}</small>
                  </div>
                )}

                {!previewSchool && kode.length >= 5 && !checking && (
                  <div className="text-danger small">
                    Kode tidak ditemukan
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleJoin}
                  disabled={!previewSchool || joining}
                >
                  {joining ? "Memproses..." : "Gabung"}
                </button>
              </>
            )}

            {/* ================= SUDAH JOIN ================= */}
            {school && (
              <>
                <div className="alert alert-success">
                  Kamu sudah tergabung dalam sekolah
                </div>

                <div className="row mb-2">
                  <div className="col-sm-3 col-form-label">Nama Sekolah</div>
                  <div className="col-sm-9">
                    <input
                      className="form-control"
                      value={school.namaSekolah}
                      disabled
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-sm-3 col-form-label">NPSN</div>
                  <div className="col-sm-9">
                    <input
                      className="form-control"
                      value={school.npsn}
                      disabled
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-sm-3 col-form-label">Status</div>
                  <div className="col-sm-9">
                    <input
                      className="form-control"
                      value={school.status}
                      disabled
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-sm-3 col-form-label">Bentuk</div>
                  <div className="col-sm-9">
                    <input
                      className="form-control"
                      value={school.bentuk}
                      disabled
                    />
                  </div>
                </div>

                {/* 🔥 NOMOR WA ADMIN */}
                <div className="row mb-2 align-items-center">
                  <div className="col-sm-3 col-form-label">WA Admin</div>

                  <div className="col-sm-3">
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        className="form-control"
                        value={school.wa || "-"}
                        disabled
                      />

                      {school.wa && (
                        <a
                          href={`https://wa.me/${school.wa.replace(/^0/, "62")}`}
                          target="_blank"
                          className="btn btn-success"
                        >
                          <i className="fab fa-whatsapp"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-danger"
                  onClick={handleLeave}
                >
                  <i className="fas fa-exchange-alt"></i> Ganti Sekolah
                </button>
              </>
            )}

          </div>
        </div>

      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <>
          <div
            className="modal show"
            style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">Informasi</h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="modal-body text-center">
                  <p>{modalMessage}</p>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-success"
                    onClick={() => setShowModal(false)}
                  >
                    OK
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

    </main>
  );
}