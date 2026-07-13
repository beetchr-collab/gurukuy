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
    AttendanceListItem,
    getAttendanceByFilter,
    AttendanceStudentRow,
    updateAttendanceStatus,
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

    // Membuat rentang tanggal untuk filter presensi
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [attendance, setAttendance] = useState<AttendanceStudentRow[]>([]);
    useEffect(() => {
        const schoolId = user?.schoolId;
        if (
            !schoolId ||
            !tahunAjaran ||
            !kelasId ||
            !startDate ||
            !endDate
        ) {
            setAttendance([]);
            return;
        }

        const loadAttendance = async () => {
            try {
                const result = await getAttendanceByFilter(
                    schoolId,
                    tahunAjaran,
                    kelasId,
                    startDate,
                    endDate
                );

                setAttendance(result);
            } catch (err) {
                console.error(err);
            }
        };

        loadAttendance();
    }, [
        tahunAjaran,
        kelasId,
        startDate,
        endDate,
        user,
    ]);

    // Aksi Edit Presensi Siswa
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStudent, setSelectedStudent] =
        useState<AttendanceStudentRow | null>(null);
    const [editStatus, setEditStatus] = useState("");
    // Membuka dan menutup modals
    const openEditModal = (student: AttendanceStudentRow) => {
        setSelectedStudent(student);
        setEditStatus(student.status);
        setShowEditModal(true);
    };
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedStudent(null);
    };
    const loadAttendance = async () => {
        if (
            !user?.schoolId ||
            !tahunAjaran ||
            !kelasId ||
            !startDate ||
            !endDate
        ) {
            setAttendance([]);
            return;
        }

        try {
            const result = await getAttendanceByFilter(
                user.schoolId,
                tahunAjaran,
                kelasId,
                startDate,
                endDate
            );

            setAttendance(result);
        } catch (error) {
            console.error(error);
        }
    };

    const saveAttendance = async () => {

        if (!selectedStudent) return;

        try {

            await updateAttendanceStatus(
                selectedStudent.attendanceId,
                selectedStudent.studentId,
                editStatus as "Hadir" | "Izin" | "Sakit" | "Alpha"
            );

            alert("Presensi berhasil diperbarui.");

            closeEditModal();

            loadAttendance();

        } catch (error) {
            console.error(error);
            alert("Gagal mengubah presensi.");
        }
    };

    return (
        <>
            <div className="container-fluid py-2">
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="h3 font-weight-bold">
                            Daftar Presensi
                        </h3>
                    </div>
                </div>

                {/* ================= INFORMASI PRESENSI ================= */}
                <div className="callout callout-info mb-3">
                    <h5>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        Informasi Presensi Siswa
                    </h5>

                    <p className="mb-0">
                        Halaman ini menampilkan daftar presensi siswa berdasarkan Tahun Ajaran, kelas dan tanggal.
                        Pastikan data presensi telah diisi dengan benar agar rekap kehadiran akurat.
                    </p>
                </div>

                {/* ================= FILTER PRESENSI ================= */}
                <div className="card shadow-sm border-0 mb-4 filterpresensi-card">

                    <div className="card-header bg-white border-0 pb-0">
                        <h5 className="fw-bold mb-1">
                            <i className="fas fa-filter text-primary me-2"></i>
                            Filter Presensi
                        </h5>

                        <small className="text-muted">
                            Pilih tahun ajaran, kelas, dan rentang tanggal untuk melihat data presensi.
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

                            {/* Tanggal Awal */}
                            <div className="col-12 col-md-6 col-xl-3">

                                <label className="form-label fw-semibold">
                                    <i className="fas fa-calendar-day text-warning me-2"></i>
                                    Tanggal Awal
                                </label>

                                <input
                                    type="date"
                                    className="form-control filterpresensi-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={!kelasId}
                                />

                            </div>

                            {/* Tanggal Akhir */}
                            <div className="col-12 col-md-6 col-xl-3">

                                <label className="form-label fw-semibold">
                                    <i className="fas fa-calendar-check text-danger me-2"></i>
                                    Tanggal Akhir
                                </label>

                                <input
                                    type="date"
                                    className="form-control filterpresensi-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={!kelasId}
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* ================= TABEL PRESENSI ================= */}
                <div className="card shadow-sm border-0">

                    <div className="card-header bg-white">

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                            <div>
                                <h5 className="fw-bold mb-1">
                                    <i className="fas fa-clipboard-list text-primary me-2"></i>
                                    Data Presensi Siswa
                                </h5>

                                <small className="text-muted">
                                    Menampilkan daftar presensi berdasarkan filter yang dipilih.
                                </small>
                            </div>

                            <span className="badge bg-primary rounded-pill px-3 py-2">
                                {attendance.length} Data
                            </span>

                        </div>

                    </div>

                    <div className="card-body p-0">

                        {/* Informasi Mobile */}
                        <div className="px-3 py-2 border-bottom bg-light small text-muted">
                            <i className="fas fa-arrows-alt-h me-1"></i>
                            Geser tabel ke kanan untuk melihat semua kolom.
                        </div>
                        <div className="table-responsive">

                            <table className="table table-hover table-bordered align-middle mb-0 presensi-table">

                                <thead className="table-primary">

                                    <tr>
                                        <th style={{ minWidth: 60 }} className="text-center">
                                            No
                                        </th>

                                        <th style={{ minWidth: 130 }}>
                                            Tanggal
                                        </th>

                                        <th style={{ minWidth: 100 }}>
                                            NIS
                                        </th>

                                        <th style={{ minWidth: 120 }}>
                                            NISN
                                        </th>

                                        <th style={{ minWidth: 220 }}>
                                            Nama Siswa
                                        </th>

                                        <th style={{ minWidth: 70 }} className="text-center">
                                            L/P
                                        </th>

                                        <th style={{ minWidth: 120 }} className="text-center">
                                            Status
                                        </th>

                                        <th style={{ minWidth: 90 }} className="text-center">
                                            Aksi
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {attendance.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan={8}
                                                className="text-center py-5 text-muted"
                                            >

                                                <i className="fas fa-folder-open fa-2x mb-3 d-block"></i>

                                                Belum ada data presensi.

                                            </td>

                                        </tr>

                                    ) : (

                                        attendance.map((item, index) => (

                                            <tr key={`${item.studentId}-${index}`}>

                                                <td className="text-center fw-semibold">
                                                    {index + 1}
                                                </td>

                                                <td>{item.tanggal}</td>

                                                <td>{item.nis}</td>

                                                <td>{item.nisn}</td>

                                                <td className="fw-semibold">
                                                    {item.nama}
                                                </td>

                                                <td className="text-center">
                                                    {item.jk}
                                                </td>

                                                <td className="text-center">

                                                    <span
                                                        className={`badge rounded-pill px-3 py-2 ${item.status === "Hadir"
                                                            ? "bg-success"
                                                            : item.status === "Izin"
                                                                ? "bg-warning text-dark"
                                                                : item.status === "Sakit"
                                                                    ? "bg-info"
                                                                    : "bg-danger"
                                                            }`}
                                                    >
                                                        {item.status}
                                                    </span>

                                                </td>

                                                <td className="text-center">

                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => openEditModal(item)}
                                                    >
                                                        <i className="fas fa-edit me-1"></i>
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
            {/* ================= Modal Edit Presensi ================= */}
            {showEditModal && (
                <>
                    <div
                        className="modal fade show"
                        style={{ display: "block" }}
                        tabIndex={-1}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content presensi-modal">

                                {/* Header */}
                                <div className="modal-header presensi-modal-header">

                                    <div>
                                        <h5 className="modal-title mb-1">
                                            <i className="fas fa-user-edit me-2"></i>
                                            Edit Presensi Siswa
                                        </h5>

                                        <small className="text-white-50">
                                            Perbarui status kehadiran siswa.
                                        </small>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={closeEditModal}
                                    />

                                </div>

                                <div className="modal-body">

                                    {/* Informasi Siswa */}
                                    <div className="presensi-info-card mb-4">

                                        <div className="row g-3">

                                            <div className="col-md-5">

                                                <small className="text-muted d-block">
                                                    Nama Siswa
                                                </small>

                                                <div className="fw-bold">
                                                    {selectedStudent?.nama}
                                                </div>

                                            </div>

                                            <div className="col-md-3">

                                                <small className="text-muted d-block">
                                                    NIS
                                                </small>

                                                <div className="fw-semibold">
                                                    {selectedStudent?.nis}
                                                </div>

                                            </div>

                                            <div className="col-md-4">

                                                <small className="text-muted d-block">
                                                    Tanggal Presensi
                                                </small>

                                                <div className="fw-semibold">
                                                    <i className="fas fa-calendar-alt text-primary me-2"></i>
                                                    {selectedStudent?.tanggal}
                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                    {/* Status */}
                                    <div>

                                        <label className="form-label fw-semibold">
                                            <i className="fas fa-clipboard-check text-primary me-2"></i>
                                            Status Presensi
                                        </label>

                                        <select
                                            className="form-select"
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                        >
                                            <option value="Hadir">Hadir</option>
                                            <option value="Izin">Izin</option>
                                            <option value="Sakit">Sakit</option>
                                            <option value="Alpha">Alpha</option>
                                        </select>

                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="modal-footer">

                                    <button
                                        className="btn btn-secondary border"
                                        onClick={closeEditModal}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Batal
                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        onClick={saveAttendance}
                                    >
                                        <i className="fas fa-save me-2"></i>
                                        Simpan Perubahan
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    );
}


