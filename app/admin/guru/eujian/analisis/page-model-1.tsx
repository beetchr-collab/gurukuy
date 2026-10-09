"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import EujianMenu from "../components/EujianMenu";

type ExamOption = {
  id: string;
  namaBankSoal?: string;
  mataPelajaran?: string;
  kelas?: string;
};

type StudentResult = {
  studentId: string;
  nama: string;
  nis: string;
  nisn: string;
  className: string;
  score: number;
  possibleScore: number;
  percentage: number | null;
  submittedAt: string | null;
  questionResults: { questionId: string; correctness: boolean | null }[];
};

type QuestionAnalysis = {
  id: string;
  tipeSoal: string;
  pertanyaan: string;
  skor: number;
  correctAnswer: string | string[] | { soal?: string; jawaban?: string }[] | null;
  correctCount: number;
  incorrectCount: number;
  manualCount: number;
  gradedCount: number;
  correctPercentage: number | null;
};

type AnalysisData = {
  exam: ExamOption;
  summary: {
    questionCount: number;
    studentCount: number;
    averageScore: number | null;
    possibleScore: number;
    manualQuestionCount: number;
  };
  students: StudentResult[];
  questions: QuestionAnalysis[];
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const formatCorrectAnswer = (question: QuestionAnalysis) => {
  if (question.correctAnswer === null) return "Perlu koreksi manual";
  if (Array.isArray(question.correctAnswer)) {
    if (question.correctAnswer.every((item) => typeof item === "object")) {
      return question.correctAnswer
        .map((item) => {
          if (typeof item === "string") return item;
          return `${item.soal || "Pasangan"} → ${item.jawaban || "-"}`;
        })
        .join("; ");
    }
    return question.correctAnswer.join(", ") || "-";
  }
  return question.correctAnswer || "-";
};

export default function AnalisisUjianPage() {
  const { user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
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
          namaBankSoal: String(document.data().namaBankSoal || ""),
          mataPelajaran: String(document.data().mataPelajaran || ""),
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
        console.error("Gagal memuat daftar ujian untuk analisis:", loadError);
        setError("Gagal memuat daftar ujian.");
        setLoadingExams(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!selectedExamId || !user?.uid) {
      setAnalysis(null);
      setLoadingAnalysis(false);
      return;
    }

    let cancelled = false;
    const loadAnalysis = async () => {
      setLoadingAnalysis(true);
      setError("");
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");

        const response = await fetch(
          `/api/cbt/analysis?examId=${encodeURIComponent(selectedExamId)}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        const result = await response.json() as {
          success: boolean;
          message?: string;
          exam?: AnalysisData["exam"];
          summary?: AnalysisData["summary"];
          students?: StudentResult[];
          questions?: QuestionAnalysis[];
        };

        if (!response.ok || !result.success || !result.exam || !result.summary) {
          throw new Error(result.message || "Gagal memuat analisis ujian.");
        }

        if (!cancelled) {
          setAnalysis({
            exam: result.exam,
            summary: result.summary,
            students: result.students || [],
            questions: result.questions || [],
          });
          setSelectedStudentId("");
        }
      } catch (loadError) {
        console.error("Gagal memuat analisis ujian:", loadError);
        if (!cancelled) {
          setAnalysis(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat analisis ujian."
          );
        }
      } finally {
        if (!cancelled) setLoadingAnalysis(false);
      }
    };

    void loadAnalysis();
    return () => {
      cancelled = true;
    };
  }, [selectedExamId, user?.uid]);

  const selectedStudent = useMemo(
    () => analysis?.students.find((student) => student.studentId === selectedStudentId),
    [analysis, selectedStudentId]
  );

  const averageScoreLabel = analysis?.summary.averageScore === null ||
    analysis?.summary.averageScore === undefined
    ? "-"
    : `${analysis.summary.averageScore}`;

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h4 className="app-content-headerText">Analisis &amp; Nilai</h4>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">
                  <a href="/admin/guru/eujian">E-Ujian</a>
                </li>
                <li className="breadcrumb-item active">Analisis &amp; Nilai</li>
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
                <i className="fas fa-chart-bar" />
              </div>
              <div>
                <h4 className="fw-bold mb-2">Analisis Soal dan Nilai Siswa</h4>
                <p className="mb-3" style={{ opacity: 0.9 }}>
                  Tinjau hasil ujian siswa, nilai otomatis, dan tingkat jawaban benar setiap soal.
                </p>
                <EujianMenu active="analisis" />
              </div>
            </div>
          </section>

          <section className="card mb-3">
            <div className="card-body d-flex flex-wrap align-items-center gap-3">
              <label className="fw-semibold mb-0" htmlFor="analysisExamSelector">
                Pilih ujian
              </label>
              <select
                className="form-select"
                id="analysisExamSelector"
                style={{ maxWidth: 480 }}
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
              {analysis?.exam && (
                <span className="text-muted small">
                  {analysis.exam.mataPelajaran || "Ujian CBT"}
                  {analysis.exam.kelas ? ` · ${analysis.exam.kelas}` : ""}
                </span>
              )}
            </div>
          </section>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          {loadingExams ? (
            <div className="card card-body text-center text-muted">Memuat daftar ujian...</div>
          ) : exams.length === 0 ? (
            <div className="card card-body text-center text-muted">
              Belum ada bank soal. Buat ujian terlebih dahulu untuk melihat analisis.
            </div>
          ) : loadingAnalysis ? (
            <div className="card card-body text-center text-muted">Memuat analisis hasil ujian...</div>
          ) : analysis && (
            <>
              <div className="row g-3 mb-3">
                <div className="col-6 col-lg-3">
                  <div className="small-box text-bg-primary mb-0">
                    <div className="inner">
                      <h3>{analysis.summary.studentCount}</h3>
                      <p>Siswa menyelesaikan ujian</p>
                    </div>
                    <div className="small-box-icon"><i className="fas fa-users" /></div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="small-box text-bg-success mb-0">
                    <div className="inner">
                      <h3>{averageScoreLabel}{averageScoreLabel !== "-" ? "%" : ""}</h3>
                      <p>Rata-rata nilai otomatis</p>
                    </div>
                    <div className="small-box-icon"><i className="fas fa-chart-line" /></div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="small-box text-bg-info mb-0">
                    <div className="inner">
                      <h3>{analysis.summary.questionCount}</h3>
                      <p>Jumlah soal</p>
                    </div>
                    <div className="small-box-icon"><i className="fas fa-list-ol" /></div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="small-box text-bg-warning mb-0">
                    <div className="inner">
                      <h3>{analysis.summary.manualQuestionCount}</h3>
                      <p>Soal perlu koreksi manual</p>
                    </div>
                    <div className="small-box-icon"><i className="fas fa-pen-to-square" /></div>
                  </div>
                </div>
              </div>

              <section className="card mb-3">
                <div className="card-header">
                  <h3 className="card-title mb-0">Nilai Siswa</h3>
                </div>
                <div className="card-body">
                  <p className="text-muted small">
                    Nilai dihitung dari bobot soal yang dapat dikoreksi otomatis. Soal uraian tidak
                    masuk perhitungan sampai dikoreksi manual.
                  </p>
                  {analysis.students.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      Belum ada siswa yang menyelesaikan ujian ini.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">No</th>
                            <th scope="col">Nama siswa</th>
                            <th scope="col">NIS</th>
                            <th scope="col">Kelas</th>
                            <th scope="col">Nilai otomatis</th>
                            <th scope="col">Dikumpulkan</th>
                            <th scope="col">Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.students.map((student, index) => (
                            <tr key={student.studentId}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">{student.nama}</td>
                              <td>{student.nis || student.nisn || "-"}</td>
                              <td>{student.className || "-"}</td>
                              <td>
                                {student.percentage === null
                                  ? "Tidak ada soal otomatis"
                                  : (
                                    <span className="badge text-bg-primary">
                                      {student.percentage}% ({student.score}/{student.possibleScore})
                                    </span>
                                  )}
                              </td>
                              <td>{formatDate(student.submittedAt)}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  type="button"
                                  onClick={() => setSelectedStudentId((current) =>
                                    current === student.studentId ? "" : student.studentId
                                  )}
                                  aria-expanded={selectedStudentId === student.studentId}
                                >
                                  {selectedStudentId === student.studentId ? "Tutup" : "Lihat"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="alert alert-light border mb-0">
                      <h5 className="fw-semibold">{selectedStudent.nama} — rincian jawaban</h5>
                      <div className="d-flex flex-wrap gap-3 small">
                        {analysis.questions.map((question, index) => {
                          const result = selectedStudent.questionResults.find(
                            (item) => item.questionId === question.id
                          );
                          return (
                            <span className="border rounded px-2 py-1" key={question.id}>
                              Soal {index + 1}:{" "}
                              {result?.correctness === null
                                ? "Perlu koreksi manual"
                                : result?.correctness
                                  ? "Benar"
                                  : "Salah"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <h3 className="card-title mb-0">Analisis Per Soal</h3>
                </div>
                <div className="card-body">
                  {analysis.questions.length === 0 ? (
                    <div className="text-center text-muted py-4">Belum ada soal di bank soal ini.</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {analysis.questions.map((question, index) => (
                        <article className="border rounded p-3" key={question.id}>
                          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                            <div className="fw-semibold">
                              Soal {index + 1} <span className="text-muted fw-normal">· {question.tipeSoal}</span>
                            </div>
                            <span className="badge text-bg-light border">
                              Bobot: {question.skor}
                            </span>
                          </div>
                          <div
                            className="mb-3"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(question.pertanyaan || "Soal tanpa teks"),
                            }}
                          />
                          <div className="small mb-2">
                            <strong>Kunci jawaban:</strong> {formatCorrectAnswer(question)}
                          </div>
                          <div className="d-flex flex-wrap gap-3 small text-muted mb-2">
                            <span className="text-success">
                              Benar: {question.correctCount}
                            </span>
                            <span className="text-danger">
                              Salah: {question.incorrectCount}
                            </span>
                            {question.manualCount > 0 && (
                              <span className="text-warning">
                                Perlu koreksi: {question.manualCount}
                              </span>
                            )}
                            <span>
                              Tingkat benar: {question.correctPercentage === null
                                ? "-"
                                : `${question.correctPercentage}%`}
                            </span>
                          </div>
                          {question.correctPercentage !== null && (
                            <div
                              className="progress"
                              role="progressbar"
                              aria-label={`Persentase jawaban benar soal ${index + 1}`}
                              aria-valuenow={question.correctPercentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              style={{ height: 8 }}
                            >
                              <div
                                className="progress-bar bg-success"
                                style={{ width: `${question.correctPercentage}%` }}
                              />
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}