"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    getAttendanceRecap,
} from "@/services/presensi.service";
import { AttendanceRecap } from "@/types/presensi";
import { useAuth } from "@/context/AuthContext";
import { exportAttendanceRecapExcel } from "@/services/presensiexcel.service";

export default function RekapPresensiPage() {
    const { kelasId } = useParams();
    // State
    const [rekap, setRekap] = useState<AttendanceRecap[]>([]);
    const { user } = useAuth();
    // Effect
    useEffect(() => {

        if (!user?.schoolId || !kelasId) return;

        loadRekap();

    }, [user, kelasId]);
    // Function
    async function loadRekap() {
        const schoolId = user?.schoolId;
        if (!schoolId) return;

        const data = await getAttendanceRecap(
            schoolId,
            kelasId as string
        );

        setRekap(data);

    }
    return (
        <div className="content-wrapper py-2">
            {/* Breadcrumb */}
            <section className="content-header py-2">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between">
                        <h3>Rekap Presensi</h3>
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


                    {/* Rekap */}

                    <div className="card">

                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="card-title">
                                Rekap Kehadiran Siswa
                            </h3>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                    exportAttendanceRecapExcel({
                                        schoolName: "",
                                        kelas: kelasId as string,
                                        tahunAjaran: "",
                                        data: rekap,
                                    })
                                }
                            >
                                <i className="fas fa-file-excel mr-1"></i>
                                Export Excel
                            </button>
                        </div>

                        <div className="card-body table-responsive p-0">

                            <table className="table table-bordered table-hover">

                                <thead>

                                    <tr>

                                        <th>No</th>

                                        <th>NIS</th>

                                        <th>Nama</th>

                                        <th>Hadir</th>

                                        <th>Izin</th>

                                        <th>Sakit</th>

                                        <th>Alpha</th>

                                        <th>% Kehadiran</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {[...rekap]
                                        .sort((a, b) =>
                                            a.nama.localeCompare(b.nama, "id", {
                                                sensitivity: "base",
                                            })
                                        )
                                        .map((item, index) => (
                                            <tr key={item.studentId}>
                                                <td>{index + 1}</td>
                                                <td>{item.nis}</td>
                                                <td>{item.nama}</td>
                                                <td>{item.hadir}</td>
                                                <td>{item.izin}</td>
                                                <td>{item.sakit}</td>
                                                <td>{item.alpha}</td>
                                                <td>{item.persentase}%</td>
                                            </tr>
                                        ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
}