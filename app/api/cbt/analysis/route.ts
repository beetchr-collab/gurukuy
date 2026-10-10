import { FieldPath } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
  initializeFirebaseAdmin,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Question = {
  id: string;
  tipeSoal: string;
  pertanyaan: string;
  skor: number;
  data: FirebaseFirestore.DocumentData;
};

type AnswerValue = string | string[] | Record<string, string> | undefined;

const isManualQuestion = (type: unknown) =>
  type === "Isian Singkat" || type === "Uraian";

const getTeacherId = async (request: Request) => {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  if (!token) return null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userSnapshot = await adminDb.collection("users").doc(decodedToken.uid).get();
    return ["guru", "admin", "superadmin"].includes(userSnapshot.data()?.role)
      ? decodedToken.uid
      : null;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getCorrectness = (
  question: FirebaseFirestore.DocumentData,
  answer: AnswerValue
): boolean | null => {
  const type = question.tipeSoal;
  if (isManualQuestion(type)) return null;

  if (type === "PG") {
    return typeof question.jawabanBenar === "string" && typeof answer === "string"
      ? answer === question.jawabanBenar
      : false;
  }

  if (type === "PGK") {
    if (!Array.isArray(question.jawabanBenar) || !isRecord(answer)) return false;
    const correctLabels = new Set(
      question.jawabanBenar.filter((label): label is string => typeof label === "string")
    );
    return (question.opsi as unknown[] || []).every((_, index) => {
      const expected = correctLabels.has(String.fromCharCode(65 + index)) ? "Benar" : "Salah";
      return answer[String(index)] === expected;
    });
  }

  if (type === "Benar/Salah") {
    if (!Array.isArray(question.benarSalah) || !isRecord(answer)) return false;
    return question.benarSalah.every((item: { jawaban?: string }, index: number) =>
      answer[String(index)] === item.jawaban
    );
  }

  if (type === "Menjodohkan") {
    if (!Array.isArray(question.pasangan) || !isRecord(answer)) return false;
    return question.pasangan.every((pair: { right?: string }, index: number) =>
      answer[String(index)] === pair.right
    );
  }

  return false;
};

const toIsoString = (value: unknown) => {
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

export async function GET(request: Request) {
  try {
    initializeFirebaseAdmin();
    const teacherId = await getTeacherId(request);
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }

    const examId = new URL(request.url).searchParams.get("examId")?.trim() || "";
    if (!examId) {
      return NextResponse.json(
        { success: false, message: "Ujian wajib dipilih." },
        { status: 400 }
      );
    }

    const examSnapshot = await adminDb.collection("bank_soal").doc(examId).get();
    if (!examSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan." },
        { status: 404 }
      );
    }
    const exam = examSnapshot.data()!;
    if (exam.ownerId !== teacherId) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses ke ujian ini." },
        { status: 403 }
      );
    }

    const [questionSnapshot, submissionsSnapshot] = await Promise.all([
      adminDb.collection("bank_soal").doc(examId).collection("soal").get(),
      adminDb.collection("cbt_submissions").where("examId", "==", examId).get(),
    ]);

    const questions: Question[] = questionSnapshot.docs.map((questionDoc) => {
      const data = questionDoc.data();
      const score = Number(data.skor);
      return {
        id: questionDoc.id,
        tipeSoal: String(data.tipeSoal || "Soal"),
        pertanyaan: String(data.pertanyaan || ""),
        skor: Number.isFinite(score) && score >= 0 ? score : 1,
        data,
      };
    });

    const studentIds = [...new Set(
      submissionsSnapshot.docs
        .map((submission) => String(submission.data().studentId || ""))
        .filter(Boolean)
    )];
    const studentSnapshots = await Promise.all(
      studentIds.map((studentId) => adminDb.collection("students").doc(studentId).get())
    );
    const studentsById = new Map(
      studentSnapshots.map((snapshot, index) => [
        studentIds[index],
        snapshot.data() || {},
      ])
    );

    const questionAnalysis = questions.map((question) => {
      let correctCount = 0;
      let incorrectCount = 0;
      let partialCount = 0;
      let manualCount = 0;
      let totalEarned = 0;
      let totalPossible = 0;

      for (const submission of submissionsSnapshot.docs) {
        const submissionData = submission.data();
        let earnedScore: number;

        if (isManualQuestion(question.data.tipeSoal)) {
          const manualScore = submissionData.manualScores?.[question.id];
          if (typeof manualScore !== "number") {
            manualCount += 1;
            continue;
          }
          earnedScore = Math.min(question.skor, Math.max(0, manualScore));
        } else {
          const answer = submissionData.answers?.[question.id] as AnswerValue;
          earnedScore = getCorrectness(question.data, answer) ? question.skor : 0;
        }

        totalEarned += earnedScore;
        totalPossible += question.skor;
        if (earnedScore === question.skor) correctCount += 1;
        else if (earnedScore === 0) incorrectCount += 1;
        else partialCount += 1;
      }

      const gradedCount = correctCount + incorrectCount + partialCount;
      const correctAnswer = question.data.tipeSoal === "PG"
        ? question.data.jawabanBenar
        : question.data.tipeSoal === "PGK"
          ? question.data.jawabanBenar
          : question.data.tipeSoal === "Benar/Salah"
            ? question.data.benarSalah?.map((item: { jawaban?: string }) => item.jawaban)
            : question.data.tipeSoal === "Menjodohkan"
              ? question.data.pasangan?.map((pair: { left?: string; right?: string }) => ({
                  soal: pair.left,
                  jawaban: pair.right,
                }))
              : question.data.tipeSoal === "Uraian"
                ? question.data.jawabanEssay || null
                : question.data.jawabanIsian || null;

      return {
        id: question.id,
        tipeSoal: question.tipeSoal,
        pertanyaan: question.pertanyaan,
        skor: question.skor,
        isManual: isManualQuestion(question.data.tipeSoal),
        correctAnswer,
        correctCount,
        incorrectCount,
        partialCount,
        manualCount,
        gradedCount,
        correctPercentage: totalPossible
          ? Math.round((totalEarned / totalPossible) * 100)
          : null,
      };
    });

    const possibleScore = questions.reduce((total, question) => total + question.skor, 0);

    const students = submissionsSnapshot.docs.map((submissionSnapshot) => {
      const submission = submissionSnapshot.data();
      const studentId = String(submission.studentId || "");
      const student = studentsById.get(studentId) || {};
      let score = 0;

      const questionResults = questions.map((question) => {
        const answer = submission.answers?.[question.id] as AnswerValue;
        const storedManualScore = submission.manualScores?.[question.id];
        const manuallyGraded = isManualQuestion(question.data.tipeSoal) &&
          typeof storedManualScore === "number";
        const earnedScore = isManualQuestion(question.data.tipeSoal)
          ? manuallyGraded
            ? Math.min(question.skor, Math.max(0, storedManualScore))
            : 0
          : getCorrectness(question.data, answer)
            ? question.skor
            : 0;
        const correctness = isManualQuestion(question.data.tipeSoal) && !manuallyGraded
          ? null
          : earnedScore === question.skor;
        score += earnedScore;
        return {
          questionId: question.id,
          correctness,
          answer: answer ?? null,
          earnedScore,
          manuallyGraded,
        };
      });

      return {
        studentId,
        nama: String(submission.studentName || student.nama || "Siswa"),
        nis: String(student.nis || ""),
        nisn: String(student.nisn || ""),
        jk: String(student.jk || student.jenisKelamin || ""),
        className: String(submission.className || student.kelas || student.tingkatKelas || ""),
        score,
        possibleScore,
        percentage: possibleScore ? Math.round((score / possibleScore) * 100) : null,
        submittedAt: toIsoString(submission.submittedAt),
        questionResults,
      };
    }).sort((left, right) => left.nama.localeCompare(right.nama, "id"));

    const scoredStudents = students.filter((student) => student.percentage !== null);
    const averageScore = scoredStudents.length
      ? Math.round(
          scoredStudents.reduce((total, student) => total + (student.percentage || 0), 0) /
            scoredStudents.length
        )
      : null;

    return NextResponse.json({
      success: true,
      exam: {
        id: examSnapshot.id,
        namaBankSoal: String(exam.namaBankSoal || "Ujian tanpa nama"),
        mataPelajaran: String(exam.mataPelajaran || ""),
        kelas: String(exam.kelas || ""),
      },
      summary: {
        questionCount: questions.length,
        studentCount: students.length,
        averageScore,
        possibleScore,
        manualQuestionCount: questions.filter(
          (question) => isManualQuestion(question.data.tipeSoal)
        ).length,
      },
      students,
      questions: questionAnalysis,
    });
  } catch (error) {
    console.error("CBT analysis API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat analisis dan nilai ujian." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    initializeFirebaseAdmin();
    const teacherId = await getTeacherId(request);
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      examId?: unknown;
      studentId?: unknown;
      questionId?: unknown;
      score?: unknown;
    };
    const examId = typeof body.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const questionId = typeof body.questionId === "string" ? body.questionId.trim() : "";
    const score = body.score;
    if (
      !examId ||
      !studentId ||
      !questionId ||
      typeof score !== "number" ||
      !Number.isFinite(score)
    ) {
      return NextResponse.json(
        { success: false, message: "Data koreksi nilai tidak valid." },
        { status: 400 }
      );
    }

    const examSnapshot = await adminDb.collection("bank_soal").doc(examId).get();
    if (!examSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan." },
        { status: 404 }
      );
    }
    if (examSnapshot.data()?.ownerId !== teacherId) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses ke ujian ini." },
        { status: 403 }
      );
    }

    const questionSnapshot = await adminDb
      .collection("bank_soal")
      .doc(examId)
      .collection("soal")
      .doc(questionId)
      .get();
    if (!questionSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Soal tidak ditemukan." },
        { status: 404 }
      );
    }
    const question = questionSnapshot.data()!;
    if (!isManualQuestion(question.tipeSoal)) {
      return NextResponse.json(
        { success: false, message: "Soal ini tidak memerlukan koreksi manual." },
        { status: 400 }
      );
    }

    const rawMaxScore = Number(question.skor);
    const maxScore = Number.isFinite(rawMaxScore) && rawMaxScore >= 0 ? rawMaxScore : 1;
    if (score < 0 || score > maxScore) {
      return NextResponse.json(
        { success: false, message: `Nilai harus antara 0 dan ${maxScore}.` },
        { status: 400 }
      );
    }

    const submissionId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    const submissionRef = adminDb.collection("cbt_submissions").doc(submissionId);
    const submissionSnapshot = await submissionRef.get();
    if (
      !submissionSnapshot.exists ||
      submissionSnapshot.data()?.studentId !== studentId
    ) {
      return NextResponse.json(
        { success: false, message: "Hasil ujian siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    await submissionRef.update(new FieldPath("manualScores", questionId), score);
    return NextResponse.json({
      success: true,
      message: "Nilai koreksi berhasil disimpan.",
    });
  } catch (error) {
    console.error("CBT manual grading API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan koreksi nilai." },
      { status: 500 }
    );
  }
}
