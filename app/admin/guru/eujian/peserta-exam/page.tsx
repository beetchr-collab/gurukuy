"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { parseCbtApiResponse } from "@/lib/cbt-api-response";
import EujianMenu from "../components/EujianMenu";

type ExamOption = {
  id: string;
  namaBankSoal?: string;
  mataPelajaran?: string;
  kelas?: string;
};

type Participant = {
  studentId: string;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  status: "Sedang mengerjakan" | "Selesai" | "locked";
  violationCount: number;
  remainingSeconds: number | null;
};

const formatRemainingTime = (seconds: number | null) => {
  if (seconds === null) return "Selesai";
  if (seconds <= 0) return "Waktu habis";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return hours > 0
    ? `${hours} jam ${minutes} menit`
    : `${minutes} menit ${remainingSeconds} detik`;
};

export default function PesertaExamPage() {
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
        const nextExams = snapshot.docs.map((exam) => ({
          id: exam.id,
          namaBankSoal: String(exam.data().namaBankSoal || ""),
          mataPelajaran: String(exam.data().mataPelajaran || ""),
          kelas: String(exam.data().kelas || ""),
        }));
        setExams(nextExams);
        setSelectedExamId((current) =>
          nextExams.some((exam) => exam.id === current)
            ? current
            : nextExams[0]?.id || ""
        );
        setLoadingExams(false);
      },
      (snapshotError) => {
        console.error("Gagal memuat ujian untuk daftar peserta:", snapshotError);
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
    let isInitialLoad = true;

    const loadParticipants = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");

        const response = await fetch(
          `/api/cbt/participants?examId=${encodeURIComponent(selectedExamId)}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        const result = await parseCbtApiResponse<{
          success: boolean;
          message?: string;
          participants?: Participant[];
        }>(response, "Gagal memuat peserta ujian.");

        if (!cancelled) {
          setParticipants(result.participants || []);
          setError("");
        }
      } catch (loadError) {
        console.error("Gagal memuat peserta ujian:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat peserta ujian."
          );
        }
      } finally {
        if (!cancelled && isInitialLoad) {
          setLoadingParticipants(false);
          isInitialLoad = false;
        }
      }
    };

    setLoadingParticipants(true);
    void loadParticipants();
    const refreshInterval = window.setInterval(() => {
      void loadParticipants();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [refreshKey, selectedExamId, user?.uid]);

  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setParticipants((current) =>
        current.map((participant) => ({
          ...participant,
          remainingSeconds: participant.remainingSeconds === null
            ? null
            : Math.max(0, participant.remainingSeconds - 1),
        }))
      );
    }, 1000);

    return () => window.clearInterval(clockInterval);
  }, []);

  const resetParticipant = async (participant: Participant) => {
    const selectedExam = exams.find((exam) => exam.id === selectedExamId);
    const confirmed = window.confirm(
      `Reset percobaan ${participant.nama} pada ujian "${selectedExam?.namaBankSoal || "ini"}"? Jawaban yang sudah dikumpulkan akan dihapus.`
    );
    if (!confirmed) return;

    setPendingStudentId(participant.studentId);
    setError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");

      const response = await fetch("/api/cbt/participants", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: participant.studentId,
        }),
      });
      await parseCbtApiResponse<{
        success: boolean;
        message?: string;
      }>(response, "Gagal mereset percobaan siswa.");

      setRefreshKey((current) => current + 1);
    } catch (resetError) {
      console.error("Gagal mereset peserta ujian:", resetError);
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Gagal mereset percobaan siswa."
      );
    } finally {
      setPendingStudentId("");
    }
  };

  const selectedExam = exams.find((exam) => exam.id === selectedExamId);

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h4 className="app-content-headerText">Peserta Ujian</h4>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">
                  <a href="/admin/guru/eujian">E-Ujian</a>
                </li>
                <li className="breadcrumb-item active">Peserta</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div
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
              >
                <i className="fas fa-users" aria-hidden="true" />
              </div>
              <div>
                <h4 className="fw-bold mb-2">Peserta E-Ujian</h4>
                <p className="mb-3" style={{ opacity: 0.9 }}>
                  Pantau siswa yang sudah masuk ke ujian, status pengerjaan, dan
                  sisa durasi. Reset akan menghapus percobaan CBT siswa pada
                  ujian yang dipilih.
                </p>
                <EujianMenu active="peserta" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h3 className="card-title mb-0">Daftar Peserta</h3>
              <div className="d-flex align-items-center gap-2">
                <label className="fw-semibold mb-0" htmlFor="examSelector">
                  Ujian
                </label>
                <select
                  className="form-select"
                  id="examSelector"
                  value={selectedExamId}
                  onChange={(event) => setSelectedExamId(event.target.value)}
                  disabled={loadingExams || exams.length === 0}
                >
                  {exams.length === 0 ? (
                    <option value="">Belum ada ujian</option>
                  ) : (
                    exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.namaBankSoal || "Ujian tanpa nama"}
                        {exam.kelas ? ` - ${exam.kelas}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {selectedExam && (
                <p className="text-muted mb-3">
                  {selectedExam.mataPelajaran || "Ujian CBT"}
                  {selectedExam.kelas ? ` · ${selectedExam.kelas}` : ""}
                </p>
              )}

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">No</th>
                      <th scope="col">NIS</th>
                      <th scope="col">NISN</th>
                      <th scope="col">Nama siswa</th>
                      <th scope="col">L/P</th>
                      <th scope="col">Status</th>
                      <th scope="col">Pelanggaran</th>
                      <th scope="col">Sisa durasi</th>
                      <th scope="col" className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingExams || loadingParticipants ? (
                      <tr>
                        <td className="text-center py-4" colSpan={9}>
                          Memuat data peserta...
                        </td>
                      </tr>
                    ) : !selectedExamId ? (
                      <tr>
                        <td className="text-center text-muted py-4" colSpan={9}>
                          Belum ada ujian yang dapat dipantau.
                        </td>
                      </tr>
                    ) : participants.length === 0 ? (
                      <tr>
                        <td className="text-center text-muted py-4" colSpan={9}>
                          Belum ada siswa yang masuk ke ujian ini.
                        </td>
                      </tr>
                    ) : (
                      participants.map((participant, index) => (
                        <tr key={participant.studentId}>
                          <td>{index + 1}</td>
                          <td>{participant.nis || "-"}</td>
                          <td>{participant.nisn || "-"}</td>
                          <td className="fw-semibold">{participant.nama}</td>
                          <td>{participant.jk || "-"}</td>
                          <td>
                            <span
                              className={`badge ${
                                participant.status === "Selesai"
                                  ? "bg-success"
                                  : participant.status === "locked"
                                    ? "bg-danger"
                                    : "bg-primary"
                              }`}
                            >
                              {participant.status === "locked" ? "Terkunci" : participant.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${participant.violationCount >= 2 ? "text-bg-danger" : participant.violationCount > 0 ? "text-bg-warning" : "text-bg-light"}`}>
                              {participant.violationCount}
                            </span>
                          </td>
                          <td>
                            {participant.status === "Selesai" || participant.status === "locked"
                              ? "Selesai"
                              : formatRemainingTime(participant.remainingSeconds)}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              type="button"
                              onClick={() => void resetParticipant(participant)}
                              disabled={pendingStudentId === participant.studentId}
                              title="Hapus hasil dan reset percobaan siswa untuk ujian ini"
                            >
                              <i className="fas fa-rotate-left me-1" aria-hidden="true" />
                              {pendingStudentId === participant.studentId
                                ? "Mereset..."
                                : "Reset siswa"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <small className="text-muted">
                Daftar diperbarui otomatis setiap 15 detik.
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}