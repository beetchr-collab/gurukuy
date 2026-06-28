"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PresensiPage() {
    const params = useParams();
    const kelasId = params.kelasId as string;

    return (
        <div className="content-wrapper py-2">

            {/* Header */}
            <section className="content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h3>Presensi Siswa</h3>
                            <small className="text-muted">
                                Kelola presensi anggota kelas
                            </small>
                        </div>

                        <Link
                            href={`/admin/guru/kelas/${kelasId}`}
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

                    {/* Informasi */}
                    <div className="card shadow-sm">

                        <div className="card-body">

                            <div className="row">

                                <div className="col-md-3">
                                    <label>Tanggal</label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        defaultValue={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label>Semester</label>

                                    <select className="form-control">
                                        <option>Ganjil</option>
                                        <option>Genap</option>
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label>Tahun Ajaran</label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="2026/2027"
                                    />
                                </div>

                                <div className="col-md-3 d-flex align-items-end">

                                    <button className="btn btn-primary btn-block">
                                        <i className="fas fa-plus mr-2"></i>
                                        Buat Presensi
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Statistik */}

                    <div className="row">

                        <div className="col-md-3">
                            <div className="small-box bg-info">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Total Siswa</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-users"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="small-box bg-success">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Hadir</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-check"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="small-box bg-warning">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Izin</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-user-clock"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <div className="small-box bg-danger">
                                <div className="inner">
                                    <h3>0</h3>
                                    <p>Alpha</p>
                                </div>

                                <div className="icon">
                                    <i className="fas fa-times"></i>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Riwayat */}

                    <div className="card shadow-sm">

                        <div className="card-header">

                            <h3 className="card-title">
                                Riwayat Presensi
                            </h3>

                        </div>

                        <div className="card-body p-0">

                            <table className="table table-hover">

                                <thead>

                                    <tr>
                                        <th style={{ width: 60 }}>No</th>
                                        <th>Tanggal</th>
                                        <th>Semester</th>
                                        <th>Tahun Ajaran</th>
                                        <th>Hadir</th>
                                        <th>Izin</th>
                                        <th>Sakit</th>
                                        <th>Alpha</th>
                                        <th style={{ width: 120 }}>Aksi</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="text-center text-muted py-4"
                                        >
                                            Belum ada data presensi
                                        </td>
                                    </tr>

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
}