"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AcademicYearOption,
  getActiveAcademicYears,
} from "@/services/kepalaSekolah.service";

interface PromotionFormProps {
  loading: boolean;

  currentAcademicYear: string;

  nextAcademicYear: string;

  onPreview: (academicYear: string) => Promise<void>;
}

export default function PromotionForm({
  loading,
  currentAcademicYear,
  nextAcademicYear,
  onPreview,
}: PromotionFormProps) {
  const [academicYear, setAcademicYear] = useState("");
  const { user } = useAuth();

  const [academicYears, setAcademicYears] =
    useState<AcademicYearOption[]>([]);

  useEffect(() => {
    if (currentAcademicYear) {
      setAcademicYear(currentAcademicYear);
    }
  }, [currentAcademicYear]);

  useEffect(() => {
    async function loadAcademicYears() {
      if (!user?.schoolId) return;

      const data = await getActiveAcademicYears(user.schoolId);

      setAcademicYears(data);

      if (data.length > 0) {
        setAcademicYear(data[0].tahunAjaran);
      }
    }

    loadAcademicYears();
  }, [user]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!academicYear) {
      alert("Pilih tahun ajaran terlebih dahulu.");
      return;
    }

    await onPreview(academicYear);
  };

  return (
    <div className="card card-primary">

      <div className="card-header">
        <h3 className="card-title">
          Proses Kenaikan Tingkat
        </h3>
      </div>

      <form onSubmit={handleSubmit}>

        <div className="card-body">

          {/* Tahun Ajaran */}

          <div className="form-group">
            <label>Tahun Ajaran</label>

            <select
              className="form-control"
              value={academicYear}
              onChange={(e) =>
                setAcademicYear(e.target.value)
              }
            >

              <option value="">
                -- Pilih Tahun Ajaran --
              </option>

              {academicYears.map((item) => (
                <option
                  key={item.id}
                  value={item.tahunAjaran}
                >
                  {item.tahunAjaran}
                </option>
              ))}

            </select>

            <small className="text-muted">
              Tahun ajaran diambil dari Kepala Sekolah yang
              berstatus aktif.
            </small>
          </div>

          <hr />

          {/* Saat Ini */}

          <div className="form-group">

            <label>Tahun Ajaran Saat Ini</label>

            <input
              className="form-control"
              value={currentAcademicYear}
              readOnly
            />

          </div>

          {/* Tujuan */}

          <div className="form-group">

            <label>Tahun Ajaran Tujuan</label>

            <input
              className="form-control"
              value={nextAcademicYear}
              readOnly
            />

          </div>

          <hr />

          <div className="alert alert-info">

            <strong>Informasi</strong>

            <ul className="mb-0 mt-2">

              <li>
                Semester <b>Genap</b> akan menaikkan kelas.
              </li>

              <li>
                Semester <b>Ganjil</b> hanya berpindah semester.
              </li>

              <li>
                Kelas 6 akan berstatus <b>Lulus</b>.
              </li>

            </ul>

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
                <span className="spinner-border spinner-border-sm mr-2" />
                Memuat...
              </>
            ) : (
              <>
                <i className="fas fa-search mr-2" />
                Preview Kenaikan
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}