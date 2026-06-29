import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import {
    Attendance,
    AttendanceRecap,
    AttendanceStudent,
} from "@/types/presensi";

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