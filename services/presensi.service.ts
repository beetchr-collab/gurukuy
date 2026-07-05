import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
    orderBy,
} from "firebase/firestore";
import {
    Attendance,
    AttendanceRecap,
    AttendanceStudent,
} from "@/types/presensi";

export interface AttendanceClass {
    id: string;
    nama: string;
}

import { db } from "@/lib/firebase";

/**
 * Simpan Presensi
 */
export async function saveAttendance(
    data: Attendance
) {
    await addDoc(collection(db, "presensi"), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

/**
 * Mengambil semua presensi berdasarkan kelas
 */
export async function getAttendanceByClass(
    schoolId: string,
    kelasId: string
): Promise<Attendance[]> {

    const q = query(
        collection(db, "presensi"),
        where("schoolId", "==", schoolId),
        where("kelasId", "==", kelasId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Attendance),
    }));
}

/**
 * Rekap Presensi
 */
export async function getAttendanceRecap(
    schoolId: string,
    kelasId: string,
    tanggalAwal?: string,
    tanggalAkhir?: string
): Promise<AttendanceRecap[]> {

    const docs = await getAttendanceByClass(
        schoolId,
        kelasId
    );

    // Filter tanggal
    const filtered = docs.filter((item) => {

        if (tanggalAwal && item.tanggal < tanggalAwal) {
            return false;
        }

        if (tanggalAkhir && item.tanggal > tanggalAkhir) {
            return false;
        }

        return true;

    });

    const rekap: Record<
        string,
        AttendanceRecap
    > = {};

    filtered.forEach((presensi) => {

        presensi.siswa.forEach((siswa) => {

            if (!rekap[siswa.studentId]) {

                rekap[siswa.studentId] = {

                    studentId: siswa.studentId,

                    nis: siswa.nis,

                    nisn: siswa.nisn,

                    nama: siswa.nama,

                    jk: siswa.jk,

                    hadir: 0,

                    izin: 0,

                    sakit: 0,

                    alpha: 0,

                    total: 0,

                    persentase: 0,

                };

            }

            switch (siswa.status) {

                case "Hadir":
                    rekap[siswa.studentId].hadir++;
                    break;

                case "Izin":
                    rekap[siswa.studentId].izin++;
                    break;

                case "Sakit":
                    rekap[siswa.studentId].sakit++;
                    break;

                case "Alpha":
                    rekap[siswa.studentId].alpha++;
                    break;
            }

            rekap[siswa.studentId].total++;
        });
    });

    return Object.values(rekap).map((item) => ({
        ...item,
        persentase:
            item.total === 0
                ? 0
                : Math.round(
                    (item.hadir / item.total) * 100
                ),
    }));
}

export interface AttendanceListItem {
    attendanceId: string;

    tanggal: string;

    tahunAjaran: string;

    kelasId: string;

    kelas: string;


    studentId: string;

    nis: string;

    nisn: string;

    nama: string;

    jk: string;

    status: string;
}

/* ===========================
   Daftar Presensi
=========================== */

export async function getAttendanceList(
    schoolId: string,
    tahunAjaran?: string,
    kelasId?: string,
    tanggalAwal?: string,
    tanggalAkhir?: string
): Promise<AttendanceListItem[]> {

    const constraints = [
        where("schoolId", "==", schoolId),
    ];

    if (tahunAjaran) {
        constraints.push(
            where("tahunAjaran", "==", tahunAjaran)
        );
    }

    if (kelasId) {
        constraints.push(
            where("kelasId", "==", kelasId)
        );
    }

    const q = query(
        collection(db, "presensi"),
        ...constraints
    );

    const snapshot = await getDocs(q);

    const result: AttendanceListItem[] = [];

    snapshot.docs.forEach((doc) => {

        const data = doc.data() as Attendance;

        // Filter tanggal
        if (
            tanggalAwal &&
            data.tanggal < tanggalAwal
        ) {
            return;
        }

        if (
            tanggalAkhir &&
            data.tanggal > tanggalAkhir
        ) {
            return;
        }

        data.siswa.forEach((siswa: AttendanceStudent) => {

            result.push({

                attendanceId: doc.id,

                tanggal: data.tanggal,

                tahunAjaran: data.tahunAjaran,

                kelasId: data.kelasId,

                kelas: data.kelas,


                studentId: siswa.studentId,

                nis: siswa.nis,

                nisn: siswa.nisn,

                nama: siswa.nama,

                jk: siswa.jk,

                status: siswa.status,

            });

        });

    });

    result.sort((a, b) => {

        if (a.tanggal < b.tanggal) return 1;

        if (a.tanggal > b.tanggal) return -1;

        return a.nama.localeCompare(b.nama);

    });

    return result;
}

// Mengambil data filter untuk daftar presensi
export interface AttendanceFilterResult {
    tahunAjaran: string[];
    kelas: AttendanceClass[];
    minDate: string;
    maxDate: string;
}

export async function getAttendanceFilter(
    ownerId: string
): Promise<AttendanceFilterResult> {

    try {

        const q = query(
            collection(db, "presensi"),
            where("ownerId", "==", ownerId),
            orderBy("tanggal", "desc")
        );

        const snapshot = await getDocs(q);

        const tahunSet = new Set<string>();
        const kelasMap = new Map<string, AttendanceClass>();
        const dates: string[] = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            if (data.tahunAjaran) {
                tahunSet.add(data.tahunAjaran);
            }

            if (
                data.kelasId &&
                !kelasMap.has(data.kelasId)
            ) {

                kelasMap.set(data.kelasId, {
                    id: data.kelasId,
                    nama: data.kelas ?? "",
                });

            }

            if (data.tanggal) {
                dates.push(data.tanggal);
            }

        });

        dates.sort();

        return {

            tahunAjaran: Array.from(tahunSet).sort((a, b) =>
                b.localeCompare(a)
            ),

            kelas: Array.from(kelasMap.values()),

            minDate: dates.length > 0 ? dates[0] : "",

            maxDate: dates.length > 0 ? dates[dates.length - 1] : "",

        };

    } catch (error) {

        console.error(error);

        return {

            tahunAjaran: [],

            kelas: [],

            minDate: "",

            maxDate: "",

        };

    }
}