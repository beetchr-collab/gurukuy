import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
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

export interface KepalaSekolah {
  id: string;
  nama: string;
  nip: string;
  schoolId: string;
  tahunAjaran: string;
  aktif: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export async function getKepalaSekolah() {
  try {
    const q = query(
      collection(db, "kepala_sekolah"),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<KepalaSekolah, "id">),
    }));
  } catch (error) {
    console.error("Gagal mengambil data kepala sekolah:", error);
    throw error;
  }
}

export async function getLatestKepalaSekolahBySchool(
  schoolId: string
) {
  const q = query(
    collection(db, "kepala_sekolah"),
    where("schoolId", "==", schoolId),
    orderBy("updatedAt", "desc"),
    // batasi untuk data yang ditampilkan dengan limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];

  return {
    id: doc.id,
    ...doc.data(),
  };
}

export async function getKepalaSekolahBySchool(
  schoolId: string
): Promise<KepalaSekolah[]> {
  const q = query(
    collection(db, "kepala_sekolah"),
    where("schoolId", "==", schoolId),
    orderBy("updatedAt", "desc"),
     // batasi untuk data yang ditampilkan dengan limit(1)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<KepalaSekolah, "id">),
  }));
}