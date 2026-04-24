'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import styles from './login.module.css';

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const uid = user.uid;
      const photo = user.photoURL; // ✅ DI SINI

      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      let role = 'guru'; // ubah role default disini
      let username = user.displayName || 'User';

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          username,
          email: user.email,
          role: 'guru', // ubah role default disini
          photo, // ✅ simpan ke Firestore juga (opsional tapi bagus)
          createdAt: new Date(),
        });
      }

      // ✅ simpan ke localStorage
      localStorage.setItem(
        'user',
        JSON.stringify({
          uid,
          role,
          username,
          email: user.email,
          photo, // ✅ penting
        })
      );

      // redirect
      router.push('/admin/guru/dashboard');

    } catch (err: any) {
      setError(err.message || 'Login Google gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container-fluid min-vh-100 ${styles.loginWrapper}`}>
      <div className="row min-vh-100">

        {/* CAROUSEL (KIRI) */}
        <div className="col-lg-7 col-md-6 d-none d-md-block p-0 order-lg-1">
          <div className="carousel-inner h-100">
            <div className="carousel-item active h-100">
              <div className={styles.heroSection}>

                {/* TEXT */}
                <div className={styles.heroText}>
                  <h1>
                    <span className={styles.blue}>Guru</span>
                    <span className={styles.orange}>Kuy</span>
                  </h1>

                  <div className={styles.badge}>
                    Aplikasi untuk Guru Hebat
                  </div>

                  <p className="text-white">
                    GuruKuy hadir untuk membantu guru mengelola tugas,
                    administrasi, dan pembelajaran dengan lebih mudah,
                    cepat, dan menyenangkan.
                  </p>
                </div>

                {/* IMAGE */}
                <div className={styles.heroImage}>
                  <img
                    src="/images/gurukuy.png" // nanti kita jelaskan
                    alt="GuruKuy"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* FORM LOGIN (KANAN) */}
        <div className="col-lg-5 col-md-6 d-flex align-items-center justify-content-center order-lg-2">
          <div className={`${styles.loginCard} w-100 px-4`}>
            {/* IMAGE */}
            <div className={styles.loginHeader}>
              <img
                src="/images/imagelogo.png" // taruh di public/images
                alt="GuruKuy"
              />
            </div>
            <div className="text-center">
              <h2 className="fw-bold mb-2">Selamat Datang</h2>
              <p className="text-muted mb-4">
                Silakan login untuk melanjutkan
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
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
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* BUTTON ROW */}
              <div className="row g-2 mt-2">
                <div className="col-6">
                  <button
                    type="submit"
                    className="btn btn-outline-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Login'}
                  </button>
                </div>

                <div className="col-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="btn btn-outline-danger w-100"
                    disabled={loading}
                  >
                    <i className="bi bi-google me-2"></i>
                    Google
                  </button>
                </div>
              </div>
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
