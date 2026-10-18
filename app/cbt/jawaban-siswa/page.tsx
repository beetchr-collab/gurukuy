"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sanitizeQuestionHtml } from "@/lib/sanitize-question-html";
import styles from "../cbt.module.css";

type Answer = string | string[] | Record<string, string> | null;

type QuestionResult = {
  id: string;
  number: number;
  tipeSoal: string;
  pertanyaan: string;
  gambarUrl: string;
  opsi: string[];
  statements: { prompt: string; choices: string[]; answer: string | null }[];
  matchingOptions: string[];
  matchingPairs: { prompt: string; answer: string | null }[];
  answer: Answer;
  earnedScore: number | null;
  possibleScore: number;
  correctness: boolean | null;
  isPartial: boolean;
  awaitingGrade: boolean;
};

type AnswerDetails = {
  exam: {
    id: string;
    namaUjian: string;
    mataPelajaran: string;
    submittedAt: string | null;
  };
  student: {
    nama: string;
    nis: string;
    nisn: string;
    kelas: string;
    sekolah: string;
  };
  summary: {
    score: number;
    possibleScore: number;
    percentage: number | null;
    pendingManualGrades: number;
  };
  questions: QuestionResult[];
};

type CbtStudent = {
  id: string;
  nisn: string;
  nis: string;
};

function MatchingReview({
  pairs,
  options,
}: {
  pairs: QuestionResult["matchingPairs"];
  options: string[];
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
    lines: { key: string; x1: number; y1: number; x2: number; y2: number }[];
  }>({ width: 0, height: 0, lines: [] });

  useEffect(() => {
    const updateLayout = () => {
      const board = boardRef.current;
      if (!board) return;
      const boardRect = board.getBoundingClientRect();
      const lines = pairs.flatMap((pair, pairIndex) => {
        if (!pair.answer) return [];
        const rightIndex = options.indexOf(pair.answer);
        const leftNode = leftRefs.current[pairIndex];
        const rightNode = rightIndex >= 0 ? rightRefs.current[rightIndex] : null;
        if (!leftNode || !rightNode) return [];
        const leftRect = leftNode.getBoundingClientRect();
        const rightRect = rightNode.getBoundingClientRect();
        return [{
          key: `${pairIndex}-${rightIndex}`,
          x1: leftRect.right - boardRect.left,
          y1: leftRect.top + leftRect.height / 2 - boardRect.top,
          x2: rightRect.left - boardRect.left,
          y2: rightRect.top + rightRect.height / 2 - boardRect.top,
        }];
      });
      setLayout({ width: boardRect.width, height: boardRect.height, lines });
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    if (boardRef.current) observer.observe(boardRef.current);
    window.addEventListener("resize", updateLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [options, pairs]);

  return (
    <div className={styles.matchingReviewBoard} ref={boardRef}>
      {layout.width > 0 && (
        <svg
          aria-hidden="true"
          className={styles.matchingReviewLines}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {layout.lines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </svg>
      )}
      <div className={styles.matchingReviewColumn}>
        {pairs.map((pair, index) => (
          <div
            className={styles.matchingReviewItem}
            key={`left-${index}`}
            ref={(node) => { leftRefs.current[index] = node; }}
          >
            <span>{index + 1}.</span>
            <div dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(pair.prompt) }} />
          </div>
        ))}
      </div>
      <div className={styles.matchingReviewColumn}>
        {options.map((option, index) => (
          <div
            className={`${styles.matchingReviewItem} ${pairs.some((pair) => pair.answer === option) ? styles.matchingReviewSelected : ""}`}
            key={`right-${index}`}
            ref={(node) => { rightRefs.current[index] = node; }}
          >
            <span>{String.fromCharCode(65 + index)}.</span>
            <div dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(option) }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentAnswersPage() {
  const router = useRouter();
  const [details, setDetails] = useState<AnswerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedStudent = localStorage.getItem("cbtStudent");
    if (!storedStudent) {
      router.replace("/cbt");
      return;
    }

    let student: CbtStudent;
    try {
      student = JSON.parse(storedStudent) as CbtStudent;
      if (!student.id || !student.nisn || !student.nis) throw new Error("Sesi tidak valid.");
    } catch {
      localStorage.removeItem("cbtStudent");
      router.replace("/cbt");
      return;
    }

    const examId = new URLSearchParams(window.location.search).get("examId")?.trim();
    if (!examId) {
      setError("Ujian tidak ditemukan.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadDetails = async () => {
      try {
        const response = await fetch("/api/cbt/student-answer-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId,
            studentId: student.id,
            nisn: student.nisn,
            nis: student.nis,
          }),
        });
        const result = await response.json() as {
          success: boolean;
          message?: string;
          exam?: AnswerDetails["exam"];
          student?: AnswerDetails["student"];
          summary?: AnswerDetails["summary"];
          questions?: QuestionResult[];
        };
        if (!response.ok || !result.success || !result.exam || !result.student || !result.summary) {
          throw new Error(result.message || "Rincian jawaban gagal dimuat.");
        }
        if (!cancelled) {
          setDetails({
            exam: result.exam,
            student: result.student,
            summary: result.summary,
            questions: result.questions || [],
          });
        }
      } catch (loadError) {
        console.error("Gagal memuat rincian jawaban siswa:", loadError);
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Rincian jawaban gagal dimuat.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("cbtStudent");
    router.replace("/cbt");
  };

  const printAnswers = () => window.print();
  const formatExamDate = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
  };

  return (
    <main className={`${styles.dashboardPage} ${styles.answerPrintPage}`}>
      <div className={styles.dashboardShell}>
        <header className={styles.dashboardHeader}>
          <div className={styles.dashboardBrand}>
            <span className={styles.brandMark}>G</span>
            <span>GuruKuy CBT</span>
          </div>
          <div className={`${styles.resultsHeaderActions} ${styles.answerPrintControls}`}>
            <Link className={styles.logoutButton} href="/cbt/nilai-siswa">
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Kembali ke nilai
            </Link>
            <button className={styles.logoutButton} type="button" onClick={printAnswers} disabled={!details}>
              <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
              Simpan PDF
            </button>
            <button className={styles.logoutButton} type="button" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </header>

        <section className={styles.dashboardContent}>
          <p className={styles.dashboardEyebrow}>RINCIAN HASIL UJIAN</p>
          <h1>{details?.exam.namaUjian || "Jawaban siswa"}</h1>
          {details && (
            <>
              <p className={styles.dashboardLead}>{details.exam.mataPelajaran || "Ujian CBT"}</p>
              <div className={styles.answerOverview}>
                <dl className={styles.answerStudentIdentity}>
                  <div><dt>Nama</dt><dd>{details.student.nama}</dd></div>
                  <div><dt>NIS</dt><dd>{details.student.nis}</dd></div>
                  <div><dt>NISN</dt><dd>{details.student.nisn}</dd></div>
                  <div><dt>Kelas</dt><dd>{details.student.kelas}</dd></div>
                  <div><dt>Asal Sekolah</dt><dd>{details.student.sekolah}</dd></div>
                  <div><dt>Tanggal Pelaksanaan Ujian</dt><dd>{formatExamDate(details.exam.submittedAt)}</dd></div>
                  {details.summary.pendingManualGrades > 0 && (
                    <div className={styles.answerPendingNote}>
                      <dt>Status koreksi</dt>
                      <dd>{details.summary.pendingManualGrades} soal menunggu koreksi guru</dd>
                    </div>
                  )}
                </dl>
                <div className={styles.answerLargeScore}>
                  <span>Nilai</span>
                  <strong>
                    {details.summary.percentage === null ? "—" : details.summary.percentage}
                  </strong>
                </div>
              </div>
            </>
          )}

          {error ? (
            <div className={styles.resultsMessage} role="alert">{error}</div>
          ) : loading ? (
            <div className={styles.resultsMessage}>Memuat rincian jawaban...</div>
          ) : details ? (
            <div className={styles.answerQuestionList}>
              {details.questions.map((question) => (
                <article className={styles.answerQuestionCard} key={question.id}>
                  <header className={styles.answerQuestionHeader}>
                    <strong>Soal {question.number}</strong>
                    <span>
                      {question.awaitingGrade
                        ? "Menunggu koreksi"
                        : question.isPartial
                          ? "Sebagian benar"
                          : question.correctness
                            ? "Benar"
                            : "Belum tepat"}
                    </span>
                  </header>
                  <div
                    className={styles.answerQuestionPrompt}
                    dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(question.pertanyaan) }}
                  />
                  {question.gambarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.answerQuestionImage} src={question.gambarUrl} alt={`Ilustrasi soal ${question.number}`} />
                  )}
                  <p className={styles.answerQuestionType}>{question.tipeSoal}</p>
                  {question.opsi.length > 0 && (
                    question.tipeSoal === "PGK" ? (
                      <table className={styles.answerReviewTable}>
                        <thead>
                          <tr><th>Pilihan</th><th>Isi pilihan</th><th>Jawaban siswa</th></tr>
                        </thead>
                        <tbody>
                          {question.opsi.map((option, optionIndex) => {
                            const label = String.fromCharCode(65 + optionIndex);
                            const selected = Array.isArray(question.answer)
                              ? question.answer.includes(label)
                              : typeof question.answer === "object" &&
                                  question.answer !== null &&
                                  question.answer[String(optionIndex)] === "Benar";
                            return (
                              <tr className={selected ? styles.answerReviewSelectedRow : ""} key={`${question.id}-option-${optionIndex}`}>
                                <th>{label}</th>
                                <td dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(option) }} />
                                <td>{selected ? "Dipilih" : "Tidak dipilih"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                    <div className={styles.answerOptions}>
                      {question.opsi.map((option, optionIndex) => {
                        const label = String.fromCharCode(65 + optionIndex);
                        const selected = Array.isArray(question.answer)
                          ? question.answer.includes(label)
                          : typeof question.answer === "string"
                            ? question.answer === label
                            : question.tipeSoal === "PGK" &&
                                typeof question.answer === "object" &&
                                question.answer !== null
                              ? question.answer[String(optionIndex)] === "Benar"
                              : false;
                        return (
                          <div
                            className={`${styles.answerOptionRow} ${selected ? styles.answerOptionSelected : ""}`}
                            key={`${question.id}-option-${optionIndex}`}
                          >
                            <strong>{label}.</strong>
                            <div dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(option) }} />
                            {selected && <span className={styles.selectedAnswerMark}>Jawaban Anda</span>}
                          </div>
                        );
                      })}
                    </div>
                    )
                  )}
                  {question.statements.length > 0 && (
                    <table className={styles.answerReviewTable}>
                      <thead>
                        <tr><th>Pernyataan</th><th>Pilihan jawaban</th><th>Jawaban siswa</th></tr>
                      </thead>
                      <tbody>
                        {question.statements.map((item, index) => (
                          <tr className={item.answer ? styles.answerReviewSelectedRow : ""} key={`${question.id}-statement-${index}`}>
                            <td dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(item.prompt) }} />
                            <td>{item.choices.join(" / ")}</td>
                            <td>{item.answer || "Belum dijawab"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {question.matchingPairs.length > 0 && (
                    <MatchingReview pairs={question.matchingPairs} options={question.matchingOptions} />
                  )}
                  <footer className={styles.answerQuestionScore}>
                    Skor:{" "}
                    {question.earnedScore === null
                      ? "Menunggu koreksi"
                      : `${question.earnedScore.toFixed(2)} / ${question.possibleScore.toFixed(2)}`}
                  </footer>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}