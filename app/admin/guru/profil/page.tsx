"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import Select from "react-select";

export default function ProfilePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [profil, setProfil] = useState({
    nama: "",
    nip: "",
    tanggalLahir: "",
    jenisKelamin: "",
    alamat: {
      alamat: "",
      dusun: "",
      rt: "",
      rw: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
    },
    whatsapp: "",
    status: "",
    jenjang: "",
    mapel: "",
    email: "",
  });

  // 🔹 Ambil data user
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setProfil({
            nama: data.username || "", // ✅ ambil dari firestore
            nip: data.nip || "",
            tanggalLahir: data.tanggalLahir || "",
            jenisKelamin: data.jenisKelamin || "",
            alamat: {
              alamat: data.alamat?.alamat || "",
              dusun: data.alamat?.dusun || "",
              rt: data.alamat?.rt || "",
              rw: data.alamat?.rw || "",
              desa: data.alamat?.desa || "",
              kecamatan: data.alamat?.kecamatan || "",
              kabupaten: data.alamat?.kabupaten || "",
            },
            whatsapp: data.whatsapp || "",
            status: data.status || "",
            jenjang: data.jenjang || "",
            mapel: data.mapel || "",
            email: data.email || user.email || "",
          });
        }

        // ambil nama dari session
        setProfil((prev) => ({
          ...prev,
          nama: currentUser?.displayName || "",
          email: currentUser?.email || "",
        }));
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 🔹 Simpan data profil
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");
  const [animate, setAnimate] = useState(false);
  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          ...profil,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setModalType("success");
      setModalMessage("Profil berhasil disimpan");
      setShowModal(true);
      setTimeout(() => setAnimate(true), 10); // 🔥 trigger animasi

      setEdit(false);
    } catch (err) {
      console.log(err);

      setModalType("error");
      setModalMessage("Gagal menyimpan profil");
      setShowModal(true);
    }

    setSaving(false);
  };
  const handleCloseModal = () => {
    setAnimate(false); // animasi keluar
    setTimeout(() => setShowModal(false), 200); // tunggu animasi selesai
  };

  const mataPelajaran = [
    // UMUM
    "Guru Kelas",

    // WAJIB
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila(PP)",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam (IPA)",
    "Ilmu Pengetahuan Sosial (IPS)",
    "Bahasa Inggris",

    // SENI & OLAHRAGA
    "Seni Budaya",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",

    // PRAKARYA
    "Prakarya",
    "Informatika",

    // SMA TAMBAHAN
    "Fisika",
    "Kimia",
    "Biologi",
    "Ekonomi",
    "Geografi",
    "Sosiologi",
    "Sejarah",
    "Sejarah Indonesia",

    // BAHASA
    "Bahasa Arab",
    "Bahasa Jepang",
    "Bahasa Jerman",
    "Bahasa Mandarin",
    "Bahasa Daerah",

    // KEJURUAN / OPSIONAL
    "Informatika / TIK",
    "Kewirausahaan"
  ];
  const mapelOptions = mataPelajaran.map((item) => ({
    label: item,
    value: item,
  }));

  return (
    <>
      <div className="container-fluid py-3">
        <div className="row">
          <div className="col-sm-6">
            <h3 className="mb-0"></h3>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-end">
              <li className="breadcrumb-item active" aria-current="page">Profil Pengguna</li>
            </ol>
          </div>
        </div>

      </div>

      <div className="container-fluid">
        <div className="callout callout-info">
          <div className="card-body">
            <h5 className="fw-bold mb-2">Profil Pengguna</h5>
            <p className="mb-2 text-muted">
              Halaman ini digunakan untuk mengelola dan memperbarui data pribadi Anda sebagai pengguna sistem.
            </p>

            <ul className="mb-0 small">
              <li>Pastikan data seperti NIP, tanggal lahir, dan alamat diisi dengan benar.</li>
              <li>Data yang Anda isi akan digunakan untuk kebutuhan administrasi sekolah.</li>
              <li>Perubahan data dapat dilakukan dengan menekan tombol   
              
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => setEdit(true)}
                  >
                    Edit Profil
                  </button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container-fluid py-2">
        <div className="card shadow-sm">
          <div className="card-header">
            <h5 className="mb-0">Profil Pengguna</h5>
          </div>
          <div className="card-body">
            {loading ? (
              <p>Sedang mengambil data, mohon menunggu...</p>
            ) : (
              <div className="row g-3">

                {/* NAMA */}
                <div className="col-md-6">
                  <label className="form-label">Nama</label>
                  <input className="form-control" value={profil.nama} readOnly />
                </div>

                {/* EMAIL */}
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={profil.email} readOnly />
                </div>

                {/* NIP */}
                <div className="col-md-6">
                  <label className="form-label">NIP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Isi NIP tanpa spasi (18 digit)"
                    className="form-control"
                    value={profil.nip}
                    disabled={!edit}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")   // 🔥 hanya angka
                        .slice(0, 18);        // 🔥 maksimal 18 digit

                      setProfil({ ...profil, nip: value });
                    }}
                  />
                </div>

                {/* TANGGAL LAHIR */}
                <div className="col-md-6">
                  <label className="form-label">Tanggal Lahir</label>
                  <input
                    type="date"
                    className="form-control"
                    value={profil.tanggalLahir}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({ ...profil, tanggalLahir: e.target.value })
                    }
                  />
                </div>

                {/* JENIS KELAMIN */}
                <div className="col-md-6">
                  <label className="form-label">Jenis Kelamin</label>
                  <select
                    className="form-select"
                    disabled={!edit}
                    value={profil.jenisKelamin}
                    onChange={(e) =>
                      setProfil({ ...profil, jenisKelamin: e.target.value })
                    }
                  >
                    <option value="">Pilih</option>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>

                {/* WHATSAPP */}
                <div className="col-md-6">
                  <label className="form-label">No. WhatsApp</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    value={profil.whatsapp}
                    disabled={!edit}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // 🔥 hanya angka
                      setProfil({ ...profil, whatsapp: value });
                    }}
                  />
                </div>

                {/* ALAMAT */}
                <div className="col-12">
                  <label className="form-label fw-bold">Alamat</label>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Alamat</label>
                  <input
                    className="form-control"
                    value={profil.alamat.alamat}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, alamat: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Dusun</label>
                  <input
                    className="form-control"
                    value={profil.alamat.dusun}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, dusun: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">RT</label>
                  <input
                    className="form-control"
                    value={profil.alamat.rt}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, rt: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">RW</label>
                  <input
                    className="form-control"
                    value={profil.alamat.rw}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, rw: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Desa / Kelurahan</label>
                  <input
                    className="form-control"
                    value={profil.alamat.desa}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, desa: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Kecamatan</label>
                  <input
                    className="form-control"
                    value={profil.alamat.kecamatan}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, kecamatan: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Kabupaten</label>
                  <input
                    className="form-control"
                    value={profil.alamat.kabupaten}
                    disabled={!edit}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        alamat: { ...profil.alamat, kabupaten: e.target.value },
                      })
                    }
                  />
                </div>

                {/* STATUS */}
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    disabled={!edit}
                    value={profil.status}
                    onChange={(e) =>
                      setProfil({ ...profil, status: e.target.value })
                    }
                  >
                    <option value="">Pilih</option>
                    <option>CPNS</option>
                    <option>PNS</option>
                    <option>PPPK</option>
                    <option>PPPK PW</option>
                    <option>Honorer</option>
                  </select>
                </div>

                {/* JENJANG */}
                <div className="col-md-6">
                  <label className="form-label">Jenjang Sekolah</label>
                  <select
                    className="form-select"
                    disabled={!edit}
                    value={profil.jenjang}
                    onChange={(e) =>
                      setProfil({ ...profil, jenjang: e.target.value })
                    }
                  >
                    <option value="">Pilih</option>
                    <option>SD/MI</option>
                    <option>SMP/MTS</option>
                    <option>SMA/MA</option>
                  </select>
                </div>

                {/* MAPEL */}
                <div className="col-md-6">
                  <label className="form-label">Mata Pelajaran</label>
                  <Select
                    isDisabled={!edit}
                    options={mapelOptions}
                    value={mapelOptions.find(
                      (opt) => opt.value === profil.mapel
                    )}
                    onChange={(selected) =>
                      setProfil({ ...profil, mapel: selected?.value || "" })
                    }
                    placeholder="Pilih Mata Pelajaran"
                  />
                </div>

              </div>
            )}
            <div className="d-flex justify-content-end mt-3">
              {!edit ? (
                <button
                  className="btn btn-warning"
                  onClick={() => setEdit(true)}
                >
                  Edit Profil
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary me-2"
                    onClick={() => setEdit(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 MODAL LETAKNYA DI SINI */}
      {showModal && (
        <>
          {/* BACKDROP */}
          <div
            className={`modal-backdrop fade ${animate ? "show" : ""}`}
            style={{ transition: "opacity 0.2s ease" }}
          ></div>

          {/* MODAL */}
          <div className="modal d-block" tabIndex={-1}>
            <div
              className={`modal-dialog modal-dialog-centered ${animate ? "modal-show" : "modal-hide"
                }`}
            >
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === "success" ? "Berhasil" : "Error"}
                  </h5>
                  <button
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>

                <div className="modal-body text-center">
                  {modalType === "success" ? (
                    <div className="text-success fs-1 mb-2">✔</div>
                  ) : (
                    <div className="text-danger fs-1 mb-2">✖</div>
                  )}
                  <p>{modalMessage}</p>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={handleCloseModal}>
                    OK
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

}

