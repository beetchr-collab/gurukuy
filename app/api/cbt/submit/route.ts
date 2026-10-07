import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type SubmittedAnswer = string | string[] | Record<string, string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

const isSubmittedAnswer = (value: unknown): value is SubmittedAnswer =>
  typeof value === "string" ||
  (Array.isArray(value) && value.every((entry) => typeof entry === "string")) ||
  isStringRecord(value);

const isSubmittedAnswers = (value: unknown): value is Record<string, SubmittedAnswer> =>
  isRecord(value) && Object.values(value).every(isSubmittedAnswer);

const isCompleteAnswer = (
  question: Record<string, unknown>,
  answer: SubmittedAnswer | undefined
) => {
  const questionType = question.tipeSoal;

  if (questionType === "PG") {
    if (typeof answer !== "string" || !Array.isArray(question.opsi)) return false;
    const optionIndex = answer.charCodeAt(0) - 65;
    return answer.length === 1 && optionIndex >= 0 && optionIndex < question.opsi.length;
  }

  if (questionType === "PGK" || questionType === "Benar/Salah") {
    const statements = questionType === "PGK" ? question.opsi : question.benarSalah;
    if (!Array.isArray(statements) || !isStringRecord(answer)) return false;
    return Object.keys(answer).length === statements.length &&
      statements.every((_, index) => {
        const value = answer[String(index)];
        return value === "Benar" || value === "Salah";
      });
  }

  if (questionType === "Menjodohkan") {
    if (!Array.isArray(question.pasangan) || !isStringRecord(answer)) return false;
    const possiblePairs = question.pasangan.flatMap((pair) => {
      if (typeof pair !== "object" || pair === null || !("right" in pair)) return [];
      return typeof pair.right === "string" ? [pair.right] : [];
    });
    return Object.keys(answer).length === question.pasangan.length &&
      question.pasangan.every((_, index) => possiblePairs.includes(answer[String(index)]));
  }

  return (questionType === "Isian Singkat" || questionType === "Uraian") &&
    typeof answer === "string" &&
    answer.trim().length > 0;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      examId?: unknown;
      studentId?: unknown;
      answers?: unknown;
      doubtfulQuestionIds?: unknown;
    };
    const examId = typeof body.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";

    if (
      !examId ||
      !studentId ||
      !isSubmittedAnswers(body.answers) ||
      !Array.isArray(body.doubtfulQuestionIds) ||
      !body.doubtfulQuestionIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json(
        { success: false, message: "Data jawaban ujian tidak valid." },
        { status: 400 }
      );
    }

    if (body.doubtfulQuestionIds.length > 0) {
      return NextResponse.json(
        { success: false, message: "Hapus semua tanda ragu-ragu sebelum menyelesaikan ujian." },
        { status: 400 }
      );
    }

    const [examSnapshot, studentSnapshot, questionSnapshot] = await Promise.all([
      adminDb.collection("bank_soal").doc(examId).get(),
      adminDb.collection("students").doc(studentId).get(),
      adminDb.collection("bank_soal").doc(examId).collection("soal").get(),
    ]);

    if (!examSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Ujian ini sudah tidak tersedia." },
        { status: 404 }
      );
    }

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Sesi siswa tidak valid. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const exam = examSnapshot.data()!;
    const student = studentSnapshot.data()!;
    const studentClass = String(student.kelas || student.tingkatKelas || "")
      .trim()
      .toLocaleLowerCase();
    const examClass = String(exam.kelas || "").trim().toLocaleLowerCase();

    if (
      exam.status !== "Aktif" ||
      exam.examStatus !== "mulai" ||
      exam.allowAccess !== true ||
      !studentClass ||
      examClass !== studentClass
    ) {
      return NextResponse.json(
        { success: false, message: "Ujian ini tidak sedang dibuka untuk kelas Anda." },
        { status: 403 }
      );
    }

    const questions = questionSnapshot.docs.map((questionDoc) => ({
      id: questionDoc.id,
      data: questionDoc.data() as Record<string, unknown>,
    }));
    const submittedAnswers = body.answers;

    if (
      questions.length === 0 ||
      Object.keys(submittedAnswers).length !== questions.length ||
      questions.some((question) =>
        !isSubmittedAnswer(submittedAnswers[question.id]) ||
        !isCompleteAnswer(question.data, submittedAnswers[question.id])
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Pastikan semua soal sudah dijawab dengan format yang benar." },
        { status: 400 }
      );
    }

    const submissionId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    await adminDb.collection("cbt_submissions").doc(submissionId).set({
      examId,
      studentId,
      studentName: student.nama || "",
      className: student.kelas || student.tingkatKelas || "",
      examName: exam.namaBankSoal || "",
      mataPelajaran: exam.mataPelajaran || "",
      answers: submittedAnswers,
      doubtfulQuestionIds: [],
      totalQuestions: questions.length,
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Jawaban ujian berhasil disimpan." });
  } catch (error) {
    console.error("CBT submission API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan jawaban ujian." },
      { status: 500 }
    );
  }
}
