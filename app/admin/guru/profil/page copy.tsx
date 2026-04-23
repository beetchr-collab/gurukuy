"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UsersPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);

  const [profil, setProfil] = useState({
    username: "",
    nip: "",
    kelas: "",
    email: "",
    foto: "",
  });

  const [file, setFile] = useState<File | null>(null);

  // ambil data berdasarkan UID
  useEffect(() => {
    const getProfilGuru = async () => {
      try {
        // tunggu sampai auth siap
        if (!user?.uid) return;

        setLoading(true);

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfil({
            username: snap.data().username || "",
            nip: snap.data().nip || "",
            kelas: snap.data().kelas || "",
            email: snap.data().email || user.email || "",
            foto: snap.data().foto || "",
          });
        }

        setLoading(false); // 🔥 WAJIB
      } catch (err) {
        console.log("Gagal ambil profil:", err);
        setLoading(false);
      }
    };

    getProfilGuru();
  }, [user?.uid]);


  // upload foto ke Google Drive via API route
  const uploadFoto = async () => {
    if (!file) return profil.foto;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-drive", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.url;
  };

  const handleUpdate = async () => {
    if (!user?.uid) return alert("User belum login");

    try {
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        username: profil.username,
        nip: profil.nip,
        kelas: profil.kelas,
        email: profil.email,
        updatedAt: new Date(),
      });

      alert("Profil berhasil diperbarui");
    } catch (err) {
      console.error(err);
      alert("Gagal update profil");
    }
  };


  // simpan perubahan
  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);

    try {
      let fotoUrl = profil.foto;

      if (file) {
        fotoUrl = await uploadFoto();
      }

      await updateDoc(doc(db, "users", user.uid), {
        username: profil.username,
        nip: profil.nip,
        kelas: profil.kelas,
        foto: fotoUrl,
      });

      setProfil({ ...profil, foto: fotoUrl });
      setEdit(false);
      alert("Profil berhasil diperbarui");
    } catch (err) {
      console.log(err);
      alert("Gagal menyimpan profil");
    }

    setSaving(false);
  };

  return (
    <main className="app-main">
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6"></div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">
                  <a href="/admin/guru/dashboard">Dashboard</a>
                </li>
                <li className="breadcrumb-item active">Profil Guru</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header d-flex justify-content-between">
              <h3 className="card-title">Profil Guru</h3>
            </div>
            <div className="card-body">
              {loading && <p>Memuat data...</p>}

              {!loading && (
                <div className="row">
                  <div className="col-md-8">

                    {/* Nama */}
                    <div className="row mb-3">
                      <label className="col-sm-3 col-form-label">Nama Guru</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="form-control"
                          value={profil.username}
                          readOnly={!edit}
                          onChange={(e) =>
                            setProfil({ ...profil, username: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* NIP */}
                    <div className="row mb-3">
                      <label className="col-sm-3 col-form-label">NIP</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="form-control"
                          value={profil.nip}
                          readOnly={!edit}
                          onChange={(e) =>
                            setProfil({ ...profil, nip: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Guru Kelas */}
                    <div className="row mb-3">
                      <label className="col-sm-3 col-form-label">Guru Kelas</label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          className="form-control"
                          value={profil.kelas}
                          readOnly={!edit}
                          onChange={(e) =>
                            setProfil({ ...profil, kelas: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Email (readonly dari auth) */}
                    <div className="row mb-3">
                      <label className="col-sm-3 col-form-label">Email</label>
                      <div className="col-sm-9">
                        <input
                          type="email"
                          className="form-control"
                          value={user?.email || ""}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* FOTO */}
                  <div className="col-md-4 text-center">
                    {profil.foto && (
                      <img
                        src={profil.foto}
                        className="img-thumbnail mb-3"
                        width={200}
                      />
                    )}

                    {edit && (
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e: any) => setFile(e.target.files[0])}
                      />
                    )}
                  </div>
                </div>

              )}

              {!edit ? (
                <button className="btn btn-warning" onClick={() => setEdit(true)}>
                  Edit Profil
                </button>
              ) : (
                <div>
                  <button
                    className="btn btn-secondary me-2"
                    onClick={() => setEdit(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdate}
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
