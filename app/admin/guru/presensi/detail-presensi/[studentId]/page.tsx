"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import {
    getStudentAttendanceDetail,
    StudentAttendanceDetail,
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

    const histories = useMemo(() => {

        if (!detail) return [];

        return detail.history.filter((item) => {

            if (
                startDate &&
                item.tanggal < startDate
            ) {
                return false;
            }

            if (
                endDate &&
                item.tanggal > endDate
            ) {
                return false;
            }

            return true;

        });

    }, [detail, startDate, endDate]);

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

                    {/* Filter Data berdasarkan Tanggal */}
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-white">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <h3 className="card-title mb-0">
                                    <i className="fas fa-filter text-primary me-2"></i>
                                    Filter Riwayat Presensi
                                </h3>
                                <span className="badge bg-primary">
                                    Filter Data
                                </span>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {/* Tanggal Awal */}
                                <div className="col-12 col-md-5">
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
                                <div className="col-12 col-md-5">
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

                                {/* Tombol */}
                                <div className="col-12 col-md-2 d-grid">
                                    <label className="form-label d-none d-md-block">
                                        &nbsp;
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setStartDate("");
                                            setEndDate("");

                                        }}
                                    >
                                        <i className="fas fa-rotate-left me-2"></i>
                                        Reset
                                    </button>
                                </div>
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

    );

}