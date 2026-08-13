"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import {
    getStudentAttendanceDetail,
    StudentAttendanceDetail,
    updateAttendanceStatus,
    StudentAttendanceHistory,
} from "@/services/presensi.service";

export default function DetailPresensiPage() {

    const { user } = useAuth();

    const params = useParams();

    const studentId = params.studentId as string;

    const [loading, setLoading] = useState(true);

    const [detail, setDetail] =
        useState<StudentAttendanceDetail | null>(null);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    // Hasil data setelah difilter
    const [histories, setHistories] = useState<StudentAttendanceHistory[]>([]);

    // Aksi Edit Presensi Siswa Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStudent, setSelectedStudent] =
        useState<StudentAttendanceHistory | null>(null);
    const [editStatus, setEditStatus] = useState("");
    const [editKeterangan, setEditKeterangan] = useState("");

    // Membuka dan menutup modals
    const openEditModal = (student: StudentAttendanceHistory) => {
        setSelectedStudent(student);
        setEditStatus(student.status);
        setEditKeterangan(student.keterangan || "");
        setShowEditModal(true);
    };
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedStudent(null);
    };

    const months = [
        { value: "01", label: "Januari" },
        { value: "02", label: "Februari" },
        { value: "03", label: "Maret" },
        { value: "04", label: "April" },
        { value: "05", label: "Mei" },
        { value: "06", label: "Juni" },
        { value: "07", label: "Juli" },
        { value: "08", label: "Agustus" },
        { value: "09", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
    ];

    const availableYears = useMemo(() => {
        if (!detail?.history) return [];

        const years = detail.history
            .map((item) => item.tanggal?.substring(0, 4))
            .filter(Boolean);

        return Array.from(new Set(years)).sort((a, b) =>
            b.localeCompare(a)
        );
    }, [detail]);


    const saveAttendance = async () => {
        if (!selectedStudent) return;

        try {
            await updateAttendanceStatus(
                selectedStudent.attendanceId,
                studentId,
                editStatus as "Hadir" | "Izin" | "Sakit" | "Alpha",
                editStatus === "Izin"
                    ? editKeterangan
                    : ""
            );

            alert("Presensi berhasil diperbarui.");

            closeEditModal();

            await loadData();

        } catch (error) {
            console.error(error);
            alert("Gagal mengubah presensi.");
        }
    };
    async function loadData() {

        if (!user?.schoolId || !studentId) return;

        try {

            setLoading(true);

            const result =
                await getStudentAttendanceDetail(
                    user.schoolId,
                    studentId
                );

            setDetail(result);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {

        loadData();

    }, [user, studentId]);

    // =====================================================
    // USE EFFECT KHUSUS FILTER RIWAYAT PRESENSI
    // =====================================================
    useEffect(() => {
        if (!detail?.history) {
            setHistories([]);
            return;
        }

        let filtered = [...detail.history];

        // ===============================
        // FILTER TAHUN
        // ===============================
        if (filterYear) {
            filtered = filtered.filter((item) => {
                return item.tanggal?.substring(0, 4) === filterYear;
            });
        }

        // ===============================
        // FILTER BULAN
        // ===============================
        if (filterMonth) {
            filtered = filtered.filter((item) => {
                return item.tanggal?.substring(5, 7) === filterMonth;
            });
        }

        // ===============================
        // FILTER TANGGAL AWAL
        // ===============================
        if (startDate) {
            filtered = filtered.filter((item) => {
                return item.tanggal >= startDate;
            });
        }

        // ===============================
        // FILTER TANGGAL AKHIR
        // ===============================
        if (endDate) {
            filtered = filtered.filter((item) => {
                return item.tanggal <= endDate;
            });
        }

        setHistories(filtered);

    }, [
        detail,
        filterYear,
        filterMonth,
        startDate,
        endDate,
    ]);

    if (loading) {

        return (

            <div className="content-wrapper">

                <section className="content">

                    <div className="container-fluid py-5">

                        <div className="text-center">

                            <div
                                className="spinner-border text-primary"
                                role="status"
                            />

                            <p className="mt-3">
                                Memuat data...
                            </p>

                        </div>

                    </div>

                </section>

            </div>

        );

    }

    if (!detail) {

        return (

            <div className="content-wrapper">

                <section className="content">

                    <div className="container-fluid py-5">

                        <div className="alert alert-warning">

                            Data presensi siswa tidak ditemukan.

                        </div>

                        <Link
                            href="/admin/guru/presensi/rekap-presensi"
                            className="btn btn-secondary"
                        >

                            <i className="fas fa-arrow-left me-2"></i>

                            Kembali

                        </Link>

                    </div>

                </section>

            </div>

        );

    }



    return (
        <>
            <div className="content-wrapper py-2">
                {/* Header */}
                <section className="content-header">
                    <div className="container-fluid">
                        <div className="d-flex justify-content-between align-items-center">
                            <h3>
                                Detail Presensi Siswa
                            </h3>
                            <Link
                                href="/admin/guru/presensi/rekap-presensi"
                                className="btn btn-secondary"
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Kembali
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="content">
                    <div className="container-fluid">
                        {/* Informasi Siswa */}
                        <div className="card shadow-sm border-0 mb-3 riwayat-presensi-card">
                            <div className="card-header bg-white border-0 d-flex align-items-center">
                                <h3 className="card-title mb-0">
                                    <i className="fas fa-user-graduate text-primary me-2"></i>
                                    Informasi Siswa
                                </h3>
                            </div>

                            <div className="card-body">
                                <div className="row g-3">

                                    <div className="col-12 col-sm-6 col-lg-4">
                                        <div className="border rounded-3 p-3 h-100 riwayat-presensi-item">
                                            <small className="text-muted d-block mb-1">
                                                <i className="fas fa-id-card me-1 text-primary"></i>
                                                NIS
                                            </small>
                                            <h6 className="mb-0 fw-bold">
                                                {detail?.nis || "-"}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-12 col-sm-6 col-lg-4">
                                        <div className="border rounded-3 p-3 h-100 riwayat-presensi-item">
                                            <small className="text-muted d-block mb-1">
                                                <i className="fas fa-address-card me-1 text-success"></i>
                                                NISN
                                            </small>
                                            <h6 className="mb-0 fw-bold">
                                                {detail?.nisn || "-"}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-12 col-lg-4">
                                        <div className="border rounded-3 p-3 h-100 riwayat-presensi-item">
                                            <small className="text-muted d-block mb-1">
                                                <i className="fas fa-user me-1 text-warning"></i>
                                                Nama Siswa
                                            </small>
                                            <h6 className="mb-0 fw-bold">
                                                {detail?.nama || "-"}
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="col-12 col-sm-6 col-lg-4">
                                        <div className="border rounded-3 p-3 h-100 riwayat-presensi-item">
                                            <small className="text-muted d-block mb-1">
                                                <i className="fas fa-venus-mars me-1 text-danger"></i>
                                                Jenis Kelamin
                                            </small>

                                            <span
                                                className={`badge ${detail?.jk === "L"
                                                    ? "bg-primary"
                                                    : "bg-pink"
                                                    }`}
                                            >
                                                {detail?.jk === "L"
                                                    ? "Laki-laki"
                                                    : detail?.jk === "P"
                                                        ? "Perempuan"
                                                        : "-"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-12 col-sm-6 col-lg-4">
                                        <div className="border rounded-3 p-3 h-100 riwayat-presensi-item">
                                            <small className="text-muted d-block mb-1">
                                                <i className="fas fa-school me-1 text-info"></i>
                                                Kelas
                                            </small>
                                            <h6 className="mb-0 fw-bold">
                                                {detail?.kelas || "-"}
                                            </h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Kehadiran */}
                        <div className="card shadow-sm border-0 mb-3">
                            {/* Statistik Presensi */}
                            <div className="card-body">
                                <div className="row g-3 riwayat-presensi-statistik">

                                    <div className="col-6 col-md-4 col-xl">
                                        <div className="riwayat-presensi-stat-card total">
                                            <div>
                                                <span className="riwayat-presensi-label">
                                                    Total Presensi
                                                </span>
                                                <h3>{detail.total}</h3>
                                            </div>

                                            <div className="riwayat-presensi-icon">
                                                <i className="fas fa-calendar-check"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-4 col-xl">
                                        <div className="riwayat-presensi-stat-card hadir">
                                            <div>
                                                <span className="riwayat-presensi-label">
                                                    Hadir
                                                </span>
                                                <h3>{detail.hadir}</h3>
                                            </div>

                                            <div className="riwayat-presensi-icon">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-4 col-xl">
                                        <div className="riwayat-presensi-stat-card izin">
                                            <div>
                                                <span className="riwayat-presensi-label">
                                                    Izin
                                                </span>
                                                <h3>{detail.izin}</h3>
                                            </div>

                                            <div className="riwayat-presensi-icon">
                                                <i className="fas fa-user-clock"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-6 col-xl">
                                        <div className="riwayat-presensi-stat-card sakit">
                                            <div>
                                                <span className="riwayat-presensi-label">
                                                    Sakit
                                                </span>
                                                <h3>{detail.sakit}</h3>
                                            </div>

                                            <div className="riwayat-presensi-icon">
                                                <i className="fas fa-notes-medical"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-6 col-xl">
                                        <div className="riwayat-presensi-stat-card alpha">
                                            <div>
                                                <span className="riwayat-presensi-label">
                                                    Alpha
                                                </span>
                                                <h3>{detail.alpha}</h3>
                                            </div>

                                            <div className="riwayat-presensi-icon">
                                                <i className="fas fa-times-circle"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-header bg-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h3 className="card-title mb-0">
                                        <i className="fas fa-chart-line text-success mr-2"></i>
                                        Progres Kehadiran
                                    </h3>
                                    <div className="text-end">
                                        <h2 className="fw-bold mb-0">
                                            {detail.persentase}%
                                        </h2>
                                        <span
                                            className={`badge ${detail.persentase >= 90
                                                ? "bg-success"
                                                : detail.persentase >= 75
                                                    ? "bg-primary"
                                                    : detail.persentase >= 60
                                                        ? "bg-warning text-dark"
                                                        : "bg-danger"
                                                }`}
                                        >
                                            {detail.persentase >= 90
                                                ? "Sangat Baik"
                                                : detail.persentase >= 75
                                                    ? "Baik"
                                                    : detail.persentase >= 60
                                                        ? "Cukup"
                                                        : "Perlu Perhatian"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="progress progress-lg">
                                    <div
                                        className={`progress-bar ${detail.persentase >= 90
                                            ? "bg-success"
                                            : detail.persentase >= 75
                                                ? "bg-primary"
                                                : detail.persentase >= 60
                                                    ? "bg-warning"
                                                    : "bg-danger"
                                            }`}
                                        role="progressbar"
                                        style={{
                                            width: `${detail.persentase}%`,
                                        }}

                                    >
                                        {detail.persentase}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter Riwayat Presensi */}
                        <div className="card shadow-sm border-0 mb-4">

                            {/* Header */}
                            <div className="card-header bg-white">

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                                    <h3 className="card-title mb-0">
                                        <i className="fas fa-filter text-primary me-2"></i>
                                        Filter Riwayat Presensi
                                    </h3>

                                    <span className="badge bg-primary">
                                        {histories.length} Data
                                    </span>

                                </div>

                            </div>


                            <div className="card-body">

                                <div className="row g-4">

                                    {/* =================================================
                KOLOM KIRI
                FILTER RENTANG TANGGAL
            ================================================= */}
                                    <div className="col-12 col-lg-6">

                                        <div className="border rounded-3 p-3 h-100">

                                            <h6 className="fw-bold mb-3">
                                                <i className="fas fa-calendar-alt text-warning me-2"></i>
                                                Filter Rentang Tanggal
                                            </h6>


                                            <div className="row g-3">

                                                {/* Tanggal Awal */}
                                                <div className="col-12 col-md-6">

                                                    <label className="form-label fw-semibold">
                                                        <i className="fas fa-calendar-day text-success me-2"></i>
                                                        Tanggal Awal
                                                    </label>

                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={startDate}
                                                        onChange={(e) =>
                                                            setStartDate(e.target.value)
                                                        }
                                                    />

                                                </div>


                                                {/* Tanggal Akhir */}
                                                <div className="col-12 col-md-6">

                                                    <label className="form-label fw-semibold">
                                                        <i className="fas fa-calendar-check text-danger me-2"></i>
                                                        Tanggal Akhir
                                                    </label>

                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={endDate}
                                                        onChange={(e) =>
                                                            setEndDate(e.target.value)
                                                        }
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================================
                KOLOM KANAN
                FILTER TAHUN & BULAN
            ================================================= */}
                                    <div className="col-12 col-lg-6">

                                        <div className="border rounded-3 p-3 h-100">

                                            <h6 className="fw-bold mb-3">
                                                <i className="fas fa-calendar-alt text-primary me-2"></i>
                                                Filter Tahun & Bulan
                                            </h6>


                                            <div className="row g-3">

                                                {/* Tahun */}
                                                <div className="col-12 col-md-6">

                                                    <label className="form-label fw-semibold">
                                                        <i className="fas fa-calendar text-primary me-2"></i>
                                                        Tahun
                                                    </label>

                                                    <select
                                                        className="form-select"
                                                        value={filterYear}
                                                        onChange={(e) =>
                                                            setFilterYear(e.target.value)
                                                        }
                                                    >

                                                        <option value="">
                                                            Semua Tahun
                                                        </option>

                                                        {availableYears.map((year) => (

                                                            <option
                                                                key={year}
                                                                value={year}
                                                            >
                                                                {year}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>


                                                {/* Bulan */}
                                                <div className="col-12 col-md-6">

                                                    <label className="form-label fw-semibold">
                                                        <i className="fas fa-calendar-days text-success me-2"></i>
                                                        Bulan
                                                    </label>

                                                    <select
                                                        className="form-select"
                                                        value={filterMonth}
                                                        onChange={(e) =>
                                                            setFilterMonth(e.target.value)
                                                        }
                                                    >

                                                        <option value="">
                                                            Semua Bulan
                                                        </option>

                                                        {months.map((month) => (

                                                            <option
                                                                key={month.value}
                                                                value={month.value}
                                                            >
                                                                {month.label}
                                                            </option>

                                                        ))}

                                                    </select>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================================
            FOOTER FILTER
        ================================================= */}
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4">

                                    {/* Informasi Filter Aktif */}
                                    <div className="d-flex flex-wrap gap-2">

                                        {(filterYear ||
                                            filterMonth ||
                                            startDate ||
                                            endDate) ? (

                                            <>
                                                <span className="text-muted fw-semibold">
                                                    <i className="fas fa-filter me-1"></i>
                                                    Filter aktif:
                                                </span>

                                                {filterYear && (
                                                    <span className="badge bg-primary">
                                                        Tahun: {filterYear}
                                                    </span>
                                                )}

                                                {filterMonth && (
                                                    <span className="badge bg-success">
                                                        Bulan:{" "}
                                                        {
                                                            months.find(
                                                                (month) =>
                                                                    month.value === filterMonth
                                                            )?.label
                                                        }
                                                    </span>
                                                )}

                                                {startDate && (
                                                    <span className="badge bg-warning text-dark">
                                                        Mulai: {startDate}
                                                    </span>
                                                )}

                                                {endDate && (
                                                    <span className="badge bg-danger">
                                                        Sampai: {endDate}
                                                    </span>
                                                )}
                                            </>

                                        ) : (

                                            <span className="text-muted">
                                                <i className="fas fa-info-circle me-1"></i>
                                                Tidak ada filter aktif
                                            </span>

                                        )}

                                    </div>


                                    {/* Reset */}
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setFilterYear("");
                                            setFilterMonth("");
                                            setStartDate("");
                                            setEndDate("");
                                        }}
                                    >
                                        <i className="fas fa-rotate-left me-2"></i>
                                        Reset Filter
                                    </button>

                                </div>

                            </div>

                        </div>

                        {/* Riwayat Presensi */}
                        <div className="card shadow-sm border-0">

                            {/* Header */}
                            <div className="card-header bg-white">

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                                    <h3 className="card-title mb-0">

                                        <i className="fas fa-history text-primary me-2"></i>

                                        Riwayat Presensi

                                    </h3>

                                    <span className="badge bg-primary fs-6">

                                        {histories.length} Hari

                                    </span>

                                </div>

                            </div>

                            {/* Body */}
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover table-striped align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th
                                                    className="text-center"
                                                    style={{ width: "70px" }}
                                                >
                                                    No
                                                </th>

                                                <th>
                                                    <i className="far fa-calendar me-2 text-primary"></i>
                                                    Tanggal
                                                </th>
                                                <th>NIS</th>
                                                <th>NISN</th>
                                                <th className="w-auto" >Nama</th>
                                                <th>
                                                    <i className="fas fa-school me-2 text-success"></i>
                                                    Kelas
                                                </th>

                                                <th
                                                    className="text-center"
                                                    style={{ width: "140px" }}
                                                >
                                                    Status
                                                </th>

                                                <th style={{ minWidth: "220px" }}>
                                                    Keterangan
                                                </th>
                                                <th>Aksi</th>
                                            </tr>

                                        </thead>

                                        <tbody>

                                            {histories.length === 0 ? (

                                                <tr>

                                                    <td
                                                        colSpan={8}
                                                        className="text-center py-5"
                                                    >

                                                        <i className="fas fa-folder-open fa-3x text-muted mb-3 d-block"></i>

                                                        <h5 className="text-muted mb-2">
                                                            Belum Ada Riwayat
                                                        </h5>

                                                        <p className="text-muted mb-0">
                                                            Riwayat presensi siswa akan tampil di sini.
                                                        </p>

                                                    </td>

                                                </tr>

                                            ) : (

                                                histories.map((item, index) => (

                                                    <tr key={item.attendanceId}>

                                                        <td className="text-center fw-semibold">

                                                            {index + 1}

                                                        </td>

                                                        <td>{item.tanggal}</td>
                                                        <td>{item.nis}</td>
                                                        <td>{item.nisn}</td>
                                                        <td className="w-auto">{item.nama}</td>
                                                        <td>{item.kelas}</td>

                                                        <td className="text-center">

                                                            {item.status === "Hadir" && (

                                                                <span className="badge bg-success rounded-pill px-3 py-2">

                                                                    <i className="fas fa-check-circle me-1"></i>

                                                                    Hadir

                                                                </span>

                                                            )}

                                                            {item.status === "Izin" && (

                                                                <span className="badge bg-warning text-dark rounded-pill px-3 py-2">

                                                                    <i className="fas fa-user-clock me-1"></i>

                                                                    Izin

                                                                </span>

                                                            )}

                                                            {item.status === "Sakit" && (

                                                                <span className="badge bg-info rounded-pill px-3 py-2">

                                                                    <i className="fas fa-notes-medical me-1"></i>

                                                                    Sakit

                                                                </span>

                                                            )}

                                                            {item.status === "Alpha" && (

                                                                <span className="badge bg-danger rounded-pill px-3 py-2">

                                                                    <i className="fas fa-times-circle me-1"></i>

                                                                    Alpha

                                                                </span>

                                                            )}

                                                        </td>

                                                        <td>

                                                            {item.keterangan ? (

                                                                <span>

                                                                    {item.keterangan}

                                                                </span>

                                                            ) : (

                                                                <span className="text-muted">

                                                                    <i className="fas fa-minus me-1"></i>

                                                                    Tidak ada keterangan

                                                                </span>

                                                            )}

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

                            {/* Footer */}

                            <div className="card-footer bg-white">

                                <div className="d-flex justify-content-between align-items-center flex-wrap">

                                    <small className="text-muted">

                                        <i className="fas fa-info-circle me-1"></i>

                                        Total Riwayat

                                    </small>

                                    <span className="badge bg-secondary fs-6">

                                        {histories.length} Hari

                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            </div>
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
                                    {/* Keterangan Izin */}
                                    {editStatus === "Izin" && (
                                        <div className="mt-3">
                                            <label className="form-label fw-semibold">
                                                <i className="fas fa-comment-alt text-primary me-2"></i>
                                                Keterangan Izin
                                            </label>

                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                placeholder="Masukkan alasan izin..."
                                                value={editKeterangan}
                                                onChange={(e) => setEditKeterangan(e.target.value)}
                                            />
                                        </div>
                                    )}
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