"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    KepalaSekolah,
    getKepalaSekolahBySchool,
} from "@/services/kepalaSekolah.service";
import {
    PresensiKelasOption,
    getKelasPresensi,
    AttendanceRecapStudent,
    getAttendanceStudentRecap,
} from "@/services/presensi.service";

export default function ListPresensiPage() {
    const { user, loading: authLoading } = useAuth();

    // State untuk mengambil data kepala sekolah
    const [kepalaSekolah, setKepalaSekolah] = useState<KepalaSekolah[]>([]);
    const [tahunAjaran, setTahunAjaran] = useState("");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (authLoading) return;
        const schoolId = user?.schoolId;
        if (!schoolId) {
            setLoading(false);
            return;
        }
        const loadData = async () => {
            try {
                const result = await getKepalaSekolahBySchool(schoolId);
                console.log("School ID :", schoolId);
                console.log("Kepala Sekolah :", result);
                if (result) {
                    setKepalaSekolah(result);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, authLoading]);

    // Menampilkan kelas berdasarkan tahun ajaran yang dipilih
    const [kelasList, setKelasList] = useState<PresensiKelasOption[]>([]);
    const [kelasId, setKelasId] = useState("");
    useEffect(() => {
        const schoolId = user?.schoolId;
        if (!schoolId || !tahunAjaran) {
            setKelasList([]);
            return;
        }

        const loadKelas = async () => {
            try {
                const result = await getKelasPresensi(
                    schoolId,
                    tahunAjaran
                );

                setKelasList(result);
            } catch (err) {
                console.error(err);
            }
        };

        loadKelas();
    }, [tahunAjaran, user]);

    // Menampilkan Rekap Presensi Siswa
    const [rekap, setRekap] = useState<AttendanceRecapStudent[]>([]);
    const loadRekap = async () => {

        if (!user?.schoolId) return;

        if (!tahunAjaran || !kelasId) {

            setRekap([]);

            return;
        }

        setLoading(true);

        try {

            const data = await getAttendanceStudentRecap(
                user.schoolId,
                tahunAjaran,
                kelasId
            );

            setRekap(data);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadRekap();

    }, [tahunAjaran, kelasId]);

    return (
        <>
            <div className="container-fluid py-2">
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="h3 font-weight-bold">
                            Rekap Presensi
                        </h3>
                    </div>
                </div>

                {/* ================= INFORMASI PRESENSI ================= */}
                <div className="callout callout-info mb-3">
                    <h5>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        Informasi Rekap Presensi Siswa
                    </h5>

                    <p className="mb-0">
                        Halaman ini menampilkan rekap presensi siswa berdasarkan Tahun Ajaran, kelas.
                        Pastikan data presensi telah diisi dengan benar agar rekap kehadiran akurat.
                    </p>
                </div>

                {/* ================= FILTER PRESENSI ================= */}
                <div className="card shadow-sm border-0 mb-4 filterpresensi-card">

                    <div className="card-header bg-white border-0 pb-0">
                        <h5 className="fw-bold mb-1">
                            <i className="fas fa-filter text-primary me-2"></i>
                            Filter Rekap Presensi
                        </h5>

                        <small className="text-muted">
                            Pilih tahun ajaran dan kelas untuk melihat rekap presensi.
                        </small>
                    </div>

                    <div className="card-body">

                        <div className="row g-3">

                            {/* Tahun Ajaran */}
                            <div className="col-12 col-md-6 col-xl-3">

                                <label className="form-label fw-semibold">
                                    <i className="fas fa-calendar-alt text-primary me-2"></i>
                                    Tahun Ajaran
                                </label>

                                <select
                                    className="form-select filterpresensi-select"
                                    value={tahunAjaran}
                                    onChange={(e) => setTahunAjaran(e.target.value)}
                                >
                                    <option value="">Pilih Tahun Ajaran</option>

                                    {kepalaSekolah.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.tahunAjaran}
                                        >
                                            {item.tahunAjaran}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            {/* Kelas */}
                            <div className="col-12 col-md-6 col-xl-3">

                                <label className="form-label fw-semibold">
                                    <i className="fas fa-users text-success me-2"></i>
                                    Kelas
                                </label>

                                <select
                                    className="form-select filterpresensi-select"
                                    value={kelasId}
                                    onChange={(e) => setKelasId(e.target.value)}
                                >
                                    <option value="">Pilih Kelas</option>

                                    {kelasList.map((item) => (
                                        <option
                                            key={item.kelasId}
                                            value={item.kelasId}
                                        >
                                            {item.kelas}
                                        </option>
                                    ))}
                                </select>

                            </div>
                        </div>

                    </div>

                </div>

                {/* ================= TABEL REKAP PRESENSI ================= */}
                <div className="card shadow-sm border-0 rekap-presensi-card">

                    <div className="card-header bg-white border-0">

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                            <div>

                                <h5 className="fw-bold mb-1">
                                    <i className="fas fa-clipboard-list text-primary me-2"></i>
                                    Rekap Presensi Siswa
                                </h5>

                                <small className="text-muted">
                                    Rekap kehadiran siswa berdasarkan filter yang dipilih.
                                </small>

                            </div>

                            <span className="badge bg-primary rounded-pill px-3 py-2">
                                {rekap.length} Siswa
                            </span>

                        </div>

                    </div>

                    <div className="card-body p-0">

                        <div className="px-3 py-2 border-bottom bg-light small text-muted">

                            <i className="fas fa-arrows-alt-h me-2"></i>

                            Geser ke kanan untuk melihat seluruh data.

                        </div>

                        <div className="table-responsive">

                            <table className="table table-hover align-middle mb-0 rekap-presensi-table">

                                <thead className="table-primary">

                                    <tr>

                                        <th className="text-center">
                                            No
                                        </th>

                                        <th>
                                            NIS
                                        </th>

                                        <th>
                                            NISN
                                        </th>

                                        <th style={{ minWidth: 220 }}>
                                            Nama Siswa
                                        </th>

                                        <th style={{ minWidth: 70 }} className="text-center">
                                            L/P
                                        </th>

                                        <th className="text-center" style={{ minWidth: 60 }}>
                                            Hadir
                                        </th>

                                        <th className="text-center" style={{ minWidth: 60 }}>
                                            Sakit
                                        </th>

                                        <th className="text-center" style={{ minWidth: 60 }}>
                                            Izin
                                        </th>

                                        <th className="text-center" style={{ minWidth: 60 }}>
                                            Alpha
                                        </th>

                                        <th className="text-center" style={{ minWidth: 60 }}>
                                            Total
                                        </th>
                                        <th
                                            className="text-center"
                                            style={{ minWidth: 150 }}
                                        >
                                            Presentase
                                        </th>
                                        <th
                                            className="text-center"                                                                                  >
                                            Detail
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {rekap.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan={12}
                                                className="text-center py-5"
                                            >

                                                <i className="fas fa-folder-open fa-3x text-secondary mb-3 d-block"></i>

                                                <h6 className="mb-1">
                                                    Belum Ada Data
                                                </h6>

                                                <small className="text-muted">
                                                    Silakan pilih filter terlebih dahulu.
                                                </small>

                                            </td>

                                        </tr>

                                    ) : (

                                        rekap.map((item, index) => (

                                            <tr key={item.studentId}>

                                                <td className="text-center fw-semibold">
                                                    {index + 1}
                                                </td>

                                                <td>{item.nis}</td>

                                                <td>{item.nisn}</td>

                                                <td className="fw-semibold">
                                                    {item.nama}
                                                </td>

                                                <td className="text-center">
                                                    {item.jk}
                                                </td>

                                                <td className="text-center">
                                                    <span className="badge bg-success rounded-pill px-3">
                                                        {item.hadir}
                                                    </span>
                                                </td>

                                                <td className="text-center">
                                                    <span className="badge bg-info rounded-pill px-3">
                                                        {item.sakit}
                                                    </span>
                                                </td>

                                                <td className="text-center">
                                                    <span className="badge bg-warning text-dark rounded-pill px-3">
                                                        {item.izin}
                                                    </span>
                                                </td>

                                                <td className="text-center">
                                                    <span className="badge bg-danger rounded-pill px-3">
                                                        {item.alpha}
                                                    </span>
                                                </td>

                                                <td className="text-center">

                                                    <span className="badge bg-primary rounded-pill px-3 py-2">
                                                        {item.total}
                                                    </span>

                                                </td>
                                                <td className="text-center">
                                                    {(() => {
                                                        const presentase =
                                                            item.total > 0
                                                                ? Math.round((item.hadir / item.total) * 100)
                                                                : 0;

                                                        let color = "bg-danger";

                                                        if (presentase >= 90) color = "bg-success";
                                                        else if (presentase >= 75) color = "bg-primary";
                                                        else if (presentase >= 60) color = "bg-warning";
                                                        else color = "bg-danger";

                                                        return (
                                                            <div style={{ minWidth: 180 }}>
                                                                <div className="d-flex justify-content-between small fw-semibold mb-1">
                                                                    <span>{presentase}%</span>
                                                                    <span>
                                                                        {item.hadir}/{item.total}
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    className="progress"
                                                                    style={{
                                                                        height: 10,
                                                                        borderRadius: 20,
                                                                        background: "#e9ecef",
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={`progress-bar ${color}`}
                                                                        role="progressbar"
                                                                        style={{
                                                                            width: `${presentase}%`,
                                                                            borderRadius: 20,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="text-center">
                                                    <button type="button" className="btn btn-outline-info btn-sm">
                                                        <i className="fas fa-circle-info"></i>
                                                    </button>
                                                </td>
                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>
            </div >
        </>
    );
}


