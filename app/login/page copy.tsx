'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import './login.css';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // 1. Login Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // 2. Ambil data user Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      throw new Error('User tidak ditemukan');
    }

    const data = userDoc.data();
    const role = data.role;
    const username = data.username;

    // 3. Simpan ke localStorage (agar navbar bisa baca cepat)
    localStorage.setItem(
      'user',
      JSON.stringify({
        uid,
        role,
        username,
        email: userCredential.user.email,
      })
    );

    // 4. Redirect berdasarkan role
    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'guru') router.push('/admin/guru/dashboard');
    else if (role === 'siswa') router.push('/siswa/dashboard');
    else throw new Error('Role tidak valid');

  } catch (err: any) {
    setError(err.message || 'Login gagal');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container-fluid min-vh-100 login-wrapper">
      <div className="row min-vh-100">

        {/* CAROUSEL (KIRI) */}
        <div className="col-lg-7 col-md-6 d-none d-md-block p-0 order-lg-1">
          <div
            id="loginCarousel"
            className="carousel slide h-100"
            data-bs-ride="carousel"
          >
            <div className="carousel-inner h-100">
              <div className="carousel-item active h-100">
                <div className="carousel-bg bg-1">
                  <div className="overlay-text">
                    <h1>Portal Sekolah Digital</h1>
                    <p>Belajar lebih modern dan interaktif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORM LOGIN (KANAN) */}
        <div className="col-lg-5 col-md-6 d-flex align-items-center justify-content-center bg-white order-lg-2">
          <div className="login-card w-100 px-4">
            <h2 className="fw-bold mb-2">Selamat Datang</h2>
            <p className="text-muted mb-4">
              Silakan login untuk melanjutkan
            </p>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>

            <p className="text-center text-muted mt-4">
              © 2026 Portal Sekolah
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
