"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import EujianMenu from "../components/EujianMenu";

type ExamOption = {
  id: string;
  namaBankSoal: string;
  kelas: string;
};

type Participant = {
  studentId: string;
  nis: string;
  nisn: string;
  nama: string;
  status: "Sedang mengerjakan" | "Selesai" | "locked";
  violationCount: number;
};

export default function PelanggaranUjianPage() {
  const { user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [pendingStudentId, setPendingStudentId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setExams([]);
      setSelectedExamId("");
      setLoadingExams(authLoading);
      return;
    }

    setLoadingExams(true);
    const examsQuery = query(
      collection(db, "bank_soal"),
      where("ownerId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(
      examsQuery,
      (snapshot) => {
        const nextExams = snapshot.docs.map((document) => ({
          id: document.id,
          namaBankSoal: String(document.data().namaBankSoal || "Ujian tanpa nama"),
          kelas: String(document.data().kelas || ""),
        }));
        setExams(nextExams);
        setSelectedExamId((current) =>
          nextExams.some((exam) => exam.id === current)
            ? current
            : nextExams[0]?.id || ""
        );
        setLoadingExams(false);
      },
      (loadError) => {
        console.error("Gagal memuat daftar ujian untuk pelanggaran:", loadError);
        setError("Gagal memuat daftar ujian.");
        setLoadingExams(false);
      }
    );
    return () => unsubscribe();
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!selectedExamId || !user?.uid) {
      setParticipants([]);
      setLoadingParticipants(false);
      return;
    }

    let cancelled = false;
    let initialLoad = true;
    const loadParticipants = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");
        const response = await fetch(
          `/api/cbt/participants?examId=${encodeURIComponent(selectedExamId)}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        const result = await response.json() as {
          success: boolean;
          message?: string;
          participants?: Participant[];
        };
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal memuat pelanggaran siswa.");
        }
        if (!cancelled) {
          setParticipants(result.participants || []);
          setError("");
        }
      } catch (loadError) {
        console.error("Gagal memuat pelanggaran siswa:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Gagal memuat data pelanggaran."
          );
        }
      } finally {
        if (!cancelled && initialLoad) {
          setLoadingParticipants(false);
          initialLoad = false;
        }
      }
    };

    setLoadingParticipants(true);
    void loadParticipants();
    const interval = window.setInterval(() => void loadParticipants(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [refreshKey, selectedExamId, user?.uid]);

  const unlockStudent = async (participant: Participant) => {
    setPendingStudentId(participant.studentId);
    setError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");
      const response = await fetch("/api/cbt/participants", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: participant.studentId,
        }),
      });
      const result = await response.json() as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal membuka kunci siswa.");
      }
      setRefreshKey((current) => current + 1);
    } catch (unlockError) {
      console.error("Gagal membuka kunci siswa:", unlockError);
      setError(
        unlockError instanceof Error ? unlockError.message : "Gagal membuka kunci siswa."
      );
    } finally {
      setPendingStudentId("");
    }
  };

  const selectedExam = exams.find((exam) => exam.id === selectedExamId);
  const violationParticipants = participants.filter(
    (participant) => participant.violationCount > 0 || participant.status === "locked"
  );

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h4 className="app-content-headerText">Pelanggaran Ujian</h4>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item"><a href="/admin/guru/eujian">E-Ujian</a></li>
                <li className="breadcrumb-item active">Pelanggaran</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <section
            className="callout border-0 shadow-sm rounded-4 p-4 mb-3"
            style={{
              background: "linear-gradient(135deg, #0d6efd 0%, #4f46e5 100%)",
              color: "#fff",
            }}
          >
            <div className="d-flex align-items-start gap-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.15)",
                  fontSize: 26,
                }}
                aria-hidden="true"
              >
                <i className="fas fa-triangle-exclamation" />
              </div>
              <div>
                <h4 className="fw-bold mb-2">Pelanggaran Peserta Ujian</h4>
                <p className="mb-3" style={{ opacity: 0.9 }}>
                  Pantau perpindahan tab, keluar fullscreen, dan percobaan meninggalkan halaman.
                  Penguncian berlaku untuk ujian yang dipilih saja.
                </p>
                <EujianMenu active="pelanggaran" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h3 className="card-title mb-0">Riwayat Pelanggaran</h3>
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold mb-0" htmlFor="violationExamSelector">Ujian</label>
                <select
                  className="form-select"
                  id="violationExamSelector"
                  value={selectedExamId}
                  onChange={(event) => setSelectedExamId(event.target.value)}
                  disabled={loadingExams || exams.length === 0}
                >
                  {exams.length === 0 ? (
                    <option value="">Belum ada ujian</option>
                  ) : (
                    exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.namaBankSoal}{exam.kelas ? ` - ${exam.kelas}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              {selectedExam && (
                <p className="text-muted">
                  {selectedExam.namaBankSoal}{selectedExam.kelas ? ` · ${selectedExam.kelas}` : ""}
                </p>
              )}
              {loadingExams || loadingParticipants ? (
                <div className="text-center text-muted py-4">Memuat data pelanggaran...</div>
              ) : exams.length === 0 ? (
                <div className="text-center text-muted py-4">Belum ada ujian.</div>
              ) : violationParticipants.length === 0 ? (
                <div className="text-center text-muted py-4">Belum ada pelanggaran pada ujian ini.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">No</th>
                        <th scope="col">NIS</th>
                        <th scope="col">NISN</th>
                        <th scope="col">Nama siswa</th>
                        <th scope="col">Jumlah pelanggaran</th>
                        <th scope="col">Status ujian</th>
                        <th scope="col">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violationParticipants.map((participant, index) => (
                        <tr key={participant.studentId}>
                          <td>{index + 1}</td>
                          <td>{participant.nis || "-"}</td>
                          <td>{participant.nisn || "-"}</td>
                          <td className="fw-semibold">{participant.nama}</td>
                          <td>
                            <span className={`badge ${participant.violationCount >= 2 ? "text-bg-danger" : "text-bg-warning"}`}>
                              {participant.violationCount}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${participant.status === "locked" ? "text-bg-danger" : "text-bg-primary"}`}>
                              {participant.status === "locked" ? "Terkunci" : participant.status}
                            </span>
                          </td>
                          <td>
                            {participant.status === "locked" ? (
                              <button
                                className="btn btn-sm btn-outline-success"
                                disabled={pendingStudentId === participant.studentId}
                                onClick={() => void unlockStudent(participant)}
                                type="button"
                              >
                                {pendingStudentId === participant.studentId ? "Membuka..." : "Buka kunci"}
                              </button>
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <small className="text-muted">Data diperbarui otomatis setiap 15 detik.</small>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
