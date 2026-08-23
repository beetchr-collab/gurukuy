"use client";

import { useEffect, useMemo, useState } from "react";
import {
    getKelasPenilaian,
    getMapelPenilaian,
    getPenilaianRekap,
    NilaiSiswa,
    RekapNilai,
} from "@/services/penilaian.service";
import {
    getBobotPenilaian,
    BobotPenilaian,
} from "@/services/bobotpenilaian.service";
import {
    getAttendanceStudentRecap,
    AttendanceRecapStudent,
} from "@/services/presensi.service";
import { getAnggotaKelas, AnggotaKelas } from "@/services/anggotakelas.service";
import { getTahunAjaranPenilaian } from "@/services/penilaian.service";
import { useAuth } from "@/context/AuthContext";
import SearchInput from "@/components/search/SearchInput";
import TableFooter from "@/components/pagination/TableFooter";
import { usePagination } from "@/hooks/usePagination";
import * as XLSX from "xlsx";

type NilaiPerMapel = Record<string, number>;
type LegerRow = {
    student: AnggotaKelas;
    nilai: NilaiPerMapel;
    rataRata: number | null;
    statusNilai: "belum-dinilai" | "tuntas" | "belum-tuntas" | "kurang";
    peringkat: number | null;
    presensi: AttendanceRecapStudent | null;
};

const DEFAULT_BOBOT: Pick<BobotPenilaian, "formatif" | "sumatif" | "sas"> = {
    formatif: 50,
    sumatif: 25,
    sas: 25,
};

function getMapelSingkatan(mapel: string) {
    const normalizedMapel = mapel.toLowerCase().replace(/\s+/g, " ").trim();
    const singkatan: Record<string, string> = {
        "pendidikan agama islam": "PAI",
        "pendidikan pancasila": "PP",
        "pendidikan pancasila (pp)": "PP",
        "bahasa indonesia": "BIN",
        "matematika": "MAT",
        "ilmu pengetahuan alam dan sosial": "IPAS",
        "ilmu pengetahuan alam dan sosial (ipas)": "IPAS",
        "bahasa inggris": "BIG",
        "seni budaya": "SB",
        "pendidikan olahraga dan kesehatan": "PJOK",
    };

    return singkatan[normalizedMapel] ?? mapel;
}

function getStudentScore(
    studentId: string,
    items: RekapNilai[],
    getScore: (nilai: NilaiSiswa[], studentId: string) => number
) {
    if (items.length === 0) return 0;

    return items.reduce(
        (total, item) => total + getScore(item.nilai, studentId),
        0
    ) / items.length;
}

function calculateFinalScore(
    studentId: string,
    rekap: RekapNilai[],
    bobot: Pick<BobotPenilaian, "formatif" | "sumatif" | "sas">
) {
    const getScore = (nilai: NilaiSiswa[], id: string) => {
        const value = nilai.find((item) => item.studentId === id)?.nilai;
        return Number(value ?? 0);
    };
    const formatif = rekap.filter((item) =>
        item.jenisPenilaian.toLowerCase().includes("formatif")
    );
    const sumatif = rekap.filter((item) => {
        const jenis = item.jenisPenilaian.toLowerCase();
        return jenis.includes("sumatif") && !jenis.includes("sumatif akhir semester");
    });
    const sas = rekap.find((item) =>
        item.jenisPenilaian.toLowerCase().includes("sumatif akhir semester")
    );

    const formatifScore = getStudentScore(studentId, formatif, getScore);
    const sumatifScore = getStudentScore(studentId, sumatif, getScore);
    const sasScore = sas ? getScore(sas.nilai, studentId) : 0;

    return (
        (formatifScore * bobot.formatif) / 100 +
        (sumatifScore * bobot.sumatif) / 100 +
        (sasScore * bobot.sas) / 100
    );
}

function getStatusNilai(rataRata: number | null): LegerRow["statusNilai"] {
    if (rataRata === null || rataRata === 0) return "belum-dinilai";
    if (rataRata >= 75) return "tuntas";
    if (rataRata >= 60) return "belum-tuntas";
    return "kurang";
}

export default function LegerNilaiPage() {
    const { user } = useAuth();
    const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
    const [kelasList, setKelasList] = useState<{ kelasId: string; namaKelas: string }[]>([]);
    const [tahunAjaran, setTahunAjaran] = useState("");
    const [kelasId, setKelasId] = useState("");
    const [mapelList, setMapelList] = useState<string[]>([]);
    const [rows, setRows] = useState<LegerRow[]>([]);
    const [search, setSearch] = useState("");
    const [statusNilai, setStatusNilai] = useState("semua");
    const [loadingFilter, setLoadingFilter] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user?.uid) return;

        getTahunAjaranPenilaian(user.uid)
            .then((list) => {
                setTahunAjaranList(list);
                setTahunAjaran((current) => current || list[0] || "");
            })
            .catch(() => setError("Gagal mengambil daftar tahun ajaran."));
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid || !tahunAjaran) {
            return;
        }

        const uid = user.uid;

        async function loadKelas() {
            setLoadingFilter(true);
            try {
            const list = await getKelasPenilaian(uid, tahunAjaran);
                setKelasList(list);
                setKelasId((current) =>
                    list.some((kelas) => kelas.kelasId === current)
                        ? current
                        : list[0]?.kelasId || ""
                );
            } catch {
                setError("Gagal mengambil daftar kelas.");
            } finally {
                setLoadingFilter(false);
            }
        }

        loadKelas();
    }, [user?.uid, tahunAjaran]);

    useEffect(() => {
        if (!user?.uid || !user.schoolId || !tahunAjaran || !kelasId) {
            return;
        }

        let cancelled = false;
        const uid = user.uid;
        const schoolId = user.schoolId;

        async function loadLeger() {
            setLoadingData(true);
            setError("");
            try {
                const [students, mapelData, attendance] = await Promise.all([
                    getAnggotaKelas(kelasId),
                    getMapelPenilaian(uid, tahunAjaran, kelasId),
                    getAttendanceStudentRecap(schoolId, tahunAjaran, kelasId),
                ]);
                const mapel = mapelData.map((item) => item.mapel);
                const attendanceMap = new Map(
                    attendance.map((item) => [item.studentId, item])
                );
                const nilaiPerMapel = await Promise.all(
                    mapel.map(async (namaMapel) => {
                        const [rekap, bobot] = await Promise.all([
                            getPenilaianRekap(uid, kelasId, namaMapel, tahunAjaran),
                            getBobotPenilaian(uid, tahunAjaran, kelasId, namaMapel),
                        ]);
                        const scores = Object.fromEntries(
                            students.map((student) => [
                                student.studentId || student.id,
                                calculateFinalScore(
                                    student.studentId || student.id,
                                    rekap,
                                    bobot ?? DEFAULT_BOBOT
                                ),
                            ])
                        );
                        return [namaMapel, scores] as const;
                    })
                );

                if (cancelled) return;
                const scoreMap = Object.fromEntries(nilaiPerMapel) as Record<string, Record<string, number>>;
                const result = students.map((student) => {
                    const studentId = student.studentId || student.id;
                    const nilai = Object.fromEntries(
                        mapel.map((namaMapel) => [
                            namaMapel,
                            scoreMap[namaMapel]?.[studentId] ?? 0,
                        ])
                    );
                    const nilaiValues = Object.values(nilai);
                    const rataRata = nilaiValues.length > 0
                        ? nilaiValues.reduce((total, value) => total + value, 0) / nilaiValues.length
                        : null;

                    return {
                        student,
                        nilai,
                        rataRata,
                        statusNilai: getStatusNilai(rataRata),
                        peringkat: null,
                        presensi: attendanceMap.get(studentId) ?? null,
                    };
                });
                const rankedRows = [...result]
                    .filter((row) => row.rataRata !== null)
                    .sort((a, b) => {
                        const difference = (b.rataRata ?? 0) - (a.rataRata ?? 0);
                        return difference || a.student.nama.localeCompare(b.student.nama, "id");
                    });
                const rankMap = new Map<string, number>();
                rankedRows.forEach((row, index) => {
                    rankMap.set(row.student.studentId || row.student.id, index + 1);
                });

                setMapelList(mapel);
                setRows(result.map((row) => ({
                    ...row,
                    peringkat: row.rataRata === null
                        ? null
                        : rankMap.get(row.student.studentId || row.student.id) ?? null,
                })));
            } catch (loadError) {
                if (!cancelled) {
                    console.error(loadError);
                    setRows([]);
                    setMapelList([]);
                    setError("Gagal mengambil data leger nilai.");
                }
            } finally {
                if (!cancelled) setLoadingData(false);
            }
        }

        loadLeger();
        return () => {
            cancelled = true;
        };
    }, [user?.uid, user?.schoolId, tahunAjaran, kelasId]);

    const filteredRows = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        return rows.filter(({ student, statusNilai: rowStatus }) =>
            (!keyword ||
                student.nama.toLowerCase().includes(keyword) ||
                String(student.nis ?? "").toLowerCase().includes(keyword) ||
                String(student.nisn ?? "").toLowerCase().includes(keyword)) &&
            (statusNilai === "semua" || rowStatus === statusNilai)
        );
    }, [rows, search, statusNilai]);

    const {
        currentPage,
        pageSize,
        totalPages,
        startIndex,
        currentData,
        setCurrentPage,
        setPageSize,
    } = usePagination({
        data: filteredRows,
        pageSize: 10,
        resetDeps: [search, statusNilai, tahunAjaran, kelasId],
    });

    const selectedClassName = kelasList.find((kelas) => kelas.kelasId === kelasId)?.namaKelas;

    const handleDownloadExcel = () => {
        if (filteredRows.length === 0) return;

        const data = filteredRows.map((row, index) => ({
            No: index + 1,
            Induk: row.student.nis || "",
            NISN: row.student.nisn || "",
            "Nama Siswa": row.student.nama,
            "L/P": row.student.jk || "",
            ...Object.fromEntries(
                mapelList.map((mapel) => [
                    getMapelSingkatan(mapel),
                    row.rataRata === null ? "" : Number(row.nilai[mapel].toFixed(2)),
                ])
            ),
            "Rata-rata": row.rataRata === null ? "" : Number(row.rataRata.toFixed(2)),
            Peringkat: row.peringkat ?? "",
            H: row.presensi?.hadir ?? 0,
            S: row.presensi?.sakit ?? 0,
            I: row.presensi?.izin ?? 0,
            A: row.presensi?.alpha ?? 0,
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leger Nilai");
        XLSX.writeFile(
            workbook,
            `Leger-Nilai-${selectedClassName || kelasId}-${tahunAjaran}.xlsx`
        );
    };

    return (
        <main className="content-wrapper">
            <div className="container-fluid py-2">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                    <div>
                        <h3 className="mb-1">Leger Nilai</h3>
                        <p className="text-muted mb-0">Rekap nilai, peringkat, dan presensi siswa</p>
                    </div>
                    {selectedClassName && <span className="badge bg-primary fs-6">{selectedClassName}</span>}
                </div>

                <div className="card shadow-sm mb-3">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4">
                                <label htmlFor="tahunAjaran" className="form-label fw-semibold">Tahun Ajaran</label>
                                <select
                                    id="tahunAjaran"
                                    className="form-select"
                                    value={tahunAjaran}
                                    onChange={(event) => setTahunAjaran(event.target.value)}
                                    disabled={tahunAjaranList.length === 0}
                                >
                                    <option value="">Pilih tahun ajaran</option>
                                    {tahunAjaranList.map((tahun) => <option key={tahun} value={tahun}>{tahun}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="kelas" className="form-label fw-semibold">Kelas</label>
                                <select
                                    id="kelas"
                                    className="form-select"
                                    value={kelasId}
                                    onChange={(event) => setKelasId(event.target.value)}
                                    disabled={loadingFilter || kelasList.length === 0}
                                >
                                    <option value="">Pilih kelas</option>
                                    {kelasList.map((kelas) => <option key={kelas.kelasId} value={kelas.kelasId}>{kelas.namaKelas}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <SearchInput
                                    value={search}
                                    onChange={setSearch}
                                    placeholder="Cari nama, induk, atau NISN..."
                                    width="100%"
                                    disabled={loadingData || rows.length === 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="card shadow-sm">
                    <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center gap-2">
                        <h5 className="mb-0">Hasil Leger</h5>
                        <button
                            type="button"
                            className="btn btn-success btn-sm ms-auto"
                            onClick={handleDownloadExcel}
                            disabled={loadingData || filteredRows.length === 0}
                            title="Download Excel"
                        >
                            <i className="fas fa-file-excel me-2"></i>
                            Download Excel
                        </button>
                    </div>
                    <div className="card-body">
                        {loadingData && <p className="text-muted mb-0">Memuat leger nilai...</p>}
                        {!loadingData && !tahunAjaran && <p className="text-muted mb-0">Pilih tahun ajaran untuk melihat leger.</p>}
                        {!loadingData && tahunAjaran && !kelasId && <p className="text-muted mb-0">Belum ada kelas dengan data penilaian pada tahun ajaran ini.</p>}
                        {!loadingData && kelasId && filteredRows.length === 0 && <p className="text-muted mb-0">Tidak ada data siswa yang sesuai.</p>}
                        {!loadingData && filteredRows.length > 0 && (
                            <>
                                <div className="table-responsive">
                                    <table className="table table-bordered table-striped align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th className="text-center" style={{ minWidth: 55 }}>No</th>
                                                <th style={{ minWidth: 110 }}>Induk</th>
                                                <th style={{ minWidth: 120 }}>NISN</th>
                                                <th style={{ whiteSpace: "nowrap" }}>Nama Siswa</th>
                                                <th className="text-center" style={{ minWidth: 65 }}>L/P</th>
                                                {mapelList.map((mapel) => <th key={mapel} className="text-center" style={{ minWidth: 90 }}>{getMapelSingkatan(mapel)}</th>)}
                                                <th className="text-center" style={{ minWidth: 100 }}>Rata-rata</th>
                                                <th className="text-center" style={{ minWidth: 85 }}>Peringkat</th>
                                                <th className="text-center" style={{ minWidth: 160 }}>Rekap Kehadiran</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentData.map((row, index) => {
                                                const presence = row.presensi;
                                                return (
                                                    <tr key={row.student.studentId || row.student.id}>
                                                        <td className="text-center">{startIndex + index + 1}</td>
                                                        <td>{row.student.nis || "-"}</td>
                                                        <td>{row.student.nisn || "-"}</td>
                                                        <td style={{ whiteSpace: "nowrap" }}>{row.student.nama}</td>
                                                        <td className="text-center">{row.student.jk || "-"}</td>
                                                        {mapelList.map((mapel) => <td key={mapel} className="text-center">{row.rataRata === null ? "-" : row.nilai[mapel].toFixed(2)}</td>)}
                                                        <td className="text-center fw-semibold">{row.rataRata === null ? "-" : row.rataRata.toFixed(2)}</td>
                                                        <td className="text-center">{row.peringkat ?? "-"}</td>
                                                        <td>
                                                            <div className="d-flex flex-wrap justify-content-center gap-1 small">
                                                                <span className="badge bg-success">H {presence?.hadir ?? 0}</span>
                                                                <span className="badge bg-info">S {presence?.sakit ?? 0}</span>
                                                                <span className="badge bg-warning text-dark">I {presence?.izin ?? 0}</span>
                                                                <span className="badge bg-danger">A {presence?.alpha ?? 0}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <TableFooter
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalData={filteredRows.length}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
