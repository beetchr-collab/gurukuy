import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nisn =
      typeof body?.nisn === "string"
        ? body.nisn.trim()
        : "";

    const nis =
      typeof body?.nis === "string"
        ? body.nis.trim()
        : "";
    const examId =
      typeof body?.examId === "string" ? body.examId.trim() : "";

    if (!nisn || !nis) {
      return NextResponse.json(
        {
          success: false,
          error: "NISN dan NIS wajib diisi.",
        },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("students")
      .where("nisn", "==", nisn)
      .limit(10)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "NISN tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    let studentDocument = null;

    for (const doc of snapshot.docs) {
      const student = doc.data();

      if (
        String(student.nis ?? "").trim() === nis
      ) {
        studentDocument = doc;
        break;
      }
    }

    if (!studentDocument) {
      return NextResponse.json(
        {
          success: false,
          error: "NISN atau NIS tidak sesuai.",
        },
        { status: 401 }
      );
    }

    const student = studentDocument.data();

    if (examId) {
      const attemptId = Buffer.from(`${examId}:${studentDocument.id}`).toString("base64url");
      const sessionSnapshot = await adminDb.collection("cbt_sessions").doc(attemptId).get();
      if (sessionSnapshot.data()?.status === "locked") {
        return NextResponse.json(
          {
            success: false,
            error: "Anda dikunci dari ujian ini karena pelanggaran. Hubungi guru untuk membuka kunci.",
          },
          { status: 423 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      student: {
        id: studentDocument.id,
        nama: String(student.nama ?? "Siswa"),
        nisn: String(student.nisn ?? ""),
        nis: String(student.nis ?? ""),
        jk: String(student.jk ?? student.jenisKelamin ?? ""),
        kelas: String(student.kelas ?? ""),
        tingkatKelas: String(
          student.tingkatKelas ?? ""
        ),
        schoolId: String(
          student.schoolId ?? ""
        ),
      },
    });
  } catch (error) {
    console.error("CBT LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server CBT.",
        detail:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
