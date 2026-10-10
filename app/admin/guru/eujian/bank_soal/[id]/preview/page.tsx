"use client";

import { useCallback, useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

type Exam = {
  id: string;
  namaBankSoal?: string;
  mataPelajaran?: string;
  kelas?: string;
  jenisPaket?: string;
};

type Question = {
  id: string;
  tipeSoal?: string;
  pertanyaan?: string;
  gambarUrl?: string;
  opsi?: string[];
  benarSalah?: { statement?: string }[];
  pasangan?: { left?: string; right?: string }[];
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export default function PreviewSoalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const examId = params.id;
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      setError("Sesi pengguna tidak valid. Silakan masuk kembali.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadPreview = async () => {
      setLoading(true);
      setError("");
      try {
        const examSnapshot = await getDoc(doc(db, "bank_soal", examId));
        if (!examSnapshot.exists()) throw new Error("Bank soal tidak ditemukan.");
        const examData = examSnapshot.data();
        if (examData.ownerId !== user.uid) {
          throw new Error("Anda tidak memiliki akses ke bank soal ini.");
        }
        const questionSnapshot = await getDocs(
          query(
            collection(db, "bank_soal", examId, "soal"),
            orderBy("createdAt", "asc"),
          ),
        );
        if (!cancelled) {
          setExam({ id: examSnapshot.id, ...examData } as Exam);
          setQuestions(
            questionSnapshot.docs.map((question) => ({
              id: question.id,
              ...question.data(),
            })) as Question[],
          );
        }
      } catch (loadError) {
        console.error("Gagal memuat preview soal:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat preview soal.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [authLoading, examId, user?.uid]);

  const openPdfDialog = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.alert("Izinkan pop-up untuk mengunduh soal sebagai PDF.");
      return;
    }
    printWindow.opener = null;
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
    const printableContent =
      document.getElementById("question-paper-content")?.innerHTML || "";
    const title = escapeHtml(exam?.namaBankSoal || "Preview Soal");
    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font: 12pt Arial, sans-serif; color: #111; margin: 18mm; }
            h1 { font-size: 20pt; margin: 0 0 6px; }
            .exam-meta { color: #444; margin-bottom: 24px; }
            article { break-inside: avoid; margin: 0 0 24px; }
            .question { margin: 12px 0; }
            .options { list-style: none; padding-left: 24px; }
            .options li { margin: 6px 0; }
            .choice-option { display: flex; gap: 8px; margin: 6px 0; }
            .true-false-table { border-collapse: collapse; width: 100%; margin-top: 12px; }
            .true-false-table th, .true-false-table td { border: 1px solid #777; padding: 8px; }
            .true-false-table th:not(:first-child), .true-false-table td:not(:first-child) { text-align: center; width: 90px; }
            .answer-checkbox { display: inline-block; width: 16px; height: 16px; border: 1px solid #333; vertical-align: middle; }
            img { max-width: 100%; height: auto; }
            .answer-lines { height: 54px; border-bottom: 1px solid #aaa; }
            .pair-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            @page { margin: 15mm; }
          </style>
        </head>
        <body>${printableContent}</body>
      </html>`);
    printWindow.document.close();
  }, [exam?.namaBankSoal]);

  const printQuestions = () => window.print();

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h4 className="app-content-headerText mb-1">Preview Soal</h4>
            <div className="text-muted small">
              {exam?.namaBankSoal || "Bank soal"}
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 preview-actions">
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.back()}
              type="button"
            >
              <i className="fas fa-arrow-left me-2" />
              Kembali
            </button>
            <button
              className="btn btn-outline-primary"
              disabled={loading || Boolean(error)}
              onClick={openPdfDialog}
              type="button"
            >
              <i className="fas fa-file-pdf me-2" />
              Download PDF
            </button>
            <button
              className="btn btn-primary"
              disabled={loading || Boolean(error)}
              onClick={printQuestions}
              type="button"
            >
              <i className="fas fa-print me-2" />
              Cetak Soal
            </button>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <style jsx global>{`
            @media print {
              .preview-actions,
              .app-content-header {
                display: none !important;
              }
              .app-main,
              .app-content,
              .container-fluid {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
              }
              .question-paper {
                border: 0 !important;
                box-shadow: none !important;
              }
              .question-paper article {
                break-inside: avoid;
              }
            }
          `}</style>
          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <div className="card card-body text-center text-muted">
              Memuat soal...
            </div>
          ) : (
            !error &&
            exam && (
              <section
                className="card question-paper shadow-sm"
                id="question-paper-content"
              >
                <div className="card-body p-4 p-lg-5">
                  <header className="border-bottom pb-3 mb-4">
                    <h1 className="h3 fw-bold">{exam.namaBankSoal}</h1>
                    <div className="exam-meta text-muted">
                      {[exam.mataPelajaran, exam.kelas, exam.jenisPaket]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="d-flex flex-wrap gap-4 small">
                      <span>Nama: ________________________________</span>
                      <span>Kelas: _______________</span>
                      <span>Tanggal: _______________</span>
                    </div>
                  </header>

                  {questions.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      Belum ada soal di bank soal ini.
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <article className="mb-4" key={question.id}>
                        <div className="d-flex gap-2">
                          <strong>{index + 1}.</strong>
                          <div className="flex-grow-1">
                            <div
                              className="question"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  question.pertanyaan || "Soal tanpa teks",
                                ),
                              }}
                            />
                            {question.gambarUrl && (
                              <img
                                alt={`Ilustrasi soal ${index + 1}`}
                                className="img-fluid mb-3"
                                src={question.gambarUrl}
                              />
                            )}
                            {["PG", "PGK"].includes(question.tipeSoal || "") &&
                              Array.from({
                                length: Math.max(4, question.opsi?.length || 0),
                              }).map((_, optionIndex) => (
                                <div className="choice-option" key={optionIndex}>
                                  <strong>
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </strong>
                                  <span>{question.opsi?.[optionIndex] || ""}</span>
                                </div>
                              ))}
                            {question.tipeSoal === "Benar/Salah" &&
                              Array.isArray(question.benarSalah) && (
                                <table
                                  className="true-false-table"
                                  style={{
                                    borderCollapse: "collapse",
                                    border: "1px solid #333",
                                    width: "100%",
                                    marginTop: 12,
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                        scope="col"
                                        style={{
                                          border: "1px solid #333",
                                          padding: 8,
                                          textAlign: "center",
                                        }}
                                      >
                                        Pernyataan
                                      </th>
                                      <th
                                        scope="col"
                                        style={{
                                          border: "1px solid #333",
                                          padding: 8,
                                          textAlign: "center",
                                          width: 90,
                                        }}
                                      >
                                        Benar
                                      </th>
                                      <th
                                        scope="col"
                                        style={{
                                          border: "1px solid #333",
                                          padding: 8,
                                          textAlign: "center",
                                          width: 90,
                                        }}
                                      >
                                        Salah
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {question.benarSalah.map((item, itemIndex) => (
                                      <tr key={itemIndex}>
                                        <td
                                          style={{
                                            border: "1px solid #333",
                                            padding: 8,
                                          }}
                                        >
                                          {item.statement}
                                        </td>
                                        {[0, 1].map((answerIndex) => (
                                          <td
                                            key={answerIndex}
                                            style={{
                                              border: "1px solid #333",
                                              padding: 8,
                                              textAlign: "center",
                                              width: 90,
                                            }}
                                          >
                                            <span
                                              aria-label={`${answerIndex === 0 ? "Benar" : "Salah"} untuk pernyataan ${itemIndex + 1}`}
                                              className="answer-checkbox"
                                              style={{
                                                display: "inline-block",
                                                width: 16,
                                                height: 16,
                                                border: "1px solid #333",
                                                verticalAlign: "middle",
                                              }}
                                            />
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            {question.tipeSoal === "Menjodohkan" &&
                              Array.isArray(question.pasangan) && (
                                <div className="pair-grid">
                                  <ol className="options">
                                    {question.pasangan.map((pair, pairIndex) => (
                                      <li key={pairIndex}>{pair.left}</li>
                                    ))}
                                  </ol>
                                  <ol className="options" type="A">
                                    {question.pasangan.map((pair, pairIndex) => (
                                      <li key={pairIndex}>{pair.right}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            {["Isian Singkat", "Uraian"].includes(
                              question.tipeSoal || "",
                            ) && <div className="answer-lines" />}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )
          )}
          {!loading && !error && (
            <p className="text-muted small mt-2 pdf-hint">
              Untuk mengunduh PDF, pilih “Simpan sebagai PDF” pada dialog cetak
              browser.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
