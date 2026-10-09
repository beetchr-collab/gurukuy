import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const examId = typeof body?.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";

    if (!examId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Data ujian atau siswa tidak lengkap." },
        { status: 400 }
      );
    }

    const attemptId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    const sessionRef = adminDb.collection("cbt_sessions").doc(attemptId);
    const sessionSnapshot = await sessionRef.get();

    if (!sessionSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Sesi ujian tidak ditemukan." },
        { status: 404 }
      );
    }

    if (sessionSnapshot.data()?.status !== "Selesai") {
      await sessionRef.update({ lastSeenAt: new Date() });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBT presence API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui sesi peserta." },
      { status: 500 }
    );
  }
}
