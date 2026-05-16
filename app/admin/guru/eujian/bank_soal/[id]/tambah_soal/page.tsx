"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TambahSoalPage() {
    const router = useRouter();
    const params = useParams();

    const bankSoalId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [bankSoal, setBankSoal] = useState<any>(null);
    const [soalList, setSoalList] = useState<any[]>([]);

    const initialFormData = {
        tipeSoal: "PG",
        pertanyaan: "",
        gambarUrl: "",
        opsi: ["", "", "", ""],
        jawabanBenar: "A",
        jawabanBenarComplex: [] as string[],
        benarSalah: [{ statement: "", jawaban: "Benar" }],
        pasangan: [{ left: "", right: "" }],
        jawabanIsian: "",
        jawabanEssay: "",
    };

    const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOptionChange = (index: number, value: string) => {
        setFormData((prev) => {
            const opsi = [...prev.opsi];
            opsi[index] = value;
            return { ...prev, opsi };
        });
    };

    const handleAddOption = () => {
        setFormData((prev) => ({
            ...prev,
            opsi: [...prev.opsi, ""],
        }));
    };

    const handleBenarSalahChange = (index: number, value: string) => {
        setFormData((prev) => {
            const benarSalah = [...prev.benarSalah];
            benarSalah[index] = { ...benarSalah[index], jawaban: value };
            return { ...prev, benarSalah };
        });
    };

    const handleBenarSalahStatementChange = (index: number, value: string) => {
        setFormData((prev) => {
            const benarSalah = [...prev.benarSalah];
            benarSalah[index] = { ...benarSalah[index], statement: value };
            return { ...prev, benarSalah };
        });
    };

    const handleAddBenarSalah = () => {
        setFormData((prev) => ({
            ...prev,
            benarSalah: [...prev.benarSalah, { statement: "", jawaban: "Benar" }],
        }));
    };

    const handleRemoveBenarSalah = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            benarSalah: prev.benarSalah.filter((_, idx) => idx !== index),
        }));
    };

    const indexToLabel = (index: number) => String.fromCharCode(65 + index);
    const labelToIndex = (label: string) => label.charCodeAt(0) - 65;
    const labelIndexToLabel = (index: number) => String.fromCharCode(65 + index);
    const jawabanToIndex = (jawaban: string) => jawaban.charCodeAt(0) - 65;

    const handleRemoveOption = (index: number) => {
        setFormData((prev) => {
            const opsi = prev.opsi.filter((_, idx) => idx !== index);
            const jawabanBenarComplex = prev.jawabanBenarComplex
                .filter((jawaban) => jawaban !== indexToLabel(index))
                .map((jawaban) => {
                    const labelIndex = jawabanToIndex(jawaban);
                    return labelIndex > index ? labelIndexToLabel(labelIndex - 1) : jawaban;
                });
            return {
                ...prev,
                opsi,
                jawabanBenarComplex,
            };
        });
    };

    const handleToggleComplexAnswer = (label: string) => {
        setFormData((prev) => {
            const existing = prev.jawabanBenarComplex.includes(label);
            const jawabanBenarComplex = existing
                ? prev.jawabanBenarComplex.filter((item) => item !== label)
                : [...prev.jawabanBenarComplex, label];
            return { ...prev, jawabanBenarComplex };
        });
    };

    const handlePairChange = (index: number, side: "left" | "right", value: string) => {
        setFormData((prev) => {
            const pasangan = [...prev.pasangan];
            pasangan[index] = { ...pasangan[index], [side]: value };
            return { ...prev, pasangan };
        });
    };

    const handleAddPair = () => {
        setFormData((prev) => ({
            ...prev,
            pasangan: [...prev.pasangan, { left: "", right: "" }],
        }));
    };

    const handleRemovePair = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            pasangan: prev.pasangan.filter((_, idx) => idx !== index),
        }));
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);

        try {
            const form = new FormData();
            form.append("file", file);

            const res = await fetch("/api/upload-drive", {
                method: "POST",
                body: form,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Gagal upload gambar");
            }

            setFormData((prev) => ({
                ...prev,
                gambarUrl: data.url,
            }));
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Gagal upload gambar");
        } finally {
            setUploadingImage(false);
        }
    };

    const resetForm = () => setFormData(initialFormData);

    // GET BANK SOAL
    useEffect(() => {
        const fetchBankSoal = async () => {
            try {
                const docRef = doc(db, "bank_soal", bankSoalId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setBankSoal({
                        id: docSnap.id,
                        ...docSnap.data(),
                    });
                }
            } catch (error) {
                console.error(error);
            }
        };

        if (bankSoalId) {
            fetchBankSoal();
        }
    }, [bankSoalId]);

    // GET SOAL
    useEffect(() => {
        if (!bankSoalId) return;

        const q = query(
            collection(db, "bank_soal", bankSoalId, "soal"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: any[] = [];

            snapshot.forEach((doc) => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            setSoalList(data);
        });

        return () => unsubscribe();
    }, [bankSoalId]);

    // TAMBAH SOAL
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                tipeSoal: formData.tipeSoal,
                pertanyaan: formData.pertanyaan,
                gambarUrl: formData.gambarUrl,
                createdAt: serverTimestamp(),
            };

            if (formData.tipeSoal === "PG") {
                payload.opsi = formData.opsi;
                payload.jawabanBenar = formData.jawabanBenar;
            }

            if (formData.tipeSoal === "PGK") {
                payload.opsi = formData.opsi;
                payload.jawabanBenar = formData.jawabanBenarComplex;
            }

            if (formData.tipeSoal === "Menjodohkan") {
                payload.pasangan = formData.pasangan;
            }

            if (formData.tipeSoal === "Isian Singkat") {
                payload.jawabanIsian = formData.jawabanIsian;
            }

            if (formData.tipeSoal === "Benar/Salah") {
                payload.benarSalah = formData.benarSalah;
            }

            if (formData.tipeSoal === "Uraian") {
                payload.jawabanEssay = formData.jawabanEssay;
            }

            await addDoc(collection(db, "bank_soal", bankSoalId, "soal"), payload);
            resetForm();
        } catch (error) {
            console.error(error);
            alert("Gagal menambahkan soal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-main">

            {/* HEADER */}
            <div className="app-content-header">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center">

                        <div>
                            <h3 className="mb-1 fw-bold">
                                Tambah Soal
                            </h3>

                            <p className="text-muted mb-0">
                                {bankSoal?.namaBankSoal || "Loading..."}
                            </p>
                        </div>

                        <button
                            className="btn btn-light border"
                            onClick={() => router.back()}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Kembali
                        </button>

                    </div>
                </div>
            </div>

            <div className="container-fluid">

                {/* INFO */}
                <div className="callout callout-info shadow-sm rounded-3">
                    <h5>
                        <i className="fas fa-info-circle me-2"></i>
                        Informasi
                    </h5>

                    <p className="mb-0">
                        Tambahkan soal dengan tipe: Pilihan Ganda, Pilihan Ganda Kompleks,
                        Menjodohkan, Benar/Salah, Isian Singkat, atau Uraian.
                    </p>
                </div>

                <div className="row">

                    {/* FORM */}
                    <div className="col-lg-5">
                        <div className="card card-primary card-outline">

                            <div className="card-header">
                                <h3 className="card-title fw-bold">
                                    Form Tambah Soal
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="card-body">

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Tipe Soal</label>
                                        <select
                                            className="form-select"
                                            name="tipeSoal"
                                            value={formData.tipeSoal}
                                            onChange={handleChange}
                                        >
                                            <option value="PG">Pilihan Ganda</option>
                                            <option value="PGK">Pilihan Ganda Kompleks</option>
                                            <option value="Menjodohkan">Menjodohkan</option>
                                            <option value="Benar/Salah">Benar/Salah</option>
                                            <option value="Isian Singkat">Isian Singkat</option>
                                            <option value="Uraian">Uraian</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            {formData.tipeSoal === "Benar/Salah" ? "Pernyataan" : "Pertanyaan"}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            name="pertanyaan"
                                            value={formData.pertanyaan}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Gambar (Upload Google Drive)</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        {uploadingImage && (
                                            <div className="form-text text-muted">Mengunggah gambar...</div>
                                        )}
                                        {formData.gambarUrl && (
                                            <div className="mt-3">
                                                <img
                                                    src={formData.gambarUrl}
                                                    alt="Preview gambar soal"
                                                    className="img-fluid rounded"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {formData.tipeSoal === "Benar/Salah" && (
                                        <>
                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <label className="form-label fw-semibold">Pernyataan Benar/Salah</label>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddBenarSalah}>
                                                    <i className="fas fa-plus me-1"></i> Tambah Pernyataan
                                                </button>
                                            </div>

                                            {formData.benarSalah.map((item, idx) => (
                                                <div key={idx} className="mb-3 row g-2 align-items-center">
                                                    <div className="col-8">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder={`Pernyataan ${idx + 1}`}
                                                            value={item.statement}
                                                            onChange={(e) => handleBenarSalahStatementChange(idx, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-3">
                                                        <select
                                                            className="form-select"
                                                            value={item.jawaban}
                                                            onChange={(e) => handleBenarSalahChange(idx, e.target.value)}
                                                        >
                                                            <option value="Benar">Benar</option>
                                                            <option value="Salah">Salah</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-1">
                                                        {formData.benarSalah.length > 1 && (
                                                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveBenarSalah(idx)}>
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {(formData.tipeSoal === "PG" || formData.tipeSoal === "PGK") && (
                                        <>
                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <label className="form-label fw-semibold">Opsi Jawaban</label>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddOption}>
                                                    <i className="fas fa-plus me-1"></i> Tambah Opsi
                                                </button>
                                            </div>

                                            {formData.opsi.map((opsi, index) => (
                                                <div key={index} className="mb-3 row g-2 align-items-center">
                                                    <div className="col-1">
                                                        <span className="fw-semibold">{indexToLabel(index)}.</span>
                                                    </div>
                                                    <div className="col-9">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={opsi}
                                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-2 d-flex gap-2">
                                                        {formData.opsi.length > 2 && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => handleRemoveOption(index)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Jawaban Benar</label>
                                                {formData.tipeSoal === "PG" ? (
                                                    <select
                                                        className="form-select"
                                                        name="jawabanBenar"
                                                        value={formData.jawabanBenar}
                                                        onChange={handleChange}
                                                    >
                                                        {formData.opsi.map((_, idx) => (
                                                            <option key={idx} value={indexToLabel(idx)}>
                                                                {indexToLabel(idx)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="row g-2">
                                                        {formData.opsi.map((_, idx) => {
                                                            const label = indexToLabel(idx);
                                                            return (
                                                                <div key={idx} className="col-md-6">
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            id={`jawaban-${label}`}
                                                                            checked={formData.jawabanBenarComplex.includes(label)}
                                                                            onChange={() => handleToggleComplexAnswer(label)}
                                                                        />
                                                                        <label className="form-check-label" htmlFor={`jawaban-${label}`}>
                                                                            {label}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {formData.tipeSoal === "Menjodohkan" && (
                                        <>
                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <label className="form-label fw-semibold">Pasangan Menjodohkan</label>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddPair}>
                                                    <i className="fas fa-plus me-1"></i> Tambah Pasangan
                                                </button>
                                            </div>
                                            {formData.pasangan.map((pair, index) => (
                                                <div key={index} className="row g-2 mb-3 align-items-center">
                                                    <div className="col-md-5">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder={`Kiri ${index + 1}`}
                                                            value={pair.left}
                                                            onChange={(e) => handlePairChange(index, "left", e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-5">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder={`Kanan ${index + 1}`}
                                                            value={pair.right}
                                                            onChange={(e) => handlePairChange(index, "right", e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-2">
                                                        {formData.pasangan.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger w-100"
                                                                onClick={() => handleRemovePair(index)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {formData.tipeSoal === "Isian Singkat" && (
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Jawaban Singkat</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="jawabanIsian"
                                                value={formData.jawabanIsian}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    )}

                                    {formData.tipeSoal === "Uraian" && (
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Kunci Jawaban / Catatan Guru</label>
                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                name="jawabanEssay"
                                                value={formData.jawabanEssay}
                                                onChange={handleChange}
                                            ></textarea>
                                        </div>
                                    )}

                                </div>

                                <div className="card-footer">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                Simpan Soal
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* LIST SOAL */}
                    <div className="col-lg-7">
                        <div className="card">

                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h3 className="card-title fw-bold">
                                    Daftar Soal
                                </h3>

                                <span className="badge bg-primary">
                                    {soalList.length} Soal
                                </span>
                            </div>

                            <div className="card-body">

                                {soalList.length > 0 ? (
                                    soalList.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="border rounded-3 p-3 mb-3"
                                        >
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6 className="fw-bold mb-1">Soal {index + 1}</h6>
                                                    <span className="badge bg-info text-dark">
                                                        {item.tipeSoal || "Tidak diketahui"}
                                                    </span>
                                                </div>
                                                <span className="badge bg-success">
                                                    {item.tipeSoal === "PGK"
                                                        ? `Jawaban: ${Array.isArray(item.jawabanBenar) ? item.jawabanBenar.join(", ") : item.jawabanBenar}`
                                                        : item.tipeSoal === "PG"
                                                        ? `Jawaban: ${item.jawabanBenar}`
                                                        : item.tipeSoal === "Benar/Salah"
                                                        ? "Benar/Salah"
                                                        : item.tipeSoal === "Isian Singkat"
                                                        ? `Jawaban: ${item.jawabanIsian}`
                                                        : item.tipeSoal === "Uraian"
                                                        ? "Uraian"
                                                        : "Menjodohkan"}
                                                </span>
                                            </div>

                                            <p className="mb-3">{item.pertanyaan}</p>

                                            {item.gambarUrl && (
                                                <div className="mb-3">
                                                    <img src={item.gambarUrl} alt="Soal" className="img-fluid rounded" />
                                                </div>
                                            )}

                                            {item.tipeSoal === "PG" && Array.isArray(item.opsi) && (
                                                <div className="row g-2">
                                                    {item.opsi.map((opsi: string, idx: number) => (
                                                        <div key={idx} className="col-md-6">
                                                            <div className="border rounded p-2">
                                                                <strong>{String.fromCharCode(65 + idx)}.</strong> {opsi}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {item.tipeSoal === "PGK" && Array.isArray(item.opsi) && (
                                                <div className="row g-2">
                                                    {item.opsi.map((opsi: string, idx: number) => (
                                                        <div key={idx} className="col-md-6">
                                                            <div className="border rounded p-2">
                                                                <strong>{String.fromCharCode(65 + idx)}.</strong> {opsi}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {item.tipeSoal === "Benar/Salah" && Array.isArray(item.benarSalah) && (
                                                <div className="row g-2">
                                                    {item.benarSalah.map((statement: any, idx: number) => (
                                                        <div key={idx} className="col-12 mb-2">
                                                            <div className="border rounded p-2 d-flex justify-content-between align-items-center">
                                                                <span>{statement.statement}</span>
                                                                <span className="badge bg-secondary">{statement.jawaban}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {item.tipeSoal === "Menjodohkan" && Array.isArray(item.pasangan) && (
                                                <div className="row g-2">
                                                    {item.pasangan.map((pair: any, idx: number) => (
                                                        <div key={idx} className="col-12 mb-2">
                                                            <div className="border rounded p-2 d-flex justify-content-between">
                                                                <span>{pair.left}</span>
                                                                <span className="text-muted">=</span>
                                                                <span>{pair.right}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {item.tipeSoal === "Isian Singkat" && (
                                                <div className="border rounded p-2">
                                                    <strong>Jawaban singkat:</strong> {item.jawabanIsian}
                                                </div>
                                            )}

                                            {item.tipeSoal === "Uraian" && item.jawabanEssay && (
                                                <div className="border rounded p-2">
                                                    <strong>Kunci jawaban / catatan guru:</strong>
                                                    <div>{item.jawabanEssay}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        <i className="fas fa-folder-open fa-2x mb-3 d-block"></i>
                                        Belum ada soal
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}