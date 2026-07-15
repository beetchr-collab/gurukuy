import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
    orderBy,
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";
import {
    Attendance,
    AttendanceRecap,
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
   List-Daftar Presensi
=========================== */
export interface PresensiKelasOption {
    kelasId: string;
    kelas: string;
}

export async function getKelasPresensi(
    schoolId: string,
    tahunAjaran: string
): Promise<PresensiKelasOption[]> {
    try {
        const q = query(
            collection(db, "presensi"),
            where("schoolId", "==", schoolId),
            where("tahunAjaran", "==", tahunAjaran)
        );

        const snapshot = await getDocs(q);

        // Hilangkan kelas yang sama
        const kelasMap = new Map<string, PresensiKelasOption>();

        snapshot.forEach((doc) => {
            const data = doc.data();

            if (!kelasMap.has(data.kelasId)) {
                kelasMap.set(data.kelasId, {
                    kelasId: data.kelasId,
                    kelas: data.kelas,
                });
            }
        });

        return Array.from(kelasMap.values()).sort((a, b) =>
            a.kelas.localeCompare(b.kelas)
        );
    } catch (error) {
        console.error("Gagal mengambil daftar kelas presensi:", error);
        throw error;
    }
}

// Filter presensi berdasarkan tanggal
export interface AttendanceListItem {
    id: string;
    kelas: string;
    kelasId: string;
    tahunAjaran: string;
    tanggal: string;
    siswa: any[];
}

export async function getAttendanceByFilter(
    schoolId: string,
    tahunAjaran: string,
    kelasId: string,
    startDate: string,
    endDate: string
): Promise<AttendanceStudentRow[]> {

    const q = query(
        collection(db, "presensi"),
        where("schoolId", "==", schoolId),
        where("tahunAjaran", "==", tahunAjaran),
        where("kelasId", "==", kelasId),
        where("tanggal", ">=", startDate),
        where("tanggal", "<=", endDate),
        orderBy("tanggal", "asc")
    );

    const snapshot = await getDocs(q);

    const rows: AttendanceStudentRow[] = [];

    snapshot.forEach((doc) => {

        const data = doc.data();

        data.siswa.forEach((siswa: any) => {

            rows.push({
                attendanceId: doc.id,
                studentId: siswa.studentId,
                nis: siswa.nis,
                nisn: siswa.nisn,
                nama: siswa.nama,
                jk: siswa.jk,
                status: siswa.status,
                tanggal: data.tanggal,
            });

        });

    });

    return rows;
}

export interface AttendanceStudentRow {
    attendanceId: string,
    studentId: string;
    nis: string;
    nisn: string;
    nama: string;
    jk: string;
    status: string;
    tanggal: string;
}

// Edit Presensi Siswa
export async function updateAttendanceStatus(
    attendanceId: string,
    studentId: string,
    status: "Hadir" | "Izin" | "Sakit" | "Alpha"
) {
    try {
        const docRef = doc(db, "presensi", attendanceId);

        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            throw new Error("Data presensi tidak ditemukan.");
        }

        const data = snapshot.data();

        const siswa = data.siswa ?? [];

        const updatedSiswa = siswa.map((item: any) => {
            if (item.studentId === studentId) {
                return {
                    ...item,
                    status,
                };
            }

            return item;
        });

        await updateDoc(docRef, {
            siswa: updatedSiswa,
            updatedAt: new Date(),
        });

        return true;
    } catch (error) {
        console.error("Gagal mengubah status presensi:", error);
        throw error;
    }
}

// Rekap Presensi Siswa
export interface AttendanceRecapStudent {
    studentId: string;
    nis: string;
    nisn: string;
    nama: string;
    jk: string;

    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;

    total: number;
}

export async function getAttendanceStudentRecap(
    schoolId: string,
    tahunAjaran: string,
    kelasId: string
): Promise<AttendanceRecapStudent[]> {
    const q = query(
        collection(db, "presensi"),
        where("schoolId", "==", schoolId),
        where("tahunAjaran", "==", tahunAjaran),
        where("kelasId", "==", kelasId)
    );
    const snapshot = await getDocs(q);
    const map = new Map<string, AttendanceRecapStudent>();
    snapshot.forEach((doc) => {
        const data = doc.data();
        const students = data.siswa || [];
        students.forEach((s: any) => {
            if (!map.has(s.studentId)) {
                map.set(s.studentId, {
                    studentId: s.studentId,
                    nis: s.nis,
                    nisn: s.nisn,
                    nama: s.nama,
                    jk: s.jk,
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alpha: 0,
                    total: 0,
                });
            }
            const item = map.get(s.studentId)!;
            switch (s.status) {
                case "Hadir":
                    item.hadir++;
                    break;
                case "Sakit":
                    item.sakit++;
                    break;
                case "Izin":
                    item.izin++;
                    break;
                case "Alpha":
                    item.alpha++;
                    break;
            }
            item.total++;
        });
    });
    return Array.from(map.values()).sort((a, b) =>
        a.nama.localeCompare(b.nama)
    );
}

// Detail Presensi Siswa
export interface StudentAttendanceHistory {
    attendanceId: string;
    tanggal: string;
    tahunAjaran: string;
    nama: string;
    nis: number;
    nisn: number;
    jk: string;
    kelasId: string;
    kelas: string;
    status: "Hadir" | "Izin" | "Sakit" | "Alpha";
    keterangan?: string;
}

export interface StudentAttendanceDetail {
    studentId: string;
    nis: string;
    nisn: string;
    nama: string;
    jk: string;
    kelas: string;
    kelasId: string;
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;

    total: number;
    persentase: number;

    history: StudentAttendanceHistory[];
}

export async function getStudentAttendanceDetail(
    schoolId: string,
    studentId: string,
    tahunAjaran?: string,
    kelasId?: string
): Promise<StudentAttendanceDetail | null> {

    const constraints: any[] = [
        where("schoolId", "==", schoolId)
    ];

    if (tahunAjaran) {
        constraints.push(where("tahunAjaran", "==", tahunAjaran));
    }

    if (kelasId) {
        constraints.push(where("kelasId", "==", kelasId));
    }

    constraints.push(orderBy("tanggal", "asc"));

    const q = query(
        collection(db, "presensi"),
        ...constraints
    );

    const snapshot = await getDocs(q);

    let detail: StudentAttendanceDetail | null = null;

    for (const docSnap of snapshot.docs) {

        const data = docSnap.data();

        const siswa = data.siswa ?? [];

        const item = siswa.find(
            (x: any) => x.studentId === studentId
        );

        if (!item) continue;

        if (!detail) {

            detail = {
                studentId: item.studentId,
                nis: item.nis,
                nisn: item.nisn,
                nama: item.nama,
                jk: item.jk,
                kelas: data.kelas,
                kelasId: data.kelasId,
                hadir: 0,
                sakit: 0,
                izin: 0,
                alpha: 0,

                total: 0,
                persentase: 0,

                history: [],
            };
        }

        switch (item.status) {
            case "Hadir":
                detail.hadir++;
                break;
            case "Sakit":
                detail.sakit++;
                break;
            case "Izin":
                detail.izin++;
                break;
            case "Alpha":
                detail.alpha++;
                break;
        }

        detail.total++;

        detail.history.push({
            attendanceId: docSnap.id,
            tanggal: data.tanggal,
            tahunAjaran: data.tahunAjaran,
            nama: item.nama,
            nis: item.nis,
            nisn: item.nisn,
            jk: item.jk,
            kelasId: data.kelasId,
            kelas: data.kelas,
            status: item.status,
            keterangan: item.keterangan ?? "",
        });
    }

    if (!detail) {
        return null;
    }

    detail.persentase =
        detail.total === 0
            ? 0
            : Math.round(
                (detail.hadir / detail.total) * 100
            );

    return detail;
}