/**
 * Data siswa yang diambil dari collection students
 */
export interface Student {
  id: string;
  nama: string;
  nis: number;
  nisn?: string;
  jk: "L" | "P";
  kelas: number;
  tahunAjaran: string;
  schoolId: string;
  ownerId: string;
}

/**
 * Status hasil simulasi kenaikan tingkat
 */
export type PromotionStatus =
  | "NAIK"
  | "TETAP"
  | "LULUS";

/**
 * Data yang ditampilkan pada Preview
 */
export interface PromotionStudent {
  id: string;

  nama: string;

  nis: number;

  kelasLama: number;

  kelasBaru: number;

  tahunAjaranLama: string;

  tahunAjaranBaru: string;

  status: PromotionStatus;

  /**
   * apakah dipilih untuk diproses
   */
  selected: boolean;
}

/**
 * Ringkasan hasil preview
 */
export interface PromotionSummary {
  total: number;

  promoted: number;

  retained: number;

  graduated: number;
}

/**
 * Form kenaikan tingkat
 */
export interface PromotionFormData {
  currentAcademicYear: string;

  nextAcademicYear: string;
}

/**
 * Hasil proses batch
 */
export interface PromotionResult {
  success: number;

  failed: number;

  total: number;
}

/**
 * Log proses kenaikan tingkat
 */
export interface PromotionLog {
  id?: string;

  fromAcademicYear: string;

  toAcademicYear: string;

  promoted: number;

  retained: number;

  graduated: number;

  total: number;

  createdBy: string;

  createdAt: Date;
}