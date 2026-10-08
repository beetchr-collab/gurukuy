"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cbt.module.css";

type CbtStudent = {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  tingkatKelas: string;
  schoolId: string;
};

export default function CbtLoginPage() {
  const router = useRouter();
  const [nisn, setNisn] = useState("");
  const [nis, setNis] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/cbt/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nisn: nisn.trim(),
        nis: nis.trim(),
      }),
    });

    // Ambil response sebagai text terlebih dahulu
    const responseText = await response.text();

    console.log("=== RESPONSE API CBT LOGIN ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("URL:", response.url);
    console.log("Content-Type:", response.headers.get("content-type"));
    console.log("Response Body:", responseText);
    console.log("================================");

    // Coba parse JSON setelah mendapatkan text
    let result: {
      student?: CbtStudent;
      error?: string;
      detail?: string;
    } = {};

    try {
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.error(
        "Response API bukan JSON:",
        jsonError
      );

      console.error(
        "Isi response sebenarnya:",
        responseText
      );

      setError(
        `Server mengembalikan response tidak valid (${response.status}).`
      );

      return;
    }

    if (!response.ok || !result.student) {
      setError(
        result.error ||
          result.detail ||
          "NISN atau NIS tidak sesuai."
      );

      return;
    }

    // Login berhasil
    localStorage.setItem(
      "cbtStudent",
      JSON.stringify(result.student)
    );

    router.push("/cbt/dashboard");
  } catch (loginError) {
    console.error(
      "CBT student login failed:",
      loginError
    );

    setError(
      loginError instanceof Error
        ? loginError.message
        : "Tidak dapat menghubungi layanan login."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginShell}>
        <section
          className={styles.welcomePanel}
          aria-label="Portal CBT GuruKuy"
        >
          <div className={styles.brandLine}>
            <span className={styles.brandMark}>G</span>
            <span>
              GuruKuy <b>CBT</b>
            </span>
          </div>

          <div className={styles.welcomeCopy}>
            <p className={styles.eyebrow}>PORTAL UJIAN SISWA</p>
            <h1>
              Siap untuk
              <br />
              menunjukkan
              <br />
              <span>yang terbaik?</span>
            </h1>
            <p className={styles.welcomeDescription}>
              Masuk ke ruang ujian digital sekolah dengan akun peserta didik
              Anda.
            </p>
          </div>

          <div className={styles.panelFooter}>
            <span>Ujian berbasis komputer</span>
            <span className={styles.footerDot} aria-hidden="true" />
            <span>GuruKuy</span>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.mobileBrand}>
            <span className={styles.brandMark}>G</span>
            <span>
              GuruKuy <b>CBT</b>
            </span>
          </div>
          <div className={styles.formContent}>
            <div className={styles.formHeading}>
              <p className={styles.eyebrow}>SELAMAT DATANG</p>
              <h2>Masuk ke akun siswa</h2>
              <p>Gunakan NISN dan NIS yang terdaftar di sekolah.</p>
            </div>

            {error && (
              <div className={styles.errorMessage} role="alert">
                <i className="bi bi-exclamation-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            <form className={styles.loginForm} onSubmit={handleLogin}>
              <label className={styles.fieldLabel} htmlFor="nisn">
                NISN
              </label>
              <div className={styles.inputWrap}>
                <i className="bi bi-person-badge" aria-hidden="true" />
                <input
                  id="nisn"
                  name="nisn"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="Masukkan NISN"
                  value={nisn}
                  onChange={(event) => setNisn(event.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <label className={styles.fieldLabel} htmlFor="nis">
                NIS
              </label>
              <div className={styles.inputWrap}>
                <i className="bi bi-key" aria-hidden="true" />
                <input
                  id="nis"
                  name="nis"
                  type={showPassword ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Masukkan NIS"
                  value={nis}
                  onChange={(event) => setNis(event.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  className={styles.visibilityButton}
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? "Sembunyikan NIS" : "Tampilkan NIS"
                  }
                  title={showPassword ? "Sembunyikan NIS" : "Tampilkan NIS"}
                  disabled={loading}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <button
                className={styles.submitButton}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />{" "}
                    Memeriksa data...
                  </>
                ) : (
                  <>
                    Masuk ke ruang ujian{" "}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className={styles.helpText}>
              Kesulitan masuk? Hubungi operator atau admin sekolah Anda.
            </p>
          </div>
          <footer className={styles.formFooter}>
            © {new Date().getFullYear()} GuruKuy CBT
          </footer>
        </section>
      </div>
    </main>
  );
}