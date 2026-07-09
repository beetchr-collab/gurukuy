"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    getPenilaianById,
    getNilaiByPenilaian,
    saveNilai,
    NilaiSiswa,
} from "@/services/penilaian.service";

export default function InputNilaiPage() {
    const params = useParams();
    const penilaianId = params.penilaianId as string;
    const router = useRouter();

    const [penilaian, setPenilaian] = useState<any>(null);

    const [students, setStudents] = useState<NilaiSiswa[]>([]);

    const [keyword, setKeyword] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [penilaianId]);

    async function loadData() {
        try {
            const data = await getPenilaianById(penilaianId);

            if (data) {
                setPenilaian(data);
            }

            const nilai = await getNilaiByPenilaian(penilaianId);

            setStudents(nilai);
        } finally {
            setLoading(false);
        }
    }

    const filtered = students.filter((item) =>
        item.nama.toLowerCase().includes(keyword.toLowerCase())
    );

    const handleChange = (studentId: string, value: string) => {
        if (Number(value) > 100) return;

        setStudents((prev) =>
            prev.map((item) =>
                item.studentId === studentId
                    ? {
                        ...item,
                        nilai: value === "" ? "" : Number(value),
                    }
                    : item
            )
        );
    };

    const total = students.length;

    const selesai = students.filter(
        (item) => item.nilai !== ""
    ).length;

    const progress =
        total === 0
            ? 0
            : Math.round((selesai / total) * 100);

    const handleSave = async () => {
        try {
            await saveNilai(penilaianId, students);

            alert("Nilai berhasil disimpan");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan nilai");
        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-3">
                Memuat data...
            </div>
        );
    }

    return (
        <div className="container-fluid py-2">

            {/* Header */}

            <div className="mb-4">

                <h3 className="h3 font-weight-bold">
                    Daftar Nilai
                </h3>
            </div>

            {/* Informasi Penilaian */}
            <div className="card shadow-sm border-0 mb-4 infonilai-card">

                <div className="card-header bg-white border-0 pb-0">
                    <h5 className="fw-bold mb-0">
                        <i className="fas fa-clipboard-check text-primary me-2"></i>
                        Informasi Penilaian
                    </h5>
                </div>

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-12 col-sm-6 col-lg-3">
                            <div className="infonilai-info-item">
                                <div className="infonilai-icon bg-primary">
                                    <i className="fas fa-book"></i>
                                </div>

                                <div>
                                    <small className="text-muted d-block">
                                        Topik Penilaian
                                    </small>

                                    <div className="fw-bold">
                                        {penilaian?.topik ?? "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-3">
                            <div className="infonilai-info-item">
                                <div className="infonilai-icon bg-success">
                                    <i className="fas fa-users"></i>
                                </div>

                                <div>
                                    <small className="text-muted d-block">
                                        Kelas
                                    </small>

                                    <span className="badge bg-success">
                                        {penilaian?.namaKelas ?? "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-3">
                            <div className="infonilai-info-item">
                                <div className="infonilai-icon bg-warning text-dark">
                                    <i className="fas fa-book-open"></i>
                                </div>

                                <div>
                                    <small className="text-muted d-block">
                                        Mata Pelajaran
                                    </small>

                                    <span className="badge bg-primary">
                                        {penilaian?.mapel ?? "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-3">
                            <div className="infonilai-info-item">
                                <div className="infonilai-icon bg-danger">
                                    <i className="fas fa-award"></i>
                                </div>

                                <div>
                                    <small className="text-muted d-block">
                                        KKM
                                    </small>

                                    <span className="badge bg-danger fs-6">
                                        {penilaian?.kkm ?? "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
            {/* Progress */}

            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between mb-2">

                        <strong>Progress Input Nilai</strong>

                        <span>
                            {selesai} / {total} siswa
                        </span>

                    </div>

                    <div
                        className="progress"
                        style={{
                            height: 10,
                        }}
                    >
                        <div
                            className="progress-bar"
                            style={{
                                width: `${progress}%`,
                            }}
                        ></div>
                    </div>

                    <div className="text-right mt-2 font-weight-bold">
                        {progress}%
                    </div>

                </div>

            </div>

            {/* Tabel */}

            <div className="card shadow-sm border-0">

                {/* Header */}
                <div className="card-header bg-white border-bottom">

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                        <h3 className="card-title mb-0 fw-semibold">
                            <i className="fas fa-user-graduate text-primary me-2"></i>
                            Daftar Nilai Siswa
                        </h3>

                        <div style={{ maxWidth: 320, width: "100%" }}>
                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    <i className="fas fa-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cari siswa..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />

                            </div>
                        </div>

                    </div>

                </div>

                {/* Table */}
                <div className="table-responsive">

                    <table className="table table-hover table-striped align-middle mb-0">

                        <thead className="table-light">

                            <tr>
                                <th className="text-center" style={{ width: 60 }}>No</th>

                                <th>NIS</th>

                                <th>NISN</th>

                                <th style={{ minWidth: 250 }}>Nama Siswa</th>

                                <th className="text-center" style={{ width: 80 }}>
                                    JK
                                </th>

                                <th className="text-center" style={{ width: 140 }}>
                                    Nilai
                                </th>
                                <th className="text-center" style={{ width: 180 }}>
                                    Keterangan
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            {filtered.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={6}
                                        className="text-center py-5 text-muted"
                                    >
                                        <i className="fas fa-users-slash fa-2x mb-3 d-block"></i>

                                        Tidak ada data siswa
                                    </td>

                                </tr>

                            ) : (

                                filtered.map((item, index) => (

                                    <tr key={item.studentId}>

                                        <td className="text-center">
                                            {index + 1}
                                        </td>

                                        <td>{item.nis}</td>

                                        <td>{item.nisn}</td>

                                        <td>
                                            <div className="fw-semibold">
                                                {item.nama}
                                            </div>
                                        </td>

                                        <td className="text-center">

                                            <span className={`badge ${item.jk === "L"
                                                ? "bg-primary"
                                                : "bg-danger"
                                                }`}>
                                                {item.jk}
                                            </span>

                                        </td>

                                        <td>

                                            <input
                                                type="number"
                                                className="form-control text-center"
                                                min={0}
                                                max={100}
                                                style={{ width: "80px", minWidth: "80px" }}
                                                value={item.nilai}
                                                onChange={(e) =>
                                                    handleChange(
                                                        item.studentId,
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </td>
                                        <td className="text-center">
                                            {item.nilai === "" ? (
                                                <span className="badge bg-secondary">
                                                    Belum Dinilai
                                                </span>
                                            ) : Number(item.nilai) >= Number(penilaian?.kkm) ? (
                                                <span className="badge bg-success">
                                                    Tuntas
                                                </span>
                                            ) : (
                                                <div>
                                                    <span className="badge bg-danger">
                                                        Belum Tuntas
                                                    </span>
                                                    <div className="small text-danger mt-1">
                                                        Kurang {Number(penilaian?.kkm) - Number(item.nilai)} poin
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {/* Footer */}
                <div className="card-footer bg-white">

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                        <small className="text-muted">
                            Total Siswa : <strong>{filtered.length}</strong>
                        </small>

                        <div className="d-flex gap-2 flex-wrap">

                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => router.back()}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Kembali
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                            >
                                <i className="fas fa-save me-2"></i>
                                Simpan Nilai
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}