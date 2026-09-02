"use client";

import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { getClassesByOwner } from "@/services/kelas.service";
import { getActiveTahunAjaran } from "@/services/tahunajaran.service";
import { MATA_PELAJARAN } from "@/lib/mata-pelajaran";
import {
  MEDIA_PEMBELAJARAN_OPTIONS,
  METODE_PEMBELAJARAN_OPTIONS,
  REFLEKSI_PEMBELAJARAN_OPTIONS,
  type SelectOption,
} from "@/lib/jurnal-pembelajaran";

type KelasOption = {
  id: string;
  namaKelas: string;
};

type PresensiSiswaItem = {
  status?: "Hadir" | "Izin" | "Sakit" | "Alpha";
};

type JurnalFormState = {
  tanggal: string;
  tahunAjaran: string;
  kelasId: string;
  mapelId: string;
  jamKe: string;
  materi: string;
  tujuanPembelajaran: string;
  kegiatanPembelajaran: string;
  metodePembelajaran: string[];
  mediaPembelajaran: string[];
  jumlahSiswa: number | "";
  siswaHadir: number | "";
  siswaIzin: number | "";
  siswaSakit: number | "";
  siswaAlpha: number | "";
  catatan: string;
  catatanLainnya: string;
  status: "Draft" | "Selesai";
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  schoolId: string;
};

const makeInitialForm = (
  user: { uid?: string; schoolId?: string } | null,
  tahunAjaran: string,
): JurnalFormState => ({
  tanggal: new Date().toISOString().split("T")[0],
  tahunAjaran,
  kelasId: "",
  mapelId: "",
  jamKe: "1-2",
  materi: "",
  tujuanPembelajaran: "",
  kegiatanPembelajaran: "",
  metodePembelajaran: ["Problem Based Learning (PBL)"],
  mediaPembelajaran: ["Buku", "LKPD"],
  jumlahSiswa: "",
  siswaHadir: "",
  siswaIzin: 0,
  siswaSakit: 0,
  siswaAlpha: 0,
  catatan: "",
  catatanLainnya: "",
  status: "Draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: user?.uid ?? "",
  schoolId: user?.schoolId ?? "",
});

export default function TambahJurnalMengajarPage() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<JurnalFormState>(() =>
    makeInitialForm(user, ""),
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user?.schoolId || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const activeYear = await getActiveTahunAjaran(user.schoolId);
        const yearName = activeYear?.tahunAjaran ?? "";
        setTahunAjaran(yearName);

        const kelasData = await getClassesByOwner(user.uid);
        setKelasList(kelasData);

        setForm((prev) => ({
          ...prev,
          tahunAjaran: yearName,
          ownerId: user.uid,
          schoolId: user.schoolId ?? "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      } catch (error) {
        console.error("Gagal memuat data jurnal:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    const loadPresensiData = async () => {
      if (!user?.schoolId || !form.kelasId || !form.tanggal) {
        setForm((prev) => ({
          ...prev,
          jumlahSiswa: "",
          siswaHadir: "",
          siswaIzin: 0,
          siswaSakit: 0,
          siswaAlpha: 0,
        }));
        return;
      }

      try {
        const q = query(
          collection(db, "presensi"),
          where("schoolId", "==", user.schoolId),
          where("kelasId", "==", form.kelasId),
          where("tanggal", "==", form.tanggal),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setForm((prev) => ({
            ...prev,
            jumlahSiswa: "",
            siswaHadir: "",
            siswaIzin: 0,
            siswaSakit: 0,
            siswaAlpha: 0,
          }));
          return;
        }

        const presensiDoc = snapshot.docs[0];
        const rawSiswa = presensiDoc.data()?.siswa;
        const siswa: PresensiSiswaItem[] = Array.isArray(rawSiswa)
          ? (rawSiswa as PresensiSiswaItem[])
          : [];

        const hadir = siswa.filter((item) => item.status === "Hadir").length;
        const izin = siswa.filter((item) => item.status === "Izin").length;
        const sakit = siswa.filter((item) => item.status === "Sakit").length;
        const alpha = siswa.filter((item) => item.status === "Alpha").length;

        setForm((prev) => ({
          ...prev,
          jumlahSiswa: siswa.length,
          siswaHadir: hadir,
          siswaIzin: izin,
          siswaSakit: sakit,
          siswaAlpha: alpha,
        }));
      } catch (error) {
        console.error("Gagal memuat data presensi:", error);
      }
    };

    loadPresensiData();
  }, [user, form.kelasId, form.tanggal]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]:
          name.includes("jumlah") || name.includes("siswa")
            ? value === ""
              ? ""
              : Number(value)
            : value,
      } as JurnalFormState;

      return next;
    });
  };

  const handleKelasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      kelasId: e.target.value,
    }));
  };

  const handleMapelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      mapelId: e.target.value,
    }));
  };

  const handleMultiSelect = (
    selected: MultiValue<SelectOption>,
    field: "metodePembelajaran" | "mediaPembelajaran",
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: selected.map((item) => item.value),
    }));
  };

  const handleCatatanChange = (selected: MultiValue<SelectOption>) => {
    const values = selected.map((item) => item.value);
    const hasOther = values.includes("Lainnya");

    setForm((prev) => ({
      ...prev,
      catatan: values.join("; "),
      catatanLainnya: hasOther ? prev.catatanLainnya : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid || !user?.schoolId) {
      alert("User belum terautentikasi.");
      return;
    }

    if (!form.kelasId || !form.mapelId) {
      alert("Kelas dan mata pelajaran harus dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const finalCatatan =
        form.catatan === "Lainnya"
          ? form.catatanLainnya || ""
          : form.catatan;

      const payload = {
        ...form,
        catatan: finalCatatan,
        metodePembelajaran: form.metodePembelajaran,
        mediaPembelajaran: form.mediaPembelajaran,
        createdAt: now,
        updatedAt: now,
        ownerId: user.uid,
        schoolId: user.schoolId,
        tahunAjaran: form.tahunAjaran || tahunAjaran,
      };

      console.log("Data jurnal mengajar siap dikirim:", payload);

      const docRef = await addDoc(collection(db, "jurnal_mengajar"), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Jurnal berhasil disimpan dengan ID:", docRef.id);
      alert("Form jurnal mengajar berhasil disimpan.");

      setForm((prev) => ({
        ...makeInitialForm(user, tahunAjaran),
        status: prev.status,
      }));
    } catch (error) {
      console.error("Gagal menyimpan jurnal mengajar:", error);
      alert("Gagal menyimpan jurnal mengajar. Cek izin Firestore dan data user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapelOptions = MATA_PELAJARAN.map((item) => ({
    value: item.idMataPelajaran,
    label: item.namaMataPelajaran,
  }));

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Input Jurnal Mengajar</h4>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/admin/guru/dashboard">Dashboard</a>
                </li>
                <li className="breadcrumb-item active">Jurnal Mengajar</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-primary text-white border-0 rounded-top-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0">Form Catatan Pembelajaran</h5>
                <span className="badge bg-light text-primary">
                  {form.status}
                </span>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tanggal</label>
                      <input
                        type="date"
                        className="form-control"
                        name="tanggal"
                        value={form.tanggal}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Tahun Ajaran</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.tahunAjaran || tahunAjaran || ""}
                        readOnly
                        placeholder="Contoh: 2025/2026 Genap"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Kelas</label>
                      <select
                        className="form-select"
                        value={form.kelasId}
                        onChange={handleKelasChange}
                        required
                      >
                        <option value="">Pilih kelas</option>
                        {kelasList.map((kelas) => (
                          <option key={kelas.id} value={kelas.id}>
                            {kelas.namaKelas}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Mata Pelajaran</label>
                      <select
                        className="form-select"
                        value={form.mapelId}
                        onChange={handleMapelChange}
                        required
                      >
                        <option value="">Pilih mata pelajaran</option>
                        {mapelOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Jam Ke</label>
                      <input
                        type="text"
                        className="form-control"
                        name="jamKe"
                        value={form.jamKe}
                        onChange={handleChange}
                        placeholder="Contoh: 1–2"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Materi/Topik</label>
                      <textarea
                        className="form-control"
                        name="materi"
                        value={form.materi}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Materi yang diajarkan"
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Tujuan Pembelajaran</label>
                      <textarea
                        className="form-control"
                        name="tujuanPembelajaran"
                        value={form.tujuanPembelajaran}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Tujuan pembelajaran"
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Kegiatan Pembelajaran
                      </label>
                      <textarea
                        className="form-control"
                        name="kegiatanPembelajaran"
                        value={form.kegiatanPembelajaran}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Aktivitas/kegiatan selama pembelajaran"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Metode Pembelajaran</label>
                      <Select
                        isMulti
                        options={METODE_PEMBELAJARAN_OPTIONS}
                        value={METODE_PEMBELAJARAN_OPTIONS.filter((option) =>
                          form.metodePembelajaran.includes(option.value),
                        )}
                        onChange={(selected) =>
                          handleMultiSelect(selected, "metodePembelajaran")
                        }
                        placeholder="Pilih metode pembelajaran"
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Media Pembelajaran</label>
                      <Select
                        isMulti
                        options={MEDIA_PEMBELAJARAN_OPTIONS}
                        value={MEDIA_PEMBELAJARAN_OPTIONS.filter((option) =>
                          form.mediaPembelajaran.includes(option.value),
                        )}
                        onChange={(selected) =>
                          handleMultiSelect(selected, "mediaPembelajaran")
                        }
                        placeholder="Pilih media pembelajaran"
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Jumlah Siswa</label>
                      <input
                        type="number"
                        className="form-control"
                        name="jumlahSiswa"
                        value={form.jumlahSiswa}
                        onChange={handleChange}
                        min={0}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Hadir</label>
                      <input
                        type="number"
                        className="form-control"
                        name="siswaHadir"
                        value={form.siswaHadir}
                        onChange={handleChange}
                        min={0}
                        required
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">Izin</label>
                      <input
                        type="number"
                        className="form-control"
                        name="siswaIzin"
                        value={form.siswaIzin}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">Sakit</label>
                      <input
                        type="number"
                        className="form-control"
                        name="siswaSakit"
                        value={form.siswaSakit}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">Alpha</label>
                      <input
                        type="number"
                        className="form-control"
                        name="siswaAlpha"
                        value={form.siswaAlpha}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Catatan / Refleksi Pembelajaran</label>
                      <Select
                        isMulti
                        options={REFLEKSI_PEMBELAJARAN_OPTIONS}
                        value={REFLEKSI_PEMBELAJARAN_OPTIONS.filter((option) =>
                          form.catatan.includes(option.value),
                        )}
                        onChange={handleCatatanChange}
                        placeholder="Pilih refleksi pembelajaran"
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>

                    {form.catatan.includes("Lainnya") && (
                      <div className="col-12">
                        <label className="form-label">Catatan Lainnya</label>
                        <textarea
                          className="form-control"
                          value={form.catatanLainnya}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              catatanLainnya: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Tuliskan refleksi atau catatan tambahan"
                        />
                      </div>
                    )}

                    <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                          setForm(makeInitialForm(user, tahunAjaran))
                        }
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Menyimpan..." : "Simpan Jurnal"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
