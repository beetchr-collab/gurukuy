"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
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

        const examId = new URLSearchParams(window.location.search).get("examId");
        if (!examId) {
          setError("Ujian tidak ditemukan.");
          return;
        }

        const examSnapshot = await getDoc(doc(db, "bank_soal", examId));
        if (!examSnapshot.exists()) {
          setError("Ujian ini sudah tidak tersedia.");
          return;
        }

        const examData = examSnapshot.data() as Exam;
        const studentClass = (student.kelas || student.tingkatKelas)
          .trim()
          .toLocaleLowerCase();
        const examClass = (examData.kelas || "").trim().toLocaleLowerCase();
        if (
          examData.status !== "Aktif" ||
          examData.examStatus !== "mulai" ||
          examData.allowAccess !== true ||
          examClass !== studentClass
        ) {
          setError("Ujian ini tidak sedang dibuka untuk kelas Anda.");
          return;
        }

        const questionSnapshot = await getDocs(
          collection(db, "bank_soal", examId, "soal")
        );
        if (cancelled) return;

        setExam(examData);
        setQuestions(
          questionSnapshot.docs.map((questionDoc) => ({
            id: questionDoc.id,
            ...questionDoc.data(),
          })) as Question[]
        );
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

  return (
    <main className={styles.examPage}>
      <div className={styles.examShell}>
        <header className={styles.examHeader}>
          <div>
            <p className={styles.dashboardEyebrow}>RUANG UJIAN CBT</p>
            <h1>{exam.namaBankSoal || "Ujian CBT"}</h1>
            <p>{exam.mataPelajaran || "Mata pelajaran"} · {exam.kelas}</p>
          </div>
          <button className={styles.examBackButton} onClick={() => router.push("/cbt/dashboard")}>
            Keluar
          </button>
        </header>

        {questions.length === 0 ? (
          <div className={styles.examEmpty}>Belum ada soal pada ujian ini.</div>
        ) : (
          <section className={styles.questionList} aria-label="Daftar soal">
            {questions.map((question, index) => {
              const currentAnswer = answers[question.id];
              return (
                <article className={styles.questionItem} key={question.id}>
                  <div className={styles.questionHeading}>
                    <span>Soal {index + 1}</span>
                    <span>{question.tipeSoal || "Soal"}</span>
                  </div>
                  <div
                    className={styles.questionPrompt}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(question.pertanyaan || ""),
                    }}
                  />
                  {question.gambarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.questionImage} src={question.gambarUrl} alt="Ilustrasi soal" />
                  )}

                  {(question.tipeSoal === "PG" || question.tipeSoal === "PGK") && (
                    <div className={styles.answerOptions}>
                      {(question.opsi || []).map((option, optionIndex) => {
                        const letter = String.fromCharCode(65 + optionIndex);
                        const multiple = question.tipeSoal === "PGK";
                        const selectedAnswers = Array.isArray(currentAnswer)
                          ? currentAnswer
                          : typeof currentAnswer === "string" ? [currentAnswer] : [];
                        return (
                          <label className={styles.answerOption} key={`${question.id}-${letter}`}>
                            <input
                              type={multiple ? "checkbox" : "radio"}
                              name={question.id}
                              checked={selectedAnswers.includes(letter)}
                              onChange={() => {
                                if (!multiple) {
                                  setAnswer(question.id, letter);
                                  return;
                                }
                                setAnswer(
                                  question.id,
                                  selectedAnswers.includes(letter)
                                    ? selectedAnswers.filter((answer) => answer !== letter)
                                    : [...selectedAnswers, letter]
                                );
                              }}
                            />
                            <span><b>{letter}.</b> {option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.tipeSoal === "Benar/Salah" && (
                    <div className={styles.answerOptions}>
                      {(question.benarSalah || []).map((statement, statementIndex) => {
                        const statementAnswers = typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                          ? currentAnswer
                          : {};
                        return (
                          <div className={styles.statementAnswer} key={`${question.id}-${statementIndex}`}>
                            <span>{statement.statement}</span>
                            <select
                              aria-label={`Jawaban pernyataan ${statementIndex + 1}`}
                              value={statementAnswers[String(statementIndex)] || ""}
                              onChange={(event) =>
                                setAnswer(question.id, {
                                  ...statementAnswers,
                                  [String(statementIndex)]: event.target.value,
                                })
                              }
                            >
                              <option value="">Pilih jawaban</option>
                              <option value="Benar">Benar</option>
                              <option value="Salah">Salah</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.tipeSoal === "Menjodohkan" && (
                    <div className={styles.answerOptions}>
                      {(question.pasangan || []).map((pair, pairIndex) => {
                        const pairAnswers = typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                          ? currentAnswer
                          : {};
                        return (
                          <div className={styles.statementAnswer} key={`${question.id}-${pairIndex}`}>
                            <span>{pair.left}</span>
                            <select
                              aria-label={`Pasangan untuk ${pair.left}`}
                              value={pairAnswers[String(pairIndex)] || ""}
                              onChange={(event) =>
                                setAnswer(question.id, {
                                  ...pairAnswers,
                                  [String(pairIndex)]: event.target.value,
                                })
                              }
                            >
                              <option value="">Pilih pasangan</option>
                              {(question.pasangan || []).map((choice, choiceIndex) => (
                                <option key={`${question.id}-choice-${choiceIndex}`} value={choice.right}>
                                  {choice.right}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.tipeSoal === "Isian Singkat" && (
                    <input
                      className={styles.shortAnswer}
                      aria-label={`Jawaban soal ${index + 1}`}
                      value={typeof currentAnswer === "string" ? currentAnswer : ""}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                    />
                  )}

                  {question.tipeSoal === "Uraian" && (
                    <textarea
                      className={styles.longAnswer}
                      aria-label={`Jawaban soal ${index + 1}`}
                      value={typeof currentAnswer === "string" ? currentAnswer : ""}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      rows={5}
                    />
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}