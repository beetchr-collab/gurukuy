"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../cbt.module.css";

type CbtStudent = {
  id: string;
  nama: string;
  nisn: string;
  nis: string;
  jk: string;
  kelas: string;
  tingkatKelas: string;
  schoolId: string;
};

type ActiveExam = {
  id: string;
  namaBankSoal?: string;
  mataPelajaran?: string;
  kelas?: string;
  examStatus?: string;
  allowAccess?: boolean;
};

const subscribeToStudentSession = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

const getStudentSession = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem("cbtStudent");

export default function CbtDashboardPage() {
  const router = useRouter();
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<ActiveExam | null>(null);
  const [examToken, setExamToken] = useState("");
  const [startError, setStartError] = useState("");
  const [startingExam, setStartingExam] = useState(false);
  const storedStudent = useSyncExternalStore(
    subscribeToStudentSession,
    getStudentSession,
    () => null
  );
  let student: CbtStudent | null = null;

  try {
    student = storedStudent ? (JSON.parse(storedStudent) as CbtStudent) : null;
  } catch {
    student = null;
  }

  // Redirect to login if no valid student session is found
  useEffect(() => {
    if (!storedStudent) {
      router.replace("/cbt");
      return;
    }

    try {
      JSON.parse(storedStudent);
    } catch {
      localStorage.removeItem("cbtStudent");
      router.replace("/cbt");
    }
  }, [router, storedStudent]);

  // Load active exams for the student
useEffect(() => {
  if (!storedStudent) return;

  let cancelled = false;

  const loadActiveExams = async () => {
    try {
      const currentStudent = JSON.parse(
        storedStudent
      ) as CbtStudent;

      const response = await fetch("/api/cbt/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kelas:
            currentStudent.kelas ||
            currentStudent.tingkatKelas,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal memuat ujian."
        );
      }

      if (cancelled) return;

      setActiveExams(result.exams || []);
    } catch (error) {
      console.error(
        "Gagal memuat ujian CBT aktif:",
        error
      );

      if (!cancelled) {
        setActiveExams([]);
      }
    }
  };

  void loadActiveExams();

  return () => {
    cancelled = true;
  };
}, [storedStudent]);

  useEffect(() => {
    if (!selectedExam) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !startingExam) {
        setSelectedExam(null);
        setExamToken("");
        setStartError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedExam, startingExam]);

  const handleStartExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedExam || !student || startingExam) return;

    const token = examToken.trim();
    if (!token) {
      setStartError("Token ujian wajib diisi.");
      return;
    }

    setStartingExam(true);
    setStartError("");
    try {
      const response = await fetch("/api/cbt/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          studentId: student.id,
          token,
          startOnly: true,
        }),
      });
      const result = await response.json() as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setStartError(result.message || "Ujian gagal dimulai. Silakan coba lagi.");
        return;
      }

      sessionStorage.setItem(`cbtExamToken:${selectedExam.id}`, token);
      router.push(`/cbt/exam?examId=${encodeURIComponent(selectedExam.id)}`);
    } catch (error) {
      console.error("Gagal memulai ujian CBT:", error);
      setStartError("Ujian gagal dimulai. Periksa koneksi lalu coba lagi.");
    } finally {
      setStartingExam(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cbtStudent");
    router.replace("/cbt");
  };

  if (!student) {
    return <main className={styles.dashboardLoading}>Memuat ruang siswa...</main>;
  }

  const className = student.kelas || student.tingkatKelas || "Belum ditentukan";

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.dashboardShell}>
        <header className={styles.dashboardHeader}>
          <div className={styles.dashboardBrand}>
            <span className={styles.brandMark}>G</span>
            <span>GuruKuy CBT</span>
          </div>
          <div className={styles.resultsHeaderActions}>
            <Link className={styles.logoutButton} href="/cbt/nilai-siswa">
              <i className="bi bi-award" aria-hidden="true" />
              Nilai saya
            </Link>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </header>

        <section className={styles.dashboardContent}>
          <p className={styles.dashboardEyebrow}>RUANG PESERTA DIDIK</p>
          <h1>Halo, {student.nama}</h1>
          <p className={styles.dashboardLead}>Selamat datang di ruang ujian CBT GuruKuy.</p>

          <div className={styles.studentSummary} aria-label="Data peserta didik">
            <div className={styles.studentDetail}>
              <span>Nama peserta</span>
              <strong>{student.nama}</strong>
            </div>
            <div className={styles.studentDetail}>
              <span>NISN</span>
              <strong>{student.nisn}</strong>
            </div>
            <div className={styles.studentDetail}>
              <span>Kelas</span>
              <strong>{className}</strong>
            </div>
          </div>

          {activeExams.length ? (
            activeExams.map((exam) => (
              <div className={styles.examNotice} key={exam.id}>
                <span className={styles.noticeIcon}>
                  <i className="bi bi-calendar2-check" aria-hidden="true" />
                </span>
                <div className={styles.examNoticeContent}>
                  <h2>{exam.namaBankSoal || "Ujian aktif"}</h2>
                  <p>{exam.mataPelajaran || "Ujian CBT"} · {exam.kelas}</p>
                  <button
                    className={styles.startExamButton}
                    type="button"
                    onClick={() => {
                      setSelectedExam(exam);
                      setExamToken("");
                      setStartError("");
                    }}
                  >
                    <i className="bi bi-play-fill" aria-hidden="true" />
                    Mulai
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.examNotice}>
              <span className={styles.noticeIcon}>
                <i className="bi bi-calendar2-check" aria-hidden="true" />
              </span>
              <div>
                <h2>Belum ada ujian yang tersedia</h2>
                <p>Jadwal ujian akan muncul di sini setelah sekolah mengaktifkannya.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedExam && (
        <div
          className={styles.startExamOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !startingExam) {
              setSelectedExam(null);
            }
          }}
        >
          <section
            className={styles.startExamDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-exam-title"
          >
            <button
              className={styles.closeStartExamDialog}
              type="button"
              aria-label="Tutup"
              disabled={startingExam}
              onClick={() => setSelectedExam(null)}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <span className={styles.startExamDialogIcon}>
              <i className="bi bi-shield-lock" aria-hidden="true" />
            </span>
            <h2 id="start-exam-title">Konfirmasi mulai ujian</h2>
            <p>
              Masukkan token untuk memulai{" "}
              <strong>{selectedExam.namaBankSoal || "ujian ini"}</strong>.
            </p>
            <form onSubmit={handleStartExam}>
              <label htmlFor="cbt-exam-token">Token ujian</label>
              <input
                id="cbt-exam-token"
                name="token"
                type="text"
                autoComplete="off"
                autoFocus
                value={examToken}
                onChange={(event) => setExamToken(event.target.value.toUpperCase())}
                aria-invalid={Boolean(startError)}
                aria-describedby={startError ? "cbt-start-error" : undefined}
                placeholder="Masukkan token dari guru"
                disabled={startingExam}
              />
              {startError && (
                <p className={styles.startExamError} id="cbt-start-error" role="alert">
                  {startError}
                </p>
              )}
              <div className={styles.startExamDialogActions}>
                <button
                  className={styles.cancelStartExamButton}
                  type="button"
                  disabled={startingExam}
                  onClick={() => setSelectedExam(null)}
                >
                  Batal
                </button>
                <button
                  className={styles.confirmStartExamButton}
                  type="submit"
                  disabled={startingExam || !examToken.trim()}
                >
                  {startingExam ? "Memeriksa..." : "Mulai ujian"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
