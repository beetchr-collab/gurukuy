import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type ParticipantRow = {
  studentId: string;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  status: "Sedang mengerjakan" | "Selesai" | "locked";
  violationCount: number;
  remainingSeconds: number | null;
  startedAt: number | null;
};

const getTeacherId = async (request: Request) => {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) return null;

  try {
    const decodedToken = await getAuth(adminDb.app).verifyIdToken(token);
    const userSnapshot = await adminDb.collection("users").doc(decodedToken.uid).get();
    const role = userSnapshot.data()?.role;

    return ["guru", "admin", "superadmin"].includes(role) ? decodedToken.uid : null;
  } catch {
    return null;
  }
};

const getAttemptId = (examId: string, studentId: string) =>
  Buffer.from(`${examId}:${studentId}`).toString("base64url");

const getMillis = (value: unknown): number | null => {
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const getDeadline = (
  exam: FirebaseFirestore.DocumentData,
  startedAt: number | null
) => {
  if (typeof exam.examDate === "string" && typeof exam.endTime === "string") {
    const scheduledEnd = new Date(`${exam.examDate}T${exam.endTime}`).getTime();
    if (!Number.isNaN(scheduledEnd)) return scheduledEnd;
  }

  return typeof exam.duration === "number" && startedAt !== null
    ? startedAt + exam.duration * 60_000
    : null;
};

const getExamForTeacher = async (examId: string, teacherId: string) => {
  const examSnapshot = await adminDb.collection("bank_soal").doc(examId).get();

  if (!examSnapshot.exists) {
    return {
      response: NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan." },
        { status: 404 }
      ),
    };
  }

  if (examSnapshot.data()?.ownerId !== teacherId) {
    return {
      response: NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses ke ujian ini." },
        { status: 403 }
      ),
    };
  }

  return { examSnapshot };
};

export async function GET(request: Request) {
  try {
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

    const { examSnapshot, response } = await getExamForTeacher(examId, teacherId);
    if (response) return response;

    const [sessionsSnapshot, submissionsSnapshot] = await Promise.all([
      adminDb.collection("cbt_sessions").where("examId", "==", examId).get(),
      adminDb.collection("cbt_submissions").where("examId", "==", examId).get(),
    ]);

    const participantData = new Map<string, {
      studentId: string;
      data: FirebaseFirestore.DocumentData;
      submitted: boolean;
    }>();

    sessionsSnapshot.docs.forEach((session) => {
      const data = session.data();
      const studentId = String(data.studentId || "");
      if (studentId) participantData.set(studentId, { studentId, data, submitted: false });
    });

    submissionsSnapshot.docs.forEach((submission) => {
      const data = submission.data();
      const studentId = String(data.studentId || "");
      if (!studentId) return;

      const current = participantData.get(studentId);
      participantData.set(studentId, {
        studentId,
        data: current?.data || data,
        submitted: true,
      });
    });

    const now = Date.now();
    const exam = examSnapshot!.data() || {};
    const participants: ParticipantRow[] = await Promise.all(
      Array.from(participantData.values()).map(async ({ studentId, data, submitted }) => {
        const studentSnapshot = await adminDb.collection("students").doc(studentId).get();
        const student = studentSnapshot.data() || {};
        const startedAt = getMillis(data.startedAt);
        const deadline = getDeadline(exam, startedAt);

        return {
          studentId,
          nis: String(data.nis || student.nis || "-"),
          nisn: String(data.nisn || student.nisn || "-"),
          nama: String(data.nama || data.studentName || student.nama || "Siswa"),
          jk: String(data.jk || student.jk || student.jenisKelamin || "-"),
          status: submitted
            ? "Selesai"
            : data.status === "locked"
              ? "locked"
              : "Sedang mengerjakan",
          violationCount: Number(data.violationCount || 0),
          remainingSeconds: submitted || data.status === "locked" || deadline === null
            ? null
            : Math.max(0, Math.ceil((deadline - now) / 1000)),
          startedAt,
        };
      })
    );

    participants.sort((left, right) =>
      left.nama.localeCompare(right.nama, "id")
    );

    return NextResponse.json({ success: true, participants });
  } catch (error) {
    console.error("CBT participants API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar peserta ujian." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const teacherId = await getTeacherId(request);
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const examId = typeof body?.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    if (!examId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Ujian dan siswa wajib dipilih." },
        { status: 400 }
      );
    }

    const { response } = await getExamForTeacher(examId, teacherId);
    if (response) return response;

    const sessionRef = adminDb
      .collection("cbt_sessions")
      .doc(getAttemptId(examId, studentId));
    const sessionSnapshot = await sessionRef.get();
    if (
      !sessionSnapshot.exists ||
      sessionSnapshot.data()?.studentId !== studentId ||
      sessionSnapshot.data()?.status !== "locked"
    ) {
      return NextResponse.json(
        { success: false, message: "Sesi siswa tidak sedang terkunci." },
        { status: 409 }
      );
    }

    await sessionRef.update({
      status: "Sedang mengerjakan",
      currentViolationCount: 0,
      unlockedAt: new Date(),
      unlockedBy: teacherId,
      lastSeenAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Kunci siswa berhasil dibuka untuk ujian ini.",
    });
  } catch (error) {
    console.error("CBT participant unlock API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuka kunci siswa." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const teacherId = await getTeacherId(request);
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "Sesi pengguna tidak valid." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const examId = typeof body?.examId === "string" ? body.examId.trim() : "";
    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    if (!examId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Ujian dan siswa wajib dipilih." },
        { status: 400 }
      );
    }

    const { response } = await getExamForTeacher(examId, teacherId);
    if (response) return response;

    const attemptId = getAttemptId(examId, studentId);
    const batch = adminDb.batch();
    batch.delete(adminDb.collection("cbt_sessions").doc(attemptId));
    batch.delete(adminDb.collection("cbt_submissions").doc(attemptId));
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Percobaan siswa berhasil direset.",
    });
  } catch (error) {
    console.error("CBT participant reset API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mereset percobaan siswa." },
      { status: 500 }
    );
  }
}
