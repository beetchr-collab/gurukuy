"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminSiswaPage() {
  const { user } = useAuth();

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [tahun, setTahun] = useState<any[]>([]);

  const [selected, setSelected] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTahun, setSelectedTahun] = useState("");

  // =========================
  // 📥 LOAD DATA
  // =========================
  useEffect(() => {
    if (!user?.schoolId) return;

    console.log("USER LOGIN:", user); // 🔥 DEBUG

    const loadData = async () => {
      try {
        // STUDENTS
        const qs = await getDocs(
          query(
            collection(db, "students"),
            where("schoolId", "==", user.schoolId)
          )
        );
        setStudents(qs.docs.map((d) => ({ id: d.id, ...d.data() })));

        // CLASSES
        const qc = await getDocs(
          query(
            collection(db, "classes"),
            where("schoolId", "==", user.schoolId)
          )
        );
        setClasses(qc.docs.map((d) => ({ id: d.id, ...d.data() })));

        // TAHUN AJARAN
        const qt = await getDocs(
          query(
            collection(db, "tahun_ajaran"),
            where("schoolId", "==", user.schoolId)
          )
        );
        setTahun(qt.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("LOAD ERROR:", err);
      }
    };

    loadData();
  }, [user]);

  // =========================
  // ✅ SELECT CHECKBOX
  // =========================
  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  // =========================
  // 💾 ASSIGN (FIX PERMISSION)
  // =========================
  const handleAssign = async () => {
    // 🔥 VALIDASI PENTING
    if (!user) {
      alert("User belum login");
      return;
    }

    if (!user.schoolId) {
      console.error("schoolId kosong:", user);
      alert("User tidak punya schoolId (cek users collection)");
      return;
    }

    if (!selectedClass || !selectedTahun) {
      alert("Pilih kelas & tahun ajaran");
      return;
    }

    if (selected.length === 0) {
      alert("Pilih minimal 1 murid");
      return;
    }

    console.log("ASSIGN DATA:", {
      schoolId: user.schoolId,
      selectedClass,
      selectedTahun,
      selected,
    });

    try {
      for (const studentId of selected) {
        await addDoc(collection(db, "student_classes"), {
          studentId,
          classId: selectedClass,
          tahunAjaranId: selectedTahun,
          schoolId: user.schoolId, // 🔥 WAJIB
          createdAt: serverTimestamp(),
        });
      }

      alert("Berhasil assign murid!");
      setSelected([]);
    } catch (err) {
      console.error("ASSIGN ERROR:", err);
      alert("Gagal assign (cek rules)");
    }
  };

  return (
    <main className="app-main py-3">
      <div className="container-fluid">

        {/* HEADER */}
        <div className="content-header mb-3">
          <h1 className="m-0">Assign Murid ke Kelas</h1>
        </div>

        {/* INFO */}
        <div className="callout callout-info">
          <h5><i className="fas fa-info-circle"></i> Informasi</h5>
          <p className="mb-0">
            Pilih murid, lalu tentukan kelas dan tahun ajaran.
          </p>
        </div>

        <div className="row">

          {/* LIST MURID */}
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">Daftar Murid</div>
              <div
                className="card-body"
                style={{ maxHeight: 400, overflowY: "auto" }}
              >
                {students.map((s) => (
                  <div key={s.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />{" "}
                    {s.nama} ({s.nis})
                  </div>
                ))}

                {students.length === 0 && (
                  <p className="text-muted">Tidak ada data murid</p>
                )}
              </div>
            </div>
          </div>

          {/* PILIH KELAS */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">Kelas & Tahun</div>
              <div className="card-body">

                <select
                  className="form-control mb-2"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>

                <select
                  className="form-control mb-2"
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(e.target.value)}
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {tahun.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-success w-100"
                  onClick={handleAssign}
                >
                  Assign Murid
                </button>

              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}