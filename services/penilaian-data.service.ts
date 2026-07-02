import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface PenilaianData {
    id: string;

    ownerId: string;
    ownerName: string;
    schoolId: string;

    mapel: string;
    namaKelas: string;
    tingkatKelas: number;

    topik: string;
    subtopik: string;

    tanggalPenilaian: string;

    tahunAjaran?: string;
}

const COLLECTION_NAME = "penilaian";

/**
 * Mengambil seluruh penilaian milik guru
 */
export async function getPenilaianDataByOwner(
    ownerId: string
): Promise<PenilaianData[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("ownerId", "==", ownerId),
            orderBy("tanggalPenilaian", "desc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<PenilaianData, "id">),
        }));
    } catch (error) {
        console.error("Gagal mengambil data penilaian:", error);
        throw error;
    }
}

/**
 * Mengambil detail penilaian
 */
export async function getPenilaianById(
    penilaianId: string
): Promise<PenilaianData | null> {
    try {
        const ref = doc(db, COLLECTION_NAME, penilaianId);

        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...(snapshot.data() as Omit<PenilaianData, "id">),
        };
    } catch (error) {
        console.error("Gagal mengambil detail penilaian:", error);
        throw error;
    }
}

/**
 * Menghapus penilaian
 */
export async function deletePenilaian(
    penilaianId: string
) {
    try {
        await deleteDoc(
            doc(db, COLLECTION_NAME, penilaianId)
        );
    } catch (error) {
        console.error("Gagal menghapus penilaian:", error);
        throw error;
    }
}