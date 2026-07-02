"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSchoolById } from "@/lib/sekolah";
import { getActiveTahunAjaran } from "@/services/tahunajaran.service";
import { getClassesByOwner } from "@/services/kelas.service";
import { MATA_PELAJARAN } from "@/lib/mata-pelajaran";
import { JENIS_PENILAIAN } from "@/lib/jenis-penilaian";
import Select from "react-select";
import {
    AnggotaKelas,
    getAnggotaKelas,
} from "@/services/anggotakelas.service";
import {
    createPenilaian,
    getTopikByMapel,
} from "@/services/penilaian.service";
import CreatableSelect from "react-select/creatable";

export default function TambahPenilaianPage() {

    const { user } = useAuth();

    const [school, setSchool] = useState<any>(null);
    const [tahunajaran, setTahunAjaran] = useState<any>(null);
    const [kelas, setKelas] = useState<any[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<string>("");
    const [students, setStudents] = useState<AnggotaKelas[]>([]);
    const [scores, setScores] = useState<Record<string, number | "">>({});

    // Menampilkan informasi sekolah
    const loadSchool = async () => {
        if (!user?.schoolId) return;

        const schoolData = await getSchoolById(user.schoolId);
        setSchool(schoolData);
    };

    // Menampilkan tahun ajaran
    const loadTahunAjaran = async () => {
        if (!user?.schoolId) return;

        const tahunajaranData = await getActiveTahunAjaran(user.schoolId);
        setTahunAjaran(tahunajaranData);
    };

    // Menampilkan kelas
    const loadKelas = async () => {
        if (!user?.schoolId) return;

        const kelasData = await getClassesByOwner(user.uid);
        setKelas(kelasData);
    };

    // Menampilkan mata pelajaran
    const loadSubjects = async () => {
        // TODO: implement subject loading logic
    };

    // Memuat data saat user tersedia
    useEffect(() => {
        if (!user?.schoolId) return;

        loadSchool();
        loadTahunAjaran();
        loadKelas();
        loadSubjects();
    }, [user]);

    // Form state
    const [form, setForm] = useState({
        topik: "",
        subtopik: "",
        jenisPenilaian: "",
        kelasId: "",
        mapel: "",
        tahunAjaran: "",
        kkm: "75",
        deskripsi: "",
        tanggalPenilaian: new Date().toISOString().split("T")[0],
    });

    // Handle form input changes
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Simpan data ke firebase
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("User tidak ditemukan.");
            return;
        }

        if (!user.schoolId) {
            alert("School ID tidak ditemukan.");
            return;
        }

        if (!selectedKelas) {
            alert("Silakan pilih kelas.");
            return;
        }

        const kelasAktif = kelas.find(
            (item) => item.id === selectedKelas
        );

        if (!kelasAktif) {
            alert("Data kelas tidak ditemukan.");
            return;
        }

        try {

            console.log("DATA USER", user);

            console.log({
                schoolId: user.schoolId,
                ownerId: user.uid,
                ownerName: user.username,
            });

            const penilaianId = await createPenilaian(
                {
                    schoolId: user.schoolId,
                    ownerId: user.uid,
                    ownerName: user.username ?? "",

                    kelasId: kelasAktif.id,
                    namaKelas: kelasAktif.namaKelas,
                    tingkatKelas: kelasAktif.tingkatKelas,

                    mapel: form.mapel,
                    topik: form.topik,
                    subtopik: form.subtopik,
                    jenisPenilaian: form.jenisPenilaian,

                    kkm: Number(form.kkm),
                    deskripsi: form.deskripsi,

                    tanggalPenilaian: form.tanggalPenilaian,
                    tahunAjaran: tahunajaran?.tahunAjaran ?? "",
                },
                students,
                scores
            );

            console.log("Penilaian berhasil:", penilaianId);

            alert("Penilaian berhasil disimpan.");

        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan penilaian.");
        }
    };

    // Isian tanggal otomatis
    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            tanggal: prev.tanggalPenilaian || new Date().toISOString().split("T")[0],
        }));
    }, []);

    // Form Select dengan pencarian
    const kelasOptions = kelas.map((item) => ({
        value: item.id,
        label: `${item.tingkatKelas} - ${item.namaKelas}`,
    }));

    const mapelOptions = MATA_PELAJARAN.map((item) => ({
        value: item.namaMataPelajaran,
        label: item.namaMataPelajaran,
    }));

    const jenisPenilaianOptions = JENIS_PENILAIAN.map((item) => ({
        value: item.namaPenilaian,
        label: item.namaPenilaian,
    }));

    // Input Nilai
    const handleScoreChange = (
        studentId: string,
        value: string
    ) => {
        setScores((prev) => ({
            ...prev,
            [studentId]:
                value === ""
                    ? ""
                    : Math.min(100, Math.max(0, Number(value))),
        }));
    };

    // Mengambil topik berdasarkan mata pelajaran yang dipilih
    const [topikOptions, setTopikOptions] = useState<
        { label: string; value: string }[]
    >([]);
    useEffect(() => {
        async function loadTopik() {
            if (!form.mapel) {
                setTopikOptions([]);
                return;
            }

            const ownerId = user?.uid;

            if (!ownerId) return;

            const data = await getTopikByMapel(
                ownerId,
                form.mapel
            );

            setTopikOptions(
                data.map((item) => ({
                    label: item,
                    value: item,
                }))
            );
        }

        loadTopik();
    }, [form.mapel]);


    return (
        <div className="container-fluid py-2">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="h3 font-weight-bold">
                        Tambah Penilaian
                    </h3>
                </div>

                <Link
                    href="/admin/guru/penilaian"
                    className="btn btn-secondary"
                >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Kembali
                </Link>
            </div>

            {/* Informasi Sekolah */}
            {school && (
                <div className="card shadow-sm border-0 mb-3 sekolah-info-card">
                    <div className="card-body">

                        <div className="row align-items-center g-3">

                            {/* Logo */}
                            <div className="col-auto">
                                <div className="sekolah-info-icon">
                                    <i className="fas fa-school"></i>
                                </div>
                            </div>

                            {/* Nama Sekolah */}
                            <div className="col">
                                <h4 className="fw-bold mb-1">
                                    {school.namaSekolah}
                                </h4>

                                <small className="text-success">
                                    <i className="fas fa-check-circle me-1"></i>
                                    Data Sekolah Aktif
                                </small>
                            </div>

                            {/* Tahun Ajaran */}
                            {tahunajaran && (
                                <div className="col-12 col-md-auto">
                                    <div className="tahun-ajaran-box">

                                        <small className="text-muted d-block">
                                            Tahun Ajaran
                                        </small>

                                        <div className="fw-bold text-primary">
                                            <i className="fas fa-calendar-alt me-2"></i>
                                            {tahunajaran.tahunAjaran}
                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="card shadow-sm">

                    <div className="card-header">
                        <h3 className="card-title">
                            Form Penilaian
                        </h3>
                    </div>
                    {/* Form Penilaian */}
                    <div className="card-body">

                        <div className="row g-4">

                            {/* Kelas */}
                            <div className="col-lg-6">
                                <label className="form-label fw-semibold">
                                    Kelas
                                </label>

                                <Select
                                    options={kelasOptions}
                                    placeholder="Cari atau pilih kelas..."
                                    value={kelasOptions.find(
                                        x => x.value === selectedKelas
                                    )}
                                    onChange={async (e) => {
                                        if (!e) return;

                                        setSelectedKelas(e.value);

                                        const data = await getAnggotaKelas(e.value);

                                        setStudents(data);

                                        const nilaiAwal: Record<string, number | ""> = {};

                                        data.forEach((s) => {
                                            nilaiAwal[s.studentId] = "";
                                        });

                                        setScores(nilaiAwal);
                                    }}
                                    isSearchable
                                />
                            </div>

                            {/* Mata Pelajaran */}
                            <div className="col-lg-6">
                                <label className="form-label fw-semibold">
                                    Mata Pelajaran
                                </label>

                                <Select
                                    options={mapelOptions}
                                    placeholder="Cari mata pelajaran..."
                                    value={mapelOptions.find(
                                        x => x.value === form.mapel
                                    )}
                                    onChange={(e) => e && setForm({ ...form, mapel: e.value, })
                                    }
                                    isSearchable
                                />
                            </div>

                            {/* Topik */}
                            <div className="col-lg-6">
                                <label className="form-label fw-semibold">
                                    Topik
                                </label>

                                <CreatableSelect
                                    options={topikOptions}
                                    placeholder="Cari atau ketik topik..."
                                    value={
                                        form.topik
                                            ? {
                                                label: form.topik,
                                                value: form.topik,
                                            }
                                            : null
                                    }
                                    onChange={(selected) =>
                                        setForm({
                                            ...form,
                                            topik: selected?.value || "",
                                        })
                                    }
                                    onCreateOption={(inputValue) =>
                                        setForm({
                                            ...form,
                                            topik: inputValue,
                                        })
                                    }
                                    isClearable
                                />
                            </div>

                            {/* Sub Topik */}
                            <div className="col-lg-6">
                                <label className="form-label fw-semibold">
                                    Sub Topik
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="subtopik"
                                    value={form.subtopik}
                                    onChange={handleChange}
                                    placeholder="Contoh: Penjumlahan dan Pengurangan"
                                />
                            </div>

                            {/* Jenis Penilaian */}
                            <div className="col-lg-4">
                                <label className="form-label fw-semibold">
                                    Jenis Penilaian
                                </label>

                                <Select
                                    options={jenisPenilaianOptions}
                                    placeholder="Pilih jenis..."
                                    value={jenisPenilaianOptions.find(
                                        x => x.value === form.jenisPenilaian
                                    )}
                                    onChange={(e) => e && setForm({ ...form, jenisPenilaian: e.value, })
                                    }
                                    isSearchable
                                />
                            </div>

                            {/* Tanggal */}
                            <div className="col-lg-4">
                                <label className="form-label fw-semibold">
                                    Tanggal Penilaian
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="tanggalPenilaian"
                                    value={form.tanggalPenilaian}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* KKM */}
                            <div className="col-lg-4">
                                <label className="form-label fw-semibold">
                                    KKM
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    max="100"
                                    name="kkm"
                                    value={form.kkm}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Deskripsi */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">
                                    Deskripsi
                                    <span className="badge bg-warning text-light border ms-2">
                                        Opsional
                                    </span>
                                </label>

                                <textarea
                                    rows={4}
                                    className="form-control"
                                    placeholder="Tambahkan deskripsi atau catatan..."
                                    name="deskripsi"
                                    value={form.deskripsi}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                    </div>

                    {/* Tabel Nilai */}
                    {selectedKelas && (
                        <div className="card-body shadow-sm mt-4">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    Daftar Peserta Penilaian
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 60 }}>No</th>
                                                <th>NIS</th>
                                                <th>NISN</th>
                                                <th>Nama</th>
                                                <th>L/P</th>
                                                <th style={{ width: 170 }}>Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="text-center py-4"
                                                    >
                                                        Tidak ada anggota kelas
                                                    </td>
                                                </tr>
                                            ) : (
                                                students.map((student, index) => (
                                                    <tr key={student.studentId}>
                                                        <td>{index + 1}</td>
                                                        <td>{student.nis}</td>
                                                        <td>{student.nisn}</td>
                                                        <td>{student.nama}</td>
                                                        <td>{student.jk}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                min={0}
                                                                max={100}
                                                                value={
                                                                    scores[
                                                                    student.studentId
                                                                    ] ?? ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleScoreChange(
                                                                        student.studentId,
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card-footer d-flex justify-content-end">

                        <Link
                            href="/admin/guru/penilaian"
                            className="btn btn-secondary mr-2"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            <i className="fas fa-save mr-2"></i>
                            Simpan Penilaian
                        </button>

                    </div>

                </div>
            </form>
        </div>
    );
}