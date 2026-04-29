"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { QRCodeCanvas } from "qrcode.react";

/* =========================
   TYPE
========================= */
type SekolahType = {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  rt: string;
  rw: string;
  dusun: string;
  bentuk: string;
  status: string;
  wa: string;
  kodeSekolah: string;
};

/* =========================
   DEFAULT
========================= */
const defaultForm: SekolahType = {
  namaSekolah: "",
  npsn: "",
  alamat: "",
  provinsi: "",
  kabupaten: "",
  kecamatan: "",
  desa: "",
  rt: "",
  rw: "",
  dusun: "",
  bentuk: "",
  status: "",
  wa: "",
  kodeSekolah: "",
};

export default function SekolahPage() {
  const [user, setUser] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false); // sudah punya data
  const [isEditing, setIsEditing] = useState(false); // sedang edit
  const [form, setForm] = useState<SekolahType>(defaultForm);

  const router = useRouter();

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");

      setUser(u);

      const docRef = doc(db, "sekolah", u.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setForm({
          namaSekolah: data?.namaSekolah || "",
          npsn: data?.npsn || "",
          alamat: data?.alamat || "",
          provinsi: data?.provinsi || "",
          kabupaten: data?.kabupaten || "",
          kecamatan: data?.kecamatan || "",
          desa: data?.desa || "",
          rt: data?.rt || "",
          rw: data?.rw || "",
          dusun: data?.dusun || "",
          bentuk: data?.bentuk || "",
          status: data?.status || "",
          wa: data?.wa || "",
          kodeSekolah: data?.kodeSekolah || "",
        });

        setIsEdit(true);
      } else {
        const kode =
          "SCH-" +
          Math.random().toString(36).substring(2, 8).toUpperCase();

        setForm((prev) => ({
          ...prev,
          kodeSekolah: kode,
        }));
      }
    });

    return () => unsub();
  }, []);

  /* =========================
     HANDLE INPUT
  ========================= */
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: any) => {
    setForm({ ...form, [name]: value.value });
  };

  /* =========================
     ACTION BUTTON
  ========================= */
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (!user) return;

    const docRef = doc(db, "sekolah", user.uid);

    try {
      if (isEdit) {
        await updateDoc(docRef, form);
        alert("Data berhasil diupdate");
        setIsEditing(false);
      } else {
        await setDoc(docRef, {
          ...form,
          ownerId: user.uid,
        });
        alert("Sekolah berhasil dibuat");
        setIsEdit(true);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal simpan data");
    }
  };

  /* =========================
   COPY KODE SEKOLAH
========================= */

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(form.kodeSekolah);
      alert("Kode berhasil disalin 👍");
    } catch (err) {
      alert("Gagal copy");
    }
  };

  /* =========================
 SHARED KODE SEKOLAH
========================= */

  const handleShareWA = () => {
    const pesan = `Halo 👋

Silakan gabung ke sekolah saya dengan kode berikut:

Kode Sekolah: ${form.kodeSekolah}

Masukkan kode tersebut di aplikasi ya 👍`;

    const url = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  /* =========================
 QR CODE KODE SEKOLAH
========================= */
  const joinLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?kode=${form.kodeSekolah}`
      : "";

  const handleDownloadQR = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${form.kodeSekolah}.png`;
    a.click();
  };

  /* =========================
     OPTIONS
  ========================= */
  const bentukOptions = [
    { value: "SD", label: "SD" },
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "MI", label: "MI" },
    { value: "MTs", label: "MTs" },
    { value: "MA", label: "MA" },
  ];

  const statusOptions = [
    { value: "Negeri", label: "Negeri" },
    { value: "Swasta", label: "Swasta" },
  ];

  const isReadOnly = isEdit && !isEditing;

  /* =========================
     UI
  ========================= */
  return (
    <div className="app-main py-3">
      <div className="container-fluid">
        <h4>Data Sekolah</h4>

        <div className="callout callout-info">
          <h5>Informasi Data Sekolah</h5>
          <p>
            Halaman ini digunakan untuk mengelola data sekolah secara terpusat.
            Setiap sekolah hanya memiliki satu data utama, namun dapat terhubung
            dengan banyak guru dalam sistem.
          </p>
          <p>
            Pastikan data seperti <strong>Nama Sekolah</strong>, <strong>NPSN</strong>,
            dan <strong>Alamat</strong> diisi dengan benar karena akan digunakan
            sebagai referensi utama untuk seluruh aktivitas guru.
          </p>
        </div>

        <div className="card p-3 mt-3">

          {/* INFO MODE */}
          {isReadOnly && (
            <div className="alert alert-secondary">
              Mode lihat data (read-only)
            </div>
          )}

          {isEditing && (
            <div className="alert alert-warning">
              Mode edit aktif
            </div>
          )}

          <div className="row">
            <div className="col-sm-2 col-form-label">Nama Sekolah</div>
            <div className="col-sm-10">
              <input name="namaSekolah" placeholder="Nama Sekolah"
                className="form-control mb-2"
                value={form.namaSekolah}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-2 col-form-label">NPSN</div>
            <div className="col-sm-10">
              <input name="npsn" placeholder="NPSN"
                className="form-control mb-2"
                value={form.npsn}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="row mb-3">
            <label className="col-sm-2 col-form-label">
              Alamat
            </label>
            <div className="col-sm-10">
              <textarea
                name="alamat"
                className="form-control"
                placeholder="Masukkan alamat jalan"
                rows={2}
                value={form.alamat}
                onChange={handleChange}
                disabled={isReadOnly}
              ></textarea>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <div className="row">
                <div className="col-sm-4 col-form-label">
                  Provinsi
                </div>
                <div className="col-sm-8">
                  <input name="provinsi" className="form-control mb-2" placeholder="Provinsi"
                    value={form.provinsi} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="row">
                <div className="col-sm-4 col-form-label">
                  Kabupaten
                </div>
                <div className="col-sm-8">
                  <input name="kabupaten" className="form-control mb-2" placeholder="Kabupaten"
                    value={form.kabupaten} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-6">
              <div className="row">
                <div className="col-sm-4 col-form-label">
                  Kecamatan
                </div>
                <div className="col-sm-8">
                  <input name="kecamatan" className="form-control mb-2" placeholder="Kecamatan"
                    value={form.kecamatan} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="row">
                <div className="col-sm-4 col-form-label">
                  Kelurahan/Desa
                </div>
                <div className="col-sm-8">
                  <input name="desa" className="form-control mb-2" placeholder="Desa"
                    value={form.desa} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="row">
                <div className="col-sm-4 col-form-label">
                  Dusun
                </div>
                <div className="col-sm-8">
                  <input name="dusun" className="form-control mb-2" placeholder="Dusun"
                    value={form.dusun} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="row">
                <div className="col-sm-3 col-form-label">
                  RT
                </div>
                <div className="col-sm-9">
                  <input name="rt" className="form-control mb-2" placeholder="RT"
                    value={form.rt} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="row">
                <div className="col-sm-3 col-form-label">
                  RW
                </div>
                <div className="col-sm-9">
                  <input name="rw" className="form-control mb-2" placeholder="RW"
                    value={form.rw} onChange={handleChange} disabled={isReadOnly} />
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-sm-2 col-form-label">Bentuk Pendidikan</div>
            <div className="col-sm-10">
              <Select
                options={bentukOptions}
                value={bentukOptions.find(o => o.value === form.bentuk)}
                onChange={(val) => handleSelect("bentuk", val)}
                isDisabled={isReadOnly}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-2 col-form-label">Status</div>
            <div className="col-sm-10">
              <Select
                options={statusOptions}
                value={statusOptions.find(o => o.value === form.status)}
                onChange={(val) => handleSelect("status", val)}
                isDisabled={isReadOnly}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-2 col-form-label">Nomor Whatsapp Admin</div>
            <div className="col-sm-10">
              <input name="wa" placeholder="Nomor WA Admin"
                className="form-control mt-2"
                value={form.wa}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* KODE SEKOLAH */}
          <div className="alert alert-info mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              Kode Sekolah: <b>{form.kodeSekolah}</b>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={handleCopy}>
                <i className="fas fa-copy"></i> Salin
              </button>

              <button className="btn btn-sm btn-success" onClick={handleShareWA}>
                <i className="fab fa-whatsapp"></i> Bagikan WA
              </button>
            </div>
          </div>

          {/* QR CODE KODE SEKOLAH */}
          <div className="card mt-3 p-3 text-center">
            <h6>QR Code Gabung Sekolah</h6>

            {form.kodeSekolah && (
              <div className="d-flex justify-content-center my-3">
                <QRCodeCanvas value={joinLink} size={180} />
              </div>
            )}

            <small>Scan untuk gabung ke sekolah</small>
            <div className="text-center mt-2">
              <button
                className="btn btn-outline-success btn-sm px-3"
                onClick={handleDownloadQR}
              >
                <i className="fas fa-download me-1"></i>
                Download QR
              </button>
            </div>
          </div>



          {/* TOMBOL */}
          <div className="text-end mt-3">

            {!isEdit && (
              <button className="btn btn-primary" onClick={handleSubmit}>
                Buat Sekolah
              </button>
            )}

            {isEdit && !isEditing && (
              <button className="btn btn-warning" onClick={handleEdit}>
                Update Data Sekolah
              </button>
            )}

            {isEdit && isEditing && (
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Batal
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Simpan
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}