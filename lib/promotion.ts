import {
  PromotionStatus,
  PromotionStudent,
  Student,
} from "@/types/promotion";

/**
 * Menghasilkan tahun ajaran berikutnya
 *
 * Contoh:
 * 2025/2026 Ganjil -> 2025/2026 Genap
 * 2025/2026 Genap -> 2026/2027 Ganjil
 */
export function getNextAcademicYear(
  academicYear: string
): string {
  const [year, semester] = academicYear.split(" ");

  const [start, end] = year.split("/").map(Number);

  if (semester === "Ganjil") {
    return `${start}/${end} Genap`;
  }

  return `${start + 1}/${end + 1} Ganjil`;
}

/**
 * Semester saat ini
 */
export function getSemester(
  academicYear: string
): "Ganjil" | "Genap" {
  return academicYear.includes("Genap")
    ? "Genap"
    : "Ganjil";
}

/**
 * Menentukan kelas berikutnya
 */
export function getNextClass(
  currentClass: number
): number {
  if (currentClass >= 6) {
    return 6;
  }

  return currentClass + 1;
}

/**
 * Menentukan status siswa
 */
export function getPromotionStatus(
  student: Student
): PromotionStatus {
  const semester = getSemester(student.tahunAjaran);

  // Semester ganjil tidak naik kelas
  if (semester === "Ganjil") {
    return "TETAP";
  }

  // Semester genap kelas 6 lulus
  if (student.kelas >= 6) {
    return "LULUS";
  }

  return "NAIK";
}

/**
 * Menghasilkan kelas baru
 */
export function calculateNewClass(
  student: Student
): number {
  const status = getPromotionStatus(student);

  switch (status) {
    case "NAIK":
      return getNextClass(student.kelas);

    case "TETAP":
      return student.kelas;

    case "LULUS":
      return student.kelas;

    default:
      return student.kelas;
  }
}

/**
 * Mengubah Student menjadi PromotionStudent
 */
export function createPromotionPreview(
  student: Student
): PromotionStudent {

  const status = getPromotionStatus(student);

  return {
    id: student.id,

    nama: student.nama,

    nis: student.nis,

    kelasLama: student.kelas,

    kelasBaru: calculateNewClass(student),

    tahunAjaranLama: student.tahunAjaran,

    tahunAjaranBaru: getNextAcademicYear(
      student.tahunAjaran
    ),

    status,

    selected: true,
  };
}

/**
 * Membuat preview seluruh siswa
 */
export function buildPromotionPreview(
  students: Student[]
): PromotionStudent[] {

  return students.map(createPromotionPreview);
}

/**
 * Menghitung ringkasan
 */
export function calculatePromotionSummary(
  preview: PromotionStudent[]
) {
  const promoted = preview.filter(
    (s) => s.status === "NAIK"
  ).length;

  const retained = preview.filter(
    (s) => s.status === "TETAP"
  ).length;

  const graduated = preview.filter(
    (s) => s.status === "LULUS"
  ).length;

  return {
    total: preview.length,

    promoted,

    retained,

    graduated,
  };
}

/**
 * Mengaktifkan / menonaktifkan siswa
 */
export function toggleSelected(
  preview: PromotionStudent[],
  studentId: string
): PromotionStudent[] {

  return preview.map((student) => {

    if (student.id !== studentId) {
      return student;
    }

    return {
      ...student,
      selected: !student.selected,
    };
  });
}

/**
 * Memilih semua siswa
 */
export function selectAll(
  preview: PromotionStudent[]
): PromotionStudent[] {

  return preview.map((student) => ({
    ...student,
    selected: true,
  }));
}

/**
 * Menghapus semua pilihan
 */
export function unselectAll(
  preview: PromotionStudent[]
): PromotionStudent[] {

  return preview.map((student) => ({
    ...student,
    selected: false,
  }));
}

/**
 * Mengambil siswa yang dipilih
 */
export function getSelectedStudents(
  preview: PromotionStudent[]
): PromotionStudent[] {

  return preview.filter(
    (student) => student.selected
  );
}