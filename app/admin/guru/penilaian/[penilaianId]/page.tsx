"use client";

import { useState } from "react";

interface StudentScore {
    id: string;
    nama: string;
    jk: string;
    nilai: string;
}

export default function InputNilaiPage() {
    const [students, setStudents] = useState<StudentScore[]>([
        {
            id: "1",
            nama: "Ahmad Fauzi",
            jk: "L",
            nilai: "90",
        },
        {
            id: "2",
            nama: "Budi Santoso",
            jk: "L",
            nilai: "",
        },
        {
            id: "3",
            nama: "Citra Lestari",
            jk: "P",
            nilai: "85",
        },
        {
            id: "4",
            nama: "Dinda Putri",
            jk: "P",
            nilai: "",
        },
    ]);

    const [keyword, setKeyword] = useState("");

    const filtered = students.filter((item) =>
        item.nama.toLowerCase().includes(keyword.toLowerCase())
    );

    const handleChange = (id: string, value: string) => {
        if (Number(value) > 100) return;

        setStudents((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          nilai: value,
                      }
                    : item
            )
        );
    };

    const total = students.length;
    const selesai = students.filter((s) => s.nilai !== "").length;
    const progress = Math.round((selesai / total) * 100);

    const handleSave = () => {
        console.log(students);

        alert("Nilai berhasil disimpan");
    };

    return (
        <div className="container-fluid">

            {/* Header */}

            <div className="mb-4">

                <h1 className="h3 font-weight-bold">
                    Input Nilai
                </h1>

                <p className="text-muted mb-0">
                    Input nilai siswa
                </p>

            </div>

            {/* Informasi Penilaian */}

            <div className="card shadow-sm mb-4">

                <div className="card-header">

                    <h3 className="card-title">
                        Informasi Penilaian
                    </h3>

                </div>

                <div className="card-body">

                    <div className="row">

                        <div className="col-md-3">
                            <strong>Penilaian</strong>
                            <br />
                            UH Bab 1
                        </div>

                        <div className="col-md-3">
                            <strong>Kelas</strong>
                            <br />
                            VII A
                        </div>

                        <div className="col-md-3">
                            <strong>Mapel</strong>
                            <br />
                            Matematika
                        </div>

                        <div className="col-md-3">
                            <strong>KKM</strong>
                            <br />
                            75
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

            <div className="card shadow-sm">

                <div className="card-header">

                    <div className="row">

                        <div className="col-md-4">

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Cari siswa..."
                                value={keyword}
                                onChange={(e) =>
                                    setKeyword(e.target.value)
                                }
                            />

                        </div>

                    </div>

                </div>

                <div className="card-body table-responsive p-0">

                    <table className="table table-hover">

                        <thead>

                            <tr>

                                <th style={{ width: "60px" }}>No</th>

                                <th>Nama</th>

                                <th style={{ width: "80px" }}>JK</th>

                                <th style={{ width: "150px" }}>
                                    Nilai
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {filtered.map((item, index) => (

                                <tr key={item.id}>

                                    <td>{index + 1}</td>

                                    <td>{item.nama}</td>

                                    <td>{item.jk}</td>

                                    <td>

                                        <input
                                            type="number"
                                            className="form-control text-center"
                                            min={0}
                                            max={100}
                                            value={item.nilai}
                                            onChange={(e) =>
                                                handleChange(
                                                    item.id,
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                <div className="card-footer text-right">

                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                    >
                        <i className="fas fa-save mr-2"></i>

                        Simpan Nilai
                    </button>

                </div>

            </div>

        </div>
    );
}