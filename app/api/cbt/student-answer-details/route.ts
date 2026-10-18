import { NextResponse } from "next/server";
import { adminDb, initializeFirebaseAdmin } from "@/lib/firebase-admin";
import { getMatchingScoreRatio, getPgkScoreRatio } from "@/lib/cbt-scoring";

export const runtime = "nodejs";

type AnswerValue = string | string[] | Record<string, string> | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isManualQuestion = (type: unknown) =>
  type === "Isian Singkat" || type === "Uraian";

const toIsoString = (value: unknown): string | null => {
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return (value.toDate() as Date).toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
};

const scoreRatio = (
  question: FirebaseFirestore.DocumentData,
  answer: AnswerValue
): number => {
  const type = question.tipeSoal;
  if (isManualQuestion(type)) return 0;

  if (type === "PG") {
    const correct = Array.isArray(question.jawabanBenar)
      ? question.jawabanBenar
      : typeof question.jawabanBenar === "string"
        ? [question.jawabanBenar]
        : [];
    const selected = Array.isArray(answer)
      ? answer
      : typeof answer === "string"
        ? [answer]
        : [];
    return selected.length === correct.length &&
      selected.every((label) => correct.includes(label))
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
    if (!Array.isArray(question.benarSalah) || !isRecord(answer) || !question.benarSalah.length) return 0;
    return question.benarSalah.filter(
      (item: { jawaban?: string }, index: number) => answer[String(index)] === item.jawaban
    ).length / question.benarSalah.length;
  }

  if (type === "Menjodohkan") {
    return getMatchingScoreRatio(question, answer);
  }

  return 0;
};

export async function POST(request: Request) {
  try {
    initializeFirebaseAdmin();
    const body = await request.json() as {
      examId?: unknown;
      studentId?: unknown;
      nisn?: unknown;
      nis?: unknown;
    };
    const examId = typeof body.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const nisn = typeof body.nisn === "string" ? body.nisn.trim() : "";
    const nis = typeof body.nis === "string" ? body.nis.trim() : "";
    if (!examId || !studentId || !nisn || !nis) {
      return NextResponse.json(
        { success: false, message: "Data siswa atau ujian tidak valid." },
        { status: 400 }
      );
    }

    const studentRef = adminDb.collection("students").doc(studentId);
    const submissionId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    const [studentSnapshot, examSnapshot, submissionSnapshot] = await Promise.all([
      studentRef.get(),
      adminDb.collection("bank_soal").doc(examId).get(),
      adminDb.collection("cbt_submissions").doc(submissionId).get(),
    ]);
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
    if (!examSnapshot.exists || examSnapshot.data()?.showResults !== true) {
      return NextResponse.json(
        { success: false, message: "Rincian jawaban belum tersedia." },
        { status: 403 }
      );
    }
    if (
      !submissionSnapshot.exists ||
      submissionSnapshot.data()?.studentId !== studentId ||
      submissionSnapshot.data()?.examId !== examId
    ) {
      return NextResponse.json(
        { success: false, message: "Hasil ujian siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const submission = submissionSnapshot.data()!;
    const schoolId = String(student?.schoolId || "");
    const schoolSnapshot = schoolId
      ? await adminDb.collection("sekolah").doc(schoolId).get()
      : null;
    const school = schoolSnapshot?.data();
    const questionSnapshot = await adminDb
      .collection("bank_soal")
      .doc(examId)
      .collection("soal")
      .get();
    const questionDocs = questionSnapshot.docs.sort((left, right) => {
      const leftCreated = left.data().createdAt;
      const rightCreated = right.data().createdAt;
      const leftTime = typeof leftCreated?.toMillis === "function" ? leftCreated.toMillis() : 0;
      const rightTime = typeof rightCreated?.toMillis === "function" ? rightCreated.toMillis() : 0;
      return leftTime - rightTime;
    });

    let score = 0;
    let possibleScore = 0;
    let pendingManualGrades = 0;
    const questions = questionDocs.map((questionDoc, index) => {
      const question = questionDoc.data();
      const rawScore = Number(question.skor);
      const maxScore = Number.isFinite(rawScore) && rawScore >= 0 ? rawScore : 1;
      const answer = submission.answers?.[questionDoc.id] as AnswerValue;
      const isManual = isManualQuestion(question.tipeSoal);
      const manualScore = submission.manualScores?.[questionDoc.id];
      const awaitingGrade = isManual && typeof manualScore !== "number";
      const earnedScore = isManual
        ? awaitingGrade
          ? 0
          : Math.min(maxScore, Math.max(0, manualScore))
        : maxScore * scoreRatio(question, answer);
      const ratio = isManual ? (awaitingGrade ? null : maxScore ? earnedScore / maxScore : 1) : scoreRatio(question, answer);

      score += earnedScore;
      possibleScore += maxScore;
      if (awaitingGrade) pendingManualGrades += 1;

      return {
        id: questionDoc.id,
        number: index + 1,
        tipeSoal: String(question.tipeSoal || "Soal"),
        pertanyaan: String(question.pertanyaan || ""),
        gambarUrl: typeof question.gambarUrl === "string" ? question.gambarUrl : "",
        opsi: Array.isArray(question.opsi) ? question.opsi : [],
        statements: Array.isArray(question.benarSalah)
          ? question.benarSalah.map((item: { statement?: string }, statementIndex: number) => ({
              prompt: String(item.statement || ""),
              choices: question.tipeSoal === "Benar/Salah"
                ? ["Benar", "Salah"]
                : question.tipeSoal === "Sesuai/Tidak Sesuai"
                  ? ["Sesuai", "Tidak Sesuai"]
                  : question.tipeSoal === "Mendukung/Tidak mendukung"
                    ? ["Mendukung", "Tidak mendukung"]
                    : ["Fakta", "Pendapat"],
              answer: isRecord(answer) && typeof answer[String(statementIndex)] === "string"
                ? answer[String(statementIndex)]
                : null,
            }))
          : [],
        matchingOptions: Array.isArray(question.pasangan)
          ? [...new Set(question.pasangan
              .map((pair: { right?: string }) => pair.right)
              .filter((right): right is string => typeof right === "string"))]
          : [],
        matchingPairs: Array.isArray(question.pasangan)
          ? question.pasangan.map((pair: { left?: string }, pairIndex: number) => ({
              prompt: String(pair.left || `Pasangan ${pairIndex + 1}`),
              answer: isRecord(answer) && typeof answer[String(pairIndex)] === "string"
                ? answer[String(pairIndex)]
                : null,
            }))
          : [],
        answer: answer ?? null,
        earnedScore: awaitingGrade ? null : earnedScore,
        possibleScore: maxScore,
        correctness: ratio === null ? null : ratio >= 1 - Number.EPSILON,
        isPartial: ratio !== null && ratio > 0 && ratio < 1 - Number.EPSILON,
        awaitingGrade,
      };
    });

    return NextResponse.json({
      success: true,
      exam: {
        id: examId,
        namaUjian: String(examSnapshot.data()?.namaBankSoal || submission.examName || "Ujian"),
        mataPelajaran: String(examSnapshot.data()?.mataPelajaran || submission.mataPelajaran || ""),
        submittedAt: toIsoString(submission.submittedAt),
      },
      student: {
        nama: String(student?.nama || submission.studentName || "Siswa"),
        nis: String(student?.nis || ""),
        nisn: String(student?.nisn || ""),
        kelas: String(student?.kelas || student?.tingkatKelas || submission.className || "-"),
        sekolah: String(school?.namaSekolah || student?.namaSekolah || "-"),
      },
      summary: {
        score,
        possibleScore,
        percentage: possibleScore ? Math.round((score / possibleScore) * 100) : null,
        pendingManualGrades,
      },
      questions,
    });
  } catch (error) {
    console.error("CBT student answer details API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat rincian jawaban siswa." },
      { status: 500 }
    );
  }
}
