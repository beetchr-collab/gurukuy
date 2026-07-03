import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface BobotPenilaian {
    ownerId: string;
    tahunAjaran: string;
    kelasId: string;
    mapel: string;

    formatif: number;
    sumatif: number;
    sas: number;

    createdAt?: any;
    updatedAt?: any;
}

/**
 * Membuat ID dokumen unik
 */
function getDocumentId(
    ownerId: string,
    tahunAjaran: string,
    kelasId: string,
    mapel: string
) {
    return `${ownerId}_${tahunAjaran}_${kelasId}_${mapel}`
        .replace(/\//g, "-")
        .replace(/\s+/g, "_");
}

/**
 * Simpan bobot (buat jika belum ada)
 */
export async function saveBobotPenilaian(
    data: BobotPenilaian
) {
    const docId = getDocumentId(
        data.ownerId,
        data.tahunAjaran,
        data.kelasId,
        data.mapel
    );

    await setDoc(
        doc(db, "bobot_penilaian", docId),
        {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        {
            merge: true,
        }
    );
}

/**
 * Mengambil bobot
 */
export async function getBobotPenilaian(
    ownerId: string,
    tahunAjaran: string,
    kelasId: string,
    mapel: string
): Promise<BobotPenilaian | null> {

    const docId = getDocumentId(
        ownerId,
        tahunAjaran,
        kelasId,
        mapel
    );

    const snapshot = await getDoc(
        doc(db, "bobot_penilaian", docId)
    );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as BobotPenilaian;
}

/**
 * Update bobot
 */
export async function updateBobotPenilaian(
    ownerId: string,
    tahunAjaran: string,
    kelasId: string,
    mapel: string,
    formatif: number,
    sumatif: number,
    sas: number
) {

    const docId = getDocumentId(
        ownerId,
        tahunAjaran,
        kelasId,
        mapel
    );

    await updateDoc(
        doc(db, "bobot_penilaian", docId),
        {
            formatif,
            sumatif,
            sas,
            updatedAt: serverTimestamp(),
        }
    );
}