import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const examId =
      typeof body?.examId === "string" ? body.examId.trim() : "";
    const studentId =
      typeof body?.studentId === "string" ? body.studentId.trim() : "";
    const token =
      typeof body?.token === "string" ? body.token.trim() : "";
    const startOnly = body?.startOnly === true;

    if (!examId || !studentId || !token) {
      return NextResponse.json(
        { success: false, message: "Data ujian, siswa, atau token tidak lengkap." },
        { status: 400 }
      );
    }

    const [examSnapshot, studentSnapshot] = await Promise.all([
      adminDb.collection("bank_soal").doc(examId).get(),
      adminDb.collection("students").doc(studentId).get(),
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

    const attemptId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    const sessionRef = adminDb.collection("cbt_sessions").doc(attemptId);
    const submissionRef = adminDb.collection("cbt_submissions").doc(attemptId);
    const [sessionSnapshot, submissionSnapshot] = await Promise.all([
      sessionRef.get(),
      submissionRef.get(),
    ]);

    if (
      sessionSnapshot.data()?.status === "Selesai" ||
      submissionSnapshot.exists
    ) {
      return NextResponse.json(
        { success: false, message: "Anda sudah menyelesaikan ujian ini. Minta guru mereset percobaan jika perlu mengulang." },
        { status: 409 }
      );
    }

    if (
      String(exam.token || "").trim().toLocaleUpperCase() !==
      token.toLocaleUpperCase()
    ) {
      return NextResponse.json(
        { success: false, message: "Token ujian tidak sesuai. Periksa kembali token dari guru." },
        { status: 403 }
      );
    }

    const existingSession = sessionSnapshot.data() || {};
    const wasLocked = existingSession.status === "locked";
    if (wasLocked && !startOnly) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "Sesi ujian terkunci. Masukkan kembali token ujian untuk melanjutkan sesi.",
        },
        { status: 423 }
      );
    }
    const sessionData: Record<string, unknown> = {
      examId,
      studentId,
      nis: String(student.nis || ""),
      nisn: String(student.nisn || ""),
      nama: String(student.nama || "Siswa"),
      jk: String(student.jk || student.jenisKelamin || ""),
      lastSeenAt: new Date(),
      status: "Sedang mengerjakan",
      violationCount: Number(existingSession.violationCount || 0),
      currentViolationCount: wasLocked
        ? 0
        : Number(existingSession.currentViolationCount ?? existingSession.violationCount ?? 0),
      resumedAfterLock: wasLocked,
    };

    if (!sessionSnapshot.exists) {
      sessionData.startedAt = new Date();
    }

    await sessionRef.set(sessionData, { merge: true });

    if (startOnly) {
      return NextResponse.json({
        success: true,
        violationCount: Number(existingSession.violationCount || 0),
      });
    }

    const questionSnapshot = await adminDb
      .collection("bank_soal")
      .doc(examId)
      .collection("soal")
      .get();
    const questionsById = new Map(
      questionSnapshot.docs.map((questionDoc) => [
        questionDoc.id,
        { id: questionDoc.id, ...questionDoc.data() },
      ])
    );
    const savedQuestionOrder = Array.isArray(existingSession.questionOrder)
      ? existingSession.questionOrder.filter(
          (questionId: unknown): questionId is string =>
            typeof questionId === "string" && questionsById.has(questionId)
        )
      : [];
    const questionOrder = [
      ...savedQuestionOrder,
      ...questionSnapshot.docs
        .map((questionDoc) => questionDoc.id)
        .filter((questionId) => !savedQuestionOrder.includes(questionId)),
    ];
    if (savedQuestionOrder.length === 0) {
      for (let index = questionOrder.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [questionOrder[index], questionOrder[randomIndex]] = [
          questionOrder[randomIndex],
          questionOrder[index],
        ];
      }
    }
    await sessionRef.set({ questionOrder }, { merge: true });

    const startedAtValue = existingSession.startedAt || sessionData.startedAt;
    const startedAt = startedAtValue instanceof Date
      ? startedAtValue.getTime()
      : typeof startedAtValue?.toMillis === "function"
        ? startedAtValue.toMillis()
        : null;
    const publicExam = {
      namaBankSoal: exam.namaBankSoal,
      mataPelajaran: exam.mataPelajaran,
      kelas: exam.kelas,
      status: exam.status,
      examStatus: exam.examStatus,
      allowAccess: exam.allowAccess,
      examDate: exam.examDate,
      endTime: exam.endTime,
      duration: exam.duration,
      startedAt,
    };

    return NextResponse.json({
      success: true,
      exam: publicExam,
      violationCount: Number(existingSession.violationCount || 0),
      resumedSession: Boolean(existingSession.startedAt),
      resumedAfterLock: existingSession.resumedAfterLock === true,
      answers: existingSession.answers || {},
      currentQuestionId: existingSession.currentQuestionId || null,
      questions: questionOrder.flatMap((questionId) => {
        const question = questionsById.get(questionId);
        return question ? [question] : [];
      }),
    });
  } catch (error) {
    console.error("CBT exam API error:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memuat soal ujian." },
      { status: 500 }
    );
  }
}
