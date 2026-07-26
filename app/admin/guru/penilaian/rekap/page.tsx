"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
// Suppress missing type declarations for bootstrap
// @ts-ignore
import * as bootstrap from "bootstrap";
import {
    getPenilaianRekap,
    getTahunAjaranPenilaian,
    getKelasPenilaian,
    RekapKelas,
    getMapelPenilaian,
    RekapMapel,
    RekapNilai,
} from "@/services/penilaian.service";
import {
    saveBobotPenilaian,
    getBobotPenilaian,
} from "@/services/bobotpenilaian.service";
import * as XLSX from "xlsx";

export default function RekapPenilaianPage() {

    const [loading, setLoading] = useState(false);

    const [kelasId, setKelasId] = useState("");
    const [mapel, setMapel] = useState("");
    const [tahunAjaran, setTahunAjaran] = useState("");
    const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        formatif: 30,
        sumatif: 30,
        sas: 40,
    });

    // Mengambil tahun ajaran dari collection "penilaian" berdasarkan owner
    useEffect(() => {
        loadTahunAjaran();
    }, []);

    async function loadTahunAjaran() {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        const list = await getTahunAjaranPenilaian(user.uid);

        setTahunAjaranList(list);

        if (list.length > 0) {
            setTahunAjaran(list[0]);
        }
    }

    // Mengambil kelas
    const [kelasList, setKelasList] = useState<RekapKelas[]>([]);
    async function loadKelas() {

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user || !tahunAjaran) return;

        const list = await getKelasPenilaian(
            user.uid,
            tahunAjaran
        );

        setKelasList(list);

        if (list.length > 0) {
            setKelasId(list[0].kelasId);
        } else {
            setKelasId("");
        }
    }

    useEffect(() => {

        if (tahunAjaran) {
            loadKelas();
        }

    }, [tahunAjaran]);

    // Mengambil Mata Pelajaran
    const [mapelList, setMapelList] = useState<RekapMapel[]>([]);
    async function loadMapel() {

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        if (!tahunAjaran || !kelasId) return;

        const list = await getMapelPenilaian(
            user.uid,
            tahunAjaran,
            kelasId
        );

        setMapelList(list);

        if (list.length > 0) {
            setMapel(list[0].mapel);
        } else {
            setMapel("");
        }
    }
    useEffect(() => {

        if (tahunAjaran && kelasId) {
            loadMapel();
        }

    }, [tahunAjaran, kelasId]);

    // Mengambil data penilaian
    const [rekap, setRekap] = useState<RekapNilai[]>([]);

    const students = useMemo(() => {

        const map = new Map<string, any>();

        rekap.forEach((penilaian) => {

            penilaian.nilai.forEach((n) => {

                if (!map.has(n.studentId)) {

                    map.set(n.studentId, {
                        studentId: n.studentId,
                        nama: n.nama,
                        nis: n.nis,
                        nisn: n.nisn,
                        jk: n.jk,
                        nilai: {},
                    });

                }

                map.get(n.studentId)!.nilai[penilaian.id] = n.nilai;

            });

        });

        const result = Array.from(map.values());

        result.sort((a, b) =>
            a.nama.localeCompare(b.nama, "id", {
                sensitivity: "base",
            })
        );

        return result;

    }, [rekap]);

    useEffect(() => {
        if (!tahunAjaran || !kelasId || !mapel) return;

        loadRekap();
    }, [tahunAjaran, kelasId, mapel]);

    async function loadRekap() {
        try {
            setLoading(true);

            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) return;

            const result = await getPenilaianRekap(
                user.uid,
                kelasId,
                mapel,
                tahunAjaran
            );

            console.log("REKAP", result);

            setRekap(result);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Boto Penilaian
    async function loadBobot() {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) return;

            if (!tahunAjaran || !kelasId || !mapel) return;

            const bobot = await getBobotPenilaian(
                user.uid,
                tahunAjaran,
                kelasId,
                mapel
            );

            if (bobot) {
                setFormData({
                    formatif: bobot.formatif,
                    sumatif: bobot.sumatif,
                    sas: bobot.sas,
                });
            } else {
                // Default jika belum ada data
                setFormData({
                    formatif: 50,
                    sumatif: 25,
                    sas: 25,
                });
            }
        } catch (error) {
            console.error("Gagal mengambil bobot:", error);
        }
    }

    useEffect(() => {
        if (!tahunAjaran || !kelasId || !mapel) return;

        loadBobot();
    }, [tahunAjaran, kelasId, mapel]);
    const handleChange = (field: string, value: string) => {
        const numValue = Number(value) || 0;
        setFormData((prev) => ({
            ...prev,
            [field]: numValue,
        }));
    };

    const total = formData.formatif + formData.sumatif + formData.sas;

    const handleSubmitBobot = async (e: React.FormEvent) => {
        e.preventDefault();

        if (total !== 100) {
            alert("Total bobot harus 100%");
            return;
        }

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                alert("User belum login");
                return;
            }

            await saveBobotPenilaian({
                ownerId: user.uid,
                tahunAjaran,
                kelasId,
                mapel,
                formatif: formData.formatif,
                sumatif: formData.sumatif,
                sas: formData.sas,
            });

            alert("Bobot berhasil disimpan.");

            await loadBobot();

        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan bobot.");
        }
    };

    // Fungsi untuk mendapatkan nomor dari subtopik, misalnya "TP1" akan menghasilkan 1, "TP2" akan menghasilkan 2, dan seterusnya. Jika tidak ada angka, akan mengembalikan 999.
    function getNomor(sub: string) {

        const match = sub.match(/\d+/);

        return match ? Number(match[0]) : 999;

    }

    // Mengelompokkan data rekap berdasarkan Jenis
    const groupedJenis = useMemo(() => {

        const jenisMap = new Map<string, Map<string, any[]>>();

        rekap.forEach((item) => {

            const lower = item.jenisPenilaian.toLowerCase();
            // Asesmen Diagnostik ditampilkan sebagai kolom khusus
            if (
                lower.includes("sumatif akhir semester") ||
                lower.includes("asesmen diagnostik")
            ) {
                return;
            }
            if (lower.includes("sumatif akhir semester")) {
                return; // abaikan SAS
            }

            let jenis = lower.includes("formatif")
                ? "Formatif"
                : "Sumatif";

            if (!jenisMap.has(jenis)) {
                jenisMap.set(jenis, new Map());
            }

            const topikMap = jenisMap.get(jenis)!;

            if (!topikMap.has(item.topik)) {
                topikMap.set(item.topik, []);
            }

            topikMap.get(item.topik)!.push(item);

        });

        const urutan = [
            "Formatif",
            "Sumatif",
        ];

        return urutan
            .filter(jenis => jenisMap.has(jenis))
            .map(jenis => ({

                jenis,

                topik: Array.from(
                    jenisMap.get(jenis)!.entries()
                ).map(([topik, items]) => ({

                    topik,

                    items: items.sort((a, b) => {
                        const waktuA = a.createdAt?.toMillis?.() ?? 0;
                        const waktuB = b.createdAt?.toMillis?.() ?? 0;

                        return waktuA - waktuB;
                    }),

                })),

            }));

    }, [rekap]);

    // Mengelompokkan data rekap Asesmen Diagnostik
    const groupedAsesmenDiagnostik = useMemo(() => {
        const asesmen = rekap.filter((item) =>
            item.jenisPenilaian
                .toLowerCase()
                .includes("asesmen diagnostik")
        );

        const topikMap = new Map<string, RekapNilai[]>();

        asesmen.forEach((item) => {
            if (!topikMap.has(item.topik)) {
                topikMap.set(item.topik, []);
            }

            topikMap.get(item.topik)!.push(item);
        });

        return Array.from(topikMap.entries()).map(
            ([topik, items]) => ({
                topik,
                items: items.sort((a, b) => {
                    const waktuA =
                        a.createdAt?.toMillis?.() ?? 0;

                    const waktuB =
                        b.createdAt?.toMillis?.() ?? 0;

                    return waktuA - waktuB;
                }),
            })
        );
    }, [rekap]);

    // Inisial tooltip
    useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        );

        tooltipTriggerList.forEach((el) => {
            new bootstrap.Tooltip(el);
        });
    }, [groupedJenis]);

    // Download Excel
    const handleDownloadExcel = () => {
        if (students.length === 0) {
            alert("Belum ada data rekap untuk diunduh.");
            return;
        }

        // =====================================
        // DATA PENILAIAN
        // =====================================

        const asesmenDiagnostik = rekap.filter((item) =>
            item.jenisPenilaian
                .toLowerCase()
                .includes("asesmen diagnostik")
        );

        const formatifItems = rekap.filter((item) =>
            item.jenisPenilaian
                .toLowerCase()
                .includes("formatif")
        );

        const sumatifItems = rekap.filter((item) =>
            item.jenisPenilaian
                .toLowerCase()
                .includes("sumatif") &&
            !item.jenisPenilaian
                .toLowerCase()
                .includes("sumatif akhir semester")
        );

        const sas = rekap.find((item) =>
            item.jenisPenilaian
                .toLowerCase()
                .includes("sumatif akhir semester")
        );

        // =====================================
        // GROUP BERDASARKAN TOPIK
        // =====================================

        const groupByTopik = (items: RekapNilai[]) => {
            const map = new Map<string, RekapNilai[]>();

            items.forEach((item) => {
                if (!map.has(item.topik)) {
                    map.set(item.topik, []);
                }

                map.get(item.topik)!.push(item);
            });

            return Array.from(map.entries()).map(
                ([topik, items]) => ({
                    topik,
                    items,
                })
            );
        };

        const asesmenByTopik =
            groupByTopik(asesmenDiagnostik);

        const formatifByTopik =
            groupByTopik(formatifItems);

        const sumatifByTopik =
            groupByTopik(sumatifItems);

        // =====================================
        // HEADER
        // =====================================

        const headerRow1: string[] = [];
        const headerRow2: string[] = [];
        const headerRow3: string[] = [];

        // Kolom identitas
        headerRow1.push(
            "No",
            "NIS",
            "NISN",
            "Nama",
            "L/P"
        );

        headerRow2.push(
            "",
            "",
            "",
            "",
            ""
        );

        headerRow3.push(
            "",
            "",
            "",
            "",
            ""
        );

        // =====================================
        // ASESMEN DIAGNOSTIK
        // =====================================

        asesmenByTopik.forEach((topik) => {
            topik.items.forEach((item, index) => {
                headerRow1.push(
                    index === 0
                        ? "Asesmen Diagnostik"
                        : ""
                );

                headerRow2.push("");

                headerRow3.push(
                    `A${index + 1}`
                );
            });
        });

        // =====================================
        // FORMATIF
        // =====================================

        formatifByTopik.forEach((topik) => {

            topik.items.forEach((item, index) => {
                headerRow1.push(
                    index === 0
                        ? "Formatif"
                        : ""
                );

                headerRow2.push(
                    index === 0
                        ? topik.topik
                        : ""
                );

                headerRow3.push(
                    `TP${index + 1}`
                );
            });

        });

        // =====================================
        // SUMATIF LINGKUP MATERI
        // =====================================

        sumatifByTopik.forEach((topik) => {

            topik.items.forEach((item, index) => {
                headerRow1.push(
                    index === 0
                        ? "Sumatif Lingkup Materi"
                        : ""
                );

                headerRow2.push(
                    index === 0
                        ? topik.topik
                        : ""
                );

                headerRow3.push(
                    `LM${index + 1}`
                );
            });

        });

        // =====================================
        // SAS
        // =====================================

        headerRow1.push(
            "Sumatif Akhir Semester"
        );

        headerRow2.push("");

        headerRow3.push("");

        // =====================================
        // NILAI AKHIR
        // =====================================

        headerRow1.push(
            "Nilai Akhir"
        );

        headerRow2.push("");

        headerRow3.push("");

        // =====================================
        // DATA SISWA
        // =====================================

        const dataRows = students.map(
            (student, index) => {

                const totalFormatif =
                    formatifItems.reduce(
                        (sum, item) =>
                            sum +
                            Number(
                                student.nilai[item.id] ?? 0
                            ),
                        0
                    );

                const rataFormatif =
                    formatifItems.length > 0
                        ? totalFormatif /
                        formatifItems.length
                        : 0;

                const totalSumatif =
                    sumatifItems.reduce(
                        (sum, item) =>
                            sum +
                            Number(
                                student.nilai[item.id] ?? 0
                            ),
                        0
                    );

                const rataSumatif =
                    sumatifItems.length > 0
                        ? totalSumatif /
                        sumatifItems.length
                        : 0;

                const nilaiSAS = sas
                    ? Number(
                        student.nilai[sas.id] ?? 0
                    )
                    : 0;

                const nilaiAkhir =
                    (rataFormatif *
                        formData.formatif) /
                    100 +

                    (rataSumatif *
                        formData.sumatif) /
                    100 +

                    (nilaiSAS *
                        formData.sas) /
                    100;

                const row: (
                    string | number
                )[] = [
                        index + 1,
                        student.nis ?? "",
                        student.nisn ?? "",
                        student.nama,
                        student.jk,
                    ];

                // ASESMEN DIAGNOSTIK
                asesmenDiagnostik.forEach(
                    (item) => {
                        row.push(
                            student.nilai[item.id] ?? ""
                        );
                    }
                );

                // FORMATIF
                formatifItems.forEach(
                    (item) => {
                        row.push(
                            student.nilai[item.id] ?? ""
                        );
                    }
                );

                // SUMATIF
                sumatifItems.forEach(
                    (item) => {
                        row.push(
                            student.nilai[item.id] ?? ""
                        );
                    }
                );

                // SAS
                row.push(
                    sas
                        ? student.nilai[sas.id] ?? ""
                        : ""
                );

                // NILAI AKHIR
                row.push(
                    Number(nilaiAkhir.toFixed(2))
                );

                return row;
            }
        );

        // =====================================
        // WORKSHEET
        // =====================================

        const worksheet =
            XLSX.utils.aoa_to_sheet([
                headerRow1,
                headerRow2,
                headerRow3,
                ...dataRows,
            ]);

        // =====================================
        // MERGE CELL
        // =====================================

        worksheet["!merges"] = [];

        // Kolom identitas
        for (let col = 0; col < 5; col++) {
            worksheet["!merges"]!.push({
                s: {
                    r: 0,
                    c: col,
                },
                e: {
                    r: 2,
                    c: col,
                },
            });
        }

        let currentCol = 5;

        // ASESMEN DIAGNOSTIK
        if (asesmenDiagnostik.length > 0) {
            worksheet["!merges"]!.push({
                s: {
                    r: 0,
                    c: currentCol,
                },
                e: {
                    r: 2,
                    c:
                        currentCol +
                        asesmenDiagnostik.length -
                        1,
                },
            });

            currentCol +=
                asesmenDiagnostik.length;
        }

        // FORMATIF
        formatifByTopik.forEach((topik) => {

            const startCol = currentCol;

            const endCol =
                currentCol +
                topik.items.length -
                1;

            // Merge jenis Formatif
            worksheet["!merges"]!.push({
                s: {
                    r: 0,
                    c: startCol,
                },
                e: {
                    r: 0,
                    c: endCol,
                },
            });

            // Merge Topik
            worksheet["!merges"]!.push({
                s: {
                    r: 1,
                    c: startCol,
                },
                e: {
                    r: 1,
                    c: endCol,
                },
            });

            currentCol =
                endCol + 1;
        });

        // SUMATIF
        sumatifByTopik.forEach((topik) => {

            const startCol = currentCol;

            const endCol =
                currentCol +
                topik.items.length -
                1;

            // Merge jenis Sumatif
            worksheet["!merges"]!.push({
                s: {
                    r: 0,
                    c: startCol,
                },
                e: {
                    r: 0,
                    c: endCol,
                },
            });

            // Merge Topik
            worksheet["!merges"]!.push({
                s: {
                    r: 1,
                    c: startCol,
                },
                e: {
                    r: 1,
                    c: endCol,
                },
            });

            currentCol =
                endCol + 1;
        });

        // SAS
        worksheet["!merges"]!.push({
            s: {
                r: 0,
                c: currentCol,
            },
            e: {
                r: 2,
                c: currentCol,
            },
        });

        currentCol++;

        // Nilai Akhir
        worksheet["!merges"]!.push({
            s: {
                r: 0,
                c: currentCol,
            },
            e: {
                r: 2,
                c: currentCol,
            },
        });

        // =====================================
        // LEBAR KOLOM
        // =====================================

        worksheet["!cols"] = [
            { wch: 6 },
            { wch: 12 },
            { wch: 16 },
            { wch: 30 },
            { wch: 8 },

            ...Array(
                headerRow1.length - 5
            ).fill({
                wch: 15,
            }),
        ];

        // =====================================
        // WORKBOOK
        // =====================================

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Rekap Nilai"
        );

        const namaFile = [
            "Rekap-Nilai",
            tahunAjaran.replace(
                "/",
                "-"
            ),
            mapel.replace(
                /\s+/g,
                "-"
            ),
        ].join("-");

        XLSX.writeFile(
            workbook,
            `${namaFile}.xlsx`
        );
    };

    return (

        <div className="container-fluid py-2">
            {/* Header */}
            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">

                    <div>
                        <h3 className="fw-bold mb-1">
                            <i className="fas fa-chart-bar text-primary me-2"></i>
                            Rekap Penilaian
                        </h3>

                        <p className="text-muted mb-0">
                            Rekap nilai siswa berdasarkan tahun ajaran, kelas, dan mata pelajaran.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Tahun Ajaran, Kelas, dan Mata Pelajaran */}
            <div className="card shadow-sm border-0 mb-3">
                <div className="card-header bg-white">
                    <h5 className="mb-0">
                        <i className="fas fa-filter me-2 text-primary"></i>
                        Filter Data
                    </h5>
                </div>

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-lg-4 col-md-6">
                            <label className="form-label fw-semibold">
                                Tahun Ajaran
                            </label>

                            <select
                                className="form-control"
                                value={tahunAjaran}
                                onChange={(e) => setTahunAjaran(e.target.value)}
                            >
                                <option value="">Pilih Tahun Ajaran</option>

                                {tahunAjaranList.map((tahun) => (
                                    <option key={tahun} value={tahun}>
                                        {tahun}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-lg-4 col-md-6">
                            <label className="form-label fw-semibold">
                                Kelas
                            </label>


                            <select
                                className="form-control"
                                value={kelasId}
                                onChange={(e) => setKelasId(e.target.value)}
                            >
                                <option value="">
                                    Pilih Kelas
                                </option>

                                {kelasList.map((kelas) => (
                                    <option
                                        key={kelas.kelasId}
                                        value={kelas.kelasId}
                                    >
                                        {kelas.namaKelas}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-lg-4 col-md-12">
                            <label className="form-label fw-semibold">
                                Mata Pelajaran
                            </label>

                            <select
                                className="form-control"
                                value={mapel}
                                onChange={(e) => setMapel(e.target.value)}
                            >
                                <option value="">
                                    Pilih Mata Pelajaran
                                </option>

                                {mapelList.map((item) => (
                                    <option
                                        key={item.mapel}
                                        value={item.mapel}
                                    >
                                        {item.mapel}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                </div>

            </div>

            {/* Form Bobot Penilaian */}
            <div className="card shadow-sm border-0 mb-3">

                <div className="card-header bg-white">
                    <h5 className="mb-0">
                        <i className="fas fa-balance-scale text-primary me-2"></i>
                        Bobot Penilaian
                    </h5>
                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmitBobot}>

                        <div className="row">

                            {/* Formatif */}
                            <div className="col-lg-4 mb-3">
                                <label className="form-label fw-semibold">
                                    Formatif
                                </label>

                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        min={0}
                                        max={100}
                                        value={formData.formatif}
                                        onChange={(e) =>
                                            handleChange(
                                                "formatif",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span className="input-group-text">
                                        %
                                    </span>
                                </div>
                            </div>

                            {/* Sumatif */}
                            <div className="col-lg-4 mb-3">
                                <label className="form-label fw-semibold">
                                    Sumatif
                                </label>

                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        min={0}
                                        max={100}
                                        value={formData.sumatif}
                                        onChange={(e) =>
                                            handleChange(
                                                "sumatif",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span className="input-group-text">
                                        %
                                    </span>
                                </div>
                            </div>

                            {/* SAS */}
                            <div className="col-lg-4 mb-3">
                                <label className="form-label fw-semibold">
                                    Sumatif Akhir Semester
                                </label>

                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        min={0}
                                        max={100}
                                        value={formData.sas}
                                        onChange={(e) =>
                                            handleChange(
                                                "sas",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span className="input-group-text">
                                        %
                                    </span>
                                </div>
                            </div>

                        </div>

                        <hr />

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                            <div>

                                <div className="small text-muted">
                                    Total Bobot
                                </div>

                                <span
                                    className={`badge fs-6 ${total === 100
                                        ? "bg-success"
                                        : "bg-danger"
                                        }`}
                                >
                                    {total}%
                                </span>

                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    total !== 100 ||
                                    !tahunAjaran ||
                                    !kelasId ||
                                    !mapel
                                }
                            >
                                <i className="fas fa-save me-2"></i>
                                Simpan Bobot
                            </button>

                        </div>

                        {total !== 100 && (
                            <div className="alert alert-warning mt-3 mb-0">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Total bobot harus <strong>100%</strong>.
                            </div>
                        )}

                    </form>

                </div>

            </div>

            {/* Tabel Rekap Penilaian */}
            <div className="card mb-2">
                {/* Header Rekap Nilai */}
                <div className="card-header bg-white border-0 px-3 px-md-4 py-3">
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">

                        {/* Judul */}
                        <div className="d-flex align-items-center">
                            <div className="rekap-icon me-3">
                                <i className="fas fa-table"></i>
                            </div>

                            <div>
                                <h5 className="mb-0 fw-bold text-dark">
                                    Rekap Nilai
                                </h5>

                                <small className="text-muted">
                                    Rekapitulasi nilai siswa
                                </small>
                            </div>
                        </div>

                        {/* Tombol */}
                        <button
                            type="button"
                            className="btn btn-success d-flex align-items-center justify-content-center gap-2"
                            onClick={handleDownloadExcel}
                            disabled={
                                loading ||
                                students.length === 0
                            }
                        >
                            <i className="fas fa-file-excel"></i>
                            <span>Download Excel</span>
                        </button>

                    </div>
                </div>

                {/*Tabel Rekap nilai*/}
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle mb-0">
                            <thead className="table-primary">

                                {/* BARIS 1 : JENIS PENILAIAN */}
                                <tr>

                                    <th rowSpan={3} className="text-center align-middle">
                                        No
                                    </th>

                                    <th rowSpan={3} className="text-center align-middle">
                                        NIS
                                    </th>

                                    <th rowSpan={3} className="text-center align-middle">
                                        NISN
                                    </th>

                                    <th rowSpan={3} className="text-center align-middle">
                                        Nama
                                    </th>

                                    <th rowSpan={3} className="text-center align-middle">
                                        L/P
                                    </th>
                                    {/* ASESMEN DIAGNOSTIK */}
                                    {groupedAsesmenDiagnostik.length > 0 && (
                                        <th
                                            colSpan={groupedAsesmenDiagnostik.reduce(
                                                (total, topik) =>
                                                    total + topik.items.length,
                                                0
                                            )}
                                            rowSpan={2}
                                            className="text-center bg-info-subtle"
                                        >
                                            Asesmen Diagnostik
                                        </th>
                                    )}

                                    {groupedJenis.map((jenis) => {

                                        const totalCol =
                                            jenis.jenis === "Formatif"
                                                ? jenis.topik.reduce(
                                                    (t: number, topik: any) =>
                                                        t + topik.items.length,
                                                    0
                                                )
                                                : jenis.topik.length;

                                        return (
                                            <th
                                                key={jenis.jenis}
                                                colSpan={totalCol}
                                                className="text-center bg-light"
                                            >
                                                {jenis.jenis}
                                            </th>
                                        );

                                    })}

                                    {/* Sumatif Akhir Semester */}
                                    <th
                                        rowSpan={3}
                                        className="text-center align-middle bg-warning"
                                        style={{
                                            width: "80px",
                                            minWidth: "80px",
                                            whiteSpace: "normal",
                                            lineHeight: "1.2",
                                        }}
                                    >
                                        Sumatif
                                        <br />
                                        Akhir
                                        <br />
                                        Semester
                                    </th>

                                    {/* Nilai Akhir */}
                                    <th
                                        rowSpan={3}
                                        className="text-center align-middle bg-success text-white"
                                    >
                                        Nilai Akhir
                                    </th>

                                </tr>

                                {/* BARIS 2 : TOPIK */}
                                <tr>
                                    {groupedJenis.flatMap((jenis) =>

                                        jenis.topik.map((topik: any) => (

                                            <th
                                                key={`${jenis.jenis}-${topik.topik}`}
                                                colSpan={
                                                    jenis.jenis === "Formatif"
                                                        ? topik.items.length
                                                        : 1
                                                }
                                                className="text-center bg-light"
                                            >
                                                {topik.topik}
                                            </th>

                                        ))

                                    )}

                                </tr>

                                {/* BARIS 3 : TP / LM */}
                                <tr>
                                    {/* ASESMEN DIAGNOSTIK */}
                                    {groupedAsesmenDiagnostik.flatMap((topik) =>
                                        topik.items.map((item, index) => (
                                            <th
                                                key={item.id}
                                                className="text-center bg-info-subtle"
                                                style={{
                                                    minWidth: 70,
                                                    cursor: "help",
                                                }}
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title={item.subtopik}
                                            >
                                                A{index + 1}
                                            </th>
                                        ))
                                    )}

                                    {groupedJenis.flatMap((jenis) => {

                                        // =============================
                                        // FORMATIF
                                        // =============================
                                        if (jenis.jenis === "Formatif") {

                                            return jenis.topik.flatMap((topik: any) =>

                                                topik.items.map(
                                                    (item: any, index: number) => (

                                                        <th
                                                            key={item.id}
                                                            className="text-center"
                                                            style={{
                                                                minWidth: 70,
                                                                cursor: "help",
                                                            }}
                                                            data-bs-toggle="tooltip"
                                                            data-bs-placement="top"
                                                            title={item.subtopik}
                                                        >
                                                            TP{index + 1}
                                                        </th>

                                                    )

                                                )

                                            );

                                        }

                                        // =============================
                                        // SUMATIF
                                        // =============================
                                        let nomor = 1;

                                        return jenis.topik.map((topik: any) => (

                                            <th
                                                key={`${jenis.jenis}-${topik.topik}`}
                                                className="text-center"
                                                style={{
                                                    minWidth: 70,
                                                    cursor: "help",
                                                }}
                                                data-bs-toggle="tooltip"
                                                data-bs-placement="top"
                                                title={topik.topik}
                                            >
                                                LM{nomor++}
                                            </th>

                                        ));

                                    })}

                                </tr>

                            </thead>
                            <tbody>

                                {students.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan={
                                                8 +
                                                groupedJenis.reduce(
                                                    (total, jenis) =>
                                                        total +
                                                        (
                                                            jenis.jenis === "Formatif"
                                                                ? jenis.topik.reduce(
                                                                    (t: number, topik: any) =>
                                                                        t + topik.items.length,
                                                                    0
                                                                )
                                                                : jenis.topik.length
                                                        ),
                                                    0
                                                )
                                            }
                                            className="text-center"
                                        >
                                            Belum ada data.
                                        </td>

                                    </tr>

                                )}

                                {students.map((student, index) => {
                                    // ==========================
                                    // ASESMEN DIAGNOSTIK
                                    // ==========================
                                    const asesmenDiagnostik = rekap.find((item) =>
                                        item.jenisPenilaian
                                            .toLowerCase()
                                            .includes("asesmen diagnostik")
                                    );

                                    const nilaiAsesmenDiagnostik = asesmenDiagnostik
                                        ? student.nilai[asesmenDiagnostik.id] ?? ""
                                        : "";

                                    // ==========================
                                    // FORMATIF
                                    // ==========================
                                    const formatifItems = rekap.filter(item =>
                                        item.jenisPenilaian
                                            .toLowerCase()
                                            .includes("formatif")
                                    );

                                    const totalFormatif = formatifItems.reduce((sum, item) => {
                                        return sum + Number(student.nilai[item.id] ?? 0);
                                    }, 0);

                                    const rataFormatif =
                                        formatifItems.length > 0
                                            ? totalFormatif / formatifItems.length
                                            : 0;

                                    // ==========================
                                    // SUMATIF
                                    // ==========================
                                    const sumatifItems = rekap.filter(item =>
                                        item.jenisPenilaian
                                            .toLowerCase()
                                            .includes("sumatif") &&
                                        !item.jenisPenilaian
                                            .toLowerCase()
                                            .includes("sumatif akhir semester")
                                    );

                                    const totalSumatif = sumatifItems.reduce((sum, item) => {
                                        return sum + Number(student.nilai[item.id] ?? 0);
                                    }, 0);

                                    const rataSumatif =
                                        sumatifItems.length > 0
                                            ? totalSumatif / sumatifItems.length
                                            : 0;

                                    // ==========================
                                    // SAS
                                    // ==========================
                                    const sas = rekap.find(item =>
                                        item.jenisPenilaian
                                            .toLowerCase()
                                            .includes("sumatif akhir semester")
                                    );

                                    const nilaiSAS = sas
                                        ? Number(student.nilai[sas.id] ?? 0)
                                        : 0;

                                    // ==========================
                                    // NILAI AKHIR
                                    // ==========================
                                    const nilaiAkhir =
                                        (rataFormatif * formData.formatif) / 100 +
                                        (rataSumatif * formData.sumatif) / 100 +
                                        (nilaiSAS * formData.sas) / 100;

                                    return (

                                        <tr key={student.studentId}>

                                            <td>{index + 1}</td>

                                            <td>{student.nis}</td>

                                            <td>{student.nisn}</td>

                                            <td style={{
                                                whiteSpace: "nowrap",
                                            }}>{student.nama}</td>

                                            <td>{student.jk}</td>
                                            {/* ASESMEN DIAGNOSTIK */}
                                            {groupedAsesmenDiagnostik.flatMap((topik) =>
                                                topik.items.map((item) => (
                                                    <td
                                                        key={`${student.studentId}-${item.id}`}
                                                        className="text-center bg-info-subtle"
                                                    >
                                                        {student.nilai[item.id] ?? ""}
                                                    </td>
                                                ))
                                            )}

                                            {/* FORMATIF & SUMATIF */}
                                            {groupedJenis.flatMap((jenis) => {

                                                if (jenis.jenis === "Formatif") {

                                                    return jenis.topik.flatMap((topik: any) =>

                                                        topik.items.map((item: any) => (

                                                            <td
                                                                key={`${student.studentId}-${item.id}`}
                                                                className="text-center"
                                                            >
                                                                {student.nilai[item.id] ?? ""}
                                                            </td>

                                                        ))

                                                    );

                                                }

                                                return jenis.topik.map((topik: any) => {

                                                    const item = topik.items[0];

                                                    return (

                                                        <td
                                                            key={`${student.studentId}-${item.id}`}
                                                            className="text-center fw-semibold"
                                                        >
                                                            {student.nilai[item.id] ?? ""}
                                                        </td>

                                                    );

                                                });

                                            })}

                                            {/* SAS */}
                                            <td className="text-center fw-bold bg-warning-subtle">
                                                {sas
                                                    ? student.nilai[sas.id] ?? ""
                                                    : ""}
                                            </td>

                                            {/* NILAI AKHIR */}
                                            <td className="text-center fw-bold bg-success-subtle">
                                                {nilaiAkhir.toFixed(2)}
                                            </td>

                                        </tr>

                                    );

                                })}
                            </tbody>
                        </table>
                    </div>

                </div>

            </div>

            {/* Informasi Penilaian */}
            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">

                    <div className="d-flex align-items-center mb-3">
                        <div
                            className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary me-3"
                            style={{
                                width: "42px",
                                height: "42px",
                                minWidth: "42px",
                            }}
                        >
                            <i className="fas fa-info-circle fs-5"></i>
                        </div>

                        <div>
                            <h5 className="fw-bold mb-1">
                                Informasi Penilaian
                            </h5>

                            <p className="text-muted small mb-0">
                                Panduan singkat mengenai kode penilaian dan perhitungan nilai akhir.
                            </p>
                        </div>
                    </div>

                    <div className="row g-3">

                        {/* Asesmen Diagnostik */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="border rounded-3 p-3 h-100 bg-info-subtle">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="badge bg-info text-dark fs-6 me-2">
                                        A
                                    </span>

                                    <strong>
                                        Asesmen Diagnostik
                                    </strong>
                                </div>

                                <p className="small text-muted mb-0">
                                    Digunakan untuk mengetahui kondisi awal,
                                    pemahaman, dan kebutuhan belajar siswa.
                                </p>
                            </div>
                        </div>

                        {/* Tujuan Pembelajaran */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="border rounded-3 p-3 h-100 bg-primary-subtle">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="badge bg-primary fs-6 me-2">
                                        TP
                                    </span>

                                    <strong>
                                        Tujuan Pembelajaran
                                    </strong>
                                </div>

                                <p className="small text-muted mb-0">
                                    Penilaian yang mengukur pencapaian
                                    tujuan pembelajaran siswa.
                                </p>
                            </div>
                        </div>

                        {/* Lingkup Materi */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="border rounded-3 p-3 h-100 bg-warning-subtle">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="badge bg-warning text-dark fs-6 me-2">
                                        LM
                                    </span>

                                    <strong>
                                        Lingkup Materi
                                    </strong>
                                </div>

                                <p className="small text-muted mb-0">
                                    Penilaian sumatif berdasarkan
                                    lingkup materi yang telah dipelajari.
                                </p>
                            </div>
                        </div>

                        {/* Nilai Akhir */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="border rounded-3 p-3 h-100 bg-success-subtle">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="badge bg-success fs-6 me-2">
                                        <i className="fas fa-calculator"></i>
                                    </span>

                                    <strong>
                                        Nilai Akhir
                                    </strong>
                                </div>

                                <p className="small text-muted mb-2">
                                    Nilai akhir dihitung dari:
                                </p>

                                <div className="d-flex flex-wrap gap-1">
                                    <span className="badge bg-success">
                                        Formatif
                                    </span>

                                    <span className="badge bg-success">
                                        Sumatif LM
                                    </span>

                                    <span className="badge bg-success">
                                        SAS
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Catatan Perhitungan */}
                    <div className="alert alert-light border mt-3 mb-0">
                        <div className="d-flex align-items-start">
                            <i className="fas fa-lightbulb text-warning me-2 mt-1"></i>

                            <div className="small">
                                <strong>Catatan:</strong>{" "}
                                Asesmen Diagnostik digunakan sebagai informasi
                                pemetaan kemampuan awal siswa dan{" "}
                                <strong>tidak masuk dalam perhitungan Nilai Akhir</strong>.
                                Nilai Akhir hanya menggunakan nilai Formatif,
                                Sumatif Lingkup Materi, dan Sumatif Akhir Semester.
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>

    );

}