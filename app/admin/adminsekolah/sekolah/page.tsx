"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

// 🔥 generate kode sekolah
function generateSchoolCode(nama: string) {
  const prefix = nama.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

export default function SekolahPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [hasSchool, setHasSchool] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);

  // 🔥 wilayah
  const [provinsi, setProvinsi] = useState<any[]>([]);
  const [kabupaten, setKabupaten] = useState<any[]>([]);
  const [kecamatan, setKecamatan] = useState<any[]>([]);
  const [desa, setDesa] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    namaSekolah: "",
    npsn: "",
    jalan: "",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    desa: "",
    dusun: "",
    rt: "",
    rw: "",
    bentukPendidikan: "SD",
    status: "Negeri",
    noWAAdmin: "",
  });

  // 🔥 ambil provinsi (API wilayah Indonesia)
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) =>
        setProvinsi(data.map((d: any) => ({ label: d.name, value: d.name, id: d.id })))
      );
  }, []);

  // 🔥 chain wilayah
  const handleProvinsi = async (val: any) => {
    setForm({ ...form, provinsi: val.value });

    const res = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${val.id}.json`
    );
    const data = await res.json();

    setKabupaten(data.map((d: any) => ({ label: d.name, value: d.name, id: d.id })));
  };

  const handleKabupaten = async (val: any) => {
    setForm({ ...form, kabupaten: val.value });

    const res = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${val.id}.json`
    );
    const data = await res.json();

    setKecamatan(data.map((d: any) => ({ label: d.name, value: d.name, id: d.id })));
  };

  const handleKecamatan = async (val: any) => {
    setForm({ ...form, kecamatan: val.value });

    const res = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${val.id}.json`
    );
    const data = await res.json();

    setDesa(data.map((d: any) => ({ label: d.name, value: d.name })));
  };

  // 🔥 auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();

      if (data?.schoolId) {
        const school = await getDoc(doc(db, "schools", data.schoolId));
        setSchoolData(school.data());
        setHasSchool(true);
      }

      setLoadingPage(false);
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    if (!user) return;

    const kodeSekolah = generateSchoolCode(form.namaSekolah);

    const schoolRef = await addDoc(collection(db, "schools"), {
      ...form,
      kodeSekolah,
      createdBy: user.uid,
      createdAt: new Date(),
    });

    await updateDoc(doc(db, "users", user.uid), {
      schoolId: schoolRef.id,
    });

    alert("Berhasil!");
    router.refresh();
  };

  const copyKode = () => {
    navigator.clipboard.writeText(schoolData.kodeSekolah);
    alert("Kode disalin!");
  };

  const shareWA = () => {
    const text = `Kode Sekolah: ${schoolData.kodeSekolah}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loadingPage) return <p className="text-center mt-5">Loading...</p>;

  return (
    <div className="app-main">
      <div className="container-fluid">
        <h4>Data Sekolah</h4>

        {hasSchool ? (
          <div className="card">
            <div className="card-body">
              <h5>{schoolData.namaSekolah}</h5>
              <p><b>Kode:</b> {schoolData.kodeSekolah}</p>

              <button className="btn btn-sm btn-success me-2" onClick={copyKode}>
                Copy Kode
              </button>
              <button className="btn btn-sm btn-success" onClick={shareWA}>
                Share WhatsApp
              </button>

              <hr />

              <p>{schoolData.jalan}</p>
              <p>{schoolData.desa}, {schoolData.kecamatan}</p>
              <p>{schoolData.kabupaten}, {schoolData.provinsi}</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>

                {/* 🔥 FORM HORIZONTAL */}
                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label">Nama Sekolah</label>
                  <div className="col-sm-9">
                    <input className="form-control" onChange={(e) => setForm({ ...form, namaSekolah: e.target.value })} required />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label">NPSN</label>
                  <div className="col-sm-9">
                    <input className="form-control" onChange={(e) => setForm({ ...form, npsn: e.target.value })} />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label">Alamat Jalan</label>
                  <div className="col-sm-9">
                    <input className="form-control" onChange={(e) => setForm({ ...form, jalan: e.target.value })} />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3">Provinsi</label>
                  <div className="col-sm-9">
                    <Select options={provinsi} onChange={handleProvinsi} isSearchable isClearable />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3">Kabupaten</label>
                  <div className="col-sm-9">
                    <Select options={kabupaten} onChange={handleKabupaten} isSearchable isClearable />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3">Kecamatan</label>
                  <div className="col-sm-9">
                    <Select options={kecamatan} onChange={handleKecamatan} isSearchable isClearable />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3">Desa</label>
                  <div className="col-sm-9">
                    <CreatableSelect
                      options={desa}
                      onChange={(v: any) => setForm({ ...form, desa: v?.value || "" })}
                      isClearable
                      placeholder="Pilih atau ketik desa"
                    />                    <small>Bisa ketik manual jika tidak ada</small>
                  </div>
                </div>

                <button className="btn btn-primary">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}