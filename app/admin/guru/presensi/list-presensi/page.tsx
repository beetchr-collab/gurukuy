"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

import {
    AttendanceFilterResult,
    getAttendanceFilter,
    getAttendanceList,
    AttendanceListItem,
} from "@/services/presensi.service";

export default function ListPresensiPage() {
    const auth = getAuth();

const [loading, setLoading] = useState(false);

const [attendance, setAttendance] = useState<AttendanceListItem[]>([]);

// Filter
const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);

const [kelasList, setKelasList] = useState<
    {
        id: string;
        nama: string;
    }[]
>([]);

const [tahunAjaran, setTahunAjaran] = useState("");

const [kelasId, setKelasId] = useState("");

const [tanggalAwal, setTanggalAwal] = useState("");

const [tanggalAkhir, setTanggalAkhir] = useState("");

const [nama, setNama] = useState("");


useEffect(() => {
    loadFilter();
}, []);

const loadFilter = async () => {
    

    const user = auth.currentUser;
console.log(user);

    if (!user) return;

    const result: AttendanceFilterResult =
        await getAttendanceFilter(user.uid);

    setTahunAjaranList(result.tahunAjaran);

    setKelasList(result.kelas);

    setTanggalAwal(result.minDate);

    setTanggalAkhir(result.maxDate);

    if (result.tahunAjaran.length > 0) {
        setTahunAjaran(result.tahunAjaran[0]);
    }

    if (result.kelas.length > 0) {
        setKelasId(result.kelas[0].id);
    }

};


useEffect(() => {

    if (
        !tahunAjaran ||
        !kelasId ||
        !tanggalAwal ||
        !tanggalAkhir
    ) {
        return;
    }

    loadAttendance();

}, [
    tahunAjaran,
    kelasId,
    tanggalAwal,
    tanggalAkhir
]);

const loadAttendance = async () => {

    const user = auth.currentUser;

    if (!user) return;

    setLoading(true);

    try {

        const result = await getAttendanceList(
            user.uid,
            tahunAjaran,
            kelasId,
            tanggalAwal,
            tanggalAkhir,
        );

        setAttendance(result);

    } finally {

        setLoading(false);

    }

};

    return (
        <div className="container-fluid">

            <div className="card">

                <div className="card-header">
                    <h4 className="card-title mb-0">
                        Daftar Presensi
                    </h4>
                </div>

                <div className="card-body">

                    {/* ================= FILTER ================= */}
<div className="card mb-3">

    <div className="card-body">

        <div className="row g-3">

            <div className="col-md-3">

                <label className="form-label">
                    Tahun Ajaran
                </label>

                <select
                    className="form-select"
                    value={tahunAjaran}
                    onChange={(e) =>
                        setTahunAjaran(e.target.value)
                    }
                >

                    {tahunAjaranList.map((item) => (

                        <option
                            key={item}
                            value={item}
                        >
                            {item}
                        </option>

                    ))}

                </select>

            </div>

            <div className="col-md-3">

                <label className="form-label">
                    Kelas
                </label>

                <select
                    className="form-select"
                    value={kelasId}
                    onChange={(e) =>
                        setKelasId(e.target.value)
                    }
                >

                    {kelasList.map((item) => (

                        <option
                            key={item.id}
                            value={item.id}
                        >
                            {item.nama}
                        </option>

                    ))}

                </select>

            </div>

            <div className="col-md-2">

                <label className="form-label">
                    Dari
                </label>

                <input
                    type="date"
                    className="form-control"
                    value={tanggalAwal}
                    onChange={(e) =>
                        setTanggalAwal(e.target.value)
                    }
                />

            </div>

            <div className="col-md-2">

                <label className="form-label">
                    Sampai
                </label>

                <input
                    type="date"
                    className="form-control"
                    value={tanggalAkhir}
                    onChange={(e) =>
                        setTanggalAkhir(e.target.value)
                    }
                />

            </div>

            <div className="col-md-2">

                <label className="form-label">
                    Nama
                </label>

                <input
                    type="text"
                    className="form-control"
                    placeholder="Cari nama..."
                    value={nama}
                    onChange={(e) =>
                        setNama(e.target.value)
                    }
                />

            </div>

        </div>

        <div className="mt-3 d-flex gap-2">

            <button
                className="btn btn-primary"
                onClick={loadAttendance}
            >
                Cari
            </button>

            <button
                className="btn btn-secondary"
                onClick={() => {

                    setNama("");

                    loadAttendance();

                }}
            >
                Reset
            </button>

        </div>

    </div>

</div>

                    {/* ================= TABEL ================= */}


                    {/* ================= PAGINATION ================= */}


                </div>

            </div>

        </div>
    );

}