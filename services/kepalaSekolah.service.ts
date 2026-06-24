import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface AcademicYearOption {
  id: string;
  tahunAjaran: string;
}

export async function getActiveAcademicYears(
  schoolId: string
): Promise<AcademicYearOption[]> {
  const q = query(
    collection(db, "kepala_sekolah"),
    where("schoolId", "==", schoolId),
    where("aktif", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    tahunAjaran: doc.data().tahunAjaran,
  }));
}