"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { parseCbtApiResponse } from "@/lib/cbt-api-response";

type ExamEntry = {
  id: string;
  nama: string;
  mataPelajaran: string;
  kelas: string;
};

type ExamColumn = ExamEntry;

type StudentEntry = {
  studentId: string;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  scores: Record<string, number | null>;
};

export default function RekapEujianPage() {
  const { user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamColumn[]>([]);
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      setStudents([]);
      setExams([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadRecap = async () => {
      setLoading(true);
      setError("");
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error("Sesi pengguna tidak valid. Silakan masuk kembali.");
        }

        const response = await fetch("/api/cbt/recap", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const result = await parseCbtApiResponse<{
          success: boolean;
          message?: string;
          exams?: ExamColumn[];
          students?: StudentEntry[];
        }>(response, "Gagal memuat rekap E-Ujian.");

        if (!cancelled) {
          setExams(result.exams || []);
          setStudents(result.students || []);
        }
      } catch (loadError) {
        console.error("Gagal memuat rekap E-Ujian:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat rekap E-Ujian."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRecap();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid]);

  const examsWithScores = useMemo(
    () =>
      exams.filter((exam) =>
        students.some((student) => typeof student.scores[exam.id] === "number")
      ),
    [exams, students]
  );

  const studentsWithScores = useMemo(
    () =>
      students.filter((student) =>
        examsWithScores.some(
          (exam) => typeof student.scores[exam.id] === "number"
        )
      ),
    [examsWithScores, students]
  );

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("id");
    if (!keyword) return studentsWithScores;

    return studentsWithScores.filter((student) =>
      [
        student.nis,
        student.nisn,
        student.nama,
        ...examsWithScores.flatMap((exam) => [
          exam.nama,
          exam.mataPelajaran,
          exam.kelas,
        ]),
      ]
        .join(" ")
        .toLocaleLowerCase("id")
        .includes(keyword)
    );
  }, [examsWithScores, search, studentsWithScores]);

  const downloadExcel = () => {
    const header = [
      ["No", "NIS", "NISN", "Nama", "L/P", "Rekap Nilai"],
      [
        "",
        "",
        "",
        "",
        "",
        ...examsWithScores.map((exam) => exam.nama),
      ],
    ];
    const rows = filteredStudents.map((student, index) => [
      index + 1,
      student.nis || "-",
      student.nisn || "-",
      student.nama || "-",
      student.jk || "-",
      ...examsWithScores.map((exam) => student.scores[exam.id] ?? ""),
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    if (examsWithScores.length > 0) {
      worksheet["!merges"] = [
        ...Array.from({ length: 5 }, (_, column) => ({
          s: { r: 0, c: column },
          e: { r: 1, c: column },
        })),
        {
          s: { r: 0, c: 5 },
          e: { r: 0, c: 4 + examsWithScores.length },
        },
      ];
    } else {
      worksheet["!merges"] = Array.from({ length: 6 }, (_, column) => ({
        s: { r: 0, c: column },
        e: { r: 1, c: column },
      }));
    }
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 18 },
      { wch: 28 },
      { wch: 8 },
      ...examsWithScores.map(() => ({ wch: 24 })),
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");
    XLSX.writeFile(
      workbook,
      `Rekap-E-Ujian-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
              <h4 className="app-content-headerText">Rekap E-Ujian</h4>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">
                  <a href="/admin/guru/eujian">E-Ujian</a>
                </li>
                <li className="breadcrumb-item active">Rekap</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <section
            className="callout border-0 shadow-sm rounded-4 p-4 mb-3"
            style={{
              background: "linear-gradient(135deg, #0d6efd 0%, #4f46e5 100%)",
              color: "#fff",
            }}
          >
            <div className="d-flex align-items-start gap-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.15)",
                  fontSize: 26,
                }}
              >
                <i className="fas fa-table-list" aria-hidden="true" />
              </div>
              <div>
                <h4 className="fw-bold mb-2">Rekap Peserta E-Ujian</h4>
                <p className="mb-3" style={{ opacity: 0.9 }}>
                  Lihat nilai siswa untuk setiap ujian yang pernah diikuti.
                </p>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h3 className="card-title mb-0">Daftar Siswa</h3>
              <div className="d-flex flex-nowrap align-items-center gap-2 ms-auto">
                <input
                  aria-label="Cari siswa atau ujian"
                  className="form-control"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari NIS, NISN, nama, atau ujian"
                  style={{ width: "min(360px, 45vw)" }}
                  type="search"
                  value={search}
                />
                <button
                  className="btn btn-success btn-sm"
                  disabled={loading || filteredStudents.length === 0}
                  onClick={downloadExcel}
                  type="button"
                >
                  <i className="fas fa-download me-2" aria-hidden="true" />
                  Download Excel
                </button>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th rowSpan={examsWithScores.length > 0 ? 2 : undefined} scope="col">
                        No
                      </th>
                      <th rowSpan={examsWithScores.length > 0 ? 2 : undefined} scope="col">
                        NIS
                      </th>
                      <th rowSpan={examsWithScores.length > 0 ? 2 : undefined} scope="col">
                        NISN
                      </th>
                      <th rowSpan={examsWithScores.length > 0 ? 2 : undefined} scope="col">
                        Nama
                      </th>
                      <th rowSpan={examsWithScores.length > 0 ? 2 : undefined} scope="col">
                        L/P
                      </th>
                      {examsWithScores.length > 0 ? (
                        <th
                          className="text-center"
                          colSpan={examsWithScores.length}
                          scope="colgroup"
                        >
                          Rekap Nilai
                        </th>
                      ) : (
                        <th scope="col">Rekap Nilai</th>
                      )}
                    </tr>
                    {examsWithScores.length > 0 && (
                      <tr>
                        {examsWithScores.map((exam) => (
                          <th
                            className="text-center"
                            key={exam.id}
                            scope="col"
                            title={[exam.mataPelajaran, exam.kelas]
                              .filter(Boolean)
                              .join(" · ")}
                          >
                            {exam.nama}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          className="text-center text-muted py-4"
                          colSpan={5 + Math.max(examsWithScores.length, 1)}
                        >
                          Memuat rekap E-Ujian...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          className="text-center text-muted py-4"
                          colSpan={5 + Math.max(examsWithScores.length, 1)}
                        >
                          {search.trim()
                            ? "Data siswa tidak ditemukan."
                            : "Belum ada siswa yang memiliki nilai ujian."}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <tr key={student.studentId}>
                          <td>{index + 1}</td>
                          <td>{student.nis || "-"}</td>
                          <td>{student.nisn || "-"}</td>
                          <td className="fw-semibold">{student.nama || "-"}</td>
                          <td>{student.jk || "-"}</td>
                          {examsWithScores.length > 0 ? (
                            examsWithScores.map((exam) => {
                              const score = student.scores[exam.id];
                              return (
                                <td className="text-center" key={exam.id}>
                                  {typeof score === "number" ? score : ""}
                                </td>
                              );
                            })
                          ) : (
                            <td className="text-center text-muted">-</td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}