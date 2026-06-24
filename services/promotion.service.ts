import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Student,
  PromotionStudent,
} from "@/types/promotion";

import {
  buildPromotionPreview,
} from "@/lib/promotion";

export interface PromotionProcessPayload {
  students: PromotionStudent[];

  ownerId: string;

  schoolId: string;

  createdBy: string;
}

/**
 * Mengambil seluruh siswa pada tahun ajaran tertentu
 */
export async function getStudentsByAcademicYear(
  ownerId: string,
  schoolId: string,
  academicYear: string
): Promise<Student[]> {
  const q = query(
    collection(db, "students"),
    where("ownerId", "==", ownerId),
    where("schoolId", "==", schoolId),
    where("tahunAjaran", "==", academicYear)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Student, "id">),
  }));
}

/**
 * Membuat preview kenaikan tingkat
 */
export async function loadPromotionPreview(
  ownerId: string,
  schoolId: string,
  academicYear: string
): Promise<PromotionStudent[]> {
  const students = await getStudentsByAcademicYear(
    ownerId,
    schoolId,
    academicYear
  );

  return buildPromotionPreview(students);
}

/**
 * Menjalankan proses kenaikan tingkat
 */
export async function processPromotion({
  students,
  ownerId,
  schoolId,
  createdBy,
}: PromotionProcessPayload) {
  const batch = writeBatch(db);

  let promoted = 0;
  let retained = 0;
  let graduated = 0;

  for (const student of students) {
    if (!student.selected) continue;

    const ref = doc(db, "students", student.id);

    batch.update(ref, {
      kelas: student.kelasBaru,
      tahunAjaran: student.tahunAjaranBaru,
      status:
        student.status === "LULUS"
          ? "Lulus"
          : "Aktif",

      updatedAt: serverTimestamp(),
    });

    switch (student.status) {
      case "NAIK":
        promoted++;
        break;

      case "TETAP":
        retained++;
        break;

      case "LULUS":
        graduated++;
        break;
    }
  }

  const logRef = doc(collection(db, "promotion_logs"));

  batch.set(logRef, {
    ownerId,

    schoolId,

    createdBy,

    total: students.filter((s) => s.selected).length,

    promoted,

    retained,

    graduated,

    fromAcademicYear:
      students[0]?.tahunAjaranLama ?? "",

    toAcademicYear:
      students[0]?.tahunAjaranBaru ?? "",

    createdAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    success: students.filter((s) => s.selected).length,

    promoted,

    retained,

    graduated,
  };
}