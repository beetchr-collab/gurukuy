import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PenilaianData {
    schoolId: string;
    ownerId: string;
    ownerName: string;

    kelasId: string;
    namaKelas: string;
    tingkatKelas: number;

    mapel: string;
    topik: string;
    subtopik: string;
    jenisPenilaian: string;

    kkm: number;
    deskripsi: string;

    tanggalPenilaian: string;
    tahunAjaran: string;
}

export async function createPenilaian(
    penilaian: PenilaianData,
    students: any[],
    scores: Record<string, number | "">
) {
    try {
        const penilaianRef = await addDoc(
            collection(db, "penilaian"),
            {
                ...penilaian,
                createdAt: serverTimestamp(),
            }
        );

        for (const student of students) {
            await setDoc(
                doc(
                    db,
                    "penilaian",
                    penilaianRef.id,
                    "nilai",
                    student.studentId
                ),
                {
                    studentId: student.studentId,
                    nama: student.nama,
                    nis: student.nis,
                    nisn: student.nisn,
                    jk: student.jk,
                    schoolId: penilaian.schoolId,
                    ownerId: penilaian.ownerId,
                    nilai: Number(scores[student.studentId] ?? 0),
                    createdAt: serverTimestamp(),
                }
            );
        }

        return penilaianRef.id;
    } catch (error) {
        console.error("createPenilaian()", error);
        throw error;
    }
}