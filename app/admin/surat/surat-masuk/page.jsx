'use client';

import Link from 'next/link';

export default function SuratMasukPage() {
  return (
    <>
      {/* Content Header */}
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Surat Masuk</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item">
                  <Link href="/admin">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Surat Masuk</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="content">
        <div className="container-fluid">

          {/* Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Daftar Surat Masuk</h3>

              <div className="card-tools">
                <button className="btn btn-primary btn-sm">
                  <i className="fas fa-plus mr-1"></i>
                  Tambah Surat
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="card-body table-responsive p-0">
              <table className="table table-hover text-nowrap">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>No Surat</th>
                    <th>Tanggal</th>
                    <th>Pengirim</th>
                    <th>Perihal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>001/SM/I/2026</td>
                    <td>10 Januari 2026</td>
                    <td>Dinas Pendidikan</td>
                    <td>Undangan Rapat</td>
                    <td>
                      <button className="btn btn-info btn-sm mr-1">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn btn-warning btn-sm mr-1">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-danger btn-sm">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="card-footer clearfix">
              <span className="text-muted">
                Menampilkan 1 dari 1 data
              </span>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
