"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StudentAttendance {
    tanggal: string;
    tahunAjaran: string;
    kelas: string;

    studentId: string;
    nis: string;
    nisn: string;
    nama: string;
    jk: string;

    status: "Hadir" | "Izin" | "Sakit" | "Alpha";
}

export default function StudentAttendancePage() {

    const params = useParams();

    const kelasId = params.kelasId as string;
    const studentId = params.studentId as string;

    const [loading, setLoading] = useState(true);

    const [attendance, setAttendance] =
        useState<StudentAttendance[]>([]);

    useEffect(() => {

        if (!kelasId || !studentId) return;

        loadAttendance();

    }, [kelasId, studentId]);

    async function loadAttendance() {

        setLoading(true);

        try {

            const q = query(
                collection(db, "presensi"),
                where("kelasId", "==", kelasId)
            );

            const snapshot = await getDocs(q);

            const result: StudentAttendance[] = [];

            snapshot.forEach((doc) => {

                const data = doc.data();

                const siswa = (data.siswa || []).find(
                    (item: any) =>
                        item.studentId === studentId
                );

                if (siswa) {

                    result.push({

                        tanggal: data.tanggal,

                        tahunAjaran: data.tahunAjaran,

                        kelas: data.kelas,

                        studentId: siswa.studentId,

                        nis: siswa.nis,

                        nisn: siswa.nisn,

                        nama: siswa.nama,

                        jk: siswa.jk,

                        status: siswa.status,

                    });

                }

            });

            result.sort((a, b) =>
                b.tanggal.localeCompare(a.tanggal)
            );

            setAttendance(result);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    /**
     * Informasi siswa
     * Mengambil data dari presensi pertama
     */
    const student = attendance[0];

    /**
     * Statistik
     */

    const total = attendance.length;

    const hadir = useMemo(
        () =>
            attendance.filter(
                (x) => x.status === "Hadir"
            ).length,
        [attendance]
    );

    const izin = useMemo(
        () =>
            attendance.filter(
                (x) => x.status === "Izin"
            ).length,
        [attendance]
    );

    const sakit = useMemo(
        () =>
            attendance.filter(
                (x) => x.status === "Sakit"
            ).length,
        [attendance]
    );

    const alpha = useMemo(
        () =>
            attendance.filter(
                (x) => x.status === "Alpha"
            ).length,
        [attendance]
    );

    function getBadge(status: string) {

        switch (status) {

            case "Hadir":
                return "badge badge-success";

            case "Izin":
                return "badge badge-primary";

            case "Sakit":
                return "badge badge-warning";

            case "Alpha":
                return "badge badge-danger";

            default:
                return "badge badge-secondary";
        }
    }

    // Perhitungan persentase kehadiran
    const presentaseKehadiran = useMemo(() => {

        if (total === 0) return 0;
        return Math.round((hadir / total) * 100);
    }, [total, hadir]);

    return (

        <div className="content-wrapper py-2">

            {/* Header */}
            <section className="content-header mb-2">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>
                                Riwayat Presensi Siswa
                            </h3>
                        </div>

                        <Link
                            href={`/admin/guru/kelas/${kelasId}/presensi/rekap`}
                            className="btn btn-secondary"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
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
                                            {student?.nis || "-"}
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
                                            {student?.nisn || "-"}
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
                                            {student?.nama || "-"}
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
                                            className={`badge ${student?.jk === "L"
                                                ? "bg-primary"
                                                : "bg-pink"
                                                }`}
                                        >
                                            {student?.jk === "L"
                                                ? "Laki-laki"
                                                : student?.jk === "P"
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
                                            {student?.kelas || "-"}
                                        </h6>
                                    </div>
                                </div>

                                <div className="col-12 col-lg-4">
                                    <div className="border rounded-3 p-3 h-100 riwayat-presensi-item">
                                        <small className="text-muted d-block mb-1">
                                            <i className="fas fa-calendar-alt me-1 text-success"></i>
                                            Tahun Ajaran
                                        </small>
                                        <h6 className="mb-0 fw-bold">
                                            {student?.tahunAjaran || "-"}
                                        </h6>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Kehadiran */}
                    <div className="card shadow-sm border-0 mb-3">

                        <div className="card-header bg-white border-0">

                            <div className="d-flex justify-content-between align-items-center">

                                <h3 className="card-title mb-0">

                                    <i className="fas fa-chart-line text-success mr-2"></i>

                                    Progres Kehadiran

                                </h3>

                                <div className="text-end">

                                    <h2 className="fw-bold mb-0">
                                        {presentaseKehadiran}%
                                    </h2>

                                    <span
                                        className={`badge ${presentaseKehadiran >= 90
                                            ? "bg-success"
                                            : presentaseKehadiran >= 75
                                                ? "bg-primary"
                                                : presentaseKehadiran >= 60
                                                    ? "bg-warning text-dark"
                                                    : "bg-danger"
                                            }`}
                                    >
                                        {presentaseKehadiran >= 90
                                            ? "Sangat Baik"
                                            : presentaseKehadiran >= 75
                                                ? "Baik"
                                                : presentaseKehadiran >= 60
                                                    ? "Cukup"
                                                    : "Perlu Perhatian"}

                                    </span>

                                </div>

                            </div>

                        </div>

                        <div className="card-body">

                            <div className="progress progress-lg">

                                <div
                                    className={`progress-bar ${presentaseKehadiran >= 90
                                        ? "bg-success"
                                        : presentaseKehadiran >= 75
                                            ? "bg-primary"
                                            : presentaseKehadiran >= 60
                                                ? "bg-warning"
                                                : "bg-danger"
                                        }`}
                                    role="progressbar"
                                    style={{
                                        width: `${presentaseKehadiran}%`,
                                    }}

                                >
                                    {presentaseKehadiran}%
                                </div>

                            </div>

                        </div>
                        {/* Statistik Presensi */}
                        <div className="card-body">
                            <div className="row g-3 riwayat-presensi-statistik">

                                <div className="col-6 col-md-4 col-xl">
                                    <div className="riwayat-presensi-stat-card total">
                                        <div>
                                            <span className="riwayat-presensi-label">
                                                Total Presensi
                                            </span>
                                            <h3>{total}</h3>
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
                                            <h3>{hadir}</h3>
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
                                            <h3>{izin}</h3>
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
                                            <h3>{sakit}</h3>
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
                                            <h3>{alpha}</h3>
                                        </div>

                                        <div className="riwayat-presensi-icon">
                                            <i className="fas fa-times-circle"></i>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Riwayat Presensi */}
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h3 className="card-title">
                                Riwayat Presensi
                            </h3>
                        </div>

                        <div className="card-body p-0">
                            {loading ? (
                                <div className="p-4 text-center">
                                    Loading...
                                </div>
                            ) : (

                                <table className="table table-bordered table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "60px" }}>
                                                No
                                            </th>

                                            <th style={{ width: "150px" }}>
                                                Tanggal
                                            </th>

                                            <th>
                                                NIS
                                            </th>

                                            <th>
                                                NISN
                                            </th>

                                            <th>
                                                Nama
                                            </th>

                                            <th style={{ width: "80px" }}>
                                                L/P
                                            </th>

                                            <th style={{ width: "120px" }}>
                                                Status
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>
                                        {attendance.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4">
                                                    Belum ada riwayat presensi.
                                                </td>
                                            </tr>
                                        )}

                                        {attendance.map((item, index) => (
                                            <tr
                                                key={index}
                                                className={
                                                    item.status === "Alpha"
                                                        ? "table-danger"
                                                        : ""
                                                }
                                            >
                                                <td>{index + 1}</td>
                                                <td>{item.tanggal}</td>
                                                <td>{item.nis}</td>
                                                <td>{item.nisn}</td>
                                                <td>{item.nama}</td>
                                                <td>{item.jk}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${item.status === "Hadir"
                                                            ? "bg-success"
                                                            : item.status === "Izin"
                                                                ? "bg-primary"
                                                                : item.status === "Sakit"
                                                                    ? "bg-warning text-dark"
                                                                    : item.status === "Alpha"
                                                                        ? "bg-danger"
                                                                        : "bg-secondary"
                                                            }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            )}

                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}