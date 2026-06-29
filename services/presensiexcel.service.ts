import * as XLSX from "xlsx";
import { AttendanceRecap } from "@/types/presensi";

interface ExportAttendanceOptions {
    schoolName: string;
    kelas: string;
    tahunAjaran: string;
    data: AttendanceRecap[];
}

export function exportAttendanceRecapExcel({
    schoolName,
    kelas,
    tahunAjaran,
    data,
}: ExportAttendanceOptions) {

    // Urutkan data berdasarkan nama siswa (A-Z)
    const sortedData = [...data].sort((a, b) =>
        a.nama.localeCompare(b.nama, "id", {
            sensitivity: "base",
            numeric: true,
        })
    );

    const rows: any[][] = [];

    // Header
    rows.push(["REKAP PRESENSI SISWA"]);
    rows.push([]);
    rows.push(["Nama Sekolah", schoolName]);
    rows.push(["Kelas", kelas]);
    rows.push(["Tahun Ajaran", tahunAjaran]);
    rows.push([
        "Tanggal Cetak",
        new Date().toLocaleDateString("id-ID"),
    ]);

    rows.push([]);

    // Judul kolom
    rows.push([
        "No",
        "NIS",
        "NISN",
        "Nama",
        "L/P",
        "Hadir",
        "Izin",
        "Sakit",
        "Alpha",
        "Total",
        "% Kehadiran",
    ]);

    // Data siswa yang sudah diurutkan
    sortedData.forEach((item, index) => {
        rows.push([
            index + 1,
            item.nis,
            item.nisn,
            item.nama,
            item.jk,
            item.hadir,
            item.izin,
            item.sakit,
            item.alpha,
            item.total,
            `${item.persentase}%`,
        ]);
    });

    // Membuat worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Lebar kolom
    ws["!cols"] = [
        { wch: 5 },   // No
        { wch: 12 },  // NIS
        { wch: 18 },  // NISN
        { wch: 35 },  // Nama
        { wch: 8 },   // L/P
        { wch: 10 },  // Hadir
        { wch: 10 },  // Izin
        { wch: 10 },  // Sakit
        { wch: 10 },  // Alpha
        { wch: 10 },  // Total
        { wch: 15 },  // % Kehadiran
    ];

    // Merge judul
    ws["!merges"] = [
        {
            s: { r: 0, c: 0 },
            e: { r: 0, c: 10 },
        },
    ];

    // Membuat workbook
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Rekap Presensi"
    );

    // Export file
    XLSX.writeFile(
        wb,
        `Rekap_Presensi_${kelas}_${tahunAjaran}.xlsx`
    );
}