import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const violationKinds = new Set(["tab-hidden", "fullscreen-exit", "leave-attempt"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      examId?: unknown;
      studentId?: unknown;
      kind?: unknown;
    };
    const examId = typeof body.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const kind = typeof body.kind === "string" ? body.kind : "";

    if (!examId || !studentId || !violationKinds.has(kind)) {
      return NextResponse.json(
        { success: false, message: "Data pelanggaran ujian tidak valid." },
        { status: 400 }
      );
    }

    const attemptId = Buffer.from(`${examId}:${studentId}`).toString("base64url");
    const sessionRef = adminDb.collection("cbt_sessions").doc(attemptId);
    const result = await adminDb.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists) {
        return { error: "Sesi ujian tidak ditemukan.", status: 404 };
      }

      const session = sessionSnapshot.data()!;
      if (session.studentId !== studentId || session.examId !== examId) {
        return { error: "Sesi ujian tidak valid.", status: 403 };
      }
      if (session.status === "Selesai") {
        return { error: "Ujian sudah diselesaikan.", status: 409 };
      }
      if (session.status === "locked") {
        return {
          violations: Number(session.violationCount || 0),
          locked: true,
        };
      }
      if (session.status !== "Sedang mengerjakan") {
        return { error: "Sesi ujian tidak aktif.", status: 409 };
      }

      const violationCount = Number(session.violationCount || 0) + 1;
      const currentViolationCount = Number(
        session.currentViolationCount ?? session.violationCount ?? 0
      ) + 1;
      const locked = currentViolationCount >= 2;
      transaction.update(sessionRef, {
        violationCount,
        currentViolationCount,
        status: locked ? "locked" : "Sedang mengerjakan",
        lastViolation: kind,
        lastViolationAt: new Date(),
        lastSeenAt: new Date(),
      });

      return { violations: violationCount, locked };
    });

    if ("error" in result) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      violations: result.violations,
      locked: result.locked,
      message: result.locked
        ? "Ujian dikunci karena pelanggaran kedua."
        : "Peringatan: ini pelanggaran pertama. Pelanggaran berikutnya akan mengunci ujian.",
    });
  } catch (error) {
    console.error("CBT violation API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mencatat pelanggaran ujian." },
      { status: 500 }
    );
  }
}
