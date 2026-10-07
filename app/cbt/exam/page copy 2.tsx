"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import styles from "../cbt.module.css";

type CbtStudent = {
  id: string;
  nama: string;
  kelas: string;
  tingkatKelas: string;
};

type Exam = {
  namaBankSoal?: string;
  mataPelajaran?: string;
  kelas?: string;
  status?: string;
  examStatus?: string;
  allowAccess?: boolean;
  examDate?: string;
  endTime?: string;
  duration?: number;
};

type Question = {
  id: string;
  tipeSoal?: string;
  pertanyaan?: string;
  gambarUrl?: string;
  opsi?: string[];
  benarSalah?: { statement: string; jawaban?: string }[];
  pasangan?: { left: string; right: string }[];
};

type Answer = string | string[] | Record<string, string>;

export default function CbtExamPage() {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<CbtStudent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [finishConfirmationOpen, setFinishConfirmationOpen] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadExam = async () => {
      try {
        const storedStudent = localStorage.getItem("cbtStudent");
        if (!storedStudent) {
          router.replace("/cbt/login");
          return;
        }

        let student: CbtStudent;
        try {
          student = JSON.parse(storedStudent) as CbtStudent;
        } catch {
          localStorage.removeItem("cbtStudent");
          router.replace("/cbt/login");
          return;
        }

        setStudent(student);
        const examId = new URLSearchParams(window.location.search).get("examId");
        if (!examId) {
          setError("Ujian tidak ditemukan.");
          return;
        }

        const response = await fetch("/api/cbt/exam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ examId, studentId: student.id }),
        });
        const result = await response.json() as {
          success: boolean;
          message?: string;
          exam?: Exam;
          questions?: Question[];
        };

        if (!response.ok || !result.success || !result.exam) {
          setError(result.message || "Soal ujian gagal dimuat. Silakan kembali dan coba lagi.");
          return;
        }
        if (cancelled) return;

        setExam(result.exam);
        setQuestions(result.questions || []);
      } catch (loadError) {
        console.error("Gagal memuat soal CBT:", loadError);
        setError("Soal ujian gagal dimuat. Silakan kembali dan coba lagi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadExam();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const setAnswer = (questionId: string, answer: Answer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  };

  useEffect(() => {
    if (!exam) return;

    const scheduledEnd = exam.examDate && exam.endTime
      ? new Date(`${exam.examDate}T${exam.endTime}`).getTime()
      : Number.NaN;
    const deadline = Number.isFinite(scheduledEnd)
      ? scheduledEnd
      : typeof exam.duration === "number" && exam.duration > 0
        ? Date.now() + exam.duration * 60 * 1000
        : null;

    if (deadline === null) return;

    const updateRemainingTime = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(interval);
  }, [exam]);

  const answeredCount = useMemo(
    () => questions.filter((question) => {
      const answer = answers[question.id];
      if (typeof answer === "string") return answer.trim().length > 0;
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== undefined && Object.values(answer).some((value) => value.trim().length > 0);
    }).length,
    [answers, questions]
  );

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--:--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    return [hours, minutes, remaining].map((part) => String(part).padStart(2, "0")).join(":");
  };

  if (loading) {
    return <main className={styles.dashboardLoading}>Memuat soal ujian...</main>;
  }

  if (error || !exam) {
    return (
      <main className={styles.examPage}>
        <div className={styles.examShell}>
          <p className={styles.examError} role="alert">{error || "Ujian tidak tersedia."}</p>
          <button className={styles.examBackButton} onClick={() => router.push("/cbt/dashboard")}>
            Kembali ke dashboard
          </button>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <main className={styles.examPage}>
      <div className={styles.examShell}>
        <header className={styles.examHeader}>
          <div className={styles.examIdentity}>
            <p className={styles.dashboardEyebrow}>RUANG UJIAN CBT</p>
            <h1>{exam.namaBankSoal || "Ujian CBT"}</h1>
            <p>{exam.mataPelajaran || "Mata pelajaran"} · {exam.kelas || "Kelas tidak ditentukan"}</p>
          </div>
          <div className={styles.examHeaderTools}>
            <section className={styles.examParticipant} aria-label="Identitas peserta">
              <span className={styles.participantAvatar} aria-hidden="true">
                {(student?.nama || "P").trim().charAt(0).toUpperCase()}
              </span>
              <span className={styles.participantDetails}>
                <small>Peserta ujian</small>
                <strong>{student?.nama || "Peserta"}</strong>
                <span>{student?.kelas || student?.tingkatKelas || "Kelas tidak ditentukan"}</span>
              </span>
            </section>
            <section className={styles.examTimer} aria-label="Sisa waktu ujian">
              <span className={styles.timerIcon} aria-hidden="true">◷</span>
              <span>
                <small>SISA WAKTU</small>
                <strong>{formatTime(remainingSeconds)}</strong>
              </span>
            </section>
          </div>
        </header>

        {questions.length === 0 ? (
          <div className={styles.examEmpty}>Belum ada soal pada ujian ini.</div>
        ) : (
          <section className={styles.examWorkspace} aria-label="Area pengerjaan ujian">
            <aside className={styles.questionNavigation} aria-label="Navigasi nomor soal">
              <div className={styles.navigationHeading}>
                <div>
                  <h2>Navigasi soal</h2>
                  <p>{answeredCount} dari {questions.length} terjawab</p>
                </div>
                <span className={styles.navigationCount}>{questions.length}</span>
              </div>
              <div className={styles.questionGrid}>
                {questions.map((question, index) => {
                  const answer = answers[question.id];
                  const answered = typeof answer === "string"
                    ? answer.trim().length > 0
                    : Array.isArray(answer)
                      ? answer.length > 0
                      : answer !== undefined &&
                        Object.values(answer).some((value) => value.trim().length > 0);
                  const classes = [
                    styles.questionNumber,
                    answered ? styles.numberAnswered : "",
                    index === currentQuestionIndex ? styles.numberActive : "",
                    doubtfulQuestions.has(question.id) ? styles.numberDoubtful : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <button
                      aria-label={`Buka soal ${index + 1}${answered ? ", sudah dijawab" : ", belum dijawab"}${doubtfulQuestions.has(question.id) ? ", ragu-ragu" : ""}`}
                      aria-current={index === currentQuestionIndex ? "step" : undefined}
                      className={classes}
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      type="button"
                    >
                      {index + 1}
                      {doubtfulQuestions.has(question.id) && <span aria-hidden="true">!</span>}
                    </button>
                  );
                })}
              </div>
              <div className={styles.questionLegend}>
                <span><i className={styles.legendUnanswered} />Belum dijawab</span>
                <span><i className={styles.legendAnswered} />Sudah dijawab</span>
                <span><i className={styles.legendActive} />Soal aktif</span>
                <span><i className={styles.legendDoubtful} />Ragu-ragu</span>
              </div>
              <button
                className={styles.finishButton}
                onClick={() => setFinishConfirmationOpen(true)}
                type="button"
              >
                Selesai Ujian
              </button>
            </aside>

            <div className={styles.questionMain}>
              <article className={styles.questionItem} key={currentQuestion.id}>
                <div className={styles.questionHeading}>
                  <span>Soal {currentQuestionIndex + 1} <small>/ {questions.length}</small></span>
                  <span>{currentQuestion.tipeSoal || "Soal"}</span>
                </div>
                <div
                  className={styles.questionPrompt}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(currentQuestion.pertanyaan || ""),
                  }}
                />
                {currentQuestion.gambarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.questionImage} src={currentQuestion.gambarUrl} alt="Ilustrasi soal" />
                )}

                {currentQuestion.tipeSoal === "PG" && (
                  <div className={styles.answerOptions}>
                    {(currentQuestion.opsi || []).map((option, optionIndex) => {
                      const letter = String.fromCharCode(65 + optionIndex);
                      return (
                        <label className={styles.answerOption} key={`${currentQuestion.id}-${letter}`}>
                          <input
                            type="radio"
                            name={currentQuestion.id}
                            checked={currentAnswer === letter}
                            onChange={() => setAnswer(currentQuestion.id, letter)}
                          />
                          <span><b>{letter}.</b> {option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {(currentQuestion.tipeSoal === "PGK" || currentQuestion.tipeSoal === "Benar/Salah") && (
                  (() => {
                    const statements = currentQuestion.tipeSoal === "PGK"
                      ? (currentQuestion.opsi || []).map((statement) => ({ statement }))
                      : currentQuestion.benarSalah || [];
                    const statementAnswers =
                      typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                        ? currentAnswer
                        : {};

                    return (
                      <div className={styles.answerTableWrap}>
                        <table className={styles.answerTable}>
                          <thead>
                            <tr>
                              <th scope="col">Pernyataan</th>
                              <th scope="col">Benar</th>
                              <th scope="col">Salah</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statements.map((statement, statementIndex) => {
                              const rowKey = String(statementIndex);
                              return (
                                <tr key={`${currentQuestion.id}-${statementIndex}`}>
                                  <th scope="row">{statement.statement}</th>
                                  {(["Benar", "Salah"] as const).map((value) => (
                                    <td key={value}>
                                      <label className={styles.answerTableChoice}>
                                        <input
                                          type="radio"
                                          name={`${currentQuestion.id}-${statementIndex}`}
                                          aria-label={`${value} untuk pernyataan ${statementIndex + 1}`}
                                          checked={statementAnswers[rowKey] === value}
                                          onChange={() =>
                                            setAnswer(currentQuestion.id, {
                                              ...statementAnswers,
                                              [rowKey]: value,
                                            })
                                          }
                                        />
                                      </label>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}

                {currentQuestion.tipeSoal === "Menjodohkan" && (
                  <div className={styles.answerOptions}>
                    {(currentQuestion.pasangan || []).map((pair, pairIndex) => {
                      const pairAnswers = typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                        ? currentAnswer
                        : {};
                      return (
                        <div className={styles.statementAnswer} key={`${currentQuestion.id}-${pairIndex}`}>
                          <span>{pair.left}</span>
                          <select
                            aria-label={`Pasangan untuk ${pair.left}`}
                            value={pairAnswers[String(pairIndex)] || ""}
                            onChange={(event) =>
                              setAnswer(currentQuestion.id, {
                                ...pairAnswers,
                                [String(pairIndex)]: event.target.value,
                              })
                            }
                          >
                            <option value="">Pilih pasangan</option>
                            {(currentQuestion.pasangan || []).map((choice, choiceIndex) => (
                              <option key={`${currentQuestion.id}-choice-${choiceIndex}`} value={choice.right}>
                                {choice.right}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.tipeSoal === "Isian Singkat" && (
                  <input
                    className={styles.shortAnswer}
                    aria-label={`Jawaban soal ${currentQuestionIndex + 1}`}
                    value={typeof currentAnswer === "string" ? currentAnswer : ""}
                    onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                  />
                )}

                {currentQuestion.tipeSoal === "Uraian" && (
                  <textarea
                    className={styles.longAnswer}
                    aria-label={`Jawaban soal ${currentQuestionIndex + 1}`}
                    value={typeof currentAnswer === "string" ? currentAnswer : ""}
                    onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                    rows={5}
                  />
                )}
              </article>

              <div className={styles.questionControls}>
                <button
                  className={styles.previousButton}
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                  type="button"
                >
                  ← Sebelumnya
                </button>
                <button
                  className={`${styles.doubtfulButton} ${doubtfulQuestions.has(currentQuestion.id) ? styles.doubtfulButtonActive : ""}`}
                  aria-pressed={doubtfulQuestions.has(currentQuestion.id)}
                  onClick={() => setDoubtfulQuestions((current) => {
                    const next = new Set(current);
                    if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
                    else next.add(currentQuestion.id);
                    return next;
                  })}
                  type="button"
                >
                  ⚑ {doubtfulQuestions.has(currentQuestion.id) ? "Hapus Ragu-ragu" : "Ragu-ragu"}
                </button>
                <button
                  className={styles.nextButton}
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
                  type="button"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
      {finishConfirmationOpen && (
        <div className={styles.finishOverlay} role="presentation">
          <section
            aria-labelledby="finish-title"
            aria-modal="true"
            className={styles.finishDialog}
            role="dialog"
          >
            <span className={styles.finishDialogIcon} aria-hidden="true">✓</span>
            <h2 id="finish-title">Selesaikan ujian?</h2>
            <p>
              {answeredCount} dari {questions.length} soal sudah dijawab.
              {answeredCount < questions.length ? " Soal yang belum dijawab tetap akan dihitung kosong." : ""}
            </p>
            <div className={styles.finishDialogActions}>
              <button
                className={styles.previousButton}
                onClick={() => setFinishConfirmationOpen(false)}
                type="button"
              >
                Kembali mengerjakan
              </button>
              <button
                className={styles.finishConfirmButton}
                onClick={() => {
                  setExamFinished(true);
                  setFinishConfirmationOpen(false);
                }}
                type="button"
              >
                Ya, selesai
              </button>
            </div>
          </section>
        </div>
      )}
      {examFinished && (
        <div className={styles.finishOverlay} role="presentation">
          <section aria-labelledby="finished-title" className={styles.finishDialog} role="status">
            <span className={styles.finishDialogIcon} aria-hidden="true">✓</span>
            <h2 id="finished-title">Ujian selesai</h2>
            <p>{answeredCount} dari {questions.length} soal sudah dijawab.</p>
            <button
              className={styles.finishConfirmButton}
              onClick={() => router.push("/cbt/dashboard")}
              type="button"
            >
              Kembali ke dashboard
            </button>
          </section>
        </div>
      )}
    </main>
  );
}