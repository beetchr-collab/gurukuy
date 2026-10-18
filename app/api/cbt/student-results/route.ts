import { NextResponse } from "next/server";
import { adminDb, initializeFirebaseAdmin } from "@/lib/firebase-admin";
import { getMatchingScoreRatio, getPgkScoreRatio } from "@/lib/cbt-scoring";

export const runtime = "nodejs";

type AnswerValue = string | string[] | Record<string, string> | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isManualQuestion = (type: unknown) =>
  type === "Isian Singkat" || type === "Uraian";

const getScoreRatio = (
  question: FirebaseFirestore.DocumentData,
  answer: AnswerValue
): number => {
  const type = question.tipeSoal;
  if (isManualQuestion(type)) return 0;

  if (type === "PG") {
    const correctAnswers = Array.isArray(question.jawabanBenar)
      ? question.jawabanBenar
      : typeof question.jawabanBenar === "string"
        ? [question.jawabanBenar]
        : [];
    const selectedAnswers = Array.isArray(answer)
      ? answer
      : typeof answer === "string"
        ? [answer]
        : [];
    return selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((label) => correctAnswers.includes(label))
      ? 1
      : 0;
  }

  if (type === "PGK") {
    return getPgkScoreRatio(question, answer);
  }

  if (
    type === "Benar/Salah" ||
    type === "Sesuai/Tidak Sesuai" ||
    type === "Mendukung/Tidak mendukung" ||
    type === "Fakta/Pendapat"
  ) {
    if (!Array.isArray(question.benarSalah) || !isRecord(answer)) return 0;
    const statements = question.benarSalah as { jawaban?: string }[];
    if (statements.length === 0) return 0;
    const correctStatements = statements.filter((item, index) =>
      answer[String(index)] === item.jawaban
    ).length;
    return correctStatements / statements.length;
  }

  if (type === "Menjodohkan") {
    return getMatchingScoreRatio(question, answer);
  }

  return 0;
};

const getIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return (value.toDate() as Date).toISOString();
  }
  return typeof value === "string" ? value : null;
};

export async function POST(request: Request) {
  try {
    initializeFirebaseAdmin();
    const body = await request.json() as {
      studentId?: unknown;
      nisn?: unknown;
      nis?: unknown;
    };
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const nisn = typeof body.nisn === "string" ? body.nisn.trim() : "";
    const nis = typeof body.nis === "string" ? body.nis.trim() : "";
    if (!studentId || !nisn || !nis) {
      return NextResponse.json(
        { success: false, message: "Sesi siswa tidak valid." },
        { status: 400 }
      );
    }

    const studentSnapshot = await adminDb.collection("students").doc(studentId).get();
    const student = studentSnapshot.data();
    if (
      !studentSnapshot.exists ||
      String(student?.nisn || "").trim() !== nisn ||
      String(student?.nis || "").trim() !== nis
    ) {
      return NextResponse.json(
        { success: false, message: "Sesi siswa tidak valid. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const submissionsSnapshot = await adminDb
      .collection("cbt_submissions")
      .where("studentId", "==", studentId)
      .get();
    const publishedResults = await Promise.all(
      submissionsSnapshot.docs.map(async (submissionSnapshot) => {
        const submission = submissionSnapshot.data();
        const examId = String(submission.examId || "");
        if (!examId || submission.studentId !== studentId) return null;

        const examRef = adminDb.collection("bank_soal").doc(examId);
        const [examSnapshot, questionSnapshot] = await Promise.all([
          examRef.get(),
          examRef.collection("soal").get(),
        ]);
        if (!examSnapshot.exists || examSnapshot.data()?.showResults !== true) return null;

        let score = 0;
        let possibleScore = 0;
        let pendingManualGrades = 0;
        questionSnapshot.docs.forEach((questionSnapshot) => {
          const question = questionSnapshot.data();
          const rawScore = Number(question.skor);
          const maxScore = Number.isFinite(rawScore) && rawScore >= 0 ? rawScore : 1;
          possibleScore += maxScore;

          if (isManualQuestion(question.tipeSoal)) {
            const manualScore = submission.manualScores?.[questionSnapshot.id];
            if (typeof manualScore === "number") {
              score += Math.min(maxScore, Math.max(0, manualScore));
            } else {
              pendingManualGrades += 1;
            }
            return;
          }

          const answer = submission.answers?.[questionSnapshot.id] as AnswerValue;
          score += maxScore * getScoreRatio(question, answer);
        });

        return {
          examId,
          namaUjian: String(examSnapshot.data()?.namaBankSoal || submission.examName || "Ujian"),
          mataPelajaran: String(examSnapshot.data()?.mataPelajaran || submission.mataPelajaran || ""),
          score,
          possibleScore,
          percentage: possibleScore ? Math.round((score / possibleScore) * 100) : null,
          pendingManualGrades,
          submittedAt: getIsoString(submission.submittedAt),
        };
      })
    );

    const results = publishedResults
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((left, right) =>
        (right.submittedAt || "").localeCompare(left.submittedAt || "")
      );

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("CBT student results API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat nilai siswa." },
      { status: 500 }
    );
  }
}
