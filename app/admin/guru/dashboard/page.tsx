export default function UsersPage() {
  return (
    <main className="app-main">
      {/* Header */}
      <div className="app-content-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-6">
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">
                  <a href="/admin/guru/dashboard">Dashboard</a>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="app-content">
        {/* ALERT */}
        <div className="container-fluid mb-3">
          <div className="callout callout-info">
            <h5>
              <i className="icon fas fa-exclamation-triangle" />{' '}
              <b>Selamat datang!</b>
            </h5>
            <a
              href="https://getbootstrap.com/docs/5.3/components/"
              target="_blank"
              rel="noopener noreferrer"
              className="callout-link"
            >
            </a>
            <hr />
            Portal ini merupakan media informasi dan komunikasi sekolah yang
            bertujuan untuk memberikan layanan informasi secara cepat,
            transparan, dan mudah diakses oleh seluruh warga sekolah serta
            masyarakat.
            <br />Kelola data pembelajaran, profil, dan aktivitas sekolah Anda dengan mudah melalui panel ini.
            <br />- Melihat ringkasan aktivitas mengajar
            <br />- Mengelola profil dan data pribadi
            <br />- Mengakses informasi sekolah terbaru
            <br />- Memantau tugas dan laporan pembelajaran
            <br />- Gunakan menu di samping untuk mulai bekerja.
          </div>
        </div>
        {/* /.container-fluid */}

      </div>
    </main>
  );
}
