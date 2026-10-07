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

    if (!examId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Data ujian atau siswa tidak lengkap." },
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

    const questionSnapshot = await adminDb
      .collection("bank_soal")
      .doc(examId)
      .collection("soal")
      .get();

    return NextResponse.json({
      success: true,
      exam,
      questions: questionSnapshot.docs.map((questionDoc) => ({
        id: questionDoc.id,
        ...questionDoc.data(),
      })),
    });
  } catch (error) {
    console.error("CBT exam API error:", error);

    return NextResponse.json(
      { success: false, message: "Gagal memuat soal ujian." },
      { status: 500 }
    );
  }
}
