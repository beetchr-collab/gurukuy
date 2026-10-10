"use client";

import { useEffect, useState, type FormEvent } from "react";
import DOMPurify from "isomorphic-dompurify";
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

const formatStudentAnswer = (
  answer: StudentResult["questionResults"][number]["answer"],
) => {
  if (answer === null || answer === "") return "Siswa tidak mengisi jawaban.";
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(", ");
  const parts = Object.entries(answer)
    .map(
      ([key, value]) =>
        `${Number.isNaN(Number(key)) ? key : `Bagian ${Number(key) + 1}`}: ${value}`,
    )
    .join("\n");
  return parts || "Siswa tidak mengisi jawaban.";
};

type StudentResult = {
  studentId: string;
  nama: string;
  nis: string;
  nisn: string;
  jk: string;
  className: string;
  score: number;
  possibleScore: number;
  percentage: number | null;
  submittedAt: string | null;
  questionResults: {
    questionId: string;
    correctness: boolean | null;
    answer: string | string[] | Record<string, string> | null;
    earnedScore: number;
    manuallyGraded: boolean;
  }[];
};

type QuestionAnalysis = {
  id: string;
  tipeSoal: string;
  pertanyaan: string;
  skor: number;
  isManual: boolean;
  correctAnswer:
    | string
    | string[]
    | { soal?: string; jawaban?: string }[]
    | null;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  manualCount: number;
  gradedCount: number;
  correctPercentage: number | null;
};

type GradingTarget = {
  student: StudentResult;
  question: QuestionAnalysis;
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
  const [gradingTarget, setGradingTarget] = useState<GradingTarget | null>(
    null,
  );
  const [gradeValue, setGradeValue] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeError, setGradeError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
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
      where("ownerId", "==", user.uid),
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
            : nextExams[0]?.id || "",
        );
        setLoadingExams(false);
      },
      (loadError) => {
        console.error("Gagal memuat daftar ujian untuk analisis:", loadError);
        setError("Gagal memuat daftar ujian.");
        setLoadingExams(false);
      },
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
        if (!idToken)
          throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");

        const response = await fetch(
          `/api/cbt/analysis?examId=${encodeURIComponent(selectedExamId)}`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
        const result = await parseCbtApiResponse<{
          success: boolean;
          message?: string;
          exam?: AnalysisData["exam"];
          summary?: AnalysisData["summary"];
          students?: StudentResult[];
          questions?: QuestionAnalysis[];
        }>(response, "Gagal memuat analisis ujian.");

        if (!result.exam || !result.summary) {
          throw new Error(result.message || "Gagal memuat analisis ujian.");
        }

        if (!cancelled) {
          setAnalysis({
            exam: result.exam,
            summary: result.summary,
            students: result.students || [],
            questions: result.questions || [],
          });
        }
      } catch (loadError) {
        console.error("Gagal memuat analisis ujian:", loadError);
        if (!cancelled) {
          setAnalysis(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat analisis ujian.",
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
  }, [refreshKey, selectedExamId, user?.uid]);

  const openGrading = (student: StudentResult, question: QuestionAnalysis) => {
    const result = student.questionResults.find(
      (item) => item.questionId === question.id,
    );
    setGradingTarget({ student, question });
    setGradeValue(result?.manuallyGraded ? String(result.earnedScore) : "");
    setGradeError("");
  };

  const saveManualGrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gradingTarget || !selectedExamId || savingGrade) return;

    const score = Number(gradeValue);
    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > gradingTarget.question.skor
    ) {
      setGradeError(`Nilai harus antara 0 dan ${gradingTarget.question.skor}.`);
      return;
    }

    setSavingGrade(true);
    setGradeError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken)
        throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");
      const response = await fetch("/api/cbt/analysis", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: gradingTarget.student.studentId,
          questionId: gradingTarget.question.id,
          score,
        }),
      });
      await parseCbtApiResponse<{
        success: boolean;
        message?: string;
      }>(response, "Gagal menyimpan nilai koreksi.");

      setGradingTarget(null);
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      console.error("Gagal menyimpan nilai koreksi:", saveError);
      setGradeError(
        saveError instanceof Error
          ? saveError.message
          : "Gagal menyimpan nilai koreksi.",
      );
    } finally {
      setSavingGrade(false);
    }
  };

  const getResultCellStyle = (
    student: StudentResult,
    question: QuestionAnalysis,
  ) => {
    const result = student.questionResults.find(
      (item) => item.questionId === question.id,
    );
    const color =
      !result?.manuallyGraded && question.isManual
        ? "#fff"
        : result && result.earnedScore >= question.skor
          ? "#16a34a"
          : result && result.earnedScore > 0
            ? "#facc15"
            : "#fff";
    return {
      backgroundColor: color,
      color: color === "#16a34a" ? "#fff" : "#202b27",
      border: "1px solid #ced4da",
      display: "block",
      minWidth: 56,
      height: 40,
      padding: "4px 8px",
      fontWeight: 700,
      width: "100%",
      boxSizing: "border-box",
    } as const;
  };

  const averageScoreLabel =
    analysis?.summary.averageScore === null ||
    analysis?.summary.averageScore === undefined
      ? "-"
      : `${analysis.summary.averageScore}`;
  const gradingQuestionNumber =
    gradingTarget && analysis
      ? analysis.questions.findIndex(
          (question) => question.id === gradingTarget.question.id,
        ) + 1
      : 0;

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
                  Tinjau hasil ujian, koreksi jawaban uraian, dan nilai siswa
                  per soal.
                </p>
                <EujianMenu active="analisis" />
              </div>
            </div>
          </section>

          <section className="card mb-3">
            <div className="card-body d-flex flex-wrap align-items-center gap-3">
              <label
                className="fw-semibold mb-0"
                htmlFor="analysisExamSelector"
              >
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
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {loadingExams ? (
            <div className="card card-body text-center text-muted">
              Memuat daftar ujian...
            </div>
          ) : exams.length === 0 ? (
            <div className="card card-body text-center text-muted">
              Belum ada bank soal. Buat ujian terlebih dahulu untuk melihat
              analisis.
            </div>
          ) : loadingAnalysis ? (
            <div className="card card-body text-center text-muted">
              Memuat analisis hasil ujian...
            </div>
          ) : (
            analysis && (
              <>
                <div className="row g-3 mb-3">
                  <div className="col-6 col-lg-3">
                    <div className="small-box text-bg-primary mb-0">
                      <div className="inner">
                        <h3>{analysis.summary.studentCount}</h3>
                        <p>Siswa menyelesaikan ujian</p>
                      </div>
                      <div className="small-box-icon">
                        <i className="fas fa-users" />
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="small-box text-bg-success mb-0">
                      <div className="inner">
                        <h3>
                          {averageScoreLabel}
                          {averageScoreLabel !== "-" ? "%" : ""}
                        </h3>
                        <p>Rata-rata nilai</p>
                      </div>
                      <div className="small-box-icon">
                        <i className="fas fa-chart-line" />
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="small-box text-bg-info mb-0">
                      <div className="inner">
                        <h3>{analysis.summary.questionCount}</h3>
                        <p>Jumlah soal</p>
                      </div>
                      <div className="small-box-icon">
                        <i className="fas fa-list-ol" />
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="small-box text-bg-warning mb-0">
                      <div className="inner">
                        <h3>{analysis.summary.manualQuestionCount}</h3>
                        <p>Soal perlu koreksi manual</p>
                      </div>
                      <div className="small-box-icon">
                        <i className="fas fa-pen-to-square" />
                      </div>
                    </div>
                  </div>
                </div>

                <section className="card mb-3">
                  <div className="card-header">
                    <h3 className="card-title mb-0">Nilai Siswa</h3>
                  </div>
                  <div className="card-body">
                    <p className="text-muted small">
                      Klik sel pada soal isian atau uraian untuk membaca jawaban
                      siswa dan memberikan nilai. Hijau = nilai penuh, kuning =
                      sebagian, putih = salah atau belum dikoreksi.
                    </p>
                    {analysis.students.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        Belum ada siswa yang menyelesaikan ujian ini.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-bordered align-middle text-center mb-0">
                          <thead className="table-light">
                            <tr>
                              <th rowSpan={2} scope="col">
                                No
                              </th>
                              <th rowSpan={2} scope="col">
                                NIS
                              </th>
                              <th rowSpan={2} scope="col">
                                NISN
                              </th>
                              <th rowSpan={2} scope="col">
                                Nama Siswa
                              </th>
                              <th rowSpan={2} scope="col">
                                L/P
                              </th>
                              <th
                                colSpan={analysis.questions.length}
                                scope="colgroup"
                              >
                                Nomor Soal
                              </th>
                              <th rowSpan={2} scope="col">
                                Rekap
                              </th>
                              <th rowSpan={2} scope="col">
                                Skor
                              </th>
                            </tr>
                            <tr>
                              {analysis.questions.map((question, index) => (
                                <th
                                  key={question.id}
                                  scope="col"
                                  title={`${question.tipeSoal} · Bobot ${question.skor}`}
                                >
                                  {index + 1}
                                  {question.isManual && (
                                    <span
                                      className="text-primary ms-1"
                                      aria-label="Perlu koreksi"
                                    >
                                      ✎
                                    </span>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.students.map((student, index) => (
                              <tr key={student.studentId}>
                                <td>{index + 1}</td>
                                <td>{student.nis || "-"}</td>
                                <td>{student.nisn || "-"}</td>
                                <td className="text-start fw-semibold">
                                  {student.nama}
                                </td>
                                <td>{student.jk || "-"}</td>
                                {analysis.questions.map((question) => {
                                  const result = student.questionResults.find(
                                    (item) => item.questionId === question.id,
                                  );
                                  const cell = (
                                    <span>
                                      {question.isManual &&
                                      !result?.manuallyGraded
                                        ? "Koreksi"
                                        : Number(
                                            result?.earnedScore.toFixed(2) || 0,
                                          )}
                                    </span>
                                  );
                                  return (
                                    <td
                                      key={question.id}
                                      style={{ padding: 2 }}
                                    >
                                      {question.isManual ? (
                                        <button
                                          aria-label={`Koreksi soal ${analysis.questions.indexOf(question) + 1} untuk ${student.nama}`}
                                          className="border-0 w-100"
                                          style={getResultCellStyle(
                                            student,
                                            question,
                                          )}
                                          type="button"
                                          onClick={() =>
                                            openGrading(student, question)
                                          }
                                        >
                                          {cell}
                                        </button>
                                      ) : (
                                        <span
                                          style={getResultCellStyle(
                                            student,
                                            question,
                                          )}
                                        >
                                          {cell}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="fw-bold">
                                  {Number(student.score.toFixed(2))} /{" "}
                                  {student.possibleScore}
                                </td>
                                <td className="fw-bold">
                                  {student.percentage !== null && (
                                    <span className="fw-bold">
                                      {student.percentage}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="d-flex flex-wrap gap-3 mt-3 small text-muted">
                      <span>
                        <i
                          className="d-inline-block rounded me-1"
                          style={{
                            width: 12,
                            height: 12,
                            background: "#16a34a",
                          }}
                        />
                        Nilai penuh
                      </span>
                      <span>
                        <i
                          className="d-inline-block rounded me-1"
                          style={{
                            width: 12,
                            height: 12,
                            background: "#facc15",
                          }}
                        />
                        Sebagian benar
                      </span>
                      <span>
                        <i
                          className="d-inline-block rounded border me-1"
                          style={{ width: 12, height: 12, background: "#fff" }}
                        />
                        Salah / belum dikoreksi
                      </span>
                      <span>
                        Nilai per sel ditampilkan dari bobot soal masing-masing.
                      </span>
                    </div>
                  </div>
                </section>

                <section className="card">
                  <div className="card-header">
                    <h3 className="card-title mb-0">Analisis Per Soal</h3>
                  </div>
                  <div className="card-body">
                    {analysis.questions.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        Belum ada soal di bank soal ini.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {analysis.questions.map((question, index) => (
                          <article
                            className="border rounded p-3"
                            key={question.id}
                          >
                            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                              <div className="fw-semibold">
                                Soal {index + 1}{" "}
                                <span className="text-muted fw-normal">
                                  · {question.tipeSoal}
                                </span>
                              </div>
                              <span className="badge text-bg-light border">
                                Bobot: {question.skor}
                              </span>
                            </div>
                            <div
                              className="mb-3"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  question.pertanyaan || "Soal tanpa teks",
                                ),
                              }}
                            />
                            <div className="small mb-2">
                              <strong>Kunci jawaban:</strong>{" "}
                              {formatCorrectAnswer(question)}
                            </div>
                            <div className="d-flex flex-wrap gap-3 small text-muted mb-2">
                              <span className="text-success">
                                Benar: {question.correctCount}
                              </span>
                              <span className="text-danger">
                                Salah: {question.incorrectCount}
                              </span>
                              {question.partialCount > 0 && (
                                <span className="text-warning">
                                  Sebagian benar: {question.partialCount}
                                </span>
                              )}
                              {question.manualCount > 0 && (
                                <span className="text-warning">
                                  Perlu koreksi: {question.manualCount}
                                </span>
                              )}
                              <span>
                                Tingkat benar:{" "}
                                {question.correctPercentage === null
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
                                  style={{
                                    width: `${question.correctPercentage}%`,
                                  }}
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
            )
          )}
        </div>
      </div>
      {gradingTarget && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingGrade) {
              setGradingTarget(null);
            }
          }}
          style={{ zIndex: 1100, background: "rgba(0,0,0,0.55)" }}
        >
          <section
            aria-labelledby="manual-grade-title"
            aria-modal="true"
            className="card shadow-lg w-100"
            role="dialog"
            style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="card-header d-flex align-items-center justify-content-between">
              <div>
                <h2 className="h5 mb-1" id="manual-grade-title">
                  Koreksi jawaban manual
                </h2>
                <div className="small text-muted">
                  {gradingTarget.student.nama} · Soal {gradingQuestionNumber}
                </div>
              </div>
              <button
                aria-label="Tutup"
                className="btn-close"
                disabled={savingGrade}
                onClick={() => setGradingTarget(null)}
                type="button"
              />
            </div>
            <div className="card-body">
              <div
                className="mb-3"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    gradingTarget.question.pertanyaan || "Soal tanpa teks",
                  ),
                }}
              />
              <div className="border rounded bg-light p-3 mb-3">
                <div className="fw-semibold mb-2">Jawaban siswa</div>
                <pre
                  className="mb-0"
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    font: "inherit",
                  }}
                >
                  {formatStudentAnswer(
                    gradingTarget.student.questionResults.find(
                      (result) =>
                        result.questionId === gradingTarget.question.id,
                    )?.answer ?? null,
                  )}
                </pre>
              </div>
              {gradingTarget.question.correctAnswer && (
                <p className="small text-muted">
                  Contoh/kunci jawaban:{" "}
                  {formatCorrectAnswer(gradingTarget.question)}
                </p>
              )}
              {gradeError && (
                <div className="alert alert-danger" role="alert">
                  {gradeError}
                </div>
              )}
              <form onSubmit={saveManualGrade}>
                <label
                  className="form-label fw-semibold"
                  htmlFor="manual-grade-score"
                >
                  Nilai (0–{gradingTarget.question.skor})
                </label>
                <input
                  autoFocus
                  className="form-control"
                  id="manual-grade-score"
                  max={gradingTarget.question.skor}
                  min={0}
                  onChange={(event) => setGradeValue(event.target.value)}
                  required
                  step="any"
                  type="number"
                  value={gradeValue}
                />
                <div className="form-text">
                  Nilai penuh = hijau, nilai sebagian = kuning, dan nilai 0 =
                  putih.
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={savingGrade}
                    onClick={() => setGradingTarget(null)}
                    type="button"
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={savingGrade}
                    type="submit"
                  >
                    {savingGrade ? "Menyimpan..." : "Simpan nilai"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
