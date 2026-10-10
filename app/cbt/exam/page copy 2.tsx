"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import styles from "../cbt.module.css";

type CbtStudent = {
  id: string;
  nama: string;
  nis?: string;
  nisn?: string;
  jk?: string;
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

const shuffleQuestions = (questions: Question[]) => {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const isQuestionAnswered = (question: Question, answer: Answer | undefined) => {
  if (question.tipeSoal === "PG") {
    return typeof answer === "string" && answer.trim().length > 0;
  }

  if (question.tipeSoal === "PGK" || question.tipeSoal === "Benar/Salah") {
    const statementCount = question.tipeSoal === "PGK"
      ? question.opsi?.length || 0
      : question.benarSalah?.length || 0;
    if (statementCount === 0 || !answer || typeof answer === "string" || Array.isArray(answer)) {
      return false;
    }
    return Array.from({ length: statementCount }, (_, index) => answer[String(index)])
      .every((value) => value === "Benar" || value === "Salah");
  }

  if (question.tipeSoal === "Menjodohkan") {
    const pairCount = question.pasangan?.length || 0;
    if (pairCount === 0 || !answer || typeof answer === "string" || Array.isArray(answer)) {
      return false;
    }
    return Array.from({ length: pairCount }, (_, index) => answer[String(index)])
      .every((value) => typeof value === "string" && value.trim().length > 0);
  }

  return typeof answer === "string" && answer.trim().length > 0;
};

export default function CbtExamPage() {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<CbtStudent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [questionNavigationOpen, setQuestionNavigationOpen] = useState(false);
  const [finishConfirmationOpen, setFinishConfirmationOpen] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
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

        const token = sessionStorage.getItem(`cbtExamToken:${examId}`);
        if (!token) {
          setError("Token ujian tidak ditemukan. Silakan kembali ke dashboard dan masukkan token.");
          return;
        }

        const response = await fetch("/api/cbt/exam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ examId, studentId: student.id, token }),
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
        setQuestions(shuffleQuestions(result.questions || []));
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

  useEffect(() => {
    if (!exam || !student || examFinished) return;

    const sendPresence = async () => {
      try {
        const examId = new URLSearchParams(window.location.search).get("examId");
        if (!examId) return;

        const response = await fetch("/api/cbt/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId, studentId: student.id }),
        });

        if (!response.ok) {
          console.error("CBT presence heartbeat failed:", response.status);
          if (response.status === 404) {
            router.replace("/cbt/dashboard");
          }
        }
      } catch (presenceError) {
        console.error("CBT presence heartbeat failed:", presenceError);
      }
    };

    void sendPresence();
    const interval = window.setInterval(() => {
      void sendPresence();
    }, 20_000);

    return () => window.clearInterval(interval);
  }, [exam, examFinished, router, student]);

  const answeredCount = useMemo(
    () => questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length,
    [answers, questions]
  );
  const canFinishExam = questions.length > 0 &&
    answeredCount === questions.length &&
    doubtfulQuestions.size === 0;

  useEffect(() => {
    if (!questionNavigationOpen && !finishConfirmationOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuestionNavigationOpen(false);
        setFinishConfirmationOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finishConfirmationOpen, questionNavigationOpen]);

  const saveAndFinishExam = async () => {
    if (!exam || !student || savingSubmission || !canFinishExam) return;

    setSavingSubmission(true);
    setSubmissionError("");
    try {
      const examId = new URLSearchParams(window.location.search).get("examId");
      if (!examId) throw new Error("ID ujian tidak ditemukan.");

      const response = await fetch("/api/cbt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          studentId: student.id,
          answers,
          doubtfulQuestionIds: Array.from(doubtfulQuestions),
        }),
      });
      const result = await response.json() as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Jawaban gagal disimpan. Silakan coba lagi.");
      }

      setFinishConfirmationOpen(false);
      setExamFinished(true);
      if (examId) sessionStorage.removeItem(`cbtExamToken:${examId}`);
    } catch (submitError) {
      console.error("Gagal menyimpan jawaban CBT:", submitError);
      setSubmissionError(
        submitError instanceof Error
          ? submitError.message
          : "Jawaban gagal disimpan. Silakan coba lagi."
      );
    } finally {
      setSavingSubmission(false);
    }
  };

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
            <div className={styles.questionMain}>
              <button
                className={styles.questionNavigationTrigger}
                onClick={() => setQuestionNavigationOpen(true)}
                type="button"
                aria-haspopup="dialog"
              >
                <span aria-hidden="true">▦</span>
                Daftar Soal
                <strong>{answeredCount}/{questions.length}</strong>
              </button>
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
                  disabled={currentQuestionIndex === questions.length - 1 && !canFinishExam}
                  onClick={() => {
                    if (currentQuestionIndex === questions.length - 1) {
                      setSubmissionError("");
                      setFinishConfirmationOpen(true);
                    } else {
                      setCurrentQuestionIndex((index) => index + 1);
                    }
                  }}
                  type="button"
                >
                  {currentQuestionIndex === questions.length - 1
                    ? canFinishExam ? "Selesai Ujian dan Simpan" : "Berikutnya"
                    : "Berikutnya →"}
                </button>
              </div>
              {currentQuestionIndex === questions.length - 1 && !canFinishExam && (
                <p className={styles.finishRequirement}>
                  Lengkapi semua jawaban dan hapus semua tanda ragu-ragu untuk menyelesaikan ujian.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
      {questionNavigationOpen && (
        <div
          className={styles.finishOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuestionNavigationOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="question-navigation-title"
            aria-modal="true"
            className={styles.navigationDialog}
            role="dialog"
          >
            <div className={styles.navigationDialogHeader}>
              <div>
                <h2 id="question-navigation-title">Navigasi soal</h2>
                <p>{answeredCount} dari {questions.length} terjawab</p>
              </div>
              <button
                aria-label="Tutup navigasi soal"
                className={styles.navigationCloseButton}
                onClick={() => setQuestionNavigationOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className={styles.questionGrid}>
              {questions.map((question, index) => {
                const answered = isQuestionAnswered(question, answers[question.id]);
                const isDoubtful = doubtfulQuestions.has(question.id);
                const classes = [
                  styles.questionNumber,
                  answered ? styles.numberAnswered : "",
                  index === currentQuestionIndex ? styles.numberActive : "",
                  isDoubtful ? styles.numberDoubtful : "",
                ].filter(Boolean).join(" ");
                return (
                  <button
                    aria-label={`Buka soal ${index + 1}${answered ? ", sudah dijawab" : ", belum dijawab"}${isDoubtful ? ", ragu-ragu" : ""}`}
                    aria-current={index === currentQuestionIndex ? "step" : undefined}
                    className={classes}
                    key={question.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setQuestionNavigationOpen(false);
                    }}
                    type="button"
                  >
                    {index + 1}
                    {isDoubtful && <span aria-hidden="true">!</span>}
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
          </section>
        </div>
      )}
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
              Semua {questions.length} soal sudah dijawab dan tidak ada yang ditandai ragu-ragu.
              Jawaban Anda akan disimpan dan ujian diakhiri.
            </p>
            {submissionError && <p className={styles.submissionError} role="alert">{submissionError}</p>}
            <div className={styles.finishDialogActions}>
              <button
                className={styles.previousButton}
                disabled={savingSubmission}
                onClick={() => setFinishConfirmationOpen(false)}
                type="button"
              >
                Kembali mengerjakan
              </button>
              <button
                className={styles.finishConfirmButton}
                disabled={savingSubmission}
                onClick={() => void saveAndFinishExam()}
                type="button"
              >
                {savingSubmission ? "Menyimpan..." : "Simpan dan akhiri ujian"}
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
              onClick={() => router.push("/cbt")}
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
