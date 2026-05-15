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

    const [formData, setFormData] = useState({
        pertanyaan: "",
        opsiA: "",
        opsiB: "",
        opsiC: "",
        opsiD: "",
        jawabanBenar: "A",
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
            orderBy("createdAt", "desc")
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
            await addDoc(
                collection(db, "bank_soal", bankSoalId, "soal"),
                {
                    ...formData,
                    createdAt: serverTimestamp(),
                }
            );

            setFormData({
                pertanyaan: "",
                opsiA: "",
                opsiB: "",
                opsiC: "",
                opsiD: "",
                jawabanBenar: "A",
            });

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
                        Tambahkan soal pilihan ganda untuk bank soal ini.
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

                                    {/* PERTANYAAN */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Pertanyaan
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

                                    {/* OPSI A */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Opsi A
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            name="opsiA"
                                            value={formData.opsiA}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* OPSI B */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Opsi B
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            name="opsiB"
                                            value={formData.opsiB}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* OPSI C */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Opsi C
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            name="opsiC"
                                            value={formData.opsiC}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* OPSI D */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Opsi D
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            name="opsiD"
                                            value={formData.opsiD}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* JAWABAN */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Jawaban Benar
                                        </label>

                                        <select
                                            className="form-select"
                                            name="jawabanBenar"
                                            value={formData.jawabanBenar}
                                            onChange={handleChange}
                                        >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                            <option value="D">D</option>
                                        </select>
                                    </div>

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

                                                <h6 className="fw-bold mb-0">
                                                    Soal {index + 1}
                                                </h6>

                                                <span className="badge bg-success">
                                                    Jawaban: {item.jawabanBenar}
                                                </span>

                                            </div>

                                            <p className="mb-3">
                                                {item.pertanyaan}
                                            </p>

                                            <div className="row g-2">
                                                <div className="col-md-6">
                                                    <div className="border rounded p-2">
                                                        <strong>A.</strong> {item.opsiA}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="border rounded p-2">
                                                        <strong>B.</strong> {item.opsiB}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="border rounded p-2">
                                                        <strong>C.</strong> {item.opsiC}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="border rounded p-2">
                                                        <strong>D.</strong> {item.opsiD}
                                                    </div>
                                                </div>
                                            </div>
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