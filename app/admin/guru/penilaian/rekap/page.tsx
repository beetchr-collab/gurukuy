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
                    formatif: 40,
                    sumatif: 30,
                    sas: 30,
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

                    items: items.sort(
                        (a, b) =>
                            getNomor(a.subtopik) -
                            getNomor(b.subtopik)
                    ),

                })),

            }));

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


    // Bobot Penilaian

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
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle mb-0">
                            <thead className="table-primary">

                                {/* ============================
        BARIS 1 : JENIS PENILAIAN
    ============================= */}
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

                                {/* ============================
        BARIS 2 : TOPIK
    ============================= */}
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

                                {/* ============================
        BARIS 3 : TP / LM
    ============================= */}
                                <tr>

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
                                                7 +
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

                                            <td>{student.nama}</td>

                                            <td>{student.jk}</td>

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

        </div>

    );

}