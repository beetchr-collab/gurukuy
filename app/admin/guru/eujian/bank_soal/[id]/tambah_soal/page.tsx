"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import "summernote/dist/summernote-lite.min.css";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import MathFormulaEditor from "./MathFormulaEditor";

type SummernoteEditorInstance = {
    summernote: {
        (options: {
            height: number;
            toolbar: [string, string[]][];
            callbacks: { onChange: (contents: string) => void };
        }): unknown;
        (command: "code", value: string): unknown;
        (command: "pasteHTML", value: string): unknown;
        (command: "destroy"): unknown;
    };
};

type QuestionItem = {
    id: string;
    tipeSoal?: string;
    skor?: number;
    pertanyaan?: string;
    gambarUrl?: string;
    opsi?: string[];
    jawabanBenar?: string | string[];
    benarSalah?: { statement: string; jawaban: string }[];
    pasangan?: { left: string; right: string }[];
    jawabanIsian?: string;
    jawabanEssay?: string;
};

const normalizeImageUrl = (value: string) => {
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";

        if (url.hostname === "drive.google.com") {
            const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
                || url.searchParams.get("id");
            if (fileId) {
                return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
            }
        }

        return url.toString();
    } catch {
        return "";
    }
};

export default function TambahSoalPage() {
    const router = useRouter();
    const params = useParams();

    const bankSoalId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [bankSoal, setBankSoal] = useState<any>(null);
    const [soalList, setSoalList] = useState<any[]>([]);
    const [soalLoadError, setSoalLoadError] = useState("");
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [mathEditorOpen, setMathEditorOpen] = useState(false);
    const questionEditorRef = useRef<HTMLTextAreaElement>(null);
    const summernoteRef = useRef<SummernoteEditorInstance | null>(null);

    const initialFormData = {
        tipeSoal: "PG",
        skor: "1",
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

    useEffect(() => {
        let disposed = false;

        const initializeEditor = async () => {
            const jquery = (await import("jquery")).default;
            (window as Window & { $?: typeof jquery; jQuery?: typeof jquery }).$ = jquery;
            (window as Window & { $?: typeof jquery; jQuery?: typeof jquery }).jQuery = jquery;
            await import("summernote/dist/summernote-lite.min.js");

            if (disposed || !questionEditorRef.current) return;

            const editor = jquery(questionEditorRef.current) as unknown as SummernoteEditorInstance;
            editor.summernote({
                height: 220,
                toolbar: [
                    ["style", ["style"]],
                    ["font", ["bold", "italic", "underline", "strikethrough", "superscript", "subscript", "clear"]],
                    ["fontname", ["fontname"]],
                    ["fontsize", ["fontsize"]],
                    ["color", ["color"]],
                    ["para", ["ul", "ol", "paragraph", "height"]],
                    ["table", ["table"]],
                    ["insert", ["picture", "link", "hr"]],
                    ["history", ["undo", "redo"]],
                    ["view", ["fullscreen", "codeview", "help"]],
                ],
                callbacks: {
                    onChange: (contents) => {
                        setFormData((prev) => ({ ...prev, pertanyaan: contents }));
                    },
                },
            });
            summernoteRef.current = editor;
        };

        void initializeEditor();

        return () => {
            disposed = true;
            summernoteRef.current?.summernote("destroy");
            summernoteRef.current = null;
        };
    }, []);

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

    const resetForm = () => setFormData(initialFormData);

    const cancelEdit = () => {
        setEditingQuestionId(null);
        resetForm();
        summernoteRef.current?.summernote("code", "");
    };

    const handleEditQuestion = (item: QuestionItem) => {
        const answer = item.jawabanBenar;
        const nextFormData = {
            ...initialFormData,
            tipeSoal: item.tipeSoal || "PG",
            skor: String(item.skor ?? 1),
            pertanyaan: item.pertanyaan || "",
            gambarUrl: item.gambarUrl || "",
            opsi: Array.isArray(item.opsi) ? item.opsi : initialFormData.opsi,
            jawabanBenar: typeof answer === "string" ? answer : "A",
            jawabanBenarComplex: Array.isArray(answer) ? answer : [],
            benarSalah: Array.isArray(item.benarSalah)
                ? item.benarSalah
                : initialFormData.benarSalah,
            pasangan: Array.isArray(item.pasangan)
                ? item.pasangan
                : initialFormData.pasangan,
            jawabanIsian: item.jawabanIsian || "",
            jawabanEssay: item.jawabanEssay || "",
        };

        setEditingQuestionId(item.id);
        setFormData(nextFormData);
        summernoteRef.current?.summernote("code", nextFormData.pertanyaan);
        document.getElementById("form-tambah-soal")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!window.confirm("Hapus soal ini? Tindakan ini tidak dapat dibatalkan.")) return;

        try {
            await deleteDoc(doc(db, "bank_soal", bankSoalId, "soal", questionId));
            if (editingQuestionId === questionId) cancelEdit();
        } catch (error) {
            console.error("Gagal menghapus soal:", error);
            alert("Gagal menghapus soal");
        }
    };

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

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data: any[] = [];

                snapshot.forEach((doc) => {
                    data.push({
                        id: doc.id,
                        ...doc.data(),
                    });
                });

                setSoalLoadError("");
                setSoalList(data);
            },
            (error) => {
                console.error("Gagal memuat daftar soal:", error);
                setSoalLoadError(
                    error.code === "permission-denied"
                        ? "Akses ditolak. Periksa Firestore Security Rules untuk subkoleksi bank_soal/{id}/soal."
                        : "Daftar soal gagal dimuat. Coba muat ulang halaman."
                );
            }
        );

        return () => unsubscribe();
    }, [bankSoalId]);

    // TAMBAH SOAL
    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        const cleanQuestion = DOMPurify.sanitize(formData.pertanyaan);
        if (!cleanQuestion.replace(/<[^>]*>/g, "").trim()) {
            alert("Pertanyaan tidak boleh kosong");
            return;
        }

        const skor = Number(formData.skor);
        if (!Number.isFinite(skor) || skor < 0) {
            alert("Skor harus berupa angka nol atau lebih");
            return;
        }

        setLoading(true);

        try {
            const payload: any = {
                tipeSoal: formData.tipeSoal,
                skor,
                pertanyaan: cleanQuestion,
                gambarUrl: normalizeImageUrl(formData.gambarUrl),
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

            if (editingQuestionId) {
                delete payload.createdAt;
                await updateDoc(
                    doc(db, "bank_soal", bankSoalId, "soal", editingQuestionId),
                    payload
                );
            } else {
                await addDoc(collection(db, "bank_soal", bankSoalId, "soal"), payload);
            }

            cancelEdit();
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
                <div className="callout callout-info shadow-sm rounded-3 mb-3">
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
                    <div className="col-12">
                        <div className="card card-primary card-outline" id="form-tambah-soal">

                            <div className="card-header">
                                <h3 className="card-title fw-bold">
                                    {editingQuestionId ? "Edit Soal" : "Form Tambah Soal"}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="card-body">

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-8">
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

                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold" htmlFor="skor">
                                                Skor / Nilai
                                            </label>
                                            <input
                                                id="skor"
                                                type="number"
                                                className="form-control"
                                                name="skor"
                                                min="0"
                                                step="any"
                                                value={formData.skor}
                                                onChange={handleChange}
                                                required
                                            />
                                            <div className="form-text">Nilai yang diberikan untuk soal ini.</div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            {formData.tipeSoal === "Benar/Salah" ? "Pernyataan" : "Pertanyaan"}
                                        </label>
                                        <div className="border border-bottom-0 rounded-top p-2 bg-light d-flex flex-wrap align-items-center gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setMathEditorOpen(true)}
                                            >
                                                <i className="fas fa-square-root-variable me-2"></i>
                                                Rumus Matematika
                                            </button>
                                            <span className="small text-muted">
                                                Teks, tabel, gambar, dan rumus dapat digabungkan dalam satu soal.
                                            </span>
                                        </div>
                                        <textarea
                                            ref={questionEditorRef}
                                            className="form-control"
                                            name="pertanyaan"
                                            defaultValue={formData.pertanyaan}
                                            aria-label="Editor pertanyaan"
                                        />
                                        {mathEditorOpen && (
                                            <MathFormulaEditor
                                                onClose={() => setMathEditorOpen(false)}
                                                onInsert={(mathML) => {
                                                    if (!summernoteRef.current) {
                                                        alert("Editor soal belum siap. Silakan coba lagi.");
                                                        return;
                                                    }
                                                    summernoteRef.current.summernote(
                                                        "pasteHTML",
                                                        `<span class="math-formula">${mathML}</span>`,
                                                    );
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold" htmlFor="gambarUrl">URL Gambar</label>
                                        <input
                                            id="gambarUrl"
                                            type="url"
                                            className="form-control"
                                            name="gambarUrl"
                                            value={formData.gambarUrl}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setFormData((prev) => ({ ...prev, gambarUrl: value }));
                                            }}
                                            placeholder="https://..."
                                        />
                                        <div className="form-text">Masukkan URL gambar publik, termasuk tautan berbagi Google Drive.</div>
                                        {formData.gambarUrl && (
                                            <div className="mt-3">
                                                <img
                                                    src={normalizeImageUrl(formData.gambarUrl)}
                                                    alt="Preview gambar soal"
                                                    className="img-fluid rounded"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = "none";
                                                    }}
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
                                    {editingQuestionId && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary me-2"
                                            onClick={cancelEdit}
                                            disabled={loading}
                                        >
                                            Batal
                                        </button>
                                    )}
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
                                                <i className={`fas ${editingQuestionId ? "fa-pen" : "fa-save"} me-2`}></i>
                                                {editingQuestionId ? "Simpan Perubahan" : "Simpan Soal"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* LIST SOAL */}
                    <div className="col-12 mt-4">
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

                                {soalLoadError && (
                                    <div className="alert alert-danger" role="alert">
                                        {soalLoadError}
                                    </div>
                                )}

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
                                                    <span className="badge bg-warning text-dark ms-2">
                                                        Skor: {item.skor ?? 1}
                                                    </span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
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
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Edit soal"
                                                    aria-label={`Edit soal ${index + 1}`}
                                                    onClick={() => handleEditQuestion(item)}
                                                >
                                                    <i className="fas fa-pen"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Hapus soal"
                                                    aria-label={`Hapus soal ${index + 1}`}
                                                    onClick={() => handleDeleteQuestion(item.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                </div>
                                            </div>

                                            <div
                                                className="mb-3"
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(item.pertanyaan || ""),
                                                }}
                                            />

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