import {
    collection,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AnggotaKelas {
    id: string;
    studentId: string;
    nama: string;
    nis: string;
    nisn?: string;
    jk: string;
    kelas: number;
    tingkatKelas: number;
    kelasId: string;
    schoolId: string;
    createdAt?: any;
}

export async function getAnggotaKelas(
    kelasId: string
): Promise<AnggotaKelas[]> {
    try {
        const q = query(
            collection(db, "classes", kelasId, "anggotakelas"),
            orderBy("nama")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<AnggotaKelas, "id">),
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}