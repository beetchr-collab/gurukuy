export type AttendanceStatus =
    | "Hadir"
    | "Izin"
    | "Sakit"
    | "Alpha";

export interface AttendanceStudent {
    studentId: string;
    nis: string;
    nisn: string;
    nama: string;
    jk: string;
    status: AttendanceStatus;
}

export interface Attendance {
    id?: string;
    schoolId: string;
    kelasId: string;
    kelas: string;
    tanggal: string;
    tahunAjaran: string;
    createdBy: string;
    createdAt?: any;
    siswa: AttendanceStudent[];
}

export interface AttendanceRecap {
    studentId: string;
    nis: string;
    nisn: string;
    nama: string;
    jk: string;

    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;

    total: number;
    persentase: number;
}