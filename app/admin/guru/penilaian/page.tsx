"use client";

import Link from "next/link";

const dummyData = [
    {
        id: "1",
        nama: "UH Bab 1",
        kelas: "VII A",
        jenis: "UH",
        tanggal: "12 Juli 2026",
        progress: 100,
    },
    {
        id: "2",
        nama: "Tugas 1",
        kelas: "VII B",
        jenis: "Tugas",
        tanggal: "15 Juli 2026",
        progress: 75,
    },
    {
        id: "3",
        nama: "PTS Ganjil",
        kelas: "VIII A",
        jenis: "PTS",
        tanggal: "20 September 2026",
        progress: 40,
    },
];

export default function PenilaianPage() {
    const total = dummyData.length;

    const selesai = dummyData.filter(
        (item) => item.progress === 100
    ).length;

    const belum = total - selesai;

    const rataRata =
        Math.round(
            dummyData.reduce(
                (acc, item) => acc + item.progress,
                0
            ) / total
        ) || 0;

    return (
        <div className="container-fluid">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 font-weight-bold">
                        Penilaian
                    </h1>
                    <p className="text-muted mb-0">
                        Kelola seluruh penilaian siswa
                    </p>
                </div>

                <Link
                    href="/admin/guru/penilaian/tambah"
                    className="btn btn-primary"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Tambah Penilaian
                </Link>
            </div>

            {/* Statistik */}
            <div className="row mb-4">

                <div className="col-md-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Total Penilaian
                            </small>

                            <h2>{total}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Belum Selesai
                            </small>

                            <h2>{belum}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Sudah Selesai
                            </small>

                            <h2>{selesai}</h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <small className="text-muted">
                                Progress Rata-rata
                            </small>

                            <h2>{rataRata}%</h2>
                        </div>
                    </div>
                </div>

            </div>

            {/* Filter */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">

                    <div className="row">

                        <div className="col-md-4">
                            <select className="form-control">
                                <option>Semua Semester</option>
                            </select>
                        </div>

                        <div className="col-md-4">
                            <select className="form-control">
                                <option>Semua Kelas</option>
                            </select>
                        </div>

                        <div className="col-md-4">
                            <select className="form-control">
                                <option>Semua Jenis</option>
                            </select>
                        </div>

                    </div>

                </div>
            </div>

            {/* Tabel */}
            <div className="card shadow-sm">

                <div className="card-header">
                    <h3 className="card-title">
                        Daftar Penilaian
                    </h3>
                </div>

                <div className="card-body table-responsive p-0">

                    <table className="table table-hover">

                        <thead>

                            <tr>
                                <th>No</th>
                                <th>Nama Penilaian</th>
                                <th>Kelas</th>
                                <th>Jenis</th>
                                <th>Tanggal</th>
                                <th style={{ width: "220px" }}>
                                    Progress
                                </th>
                                <th style={{ width: "100px" }}>
                                    Aksi
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            {dummyData.map((item, index) => (

                                <tr key={item.id}>

                                    <td>{index + 1}</td>

                                    <td>{item.nama}</td>

                                    <td>{item.kelas}</td>

                                    <td>{item.jenis}</td>

                                    <td>{item.tanggal}</td>

                                    <td>

                                        <div className="d-flex align-items-center">

                                            <div
                                                className="progress flex-grow-1"
                                                style={{ height: 8 }}
                                            >
                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${item.progress}%`,
                                                    }}
                                                ></div>
                                            </div>

                                            <span className="ml-2 font-weight-bold">
                                                {item.progress}%
                                            </span>

                                        </div>

                                    </td>

                                    <td>

                                        <Link
                                            href={`/admin/guru/penilaian/${item.id}`}
                                            className="btn btn-info btn-sm"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </Link>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}