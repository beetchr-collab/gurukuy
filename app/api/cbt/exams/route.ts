import { NextResponse } from "next/server";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseAdminApp = getApps().length
  ? getApps()[0]
  : initializeApp();

function getFirebaseAdminApp() {
  return firebaseAdminApp;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      kelas,
    } = body;

    if (!kelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Data siswa tidak lengkap.",
        },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();
    const firestore = getFirestore(app);

    const snapshot = await firestore
      .collection("bank_soal")
      .where("status", "==", "Aktif")
      .where("examStatus", "==", "mulai")
      .get();

    const studentClass = String(kelas)
      .trim()
      .toLocaleLowerCase();

    const exams = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((exam) => {
        const data = exam as {
          schoolId?: string;
          kelas?: string;
          allowAccess?: boolean;
        };

        return (
          data.allowAccess === true &&
          String(data.kelas || "")
            .trim()
            .toLocaleLowerCase() === studentClass
        );
      });

    return NextResponse.json({
      success: true,
      exams,
    });
  } catch (error) {
    console.error("CBT exams API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil ujian CBT.",
      },
      { status: 500 }
    );
  }
} 