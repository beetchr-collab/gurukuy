import { NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
  initializeFirebaseAdmin,
} from "@/lib/firebase-admin";
import { getMatchingScoreRatio, getPgkScoreRatio } from "@/lib/cbt-scoring";

export const runtime = "nodejs";

type ExamEntry = {
  id: string;
  nama: string;
  mataPelajaran: string;
  kelas: string;
};

type AttemptEntry = {
  data: FirebaseFirestore.DocumentData;
  submission?: FirebaseFirestore.DocumentData;
};

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

  if (type === "PGK") return getPgkScoreRatio(question, answer);

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

  if (type === "Menjodohkan") return getMatchingScoreRatio(question, answer);
  return 0;
};

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

    const examSnapshot = await adminDb
      .collection("bank_soal")
      .where("ownerId", "==", teacherId)
      .get();
    const attemptsByStudent = new Map<
      string,
      {
        attempt: FirebaseFirestore.DocumentData;
        exams: ExamEntry[];
        scores: Record<string, number | null>;
      }
    >();

    const examParticipants = await Promise.all(
      examSnapshot.docs.map(async (examDocument) => {
        const exam = examDocument.data();
        const [
          sessionsSnapshot,
          submissionsSnapshot,
          questionSnapshot,
        ] = await Promise.all([
          adminDb.collection("cbt_sessions")
            .where("examId", "==", examDocument.id)
            .get(),
          adminDb.collection("cbt_submissions")
            .where("examId", "==", examDocument.id)
            .get(),
          adminDb.collection("bank_soal")
            .doc(examDocument.id)
            .collection("soal")
            .get(),
        ]);
        const participants = new Map<string, AttemptEntry>();

        sessionsSnapshot.docs.forEach((session) => {
          const data = session.data();
          const studentId = String(data.studentId || "");
          if (studentId) participants.set(studentId, { data });
        });
        submissionsSnapshot.docs.forEach((submission) => {
          const data = submission.data();
          const studentId = String(data.studentId || "");
          if (studentId) {
            const participant = participants.get(studentId);
            participants.set(studentId, {
              data: participant?.data || data,
              submission: data,
            });
          }
        });

        return {
          exam: {
            id: examDocument.id,
            nama: String(exam.namaBankSoal || "Ujian tanpa nama"),
            mataPelajaran: String(exam.mataPelajaran || ""),
            kelas: String(exam.kelas || ""),
          },
          participants,
          questions: questionSnapshot.docs.map((questionDocument) => {
            const data = questionDocument.data();
            const rawScore = Number(data.skor);
            return {
              id: questionDocument.id,
              data,
              score:
                Number.isFinite(rawScore) && rawScore >= 0 ? rawScore : 1,
            };
          }),
        };
      })
    );

    const exams = examParticipants
      .map(({ exam }) => exam)
      .sort((left, right) => left.nama.localeCompare(right.nama, "id"));

    examParticipants.forEach(({ exam, participants, questions }) => {
      participants.forEach(({ data, submission }, studentId) => {
        let student = attemptsByStudent.get(studentId);
        if (!student) {
          student = { attempt: data, exams: [], scores: {} };
          attemptsByStudent.set(studentId, student);
        }
        student.exams.push(exam);
        if (!submission) {
          student.scores[exam.id] = null;
          return;
        }

        const possibleScore = questions.reduce(
          (total, question) => total + question.score,
          0
        );
        const earnedScore = questions.reduce((total, question) => {
          const manualScore = submission.manualScores?.[question.id];
          const earned = isManualQuestion(question.data.tipeSoal)
            ? typeof manualScore === "number"
              ? Math.min(question.score, Math.max(0, manualScore))
              : 0
            : question.score *
              getScoreRatio(
                question.data,
                submission.answers?.[question.id] as AnswerValue
              );
          return total + earned;
        }, 0);
        student.scores[exam.id] = possibleScore
          ? Math.round((earnedScore / possibleScore) * 100)
          : null;
      });
    });

    const students = await Promise.all(
      Array.from(attemptsByStudent.entries()).map(async ([studentId, entry]) => {
        const studentSnapshot = await adminDb
          .collection("students")
          .doc(studentId)
          .get();
        const studentData = studentSnapshot.data() || {};
        return {
          studentId,
          nis: String(entry.attempt.nis || studentData.nis || "-"),
          nisn: String(entry.attempt.nisn || studentData.nisn || "-"),
          nama: String(
            entry.attempt.nama ||
              entry.attempt.studentName ||
              studentData.nama ||
              "Siswa"
          ),
          jk: String(
            entry.attempt.jk ||
              studentData.jk ||
              studentData.jenisKelamin ||
              "-"
          ),
          exams: entry.exams,
          scores: entry.scores,
        };
      })
    );

    students.sort((left, right) => left.nama.localeCompare(right.nama, "id"));

    return NextResponse.json({ success: true, exams, students });
  } catch (error) {
    console.error("CBT recap API error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat rekap E-Ujian." },
      { status: 500 }
    );
  }
}
