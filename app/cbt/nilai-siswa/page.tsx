"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../cbt.module.css";

type StudentResult = {
  examId: string;
  namaUjian: string;
  mataPelajaran: string;
  score: number;
  possibleScore: number;
  percentage: number | null;
  pendingManualGrades: number;
  submittedAt: string | null;
};

type CbtStudent = {
  id: string;
  nama: string;
  nisn: string;
  nis: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

export default function StudentResultsPage() {
  const router = useRouter();
  const [student, setStudent] = useState<CbtStudent | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedStudent = localStorage.getItem("cbtStudent");
    if (!storedStudent) {
      router.replace("/cbt");
      return;
    }

    let currentStudent: CbtStudent;
    try {
      currentStudent = JSON.parse(storedStudent) as CbtStudent;
      if (!currentStudent.id || !currentStudent.nisn || !currentStudent.nis) {
        throw new Error("Sesi siswa tidak valid.");
      }
    } catch {
      localStorage.removeItem("cbtStudent");
      router.replace("/cbt");
      return;
    }

    setStudent(currentStudent);
    let cancelled = false;
    const loadResults = async () => {
      try {
        const response = await fetch("/api/cbt/student-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: currentStudent.id,
            nisn: currentStudent.nisn,
            nis: currentStudent.nis,
          }),
        });
        const result = await response.json() as {
          success: boolean;
          message?: string;
          results?: StudentResult[];
        };
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal memuat nilai siswa.");
        }
        if (!cancelled) setResults(result.results || []);
      } catch (loadError) {
        console.error("Gagal memuat nilai siswa:", loadError);
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat nilai siswa.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadResults();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("cbtStudent");
    router.replace("/cbt");
  };

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.dashboardShell}>
        <header className={styles.dashboardHeader}>
          <div className={styles.dashboardBrand}>
            <span className={styles.brandMark}>G</span>
            <span>GuruKuy CBT</span>
          </div>
          <div className={styles.resultsHeaderActions}>
            <Link className={styles.logoutButton} href="/cbt/dashboard">
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Ruang siswa
            </Link>
            <button className={styles.logoutButton} type="button" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </header>

        <section className={styles.dashboardContent}>
          <p className={styles.dashboardEyebrow}>HASIL UJIAN</p>
          <p className={styles.dashboardLead}>
            {student ? `Berikut hasil ujian yang telah dipublikasikan untuk ${student.nama}.` : "Memuat data siswa..."}
          </p>

          {error ? (
            <div className={styles.resultsMessage} role="alert">{error}</div>
          ) : loading ? (
            <div className={styles.resultsMessage}>Memuat nilai...</div>
          ) : results.length === 0 ? (
            <div className={styles.resultsMessage}>
              Belum ada nilai yang ditampilkan. Nilai akan muncul setelah Anda menyelesaikan ujian dan guru mengaktifkan tampilan nilai.
            </div>
          ) : (
            <div className={styles.resultsList}>
              {results.map((result) => (
                <article className={styles.resultCard} key={result.examId}>
                  <div className={styles.resultDetails}>
                    <h2>{result.namaUjian}</h2>
                    <p>{result.mataPelajaran || "Ujian CBT"} · Dikumpulkan {formatDate(result.submittedAt)}</p>
                    {result.pendingManualGrades > 0 && (
                      <span className={styles.pendingGrade}>
                        {result.pendingManualGrades} soal menunggu koreksi guru
                      </span>
                    )}
                  </div>
                  <div className={styles.resultScore}>
                    <div>
                      <h5>Nilai</h5>
                      <h1>{result.percentage === null ? "—" : `${result.percentage}`}</h1>
                    </div>
                    <Link
                      className={styles.answerDetailsLink}
                      href={`/cbt/jawaban-siswa?examId=${encodeURIComponent(result.examId)}`}
                    >
                      <i className="bi bi-card-checklist" aria-hidden="true" />
                      Cek Jawaban
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
