import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    orderBy,
    getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ClassData {
    id: string;
    namaKelas: string;
    tingkatKelas: number;
    mataPelajaran: string;
    kepalaSekolah: string;
    tahunAjaran: string;
    schoolId: string;
    ownerId: string;
    ownerName: string;
    createdAt?: any;
}

/**
 * Mengambil seluruh kelas berdasarkan ownerId
 */
export async function getClassesByOwner(
    ownerId: string
): Promise<ClassData[]> {
    try {
        const q = query(
            collection(db, "classes"),
            where("ownerId", "==", ownerId),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ClassData, "id">),
        }));
    } catch (error) {
        console.error("Error mengambil data kelas:", error);
        return [];
    }
}

/**
 * Mengambil detail kelas berdasarkan id
 */
export async function getClassById(
    classId: string
): Promise<ClassData | null> {
    try {
        const ref = doc(db, "classes", classId);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) return null;

        return {
            id: snapshot.id,
            ...(snapshot.data() as Omit<ClassData, "id">),
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Mengambil jumlah kelas berdasarkan ownerId dan tahun ajaran
export async function getJumlahKelas(
  ownerId: string,
  tahunAjaran: string
): Promise<number> {
  try {
    console.log("==================================");
    console.log("OWNER ID :", ownerId);
    console.log("TAHUN AJARAN :", tahunAjaran);

    const q = query(
      collection(db, "classes"),
      where("ownerId", "==", ownerId.trim()),
      where("tahunAjaran", "==", tahunAjaran.trim())
    );

    const snapshot = await getDocs(q);

    console.log("JUMLAH DITEMUKAN :", snapshot.size);

    snapshot.forEach((doc) => {
      console.log("DATA KELAS :", doc.id, doc.data());
    });

    console.log("==================================");

    return snapshot.size;
  } catch (error) {
    console.error("Error getJumlahKelas :", error);
    return 0;
  }
}