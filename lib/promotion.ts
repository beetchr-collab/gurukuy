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
 * Mengambil nilai kelas siswa sebagai angka
 */
function getStudentClassLevel(
  student: Student
): number {
  const candidates = [
    student.tingkatKelas,
    student.kelas,
    (student as Student & { kelasSiswa?: string }).kelasSiswa,
  ];

  for (const rawValue of candidates) {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue;
    }

    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();

      if (!trimmed) {
        continue;
      }

      const normalized = trimmed.toLowerCase();

      const romanMap: Record<string, number> = {
        i: 1,
        ii: 2,
        iii: 3,
        iv: 4,
        v: 5,
        vi: 6,
        vii: 7,
        viii: 8,
        ix: 9,
        x: 10,
      };

      if (romanMap[normalized]) {
        return romanMap[normalized];
      }

      const match = trimmed.match(/\d+/);

      if (match) {
        return Number(match[0]);
      }
    }
  }

  return 0;
}

/**
 * Menentukan status siswa
 */
export function getPromotionStatus(
  student: Student
): PromotionStatus {
  const academicYear =
    typeof student.tahunAjaran === "string"
      ? student.tahunAjaran
      : "";

  const semester = getSemester(academicYear);
  const currentClass = getStudentClassLevel(student);

  if (typeof student.status === "string") {
    const normalizedStatus = student.status.toUpperCase();

    if (normalizedStatus === "NAIK" || normalizedStatus === "TETAP" || normalizedStatus === "LULUS") {
      return normalizedStatus as PromotionStatus;
    }
  }

  // Semester ganjil tidak naik kelas
  if (semester === "Ganjil") {
    return "TETAP";
  }

  // Semester genap kelas 6 lulus
  if (currentClass >= 6) {
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
  const currentClass = getStudentClassLevel(student);

  switch (status) {
    case "NAIK":
      return getNextClass(currentClass);

    case "TETAP":
      return currentClass;

    case "LULUS":
      return currentClass;

    default:
      return currentClass;
  }
}

/**
 * Mengubah Student menjadi PromotionStudent
 */
export function createPromotionPreview(
  student: Student
): PromotionStudent {

  const status = getPromotionStatus(student);
  const currentClass = getStudentClassLevel(student);

  const academicYear = student.tahunAjaran ?? "";

  return {
    id: student.id,
    nama: student.nama,
    nis: student.nis,
    nisn: student.nisn,
    tingkatKelasLama: currentClass,
    tingkatKelasBaru: calculateNewClass(student),
    tahunAjaranLama: academicYear,
    tahunAjaranBaru: getNextAcademicYear(academicYear),
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