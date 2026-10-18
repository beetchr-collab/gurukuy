import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
  initializeFirebaseAdmin,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    initializeFirebaseAdmin();
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, message: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }
    const userSnapshot = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!["guru", "admin", "superadmin"].includes(userSnapshot.data()?.role)) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses." },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      examId?: unknown;
      showResults?: unknown;
    };
    const examId = typeof body.examId === "string" ? body.examId.trim() : "";
    if (!examId || typeof body.showResults !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Data pengaturan tampilan nilai tidak valid." },
        { status: 400 }
      );
    }

    const examRef = adminDb.collection("bank_soal").doc(examId);
    const examSnapshot = await examRef.get();
    if (!examSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan." },
        { status: 404 }
      );
    }
    if (examSnapshot.data()?.ownerId !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses ke ujian ini." },
        { status: 403 }
      );
    }

    await examRef.update({ showResults: body.showResults });
    return NextResponse.json({
      success: true,
      message: body.showResults
        ? "Nilai sekarang dapat dilihat siswa."
        : "Nilai disembunyikan dari siswa.",
    });
  } catch (error) {
    console.error("CBT results visibility API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengubah tampilan nilai." },
      { status: 500 }
    );
  }
}
