import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    setDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    where,
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

export interface NilaiSiswa {
    id?: string;
    studentId: string;
    nama: string;
    nis?: string;
    nisn?: string;
    jk: string;
    nilai: number | "";
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
            const score = scores[student.studentId];

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
                    nilai:
                        score === "" || score == null
                            ? ""
                            : Number(score),
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

export async function getPenilaianById(
    penilaianId: string
) {
    try {
        const ref = doc(db, "penilaian", penilaianId);

        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) return null;

        return {
            id: snapshot.id,
            ...snapshot.data(),
        };
    } catch (error) {
        console.error("getPenilaianById()", error);
        throw error;
    }
}

export async function getNilaiByPenilaian(
    penilaianId: string
): Promise<NilaiSiswa[]> {
    try {
        const q = query(
            collection(
                db,
                "penilaian",
                penilaianId,
                "nilai"
            ),
            orderBy("nama")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<NilaiSiswa, "id">),
        }));
    } catch (error) {
        console.error("getNilaiByPenilaian()", error);
        throw error;
    }
}

export async function saveNilai(
    penilaianId: string,
    students: NilaiSiswa[]
) {
    try {
        for (const student of students) {
            await setDoc(
                doc(
                    db,
                    "penilaian",
                    penilaianId,
                    "nilai",
                    student.studentId
                ),
                {
                    studentId: student.studentId,
                    nama: student.nama,
                    nis: student.nis,
                    nisn: student.nisn,
                    jk: student.jk,
                    nilai:
                        student.nilai === ""
                            ? ""
                            : Number(student.nilai),

                    updatedAt: serverTimestamp(),
                },
                {
                    merge: true,
                }
            );
        }
    } catch (error) {
        console.error("saveNilai()", error);
        throw error;
    }
}

export async function getTopikByMapel(
    ownerId: string,
    mapel: string
) {
    const q = query(
        collection(db, "penilaian"),
        where("ownerId", "==", ownerId),
        where("mapel", "==", mapel)
    );

    const snapshot = await getDocs(q);

    const topikSet = new Set<string>();

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.topik) {
            topikSet.add(data.topik);
        }
    });

    return Array.from(topikSet).sort();
}

export async function getTahunAjaranPenilaian(
    ownerId: string
): Promise<string[]> {
    const q = query(
        collection(db, "penilaian"),
        where("ownerId", "==", ownerId)
    );

    const snapshot = await getDocs(q);

    const tahunSet = new Set<string>();

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.tahunAjaran) {
            tahunSet.add(data.tahunAjaran);
        }
    });

    return Array.from(tahunSet).sort().reverse();
}

export interface RekapKelas {
    kelasId: string;
    namaKelas: string;
}

export async function getKelasPenilaian(
    ownerId: string,
    tahunAjaran: string
): Promise<RekapKelas[]> {

    const q = query(
        collection(db, "penilaian"),
        where("ownerId", "==", ownerId),
        where("tahunAjaran", "==", tahunAjaran)
    );

    const snapshot = await getDocs(q);

    const kelasMap = new Map<string, RekapKelas>();

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.kelasId && data.namaKelas) {
            kelasMap.set(data.kelasId, {
                kelasId: data.kelasId,
                namaKelas: data.namaKelas,
            });
        }
    });

    return Array.from(kelasMap.values()).sort((a, b) =>
        a.namaKelas.localeCompare(b.namaKelas)
    );
}

export interface RekapMapel {
    mapel: string;
}

export async function getMapelPenilaian(
    ownerId: string,
    tahunAjaran: string,
    kelasId: string
): Promise<RekapMapel[]> {

    const q = query(
        collection(db, "penilaian"),
        where("ownerId", "==", ownerId),
        where("tahunAjaran", "==", tahunAjaran),
        where("kelasId", "==", kelasId)
    );

    const snapshot = await getDocs(q);

    const mapelSet = new Set<string>();

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.mapel) {
            mapelSet.add(data.mapel);
        }
    });

    return Array.from(mapelSet)
        .sort()
        .map((mapel) => ({ mapel }));
}

export interface RekapNilai {
    id: string;
    topik: string;
    subtopik: string;
    jenisPenilaian: string;
    nilai: NilaiSiswa[];
}

export async function getPenilaianRekap(
    ownerId: string,
    kelasId: string,
    mapel: string,
    tahunAjaran: string
): Promise<RekapNilai[]> {

    const q = query(
        collection(db, "penilaian"),
        where("ownerId", "==", ownerId),
        where("kelasId", "==", kelasId),
        where("mapel", "==", mapel),
        where("tahunAjaran", "==", tahunAjaran)
    );

    const snapshot = await getDocs(q);

    const result: RekapNilai[] = [];

    for (const docSnap of snapshot.docs) {

        const data = docSnap.data() as PenilaianData;

        const nilaiQuery = query(
            collection(
                db,
                "penilaian",
                docSnap.id,
                "nilai"
            ),
            orderBy("nama")
        );

        const nilaiSnapshot = await getDocs(nilaiQuery);

        result.push({
            id: docSnap.id,
            topik: data.topik,
            subtopik: data.subtopik,
            jenisPenilaian: data.jenisPenilaian,
            nilai: nilaiSnapshot.docs.map((n) => ({
                id: n.id,
                ...(n.data() as Omit<NilaiSiswa, "id">),
            })),
        });

    }

    function getUrutanJenis(jenis: string): number {

        const value = (jenis || "").toLowerCase().trim();

        if (value.includes("sumatif akhir semester")) {
            return 3;
        }

        if (value.includes("sumatif")) {
            return 2;
        }

        if (value.includes("formatif")) {
            return 1;
        }

        return 99;
    }

    function nomorTP(subtopik: string): number {

        const match = (subtopik || "").match(/\d+/);

        return match ? Number(match[0]) : 999;

    }

    result.sort((a, b) => {

        const jenisA = getUrutanJenis(a.jenisPenilaian);
        const jenisB = getUrutanJenis(b.jenisPenilaian);

        if (jenisA !== jenisB) {
            return jenisA - jenisB;
        }

        const topikCompare = a.topik.localeCompare(
            b.topik,
            "id",
            {
                sensitivity: "base",
            }
        );

        if (topikCompare !== 0) {
            return topikCompare;
        }

        return nomorTP(a.subtopik) - nomorTP(b.subtopik);

    });

    return result;
}