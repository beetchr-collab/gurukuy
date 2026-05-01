export default function Footer() {
  return (
    <footer className="app-footer footer-gradient text-sm">
      <div className="d-flex flex-wrap justify-content-between align-items-center">

        <div>
          <strong>
            © {new Date().getFullYear()} GuruKuy
          </strong>
          <div className="small">
            Mendukung digitalisasi pendidikan yang lebih efektif
          </div>
        </div>

        <div className="text-end small">
          <div>Versi 1.0.0</div>
          <div>Developed by Selamet Andika Putra</div>
        </div>

      </div>
    </footer>
  );
}