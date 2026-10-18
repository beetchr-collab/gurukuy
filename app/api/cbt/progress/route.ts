import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type ProgressAnswer = string | string[] | Record<string, string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProgressAnswer = (value: unknown): value is ProgressAnswer =>
  typeof value === "string" ||
  (Array.isArray(value) && value.every((item) => typeof item === "string")) ||
  (isRecord(value) && Object.values(value).every((item) => typeof item === "string"));

const isValidAnswerForQuestion = (
  question: FirebaseFirestore.DocumentData,
  answer: ProgressAnswer
) => {
  const options = Array.isArray(question.opsi) ? question.opsi : [];
  const isOptionLabel = (label: string) => {
    const index = label.charCodeAt(0) - 65;
    return label.length === 1 && index >= 0 && index < options.length;
  };

  if (question.tipeSoal === "PG") {
    return typeof answer === "string" && isOptionLabel(answer);
  }
  if (question.tipeSoal === "PGK") {
    return Array.isArray(answer) &&
      new Set(answer).size === answer.length &&
      answer.every(isOptionLabel);
  }
  if (
    question.tipeSoal === "Benar/Salah" ||
    question.tipeSoal === "Sesuai/Tidak Sesuai" ||
    question.tipeSoal === "Mendukung/Tidak mendukung" ||
    question.tipeSoal === "Fakta/Pendapat"
  ) {
    const statements = Array.isArray(question.benarSalah) ? question.benarSalah : [];
    const allowedAnswers =
      question.tipeSoal === "Benar/Salah"
        ? ["Benar", "Salah"]
        : question.tipeSoal === "Sesuai/Tidak Sesuai"
          ? ["Sesuai", "Tidak Sesuai"]
          : question.tipeSoal === "Mendukung/Tidak mendukung"
            ? ["Mendukung", "Tidak mendukung"]
            : ["Fakta", "Pendapat"];
    return !Array.isArray(answer) &&
      typeof answer !== "string" &&
      Object.entries(answer).every(([index, value]) =>
        /^\d+$/.test(index) &&
        Number(index) < statements.length &&
        allowedAnswers.includes(value)
      );
  }
  if (question.tipeSoal === "Menjodohkan") {
    const pairs = Array.isArray(question.pasangan) ? question.pasangan : [];
    const possibleMatches = pairs.flatMap((pair: unknown) =>
      isRecord(pair) && typeof pair.right === "string" ? [pair.right] : []
    );
    return !Array.isArray(answer) &&
      typeof answer !== "string" &&
      Object.entries(answer).every(([index, value]) =>
        /^\d+$/.test(index) &&
        Number(index) < pairs.length &&
        possibleMatches.includes(value)
      );
  }
  return (
    question.tipeSoal === "Isian Singkat" ||
    question.tipeSoal === "Uraian"
  ) && typeof answer === "string";
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      examId?: unknown;
      studentId?: unknown;
      answers?: unknown;
      currentQuestionId?: unknown;
      progressUpdatedAt?: unknown;
    };
    const examId = typeof body.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const answers = body.answers;
    const currentQuestionId =
      typeof body.currentQuestionId === "string" ? body.currentQuestionId : "";
    const progressUpdatedAt =
      typeof body.progressUpdatedAt === "number" && Number.isFinite(body.progressUpdatedAt)
        ? body.progressUpdatedAt
        : 0;

    if (!examId || !studentId || !isRecord(answers) || progressUpdatedAt <= 0) {
      return NextResponse.json(
        { success: false, message: "Data progres ujian tidak valid." },
        { status: 400 }
      );
    }

    const attemptId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    const sessionRef = adminDb.collection("cbt_sessions").doc(attemptId);
    const questionsSnapshot = await adminDb
      .collection("bank_soal")
      .doc(examId)
      .collection("soal")
      .get();
    const questions = new Map(
      questionsSnapshot.docs.map((question) => [question.id, question.data()])
    );

    if (
      Object.entries(answers).some(([questionId, answer]) => {
        const question = questions.get(questionId);
        return !question ||
          !isProgressAnswer(answer) ||
          !isValidAnswerForQuestion(question, answer);
      }) ||
      (currentQuestionId && !questions.has(currentQuestionId))
    ) {
      return NextResponse.json(
        { success: false, message: "Jawaban progres ujian tidak valid." },
        { status: 400 }
      );
    }

    const result = await adminDb.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists) return { error: "Sesi ujian tidak ditemukan.", status: 404 };
      const session = sessionSnapshot.data()!;
      if (session.examId !== examId || session.studentId !== studentId) {
        return { error: "Sesi ujian tidak valid.", status: 403 };
      }
      if (session.status === "Selesai") {
        return { error: "Ujian sudah diselesaikan.", status: 409 };
      }
      if (Number(session.progressClientUpdatedAt || 0) > progressUpdatedAt) {
        return { success: true };
      }

      transaction.update(sessionRef, {
        answers,
        currentQuestionId: currentQuestionId || null,
        progressClientUpdatedAt: progressUpdatedAt,
        progressSavedAt: new Date(),
        lastSeenAt: new Date(),
      });
      return { success: true };
    });

    if ("error" in result) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBT progress API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan progres ujian." },
      { status: 500 }
    );
  }
}
