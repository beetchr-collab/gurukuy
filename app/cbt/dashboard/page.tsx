"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import styles from "../cbt.module.css";

type CbtStudent = {
  id: string;
  nama: string;
  nisn: string;
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
          <button className={styles.logoutButton} onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            Keluar
          </button>
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
                    onClick={() => router.push(`/cbt/exam?examId=${exam.id}`)}
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
    </main>
  );
}
