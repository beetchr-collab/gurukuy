"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
    getPenilaianById,
    getNilaiByPenilaian,
    saveNilai,
    NilaiSiswa,
    updatePenilaian,
} from "@/services/penilaian.service";
import { useModal } from "@/components/modals/useModal";

export default function InputNilaiPage() {
    const params = useParams();
    const penilaianId = params.penilaianId as string;
    const router = useRouter();
    const { showModal } = useModal();
    const [penilaian, setPenilaian] = useState<any>(null);

    const [students, setStudents] = useState<NilaiSiswa[]>([]);

    const [keyword, setKeyword] = useState("");
    const [statusNilai, setStatusNilai] = useState("semua");
    const [showEditModal, setShowEditModal] = useState(false); // Update Informasi Penilaian
    const [formEdit, setFormEdit] = useState({
        namaKelas: "",
        topik: "",
        subtopik: "",
        deskripsi: "",
        kkm: 75,
    }); // Update Informasi Penilaian

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

    const getStatusNilai = (nilai: number | "") => {
        if (nilai === "") return "belum-dinilai";
        if (Number(nilai) >= Number(penilaian?.kkm)) return "tuntas";
        if (Number(nilai) >= 60) return "belum-tuntas";
        return "kurang";
    };

    const filtered = students.filter((item) =>
        item.nama.toLowerCase().includes(keyword.toLowerCase()) &&
        (statusNilai === "semua" || getStatusNilai(item.nilai) === statusNilai)
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

    // Update Informasi Penilaian
    const openEditModal = () => {
        setFormEdit({
            namaKelas: penilaian.namaKelas,
            topik: penilaian.topik,
            subtopik: penilaian.subtopik,
            deskripsi: penilaian.deskripsi ?? "",
            kkm: penilaian.kkm,
        });

        setShowEditModal(true);
    };

    const handleUpdatePenilaian = async () => {
        try {
            await updatePenilaian(penilaianId, formEdit);

            setPenilaian({
                ...penilaian,
                ...formEdit,
            });

            setShowEditModal(false);

            showModal({
                type: "success",
                title: "Berhasil",
                message: "Informasi penilaian berhasil diperbarui."
            });

        } catch (error) {
            console.error(error);

            showModal({
                type: "error",
                title: "Gagal",
                message: "Informasi penilaian gagal diperbarui."
            });
        }
    };

    return (
        <>
            <div className="container-fluid py-2">

                {/* Header */}

                <div className="mb-3">

                    <h3 className="h3 font-weight-bold">
                        Daftar Nilai
                    </h3>
                </div>

                {/* Progress */}
                <div className="card shadow-sm mb-2">

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

                {/* Informasi Penilaian */}
                <div className="card shadow-sm border-0 mb-4 infonilai-card">

                    <div className="card-body py-3">

                        <div className="d-flex flex-wrap align-items-center gap-3">

                            {/* TITLE */}
                            <div className="d-flex align-items-center me-2">
                                <i className="fas fa-clipboard-check text-primary fs-5 me-2"></i>

                                <div>
                                    <div className="fw-bold">
                                        Informasi Penilaian
                                    </div>

                                    <small className="text-muted">
                                        Detail penilaian
                                    </small>
                                </div>
                            </div>

                            {/* SUB TOPIK */}
                            <div className="border-start ps-3">
                                <small className="text-muted d-block">
                                    Sub Topik
                                </small>

                                <span className="fw-semibold">
                                    {penilaian?.subtopik ?? "-"}
                                </span>
                            </div>

                            {/* KELAS */}
                            <div className="border-start ps-3">
                                <small className="text-muted d-block">
                                    Kelas
                                </small>

                                <span className="badge bg-success">
                                    {penilaian?.namaKelas ?? "-"}
                                </span>
                            </div>

                            {/* MAPEL */}
                            <div className="border-start ps-3">
                                <small className="text-muted d-block">
                                    Mata Pelajaran
                                </small>

                                <span className="badge bg-primary">
                                    {penilaian?.mapel ?? "-"}
                                </span>
                            </div>

                            {/* KKM */}
                            <div className="border-start ps-3">
                                <small className="text-muted d-block">
                                    KKM
                                </small>

                                <span className="badge bg-danger">
                                    {penilaian?.kkm ?? "-"}
                                </span>
                            </div>

                            {/* EDIT */}
                            <div className="ms-auto">
                                <button
                                    type="button"
                                    className="btn btn-warning btn-sm d-flex align-items-center"
                                    onClick={openEditModal}
                                    title="Edit Informasi Penilaian"
                                >
                                    <i className="fas fa-edit me-2"></i>
                                    Edit
                                </button>
                            </div>

                        </div>

                        {/* DESKRIPSI */}
                        {penilaian?.deskripsi && (
                            <div className="border-top mt-3 pt-2">
                                <small className="text-muted me-2">
                                    <i className="fas fa-align-left me-1"></i>
                                    Deskripsi/Kegiatan:
                                </small>

                                <span className="text-muted">
                                    {penilaian.deskripsi}
                                </span>
                            </div>
                        )}

                    </div>

                </div>

                {/* Tabel */}
                <div className="card shadow-sm border-0">

                   {/* Header */}
                    <div className="card-header bg-white border-bottom py-3">

    <div className="d-flex flex-wrap align-items-center gap-3 w-100">

        {/* TITLE */}
        <div className="flex-grow-1 min-w-0">
            <h3 className="card-title mb-1 fw-semibold text-nowrap">
                <i className="fas fa-user-graduate text-primary me-2"></i>
                Daftar Nilai Siswa
            </h3>
        </div>

        {/* FILTER */}
        <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">

            {/* STATUS */}
            <div className="filter-status">
                <select
                    className="form-select"
                    value={statusNilai}
                    onChange={(e) => setStatusNilai(e.target.value)}
                    aria-label="Filter status nilai"
                >
                    <option value="semua">Semua Status</option>
                    <option value="belum-dinilai">
                        Belum Dinilai
                    </option>
                    <option value="tuntas">
                        Tuntas
                    </option>
                    <option value="belum-tuntas">
                        Belum Tuntas
                    </option>
                    <option value="kurang">
                        Kurang
                    </option>
                </select>
            </div>

            {/* SEARCH */}
            <div className="filter-search">
                <div className="input-group">

                    <span className="input-group-text bg-white">
                        <i className="fas fa-search text-muted"></i>
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

            {/* Modal Edit Informasi Penilaian */}
            {showEditModal && (
                <>
                    <div
                        className="modal fade show"
                        style={{ display: "block", backgroundColor: "rgba(0,0,0,.5)" }}
                        tabIndex={-1}
                    >
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg">

                                {/* Header */}
                                <div className="modal-header bg-warning">
                                    <h5 className="modal-title fw-bold text-dark">
                                        <i className="fas fa-edit me-2"></i>
                                        Edit Informasi Penilaian
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowEditModal(false)}
                                    />
                                </div>

                                {/* Body */}
                                <div className="modal-body">

                                    <div className="row g-3">

                                        {/* Mata Pelajaran */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Mata Pelajaran
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={penilaian?.mapel ?? ""}
                                                readOnly
                                            />
                                        </div>

                                        {/* Kelas */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Kelas
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={penilaian?.namaKelas ?? ""}
                                                readOnly
                                            />
                                        </div>
                                        {/* Topik */}
                                        <div className="col-md-12">
                                            <label className="form-label fw-semibold">
                                                Topik
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formEdit.topik}
                                                onChange={(e) =>
                                                    setFormEdit({
                                                        ...formEdit,
                                                        topik: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        {/* Subtopik */}
                                        <div className="col-md-12">
                                            <label className="form-label fw-semibold">
                                                Sub Topik
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formEdit.subtopik}
                                                onChange={(e) =>
                                                    setFormEdit({
                                                        ...formEdit,
                                                        subtopik: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        {/* Deskripsi */}
                                        <div className="col-md-12">
                                            <label className="form-label fw-semibold">
                                                Deskripsi
                                            </label>

                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                value={formEdit.deskripsi}
                                                onChange={(e) =>
                                                    setFormEdit({
                                                        ...formEdit,
                                                        deskripsi: e.target.value,
                                                    })
                                                }
                                                placeholder="Tambahkan deskripsi atau catatan..."
                                            />
                                        </div>

                                        {/* KKM */}
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                KKM
                                            </label>

                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                className="form-control"
                                                value={formEdit.kkm}
                                                onChange={(e) =>
                                                    setFormEdit({
                                                        ...formEdit,
                                                        kkm: Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="modal-footer">

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Batal
                                    </button>

                                    <button
                                        className="btn btn-primary"
                                        onClick={handleUpdatePenilaian}
                                    >
                                        <i className="fas fa-save me-2"></i>
                                        Simpan Perubahan
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Backdrop */}
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>

    );
}