"use client";

import { useEffect, useMemo, useState } from "react";

import * as XLSX from "xlsx";
import { doc, getDoc } from "firebase/firestore";

import {
    getMonthlyAttendanceByFilter,
    MonthlyAttendanceResult,
} from "@/services/presensi.service";

import {
    getKelasPresensi,
    PresensiKelasOption,
} from "@/services/presensi.service";

import { useAuth } from "@/context/AuthContext";

import { getActiveTahunAjaran } from "@/services/tahunajaran.service";
import { getSchoolById } from "@/lib/sekolah";
import { db } from "@/lib/firebase";
import { getKepalaSekolahBySchool } from "@/services/kepalaSekolah.service";

interface AcademicYearOption {
    id?: string;
    tahunAjaran: string;
}


/* =========================================================
   HELPER
========================================================= */

function getDaysInMonth(
    year: number,
    month: number
) {
    return new Date(
        year,
        month,
        0
    ).getDate();
}


function getDayName(
    year: number,
    month: number,
    day: number
) {

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    const names = [
        "Min",
        "Sen",
        "Sel",
        "Rab",
        "Kam",
        "Jum",
        "Sab",
    ];

    return names[date.getDay()];
}


function getDateKey(
    year: number,
    month: number,
    day: number
) {

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}


function getStatusCode(
    status?: string
) {

    switch (status) {

        case "Hadir":
            return "H";

        case "Izin":
            return "I";

        case "Sakit":
            return "S";

        case "Alpha":
            return "A";

        default:
            return "";
    }
}

function getStatusClass(
    status?: string
) {

    switch (status) {

        case "Hadir":
            return "status-hadir";

        case "Izin":
            return "status-izin";

        case "Sakit":
            return "status-sakit";

        case "Alpha":
            return "status-alpha";

        default:
            return "";
    }
}


/* =========================================================
   MONTH
========================================================= */

const MONTHS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];


/* =========================================================
   PAGE
========================================================= */

export default function RekapPresensiBulananPage() {

    const auth = useAuth();
    const schoolId = auth.user?.schoolId;

    // FIlter states
    const currentDate =
        new Date();

    const [tahunAjaran, setTahunAjaran] =
        useState("");

    const [kelasId, setKelasId] =
        useState("");

    const [tahun, setTahun] =
        useState(
            currentDate.getFullYear()
        );

    const [bulan, setBulan] =
        useState(
            currentDate.getMonth() + 1
        );

    // Data states
    const [academicYears, setAcademicYears] =
        useState<AcademicYearOption[]>([]);

    const [kelas, setKelas] =
        useState<PresensiKelasOption[]>([]);

    const [rekap, setRekap] =
        useState<MonthlyAttendanceResult | null>(
            null
        );


    // States untuk loading dan error
    const [loadingTahunAjaran, setLoadingTahunAjaran] =
        useState(false);

    const [loadingKelas, setLoadingKelas] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [exporting, setExporting] =
        useState(false);


    /* =====================================================
       LOAD TAHUN AJARAN
    ===================================================== */

    useEffect(() => {

        if (!schoolId) {
            return;
        }

        async function loadAcademicYears() {

            try {

                setLoadingTahunAjaran(true);

                const data =
                    await getActiveTahunAjaran(
                        schoolId!
                    );

                setAcademicYears(
                    data ? [data as AcademicYearOption] : []
                );

            } catch (error) {

                console.error(
                    "Gagal mengambil tahun ajaran:",
                    error
                );

                setError(
                    "Gagal mengambil tahun ajaran."
                );

            } finally {

                setLoadingTahunAjaran(false);
            }
        }

        loadAcademicYears();

    }, [schoolId]);


    /* =====================================================
       LOAD KELAS
    ===================================================== */

    useEffect(() => {

        if (!schoolId || !tahunAjaran) {

            setKelas([]);
            setKelasId("");

            return;
        }

        async function loadKelas() {

            try {

                setLoadingKelas(true);

                const data =
                    await getKelasPresensi(
                        schoolId as string,
                        tahunAjaran as string
                    );

                setKelas(data);

            } catch (error) {

                console.error(
                    "Gagal mengambil kelas:",
                    error
                );

                setError(
                    "Gagal mengambil daftar kelas."
                );

            } finally {

                setLoadingKelas(false);
            }
        }

        loadKelas();

    }, [
        schoolId,
        tahunAjaran
    ]);


    /* =====================================================
       LOAD REKAP
    ===================================================== */

    useEffect(() => {

        if (
            !schoolId ||
            !tahunAjaran ||
            !kelasId ||
            !tahun ||
            !bulan
        ) {

            setRekap(null);

            return;
        }

        async function loadRekap() {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getMonthlyAttendanceByFilter(
                        schoolId!,
                        tahunAjaran!,
                        kelasId!,
                        tahun!,
                        bulan!
                    );

                setRekap(data);

            } catch (error) {

                console.error(
                    "Gagal mengambil rekap bulanan:",
                    error
                );

                setError(
                    "Gagal mengambil data rekap presensi."
                );

                setRekap(null);

            } finally {

                setLoading(false);
            }
        }

        loadRekap();

    }, [
        schoolId,
        tahunAjaran,
        kelasId,
        tahun,
        bulan
    ]);


    /* =====================================================
       JUMLAH HARI
    ===================================================== */

    const days =
        useMemo(() => {

            return getDaysInMonth(
                tahun,
                bulan
            );

        }, [
            tahun,
            bulan
        ]);


    /* =====================================================
       DAFTAR TAHUN
    ===================================================== */

    const years =
        useMemo(() => {

            const current =
                new Date().getFullYear();

            return Array.from(
                { length: 6 },
                (_, index) =>
                    current - 3 + index
            );

        }, []);


    /* =====================================================
       RENDER
    ===================================================== */

    const studentCount = rekap?.students?.length ?? 0;

    // Tinggi setiap baris siswa
    const ROW_HEIGHT = 38;

    // Tinggi header tabel (2 baris)
    const TABLE_HEADER_HEIGHT = 82;

    // Padding tambahan
    const TABLE_EXTRA_HEIGHT = 12;

    // Tinggi tabel mengikuti jumlah siswa,
    // tetapi tidak boleh melebihi area layar.
    const calculatedTableHeight =
        TABLE_HEADER_HEIGHT +
        (studentCount * ROW_HEIGHT) +
        TABLE_EXTRA_HEIGHT;

    async function handleDownloadExcelAllMonths() {

        if (!schoolId || !tahunAjaran || !kelasId || !tahun) {
            setError("Lengkapi filter: Tahun Ajaran, Kelas dan Tahun.");
            return;
        }

        setExporting(true);

        try {
            const wb = XLSX.utils.book_new();

            const startMonth = 7; // Juli sebagai awal tahun ajaran

            for (let offset = 0; offset < 12; offset++) {

                const month = ((startMonth - 1 + offset) % 12) + 1;
                // Jika bulan <= 6, berarti masuk tahun ajaran berikutnya
                const yearForMonth = month <= 6 ? tahun + 1 : tahun;

                // Ambil data rekap untuk bulan ini
                let data;
                try {
                    data = await getMonthlyAttendanceByFilter(
                        schoolId!,
                        tahunAjaran!,
                        kelasId!,
                        yearForMonth,
                        month
                    );
                } catch (err) {
                    console.error("Gagal mengambil rekap untuk bulan", month, err);
                    continue;
                }

                // Siapkan array of arrays untuk sheet dengan judul dan header yang rapi
                const daysInMonth = getDaysInMonth(yearForMonth, month);

                const totalCols = 5 + daysInMonth + 3; // No, NIS, NISN, NAMA, L/P, days..., S,I,A

                const school = await getSchoolById(schoolId!);

                const kelasName = kelas.find((k) => k.kelasId === kelasId)?.kelas || rekap?.kelas || kelasId;

                const schoolName = school?.nama || "";

                const title = `Presensi Bulan ${MONTHS[month - 1]} ${yearForMonth} - ${kelasName}`;

                // Row 0: title (merged across all columns)
                const rowTitle = [title, ...Array(totalCols - 1).fill("")];

                // Row 1: blank spacer row to create one-line gap between title and table
                const blankRow: any[] = Array(totalCols).fill("");

                // Row 2: header - day names above
                const headerRow1: any[] = Array(totalCols).fill("");
                headerRow1[0] = "No";
                headerRow1[1] = "NIS";
                headerRow1[2] = "NISN";
                headerRow1[3] = "NAMA SISWA";
                headerRow1[4] = "L/P";
                for (let d = 1; d <= daysInMonth; d++) {
                    const idx = 5 + (d - 1);
                    const dayName = getDayName(yearForMonth, month, d);
                    headerRow1[idx] = dayName;
                }
                // Rekap label above S/I/A
                headerRow1[5 + daysInMonth] = "Rekap Presensi";

                // Row 3: header - date numbers and S/I/A
                const headerRow2: any[] = Array(totalCols).fill("");
                for (let d = 1; d <= daysInMonth; d++) {
                    const idx = 5 + (d - 1);
                    headerRow2[idx] = String(d);
                }
                headerRow2[5 + daysInMonth] = "S";
                headerRow2[5 + daysInMonth + 1] = "I";
                headerRow2[5 + daysInMonth + 2] = "A";

                const aoa: any[] = [rowTitle, blankRow, headerRow1, headerRow2];

                // Data rows
                if (data && data.students && data.students.length) {
                    data.students.forEach((student: any, index: number) => {
                        const row: any[] = Array(totalCols).fill("");

                        row[0] = index + 1;
                        row[1] = student.nis || "-";
                        row[2] = student.nisn || "-";
                        row[3] = student.nama || "-";
                        row[4] = student.jk || "-";

                        for (let d = 1; d <= daysInMonth; d++) {
                            const key = getDateKey(yearForMonth, month, d);
                            const status = student.attendance?.[key];
                            const colIdx = 5 + (d - 1);
                            switch (status) {
                                case "Hadir":
                                    row[colIdx] = "H";
                                    break;
                                case "Izin":
                                    row[colIdx] = "I";
                                    break;
                                case "Sakit":
                                    row[colIdx] = "S";
                                    break;
                                case "Alpha":
                                    row[colIdx] = "A";
                                    break;
                                default:
                                    row[colIdx] = "";
                            }
                        }

                        const summary: { sakit: number; izin: number; alpha: number } =
                            Object.values(student.attendance || {}).reduce(
                                (res: { sakit: number; izin: number; alpha: number }, st: any) => {
                                    if (st === "Sakit") res.sakit++;
                                    if (st === "Izin") res.izin++;
                                    if (st === "Alpha") res.alpha++;
                                    return res;
                                },
                                { sakit: 0, izin: 0, alpha: 0 }
                            );

                        row[5 + daysInMonth] = summary.sakit;
                        row[5 + daysInMonth + 1] = summary.izin;
                        row[5 + daysInMonth + 2] = summary.alpha;

                        aoa.push(row);
                    });
                }

                const sheet = XLSX.utils.aoa_to_sheet(aoa);

                // Merges:
                // - title across all columns (row 0)
                // - first five header columns (No..L/P) should span two rows (row 2-3)
                // - Rekap Presensi label across last 3 columns on headerRow1 (row 2)
                const merges: any[] = [];
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }); // title

                // Merge first five columns from headerRow1 (r:2) to headerRow2 (r:3)
                for (let c = 0; c <= 4; c++) {
                    merges.push({ s: { r: 2, c }, e: { r: 3, c } });
                }

                // Rekap Presensi merge across last 3 columns on row 2
                merges.push({ s: { r: 2, c: 5 + daysInMonth }, e: { r: 2, c: 5 + daysInMonth + 2 } });

                sheet["!merges"] = merges;

                // Adjust column widths based on longest text in each column
                const cols: any[] = [];
                for (let c = 0; c < totalCols; c++) {
                    let maxLen = 0;
                    for (let r = 0; r < aoa.length; r++) {
                        const v = aoa[r][c];
                        if (v !== undefined && v !== null) {
                            const l = String(v).length;
                            if (l > maxLen) maxLen = l;
                        }
                    }
                    const wch = Math.min(Math.max(maxLen + 2, 6), 40);
                    cols.push({ wch });
                }
                sheet["!cols"] = cols;

                // Apply styling: title bold & centered, headers bold & centered,
                // table borders, and status colors (S blue, I yellow, A red).
                const borderStyle = {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } },
                };

                const lastRow = aoa.length - 1;

                // Helper to ensure cell exists
                const ensureCell = (r: number, c: number) => {
                    const addr = XLSX.utils.encode_cell({ r, c });
                    if (!sheet[addr]) {
                        sheet[addr] = { v: "", t: "s" } as any;
                    }
                    return sheet[addr];
                };

                // Title row (row 0)
                const titleCell = ensureCell(0, 0);
                (titleCell as any).s = {
                    font: { bold: true, sz: 14 },
                    alignment: { horizontal: "center", vertical: "center" },
                };

                // Header rows: headerRow1 at r=2, headerRow2 at r=3 (because r=1 is blank)
                const headerRows = [2, 3];
                headerRows.forEach((r) => {
                    for (let c = 0; c < totalCols; c++) {
                        const cell = ensureCell(r, c) as any;
                        cell.s = cell.s || {};
                        cell.s.font = { ...(cell.s.font || {}), bold: true };
                        cell.s.alignment = { ...(cell.s.alignment || {}), horizontal: "center", vertical: "center", wrapText: true };
                        cell.s.border = borderStyle;
                    }
                });

                // Data rows: apply borders and status colors
                for (let r = 4; r <= lastRow; r++) {
                    for (let c = 0; c < totalCols; c++) {
                        const cell = ensureCell(r, c) as any;
                        cell.s = cell.s || {};
                        // default alignment: center for date/status columns, left for name columns
                        if (c >= 5 && c < 5 + daysInMonth + 3) {
                            cell.s.alignment = { horizontal: "center", vertical: "center" };
                        } else if (c === 3) {
                            cell.s.alignment = { horizontal: "left", vertical: "center" };
                        } else {
                            cell.s.alignment = { horizontal: "center", vertical: "center" };
                        }
                        cell.s.border = borderStyle;

                        // Apply status colors for single-letter codes in day columns and summary
                        const v = cell.v;
                        if (v === "S") {
                            cell.s.font = { ...(cell.s.font || {}), color: { rgb: "0000FF" } };
                        } else if (v === "I") {
                            cell.s.font = { ...(cell.s.font || {}), color: { rgb: "FFD700" } };
                        } else if (v === "A") {
                            cell.s.font = { ...(cell.s.font || {}), color: { rgb: "FF0000" } };
                        }
                    }
                }

                const sheetName = `${MONTHS[month - 1].slice(0, 20)}`;
                XLSX.utils.book_append_sheet(wb, sheet, sheetName);
            }

            const fileName = `rekap-presensi-bulanan-${(rekap?.kelas || kelasId || "kelas")}-${tahunAjaran}.xlsx`;
            XLSX.writeFile(wb, fileName);

        } finally {
            setExporting(false);
        }
    }

    async function handlePrint() {
        if (!rekap || !schoolId || !auth.user?.uid) {
            alert("Data rekap belum siap untuk dicetak.");
            return;
        }

        const printWindow = window.open("", "_blank", "width=1400,height=900");

        if (!printWindow) {
            alert("Popup diblokir. Izinkan popup browser untuk mencetak rekap.");
            return;
        }

        const escapeHtml = (value: unknown) =>
            String(value ?? "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        try {
            const [userSnapshot, kepalaSekolahData, school] = await Promise.all([
                getDoc(doc(db, "users", auth.user.uid)),
                getKepalaSekolahBySchool(schoolId),
                getSchoolById(schoolId),
            ]);

            const guruData = userSnapshot.exists() ? userSnapshot.data() : null;
            const kepalaSekolah = kepalaSekolahData.find((item) => item.aktif) ?? kepalaSekolahData[0];
            const guruName = guruData?.username || auth.user.username || "Guru";
            const guruNip = guruData?.nip || "-";
            const kepalaNama = kepalaSekolah?.nama || "-";
            const kepalaNip = kepalaSekolah?.nip || "-";
            const schoolName = school?.nama || "-";

            const rows = rekap.students.map((student, index) => {
                const summary = Object.values(student.attendance).reduce(
                    (result, status) => {
                        if (status === "Sakit") result.sakit++;
                        if (status === "Izin") result.izin++;
                        if (status === "Alpha") result.alpha++;
                        return result;
                    },
                    { sakit: 0, izin: 0, alpha: 0 },
                );

                const dayCells = Array.from({ length: days }, (_, dayIndex) => {
                    const status = student.attendance[getDateKey(tahun, bulan, dayIndex + 1)];
                    return `<td>${getStatusCode(status)}</td>`;
                }).join("");

                return `<tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(student.nis || "-")}</td>
                    <td>${escapeHtml(student.nisn || "-")}</td>
                    <td class="name">${escapeHtml(student.nama)}</td>
                    <td>${escapeHtml(student.jk || "-")}</td>
                    ${dayCells}
                    <td>${summary.sakit}</td>
                    <td>${summary.izin}</td>
                    <td>${summary.alpha}</td>
                </tr>`;
            }).join("");

            const dayHeaders = Array.from({ length: days }, (_, dayIndex) => {
                const day = dayIndex + 1;
                return `<th>${getDayName(tahun, bulan, day)}<br>${day}</th>`;
            }).join("");
            const printDate = new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Rekap Presensi ${escapeHtml(rekap.kelas || "")}</title>
                        <style>
                            @page { size: A4 landscape; margin: 10mm; }
                            body { font-family: Arial, sans-serif; color: #111827; margin: 0; font-size: 9px; }
                            h2, .school, .period { text-align: center; margin: 0; }
                            h2 { font-size: 16px; margin-bottom: 4px; }
                            .school, .period { font-size: 10px; margin-bottom: 3px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
                            th, td { border: 1px solid #374151; padding: 3px 2px; text-align: center; vertical-align: middle; word-wrap: break-word; }
                            th { background: #e5e7eb; font-weight: 700; }
                            th:nth-child(4), td:nth-child(4) { width: 18%; }
                            td.name { text-align: left; }
                            .signatures { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
                            .signature { width: 35%; text-align: center; }
                            .signature-space { height: 48px; }
                            .date { text-align: right; margin-bottom: 8px; }
                        </style>
                    </head>
                    <body>
                        <h2>REKAP PRESENSI BULANAN</h2>
                        <div class="school">${escapeHtml(schoolName)}${rekap.kelas ? ` - Kelas ${escapeHtml(rekap.kelas)}` : ""}</div>
                        <div class="period">${escapeHtml(rekap.tahunAjaran || tahunAjaran)} | ${MONTHS[bulan - 1]} ${tahun}</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>No</th><th>NIS</th><th>NISN</th><th>NAMA SISWA</th><th>L/P</th>
                                    ${dayHeaders}<th>S</th><th>I</th><th>A</th>
                                </tr>
                            </thead>
                            <tbody>${rows || `<tr><td colspan="${5 + days + 3}">Tidak ada data siswa</td></tr>`}</tbody>
                        </table>
                        <div class="signatures">
                            <div class="signature">
                                <div>Mengetahui,</div>
                                <div>Kepala Sekolah</div>
                                <div class="signature-space"></div>
                                <strong>${escapeHtml(kepalaNama)}</strong>
                                <div>NIP. ${escapeHtml(kepalaNip)}</div>
                            </div>
                            <div class="signature">
                                <div class="date">${printDate}</div>
                                <div>Guru</div>
                                <div class="signature-space"></div>
                                <strong>${escapeHtml(guruName)}</strong>
                                <div>NIP. ${escapeHtml(guruNip)}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        } catch (error) {
            console.error("Gagal menyiapkan cetak rekap presensi:", error);
            printWindow.close();
            alert("Gagal menyiapkan data cetak rekap presensi.");
        }
    }

    return (

        <div className="container-fluid py-3">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">

                <div>

                    <h3 className="mb-1">
                        <i className="fas fa-calendar-alt me-2 text-primary"></i>
                        Rekap Presensi Bulanan
                    </h3>

                    <p className="text-muted mb-0">
                        Rekap kehadiran siswa berdasarkan
                        tanggal dalam satu bulan
                    </p>

                </div>

            </div>


            {/* =========================================
                FILTER
            ========================================= */}

            <div className="card card-primary card-outline mb-3">

                <div className="card-header">

                    <h3 className="card-title">

                        <i className="fas fa-filter me-2"></i>

                        Filter Rekap

                    </h3>

                </div>


                <div className="card-body">

                    <div className="row g-3">

                        {/* TAHUN AJARAN */}

                        <div className="col-md-3">

                            <label className="form-label">
                                Tahun Ajaran
                            </label>

                            <select
                                className="form-select"
                                value={tahunAjaran}
                                onChange={(e) => {

                                    setTahunAjaran(
                                        e.target.value
                                    );

                                    setKelasId("");

                                }}
                                disabled={
                                    loadingTahunAjaran
                                }
                            >

                                <option value="">
                                    -- Pilih Tahun Ajaran --
                                </option>

                                {academicYears.map(
                                    (item, index) => (

                                        <option
                                            key={
                                                item.id ||
                                                item.tahunAjaran ||
                                                index
                                            }
                                            value={
                                                item.tahunAjaran
                                            }
                                        >
                                            {item.tahunAjaran}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* KELAS */}

                        <div className="col-md-3">

                            <label className="form-label">
                                Kelas
                            </label>

                            <select
                                className="form-select"
                                value={kelasId}
                                onChange={(e) =>
                                    setKelasId(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    !tahunAjaran ||
                                    loadingKelas
                                }
                            >

                                <option value="">

                                    {!tahunAjaran
                                        ? "-- Pilih Tahun Ajaran Dahulu --"
                                        : loadingKelas
                                            ? "-- Memuat Kelas --"
                                            : "-- Pilih Kelas --"
                                    }

                                </option>

                                {kelas.map(
                                    (item) => (

                                        <option
                                            key={
                                                item.kelasId
                                            }
                                            value={
                                                item.kelasId
                                            }
                                        >
                                            {item.kelas}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* TAHUN */}

                        <div className="col-md-2">

                            <label className="form-label">
                                Tahun
                            </label>

                            <select
                                className="form-select"
                                value={tahun}
                                onChange={(e) =>
                                    setTahun(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            >

                                {years.map(
                                    (item) => (

                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* BULAN */}

                        <div className="col-md-2">

                            <label className="form-label">
                                Bulan
                            </label>

                            <select
                                className="form-select"
                                value={bulan}
                                onChange={(e) =>
                                    setBulan(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            >

                                {MONTHS.map(
                                    (item, index) => (

                                        <option
                                            key={item}
                                            value={index + 1}
                                        >
                                            {item}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* INFO */}

                        <div className="col-md-2 d-flex align-items-end">

                            <div className="text-muted small">

                                {days} hari

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================
                ERROR
            ========================================= */}

            {error && (

                <div className="alert alert-danger">

                    <i className="fas fa-exclamation-circle me-2"></i>

                    {error}

                </div>

            )}


            {/* =========================================
                LOADING
            ========================================= */}

            {loading && (

                <div className="card">

                    <div className="card-body text-center py-5">

                        <div
                            className="spinner-border text-primary"
                            role="status"
                        />

                        <div className="mt-2 text-muted">
                            Memuat rekap presensi...
                        </div>

                    </div>

                </div>

            )}


            {/* =========================================
                EMPTY
            ========================================= */}

            {!loading &&
                !rekap &&
                tahunAjaran &&
                kelasId && (

                    <div className="card">

                        <div className="card-body text-center py-5">

                            <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>

                            <p className="text-muted mb-0">
                                Belum ada data presensi.
                            </p>

                        </div>

                    </div>

                )}


            {/* =========================================
                REKAP
            ========================================= */}

            {!loading &&
                rekap && (

                    <div className="card">
                        {/*    CARD HEADER - ADMINLTE 4 */}
                        <div className="card-header border-0 py-3">
                            <div className="row align-items-center g-3">
                                {/* INFORMASI REKAP */}
                                <div className="col-12 col-lg">
                                    <div className="d-flex align-items-start">
                                        {/* TITLE + INFO */}
                                        <div className="min-w-0 w-100">

                                            {/* TITLE */}
                                            <div className="fw-bold fs-5 lh-sm mb-1">
                                                Rekap Presensi
                                                {rekap.kelas && (
                                                    <>
                                                        <span className="text-muted fw-normal">
                                                            {" - "}
                                                        </span>

                                                        <span className="text-dark">
                                                            {rekap.kelas}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* INFO - BARIS KEDUA */}
                                            <div className="d-flex align-items-center flex-wrap gap-2 text-muted small">

                                                {/* TAHUN AJARAN */}
                                                <span className="d-inline-flex align-items-center">
                                                    <i className="bi bi-mortarboard-fill me-1"></i>

                                                    <span>
                                                        {rekap.tahunAjaran || "-"}
                                                    </span>
                                                </span>

                                                <span className="text-secondary">
                                                    •
                                                </span>

                                                {/* BULAN */}
                                                <span className="d-inline-flex align-items-center">
                                                    <i className="bi bi-calendar3 me-1"></i>

                                                    <span>
                                                        {MONTHS[bulan - 1]} {tahun}
                                                    </span>
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* LEGENDA STATUS */}
                                <div className="col-12 col-lg-auto">

                                    <div
                                        className="
                    d-flex
                    flex-wrap
                    justify-content-lg-end
                    align-items-center
                    gap-2
                "
                                    >

                                        {/* HADIR */}
                                        <span
                                            className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2">
                                            <strong>H : </strong>
                                            <span className="ms-1">
                                                Hadir
                                            </span>
                                        </span>

                                        {/* SAKIT */}
                                        <span
                                            className="
                        badge
                        bg-info-subtle
                        text-primary-emphasis
                        border
                        border-info-subtle
                        rounded-pill
                        px-3
                        py-2
                    "
                                        >
                                            <strong>S : </strong>
                                            <span className="ms-1">
                                                Sakit
                                            </span>
                                        </span>


                                        {/* IZIN */}
                                        <span
                                            className="
                        badge
                        bg-warning-subtle
                        text-warning-emphasis
                        border
                        border-warning-subtle
                        rounded-pill
                        px-3
                        py-2
                    "
                                        >
                                            <strong>I : </strong>
                                            <span className="ms-1">
                                                Izin
                                            </span>
                                        </span>


                                        {/* ALPHA */}
                                        <span
                                            className="
                        badge
                        bg-danger-subtle
                        text-danger
                        border
                        border-danger-subtle
                        rounded-pill
                        px-3
                        py-2
                    "
                                        >
                                            <strong>A : </strong>
                                            <span className="ms-1">
                                                Alpha
                                            </span>
                                        </span>

                                        <button
                                            type="button"
                                            className="btn btn-outline-success btn-sm ms-2"
                                            onClick={handleDownloadExcelAllMonths}
                                            disabled={exporting}
                                        >
                                            <i className="fas fa-file-excel me-1"></i>
                                            {exporting ? "Membuat Excel..." : "Download Excel (Per Bulan)"}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={handlePrint}
                                        >
                                            <i className="fas fa-print me-1"></i>
                                            Cetak
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* TABLE */}
                        <div className="card-body">
                            <div className="attendance-table-wrapper">
                                <div className="table-responsive">
                                    <table className="table mb-0 monthly-attendance-table">

                                        {/* HEADER */}
                                        <thead>

                                            {/* BARIS 1 */}
                                            <tr>

                                                {/* NO */}
                                                <th
                                                    rowSpan={2}
                                                    className="sticky-col sticky-no attendance-header text-center"
                                                >
                                                    No
                                                </th>

                                                {/* NIS */}
                                                <th
                                                    rowSpan={2}
                                                    className="sticky-col sticky-nis attendance-header text-center"
                                                >
                                                    NIS
                                                </th>

                                                {/* NISN */}
                                                <th
                                                    rowSpan={2}
                                                    className="sticky-col sticky-nisn attendance-header text-center"
                                                >
                                                    NISN
                                                </th>

                                                {/* NAMA */}
                                                <th
                                                    rowSpan={2}
                                                    className="sticky-col sticky-nama attendance-header"
                                                >
                                                    NAMA SISWA
                                                </th>

                                                {/* JENIS KELAMIN */}
                                                <th
                                                    rowSpan={2}
                                                    className="sticky-col sticky-jk attendance-header text-center"
                                                >
                                                    L/P
                                                </th>

                                                {/* BULAN */}
                                                <th
                                                    colSpan={days}
                                                    className="text-center attendance-header-month"
                                                >
                                                    {MONTHS[bulan - 1].toUpperCase()} {tahun}
                                                </th>

                                                {/* REKAP */}
                                                <th
                                                    colSpan={3}
                                                    className="monthly-summary-title"
                                                >
                                                    <div className="summary-title-content">
                                                        <i className="fas fa-chart-pie"></i>
                                                        <span>Rekap Presensi</span>
                                                    </div>
                                                </th>

                                            </tr>

                                            {/* BARIS 2 - TANGGAL */}
                                            <tr>

                                                {Array.from(
                                                    { length: days },
                                                    (_, index) => {

                                                        const day = index + 1;

                                                        const dayName = getDayName(
                                                            tahun,
                                                            bulan,
                                                            day
                                                        );

                                                        const isSunday =
                                                            dayName === "Min";

                                                        return (
                                                            <th
                                                                key={day}
                                                                className={
                                                                    isSunday
                                                                        ? "day-header sunday"
                                                                        : "day-header"
                                                                }
                                                            >

                                                                <span className="day-name">
                                                                    {dayName}
                                                                </span>

                                                                <span className="day-number">
                                                                    {day}
                                                                </span>

                                                            </th>
                                                        );
                                                    }
                                                )}
                                                {/* REKAP PRESENSI */}
                                                <th className="summary-header sakit">S</th>
                                                <th className="summary-header izin">
                                                    I
                                                </th>
                                                <th className="summary-header alpha">
                                                    A
                                                </th>
                                            </tr>

                                        </thead>
                                        <tbody>
                                            {rekap.students.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5 + days}
                                                        className="empty-attendance"
                                                    >
                                                        <div className="empty-attendance-content">
                                                            <div className="empty-attendance-icon">
                                                                <i className="bi bi-calendar-x"></i>
                                                            </div>

                                                            <div className="empty-attendance-title">
                                                                Tidak ada data siswa
                                                            </div>

                                                            <div className="empty-attendance-text">
                                                                Belum terdapat data siswa untuk
                                                                ditampilkan pada rekap ini.
                                                            </div>

                                                        </div>

                                                    </td>

                                                </tr>

                                            ) : (

                                                rekap.students.map(
                                                    (
                                                        student,
                                                        index
                                                    ) => {

                                                        const summary = Object.values(
                                                            student.attendance
                                                        ).reduce(
                                                            (result, status) => {

                                                                switch (status) {

                                                                    case "Sakit":
                                                                        result.sakit++;
                                                                        break;

                                                                    case "Izin":
                                                                        result.izin++;
                                                                        break;

                                                                    case "Alpha":
                                                                        result.alpha++;
                                                                        break;

                                                                }

                                                                return result;

                                                            },
                                                            {
                                                                sakit: 0,
                                                                izin: 0,
                                                                alpha: 0,
                                                            }
                                                        );
                                                        return (
                                                            <tr
                                                                key={student.studentId}
                                                            >

                                                                {/* 
                                        NO
                                     */}
                                                                <td
                                                                    className="
                                            sticky-col
                                            sticky-no
                                            student-cell
                                            text-center
                                        "
                                                                >
                                                                    {index + 1}
                                                                </td>


                                                                {/* =================================
                                        NIS
                                    ================================== */}
                                                                <td
                                                                    className="
                                            sticky-col
                                            sticky-nis
                                            student-cell
                                        "
                                                                >
                                                                    {student.nis || "-"}
                                                                </td>


                                                                {/* =================================
                                        NISN
                                    ================================== */}
                                                                <td
                                                                    className="
                                            sticky-col
                                            sticky-nisn
                                            student-cell
                                        "
                                                                >
                                                                    {student.nisn || "-"}
                                                                </td>


                                                                {/* =================================
                                        NAMA SISWA
                                    ================================== */}
                                                                <td
                                                                    className="
                                            sticky-col
                                            sticky-nama
                                            student-cell
                                            student-name
                                        "
                                                                >
                                                                    {student.nama}
                                                                </td>


                                                                {/* JENIS KELAMIN */}
                                                                <td
                                                                    className="sticky-col sticky-jk student-cell text-center">
                                                                    <span
                                                                        className={
                                                                            student.jk === "L"
                                                                                ? "gender-badge gender-l"
                                                                                : "gender-badge gender-p"
                                                                        }
                                                                    >
                                                                        {student.jk || "-"}
                                                                    </span>
                                                                </td>


                                                                {/* TANGGAL */}
                                                                {Array.from(
                                                                    { length: days },
                                                                    (_, index) => {

                                                                        const day =
                                                                            index + 1;

                                                                        const dateKey =
                                                                            getDateKey(
                                                                                tahun,
                                                                                bulan,
                                                                                day
                                                                            );

                                                                        const status =
                                                                            student
                                                                                .attendance[
                                                                            dateKey
                                                                            ];

                                                                        const dayName =
                                                                            getDayName(
                                                                                tahun,
                                                                                bulan,
                                                                                day
                                                                            );

                                                                        const isSunday =
                                                                            dayName === "Min";

                                                                        return (

                                                                            <td
                                                                                key={dateKey}
                                                                                className={`
                                                        attendance-cell
                                                        ${isSunday
                                                                                        ? "sunday-cell"
                                                                                        : ""
                                                                                    }
                                                        ${getStatusClass(
                                                                                        status
                                                                                    )}
                                                    `}
                                                                                title={
                                                                                    status ||
                                                                                    "Belum ada presensi"
                                                                                }
                                                                            >

                                                                                <span className="attendance-status">

                                                                                    {getStatusCode(
                                                                                        status
                                                                                    )}

                                                                                </span>

                                                                            </td>

                                                                        );
                                                                    }
                                                                )}

                                                                {/* REKAP PRESENSI */}
                                                                <td className="summary-cell sakit-cell">
                                                                    {summary.sakit}
                                                                </td>

                                                                <td className="summary-cell izin-cell">
                                                                    {summary.izin}
                                                                </td>

                                                                <td className="summary-cell alpha-cell">
                                                                    {summary.alpha}
                                                                </td>

                                                            </tr>
                                                        );
                                                    }
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                )}

        </div>
    );
}