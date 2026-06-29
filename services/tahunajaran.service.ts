import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface TahunAjaran {
  id: string;
  nama: string;
  nip: string;
  schoolId: string;
  tahunAjaran: string;
  aktif: boolean;
}

export async function getActiveTahunAjaran(
  schoolId: string
): Promise<TahunAjaran | null> {
  const q = query(
    collection(db, "kepala_sekolah"),
    where("schoolId", "==", schoolId),
    where("aktif", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  return {
    id: doc.id,
    ...(doc.data() as Omit<TahunAjaran, "id">),
  };
}