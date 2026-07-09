"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPenilaianDataByOwner } from "@/services/penilaian-data.service";
import { getAuth } from "firebase/auth";
import {
    getTahunAjaranPenilaian,
    getNilaiByPenilaian,
    RekapKelas,
    getKelasPenilaian,
    RekapMapel,
    getMapelPenilaian,
    deletePenilaian,
} from "@/services/penilaian.service";
import { useModal } from "@/components/modals/useModal";
// pagination
import { usePagination } from "@/hooks/usePagination";
import TableFooter from "@/components/pagination/TableFooter";

export default function PenilaianPage() {
    const [penilaian, setPenilaian] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mengambil tahun ajaran dari collection "penilaian" berdasarkan owner
    const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
    const [tahunAjaran, setTahunAjaran] = useState("");


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
    const [kelasId, setKelasId] = useState("");
    async function loadKelas() {

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user || !tahunAjaran) return;

        const list = await getKelasPenilaian(
            user.uid,
            tahunAjaran
        );

        setKelasList(list);

        // Jangan pilih kelas otomatis
        setKelasId("");

        // Kosongkan mapel
        setMapel("");
        setMapelList([]);
    }

    useEffect(() => {

        if (tahunAjaran) {
            loadKelas();
        }

    }, [tahunAjaran]);

    // Mengambil Mata Pelajaran
    const [mapelList, setMapelList] = useState<RekapMapel[]>([]);
    const [mapel, setMapel] = useState("");

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

        setMapel(""); // Reset mapel setiap kali loadMapel dipanggil
    }
    useEffect(() => {

        if (tahunAjaran && kelasId) {
            loadMapel();
        }

    }, [tahunAjaran, kelasId]);

    // Ambil data Penilaian dari Firebase
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) return;

            const data = await getPenilaianDataByOwner(user.uid);

            const result = await Promise.all(
                data.map(async (item) => {
                    const nilai = await getNilaiByPenilaian(item.id);

                    const totalSiswa = nilai.length;

                    const nilaiTerisi = nilai.filter(
                        (n) =>
                            n.nilai !== "" &&
                            n.nilai !== null &&
                            n.nilai !== undefined
                    ).length;

                    const progress =
                        totalSiswa === 0
                            ? 0
                            : Math.round(
                                (nilaiTerisi / totalSiswa) * 100
                            );

                    return {
                        ...item,
                        totalSiswa,
                        nilaiTerisi,
                        progress,
                    };
                })
            );

            setPenilaian(result);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Statistik
    const total = penilaian.length;

    const selesai = penilaian.filter(
        (item) => item.progress === 100
    ).length;

    const belum = total - selesai;

    const rataRata =
        total === 0
            ? 0
            : Math.round(
                penilaian.reduce(
                    (sum, item) => sum + item.progress,
                    0
                ) / total
            );

    // Filter data penilaian berdasarkan tahun ajaran, kelas, dan mata pelajaran
    const filteredPenilaian = penilaian.filter((item) => {

        const sesuaiTahun =
            !tahunAjaran || item.tahunAjaran === tahunAjaran;

        const sesuaiKelas =
            !kelasId || item.kelasId === kelasId;

        const sesuaiMapel =
            !mapel || item.mapel === mapel;

        return (
            sesuaiTahun &&
            sesuaiKelas &&
            sesuaiMapel
        );
    });

    // Hapus Daftar Penilaian
    const { showModal } = useModal();
    async function handleDelete(id: string) {

        if (
            !window.confirm(
                "Apakah Anda yakin ingin menghapus penilaian ini?\n\nSemua data nilai siswa juga akan ikut dihapus."
            )
        ) {
            return;
        }

        try {

            await deletePenilaian(id);

            await loadData();

            showModal({
                type: "success",
                title: "Berhasil",
                message:
                    "Data penilaian beserta seluruh nilai siswa berhasil dihapus.",
            });

        } catch (error) {

            console.error(error);

            showModal({
                type: "error",
                title: "Gagal",
                message: "Data penilaian gagal dihapus.",
            });

        }
    }


    // Pagination
    const {
        currentPage,
        pageSize,
        totalPages,
        startIndex,
        currentData,
        setCurrentPage,
        setPageSize,
    } = usePagination({
        data: filteredPenilaian,
        pageSize: 5, // jumlah data default per halaman
        resetDeps: [tahunAjaran, kelasId, mapel], // reset ke halaman 1 saat filter berubah
    });


    return (
        <div className="container-fluid py-2">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h1 className="h3 font-weight-bold">
                        Penilaian
                    </h1>
                </div>
            </div>

            {/* Statistik */}
            <div className="row g-3 mb-2 penilaian-statistik">

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="penilaian-stat-card total">
                        <div>
                            <span className="penilaian-stat-label">
                                Total Penilaian
                            </span>

                            <h2>{total}</h2>
                        </div>

                        <div className="penilaian-stat-icon">
                            <i className="fas fa-clipboard-list"></i>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="penilaian-stat-card belum">
                        <div>
                            <span className="penilaian-stat-label">
                                Belum Selesai
                            </span>

                            <h2>{belum}</h2>
                        </div>

                        <div className="penilaian-stat-icon">
                            <i className="fas fa-hourglass-half"></i>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="penilaian-stat-card selesai">
                        <div>
                            <span className="penilaian-stat-label">
                                Sudah Selesai
                            </span>

                            <h2>{selesai}</h2>
                        </div>

                        <div className="penilaian-stat-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="penilaian-stat-card progress">
                        <div>
                            <span className="penilaian-stat-label">
                                Progress Rata-rata
                            </span>

                            <h2>{rataRata}%</h2>

                            <small>Kemajuan pengisian nilai</small>
                        </div>

                        <div className="penilaian-stat-icon">
                            <i className="fas fa-chart-line"></i>
                        </div>
                    </div>
                </div>

            </div>

            {/* Tombol Tambah Topik Penilaian */}
            <div
                className="layout-aksi mb-2"
                style={{
                    background:
                        "linear-gradient(135deg,#0d6efd 0%,#3b5bdb 50%,#6f42c1 100%)",
                    borderRadius: "16px",
                    padding: "20px",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(13,110,253,.20)"
                }}
            >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                    {/* Informasi */}
                    <div className="flex-grow-1">

                        <div className="d-flex align-items-center mb-2">
                            <div
                                className="d-flex justify-content-center align-items-center rounded-circle bg-white bg-opacity-25 me-3"
                                style={{
                                    width: "50px",
                                    height: "50px",
                                    fontSize: "22px"
                                }}
                            >
                                <i className="fas fa-clipboard-check text-white"></i>
                            </div>

                            <div>
                                <h5 className="mb-1 text-white fw-bold">
                                    Pengelolaan Penilaian
                                </h5>

                                <small className="text-white-50">
                                    Kelola topik penilaian, pantau progres pengisian nilai,
                                    dan lihat hasil penilaian siswa dengan mudah.
                                </small>
                            </div>
                        </div>

                    </div>

                    {/* Tombol */}
                    <div className="d-flex flex-wrap gap-2">

                        <Link
                            href="/admin/guru/penilaian/tambah"
                            className="btn btn-light shadow-sm"
                        >
                            <i className="fas fa-plus me-2"></i>
                            Tambah Topik/Input Nilai
                        </Link>

                    </div>

                </div>
            </div>

            {/* Filter */}
            <div className="card shadow-sm border-0 mb-4 filter-rekap-card">

                <div className="card-header bg-white border-0 pb-0">
                    <small className="text-muted">
                        Pilih tahun ajaran, kelas, dan mata pelajaran untuk menampilkan data.
                    </small>
                </div>

                <div className="card-body">
                    <div className="row g-3">
                        {/* Tahun Ajaran */}
                        <div className="col-12 col-md-6 col-xl-4">
                            <label className="form-label fw-semibold">
                                <i className="fas fa-calendar-alt text-primary me-2"></i>
                                Tahun Ajaran
                            </label>
                            <select
                                className="form-select filter-select"
                                value={tahunAjaran}
                                onChange={(e) => {
                                    setTahunAjaran(e.target.value);
                                    setKelasId("");
                                    setMapel("");
                                }}
                            >
                                <option value="">Pilih Tahun Ajaran</option>

                                {tahunAjaranList.map((tahun) => (
                                    <option key={tahun} value={tahun}>
                                        {tahun}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Kelas */}
                        <div className="col-12 col-md-6 col-xl-4">

                            <label className="form-label fw-semibold">
                                <i className="fas fa-users text-success me-2"></i>
                                Kelas
                            </label>

                            <select
                                className="form-select filter-select"
                                value={kelasId}
                                disabled={!tahunAjaran}
                                onChange={(e) => {
                                    setKelasId(e.target.value);
                                    setMapel("");
                                }}
                            >
                                <option value="">Semua Kelas</option>

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

                        {/* Mata Pelajaran */}
                        <div className="col-12 col-md-12 col-xl-4">

                            <label className="form-label fw-semibold">
                                <i className="fas fa-book-open text-warning me-2"></i>
                                Mata Pelajaran
                            </label>

                            <select
                                className="form-select filter-select"
                                value={mapel}
                                onChange={(e) => setMapel(e.target.value)}
                            >
                                <option value="">Pilih Mata Pelajaran</option>

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

            {/* Tabel */}
<div className="card shadow-sm border-0">

    <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="card-title fw-semibold mb-0">
                <i className="fas fa-clipboard-list text-primary me-2"></i>
                Daftar Penilaian
            </h3>

            <span className="badge bg-primary">
                {filteredPenilaian.length} Penilaian
            </span>
        </div>
    </div>

    <div className="table-responsive">

        <table className="table table-hover table-striped align-middle mb-0">

            <thead className="table-light">
                <tr>
                    <th className="text-center" style={{ width: 60 }}>No</th>

                    <th style={{ minWidth: 180 }}>
                        Mata Pelajaran
                    </th>

                    <th style={{ minWidth: 260 }}>
                        Topik
                    </th>

                    <th>
                        Kelas
                    </th>

                    <th>
                        Jenis
                    </th>

                    <th style={{ width: 140 }}>
                        Tanggal
                    </th>

                    <th style={{ minWidth: 260 }}>
                        Progress
                    </th>

                    <th className="text-center" style={{ width: 120 }}>
                        Aksi
                    </th>
                </tr>
            </thead>

            <tbody>

                {loading ? (

                    <tr>
                        <td
                            colSpan={8}
                            className="text-center py-5"
                        >
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            Memuat data...
                        </td>
                    </tr>

                ) : currentData.length === 0 ? (

                    <tr>
                        <td
                            colSpan={8}
                            className="text-center py-5 text-muted"
                        >
                            <i className="fas fa-folder-open fa-2x mb-3 d-block"></i>
                            Belum ada data penilaian
                        </td>
                    </tr>

                ) : (

                    currentData.map((item, index) => (

                        <tr key={item.id}>

                            <td className="text-center">
                                {startIndex + index + 1}
                            </td>

                            <td>
                                <div className="fw-semibold">
                                    {item.mapel}
                                </div>
                            </td>

                            <td>
                                <div className="fw-bold">
                                    {item.topik}
                                </div>

                                <small className="text-muted">
                                    {item.subtopik}
                                </small>
                            </td>

                            <td>
                                <span className="badge bg-info">
                                    {item.namaKelas}
                                </span>
                            </td>

                            <td>

                                <span className={`badge ${
                                    item.jenisPenilaian === "Sumatif"
                                        ? "bg-warning text-dark"
                                        : "bg-success"
                                }`}>
                                    {item.jenisPenilaian}
                                </span>

                            </td>

                            <td>
                                {item.tanggalPenilaian}
                            </td>

                            <td>

                                <div className="d-flex align-items-center gap-2">

                                    <div className="progress flex-grow-1 rounded-pill"
                                        style={{ height: 8 }}>

                                        <div
                                            className={`progress-bar ${
                                                item.progress === 100
                                                    ? "bg-success"
                                                    : item.progress >= 75
                                                        ? "bg-primary"
                                                        : item.progress >= 50
                                                            ? "bg-warning"
                                                            : "bg-danger"
                                            }`}
                                            style={{
                                                width: `${item.progress}%`
                                            }}
                                        />

                                    </div>

                                    <span
                                        className="fw-bold"
                                        style={{ width: 42 }}
                                    >
                                        {item.progress}%
                                    </span>

                                </div>

                                <div className="d-flex justify-content-between mt-2">

                                    <small className="text-muted">
                                        {item.nilaiTerisi} / {item.totalSiswa} siswa
                                    </small>

                                    <span
                                        className={`badge ${
                                            item.progress === 100
                                                ? "bg-success"
                                                : "bg-warning text-dark"
                                        }`}
                                    >
                                        {item.progress === 100
                                            ? "Selesai"
                                            : "Proses"}
                                    </span>

                                </div>

                            </td>

                            <td>

                                <div className="d-flex justify-content-center gap-2">

                                    <Link
                                        href={`/admin/guru/penilaian/${item.id}`}
                                        className="btn btn-warning btn-sm rounded-circle"
                                        title="Input Nilai"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </Link>

                                    <button
                                        className="btn btn-danger btn-sm rounded-circle"
                                        title="Hapus"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>

                                </div>

                            </td>

                        </tr>

                    ))

                )}

            </tbody>

        </table>

    </div>

    <div className="card-footer bg-white">

        <TableFooter
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalData={filteredPenilaian.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
            }}
        />

    </div>

</div>
        </div>
    );
}