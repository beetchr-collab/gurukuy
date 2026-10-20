"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

const statementTypes = [
  "Benar/Salah",
  "Sesuai/Tidak Sesuai",
  "Mendukung/Tidak mendukung",
  "Fakta/Pendapat",
];

const supportedTypes = [
  "PG",
  "PGK",
  "Menjodohkan",
  ...statementTypes,
  "Isian Singkat",
  "Uraian",
];

const headers = [
  "Tipe Soal",
  "Pertanyaan",
  "Skor",
  "Gambar URL",
  "Opsi (pisahkan dengan |)",
  "Jawaban Benar (pisahkan dengan |)",
  "Jawaban Isian",
  "Jawaban Uraian",
  "Pernyataan (pisahkan dengan |)",
  "Jawaban Pernyataan (pisahkan dengan |)",
  "Pasangan (format kiri=>kanan; pisahkan dengan |)",
];

type BankSoal = {
  id: string;
  namaBankSoal: string;
};

type ImportedQuestion = {
  tipeSoal: string;
  pertanyaan: string;
  skor: number;
  gambarUrl?: string;
  opsi?: string[];
  jawabanBenar?: string[];
  jawabanIsian?: string;
  jawabanEssay?: string;
  benarSalah?: { statement: string; jawaban: string }[];
  pasangan?: { left: string; right: string }[];
};

type SpreadsheetRow = Record<string, unknown>;

const getCellText = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";

const splitValues = (value: unknown) =>
  getCellText(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const getStatementAnswerOptions = (type: string) => {
  if (type === "Sesuai/Tidak Sesuai") return ["Sesuai", "Tidak Sesuai"];
  if (type === "Mendukung/Tidak mendukung") {
    return ["Mendukung", "Tidak mendukung"];
  }
  if (type === "Fakta/Pendapat") return ["Fakta", "Pendapat"];
  return ["Benar", "Salah"];
};

function parseSpreadsheetRows(rows: SpreadsheetRow[]) {
  const questions: ImportedQuestion[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const questionText = getCellText(row["Pertanyaan"]);
    const type = getCellText(row["Tipe Soal"]);
    if (!questionText && !type) return;

    const rowErrors: string[] = [];
    if (!supportedTypes.includes(type)) {
      rowErrors.push(
        `Tipe soal tidak valid. Pilihan: ${supportedTypes.join(", ")}.`,
      );
    }
    if (!questionText) rowErrors.push("Pertanyaan wajib diisi.");

    const scoreValue = getCellText(row["Skor"]);
    const score = scoreValue ? Number(scoreValue) : 1;
    if (!Number.isFinite(score) || score < 0) {
      rowErrors.push("Skor harus berupa angka 0 atau lebih.");
    }

    const options = splitValues(row["Opsi (pisahkan dengan |)"]);
    const correctAnswers = splitValues(
      row["Jawaban Benar (pisahkan dengan |)"],
    );
    const optionLabels = options.map((_, optionIndex) =>
      String.fromCharCode(65 + optionIndex),
    );
    const statements = splitValues(
      row["Pernyataan (pisahkan dengan |)"],
    );
    const statementAnswers = splitValues(
      row["Jawaban Pernyataan (pisahkan dengan |)"],
    );
    const pairs = splitValues(
      row["Pasangan (format kiri=>kanan; pisahkan dengan |)"],
    );

    const question: ImportedQuestion = {
      tipeSoal: type,
      pertanyaan: questionText,
      skor: score,
    };

    const imageUrl = getCellText(row["Gambar URL"]);
    if (imageUrl) question.gambarUrl = imageUrl;

    if (type === "PG" || type === "PGK") {
      if (options.length < 2) {
        rowErrors.push("Pilihan jawaban minimal harus berisi 2 opsi.");
      }
      if (
        correctAnswers.length === 0 ||
        (type === "PG" && correctAnswers.length !== 1) ||
        correctAnswers.some((answer) => !optionLabels.includes(answer))
      ) {
        rowErrors.push(
          `Jawaban benar harus berupa label opsi (${optionLabels.join(", ")}). PG hanya memiliki satu jawaban benar.`,
        );
      }
      question.opsi = options;
      question.jawabanBenar = correctAnswers;
    }

    if (type === "Menjodohkan") {
      const parsedPairs = pairs.map((pair) => {
        const [left, ...rightParts] = pair.split("=>");
        return { left: left?.trim() ?? "", right: rightParts.join("=>").trim() };
      });
      if (
        parsedPairs.length === 0 ||
        parsedPairs.some((pair) => !pair.left || !pair.right)
      ) {
        rowErrors.push(
          "Pasangan wajib diisi dengan format kiri=>kanan dan dipisahkan |.",
        );
      }
      question.pasangan = parsedPairs;
    }

    if (statementTypes.includes(type)) {
      const allowedAnswers = getStatementAnswerOptions(type);
      if (
        statements.length === 0 ||
        statements.length !== statementAnswers.length ||
        statementAnswers.some((answer) => !allowedAnswers.includes(answer))
      ) {
        rowErrors.push(
          `Isi pernyataan dan jawaban dengan jumlah yang sama. Jawaban: ${allowedAnswers.join(" / ")}.`,
        );
      }
      question.benarSalah = statements.map((statement, statementIndex) => ({
        statement,
        jawaban: statementAnswers[statementIndex] ?? "",
      }));
    }

    if (type === "Isian Singkat") {
      question.jawabanIsian = getCellText(row["Jawaban Isian"]);
      if (!question.jawabanIsian) rowErrors.push("Jawaban isian wajib diisi.");
    }

    if (type === "Uraian") {
      question.jawabanEssay = getCellText(row["Jawaban Uraian"]);
      if (!question.jawabanEssay) rowErrors.push("Jawaban uraian wajib diisi.");
    }

    if (rowErrors.length > 0) {
      errors.push(`Baris ${rowNumber}: ${rowErrors.join(" ")}`);
    } else {
      questions.push(question);
    }
  });

  return { questions, errors };
}

export default function ImportBankSoalPage() {
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([]);
  const [selectedBankSoalId, setSelectedBankSoalId] = useState("");
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState("");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      setBankSoalList([]);
      setBankLoading(false);
      setBankError("Silakan login untuk melihat bank soal.");
      return;
    }

    setBankLoading(true);
    const bankQuery = query(
      collection(db, "bank_soal"),
      where("ownerId", "==", user.uid),
    );

    return onSnapshot(
      bankQuery,
      (snapshot) => {
        setBankSoalList(
          snapshot.docs.map((bankDoc) => ({
            id: bankDoc.id,
            namaBankSoal:
              typeof bankDoc.data().namaBankSoal === "string"
                ? bankDoc.data().namaBankSoal
                : "Bank soal tanpa nama",
          })),
        );
        setBankError("");
        setBankLoading(false);
      },
      (error) => {
        console.error("Gagal memuat daftar bank soal:", error);
        setBankError("Daftar bank soal gagal dimuat. Silakan coba lagi.");
        setBankLoading(false);
      },
    );
  }, [authLoading, user?.uid]);

  const resetFile = () => {
    setFileName("");
    setQuestions([]);
    setValidationErrors([]);
    setFileError("");
    setSuccessMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBankChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBankSoalId(event.target.value);
    resetFile();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    resetFile();
    if (!file) return;
    if (!selectedBankSoalId) {
      setFileError("Pilih nama bank soal terlebih dahulu.");
      return;
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setFileError("Pilih file Excel dengan format .xlsx atau .xls.");
      return;
    }

    setIsReadingFile(true);
    setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setFileError("File Excel tidak memiliki sheet.");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(
        workbook.Sheets[firstSheetName],
        { defval: "", raw: false },
      );
      if (rows.length === 0) {
        setFileError("Sheet belum berisi data soal.");
        return;
      }
      const missingHeaders = ["Tipe Soal", "Pertanyaan"].filter(
        (header) => !(header in rows[0]),
      );
      if (missingHeaders.length > 0) {
        setFileError(
          `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}. Gunakan template import.`,
        );
        return;
      }

      const result = parseSpreadsheetRows(rows);
      setQuestions(result.questions);
      setValidationErrors(result.errors);
      if (result.questions.length > 500) {
        setFileError(
          "Maksimal 500 soal dapat diimpor dalam satu kali proses. Kurangi jumlah baris pada file.",
        );
      }
      if (result.questions.length === 0 && result.errors.length === 0) {
        setFileError("Tidak ada baris soal yang dapat dibaca.");
      }
    } catch (error) {
      console.error("Gagal membaca file import soal:", error);
      setFileError("File Excel gagal dibaca. Pastikan file tidak rusak.");
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      [
        "PG",
        "Contoh pertanyaan pilihan ganda",
        1,
        "",
        "Pilihan A|Pilihan B|Pilihan C|Pilihan D",
        "A",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "Uraian",
        "Contoh pertanyaan uraian",
        5,
        "",
        "",
        "",
        "",
        "Contoh jawaban uraian",
        "",
        "",
        "",
      ],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Soal");
    XLSX.writeFile(workbook, "Template-Import-Soal.xlsx");
  };

  const handleImport = async () => {
    if (!user?.uid) {
      setFileError("Silakan login kembali sebelum mengimpor soal.");
      return;
    }
    if (!selectedBankSoalId) {
      setFileError("Pilih nama bank soal terlebih dahulu.");
      return;
    }
    if (questions.length === 0 || validationErrors.length > 0) return;

    setIsImporting(true);
    setFileError("");
    setSuccessMessage("");
    try {
      const batch = writeBatch(db);
      questions.forEach((question) => {
        const questionRef = doc(
          collection(db, "bank_soal", selectedBankSoalId, "soal"),
        );
        batch.set(questionRef, {
          ...question,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setSuccessMessage(`${questions.length} soal berhasil diimpor.`);
      setQuestions([]);
      setValidationErrors([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Gagal mengimpor soal:", error);
      setFileError("Soal gagal diimpor. Periksa koneksi dan coba lagi.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <h3 className="mb-1 fw-bold">Import Soal</h3>
          <p className="text-muted mb-0">
            Impor soal dari file Excel ke bank soal yang dipilih.
          </p>
        </div>
      </div>

      <div className="container-fluid">
        <div className="callout callout-info shadow-sm rounded-3 mb-3">
          <h5>
            <i className="fas fa-info-circle me-2" />
            Petunjuk Import
          </h5>
          <p className="mb-2">
            Pilih bank soal terlebih dahulu, lalu unggah file Excel. Tipe soal
            harus menggunakan nilai yang tersedia di template.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handleDownloadTemplate}
          >
            <i className="fas fa-download me-2" />
            Unduh Template Excel
          </button>
        </div>

        {bankError && (
          <div className="alert alert-danger" role="alert">
            {bankError}
          </div>
        )}

        <div className="card card-primary card-outline">
          <div className="card-header">
            <h3 className="card-title fw-bold">Form Import Soal</h3>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <label
                className="form-label fw-semibold"
                htmlFor="bank-soal-select"
              >
                1. Nama Bank Soal
              </label>
              <select
                id="bank-soal-select"
                className="form-select"
                value={selectedBankSoalId}
                onChange={handleBankChange}
                disabled={bankLoading || bankSoalList.length === 0}
                required
              >
                <option value="">
                  {bankLoading
                    ? "Memuat bank soal..."
                    : bankSoalList.length === 0
                      ? "Belum ada bank soal"
                      : "Pilih nama bank soal"}
                </option>
                {bankSoalList.map((bankSoal) => (
                  <option key={bankSoal.id} value={bankSoal.id}>
                    {bankSoal.namaBankSoal}
                  </option>
                ))}
              </select>
              <div className="form-text">
                Soal dari file akan ditambahkan ke bank soal yang dipilih.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="excel-file">
                2. File Excel
              </label>
              <input
                ref={fileInputRef}
                id="excel-file"
                type="file"
                className="form-control"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={!selectedBankSoalId || isReadingFile || isImporting}
              />
              <div className="form-text">
                Format yang didukung: .xlsx dan .xls. Maksimal 500 soal dalam
                satu kali import.
              </div>
            </div>

            {fileName && (
              <p className="small text-muted mb-3">
                File: <span className="fw-semibold">{fileName}</span>
              </p>
            )}

            {isReadingFile && (
              <div className="alert alert-info" role="status">
                Membaca dan memvalidasi file...
              </div>
            )}

            {fileError && (
              <div className="alert alert-danger" role="alert">
                {fileError}
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success" role="status">
                {successMessage}
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="alert alert-danger" role="alert">
                <div className="fw-semibold mb-2">
                  Terdapat {validationErrors.length} kesalahan. Perbaiki file
                  sebelum mengimpor:
                </div>
                <ul className="mb-0">
                  {validationErrors.slice(0, 8).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
                {validationErrors.length > 8 && (
                  <div className="mt-2">
                    dan {validationErrors.length - 8} kesalahan lainnya.
                  </div>
                )}
              </div>
            )}

            {questions.length > 0 && questions.length <= 500 && (
              <div className="alert alert-success" role="status">
                File valid: {questions.length} soal siap diimpor.
              </div>
            )}

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={
                  isImporting ||
                  isReadingFile ||
                  questions.length === 0 ||
                  validationErrors.length > 0 ||
                  questions.length > 500
                }
              >
                {isImporting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    />
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-import me-2" />
                    Import {questions.length > 0 ? `${questions.length} Soal` : "Soal"}
                  </>
                )}
              </button>
              {(fileName || fileError || successMessage) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetFile}
                  disabled={isImporting || isReadingFile}
                >
                  Reset File
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="callout callout-warning shadow-sm rounded-3 mt-3">
          <h5 className="fw-bold">
            <i className="fas fa-exclamation-circle me-2" />
            Tipe Soal yang Didukung
          </h5>
          <p className="mb-0">
            {supportedTypes.join(", ")}. Gunakan tanda | untuk memisahkan
            pilihan dan pernyataan. Jawaban PG/PGK harus berupa label opsi
            (misalnya A atau A|C). Pada tipe Menjodohkan, setiap pasangan
            ditulis dengan format kiri=&gt;kanan.
          </p>
        </div>
      </div>
    </div>
  );
}