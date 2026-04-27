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
    jenjang: "",
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
            jenjang: data.jenjang || "",
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

  return (
    <>
      <main className="app-main">
        <div className="container-fluid mb-3">
          {/* HEADER */}
          <div className="app-content-header">
            <div className="container-fluid">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Data Sekolah</h4>

                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item active">Data Sekolah</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="callout callout-info">
            <div className="card-body">
              <h5 className="fw-bold mb-2">Data Sekolah</h5>
              <p className="mb-2 text-muted">
                Halaman ini digunakan untuk mengelola dan memperbarui informasi resmi terkait data sekolah.
              </p>

              <ul className="mb-0 small">
                <li>Pastikan data seperti nama sekolah, NPSN, alamat, dan kontak diisi dengan benar.</li>
                <li>Data yang Anda isi akan digunakan untuk kebutuhan administrasi dan pelaporan sekolah.</li>
                <li>Perubahan data dapat dilakukan dengan menekan tombol <b>Edit Data Sekolah</b>.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="container-fluid">
          <div className="card shadow-sm">
            <div className="card-header text-bg-primary">
              <h5 className="mb-0">Data Sekolah</h5>
            </div>
            <div className="card-body">

            </div>
          </div>
        </div>
        
      </main>
    </>
  );
}

