"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAnggotaKelas, AnggotaKelas } from "@/services/anggotakelas.service";
import { getClassesByOwner, ClassData } from "@/services/kelas.service";
import {
  getPenilaianDataByOwner,
  PenilaianData,
} from "@/services/penilaian-data.service";
import { getNilaiByPenilaian, NilaiSiswa } from "@/services/penilaian.service";
import { getActiveTahunAjaran } from "@/services/tahunajaran.service";
import { usePagination } from "@/hooks/usePagination";
import TableFooter from "@/components/pagination/TableFooter";

type PendingTask = {
  id: string;
  mapel: string;
  topik: string;
  subtopik: string;
  jenisPenilaian: string;
};

type StudentRow = {
  id: string;
  studentId: string;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  kelas: string;
  pendingTasks: PendingTask[];
  pendingScoreCount: number;
};

function getStudentKey(student: AnggotaKelas) {
  return student.studentId || student.id;
}

function normalizeStudentName(name: string | undefined) {
  return (name ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("id");
}

export default function TagihanTugasPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [assessments, setAssessments] = useState<PenilaianData[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(
    null,
  );
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;

    async function loadOptions() {
      setLoadingSetup(true);
      setError("");

      try {
        const [classData, assessmentData, activeYear] = await Promise.all([
          getClassesByOwner(user!.uid),
          getPenilaianDataByOwner(user!.uid),
          user!.schoolId
            ? getActiveTahunAjaran(user!.schoolId)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const years = Array.from(
          new Set(
            [
              ...classData.map((item) => item.tahunAjaran),
              ...assessmentData.map((item) => item.tahunAjaran ?? ""),
              activeYear?.tahunAjaran ?? "",
            ].filter(Boolean),
          ),
        ).sort((a, b) => b.localeCompare(a));

        setClasses(classData);
        setAssessments(assessmentData);
        setTahunAjaranList(years);
        setTahunAjaran((current) =>
          current && years.includes(current)
            ? current
            : years.includes(activeYear?.tahunAjaran ?? "")
              ? activeYear!.tahunAjaran
              : (years[0] ?? ""),
        );
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Gagal mengambil data tahun ajaran.");
      } finally {
        if (!cancelled) setLoadingSetup(false);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.schoolId]);

  useEffect(() => {
    if (!tahunAjaran || !user?.uid) {
      setRows([]);
      return;
    }

    let cancelled = false;

    async function loadStudentsAndPendingTasks() {
      setLoadingRows(true);
      setError("");

      try {
        const yearClasses = classes.filter(
          (item) => item.tahunAjaran === tahunAjaran,
        );
        const yearAssessments = assessments.filter(
          (item) => item.tahunAjaran === tahunAjaran,
        );

        const [classStudents, assessmentValues] = await Promise.all([
          Promise.all(
            yearClasses.map(async (kelas) => ({
              kelas,
              students: await getAnggotaKelas(kelas.id),
            })),
          ),
          Promise.all(
            yearAssessments.map(async (assessment) => ({
              assessment,
              students: await getNilaiByPenilaian(assessment.id),
            })),
          ),
        ]);

        if (cancelled) return;

        const tasksByStudent = new Map<string, PendingTask[]>();
        assessmentValues.forEach(({ assessment, students }) => {
          students.forEach((student: NilaiSiswa) => {
            if (
              student.nilai !== null &&
              student.nilai !== undefined &&
              !(
                typeof student.nilai === "string" && student.nilai.trim() === ""
              )
            ) {
              return;
            }

            const key = normalizeStudentName(student.nama);
            if (!key) return;
            const pending = tasksByStudent.get(key) ?? [];
            pending.push({
              id: assessment.id,
              mapel: assessment.mapel ?? "-",
              topik: assessment.topik ?? "Tanpa topik",
              subtopik: assessment.subtopik ?? "",
              jenisPenilaian: assessment.jenisPenilaian ?? "",
            });
            tasksByStudent.set(key, pending);
          });
        });

        const result = classStudents
          .flatMap(({ kelas, students }) =>
            students.map((student) => {
              const studentId = getStudentKey(student);
              const pendingTasks =
                tasksByStudent.get(normalizeStudentName(student.nama)) ?? [];
              return {
                id: `${kelas.id}:${studentId}`,
                studentId,
                nis: student.nis ?? "-",
                nisn: student.nisn ?? "-",
                nama: student.nama ?? "Tanpa nama",
                jk: student.jk ?? "-",
                kelas: kelas.namaKelas,
                pendingTasks,
                pendingScoreCount: pendingTasks.length,
              };
            }),
          )
          .sort((a, b) =>
            a.nama.localeCompare(b.nama, "id", { sensitivity: "base" }),
          );

        setRows(result);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Gagal mengambil data siswa dan penilaian.");
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    }

    loadStudentsAndPendingTasks();
    return () => {
      cancelled = true;
    };
  }, [classes, assessments, tahunAjaran, user?.uid]);

  const pagination = usePagination({
    data: rows,
    pageSize: 10,
    resetDeps: [tahunAjaran],
  });

  const pendingTaskCount = useMemo(
    () =>
      rows.reduce((total, student) => total + student.pendingTasks.length, 0),
    [rows],
  );

  if (!user?.uid || loadingSetup) {
    return <div className="container-fluid py-3">Memuat data...</div>;
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h3 className="mb-1">Tagihan Tugas Siswa</h3>
          <p className="text-muted mb-0">
            Daftar tugas yang belum dinilai pada seluruh mata pelajaran.
          </p>
        </div>
        <div className="form-group mb-0" style={{ minWidth: 220 }}>
          <label htmlFor="tahun-ajaran" className="mb-1">
            Tahun Ajaran
          </label>
          <select
            id="tahun-ajaran"
            className="form-control"
            value={tahunAjaran}
            onChange={(event) => setTahunAjaran(event.target.value)}
            disabled={tahunAjaranList.length === 0}
          >
            {tahunAjaranList.length === 0 && (
              <option value="">Tidak ada tahun ajaran</option>
            )}
            {tahunAjaranList.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
        <span className="text-muted">{rows.length} siswa</span>
        <span className="text-muted">
          {pendingTaskCount} tugas belum dinilai
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover bg-white">
          <thead className="thead-light">
            <tr>
              <th scope="col">No</th>
              <th scope="col">NIS</th>
              <th scope="col">NISN</th>
              <th scope="col">Nama</th>
              <th scope="col">L/P</th>
              <th scope="col">Kelas</th>
              <th scope="col">Tugas Belum Dinilai</th>
              <th scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loadingRows ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Memuat data siswa...
                </td>
              </tr>
            ) : pagination.currentData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  Tidak ada data siswa untuk tahun ajaran ini.
                </td>
              </tr>
            ) : (
              pagination.currentData.map((student, index) => (
                <tr key={student.id}>
                  <td>{pagination.startIndex + index + 1}</td>
                  <td>{student.nis}</td>
                  <td>{student.nisn}</td>
                  <td>{student.nama}</td>
                  <td>{student.jk}</td>
                  <td>{student.kelas}</td>
                  <td className="text-center">{student.pendingScoreCount}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => setSelectedStudent(student)}>
                      <span><i className="fa-solid fa-eye"></i></span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TableFooter
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalData={rows.length}
        onPageChange={pagination.setCurrentPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {selectedStudent && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-tasks-title"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header d-flex align-items-start justify-content-between">
                <div>
                  <h5 className="modal-title" id="pending-tasks-title">
                    Tugas Belum Dinilai
                  </h5>
                  <small className="text-muted">
                    {selectedStudent.nama} · {selectedStudent.kelas}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-light border rounded-circle d-inline-flex align-items-center justify-content-center p-0 flex-shrink-0"
                  aria-label="Tutup"
                  title="Tutup"
                  onClick={() => setSelectedStudent(null)}
                  style={{ width: 32, height: 32, lineHeight: 1 }}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="list-group">
                  {selectedStudent.pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2"
                    >
                      <div>
                        <strong>{task.topik}</strong>
                        {task.subtopik && (
                          <div className="small text-muted">
                            {task.subtopik}
                          </div>
                        )}
                        <div className="small text-muted">
                          {task.mapel}
                          {task.jenisPenilaian
                            ? ` · ${task.jenisPenilaian}`
                            : ""}
                        </div>
                      </div>
                      <Link
                        className="btn btn-sm btn-primary"
                        href={`/admin/guru/penilaian/${task.id}`}
                      >
                        Buka penilaian
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedStudent(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
