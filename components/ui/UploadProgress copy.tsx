"use client";

interface UploadProgressProps {
  loading: boolean;
  progress: number;
  title?: string;
  subtitle?: string;
  onFinish?: () => void;
}

export default function UploadProgress({
  loading,
  progress,
  title = "Mengupload Data",
  subtitle = "Mohon tunggu hingga proses selesai...",
  onFinish
}: UploadProgressProps) {
  if (!loading) return null;

  return (
    <div className="card shadow-sm border-0 mt-4">

      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">

          <div>

            <h6 className="mb-1">
              <i className="fas fa-cloud-upload-alt text-primary me-2"></i>
              {title}
            </h6>

            <small className="text-muted">
              {subtitle}
            </small>

          </div>

          <div className="text-end">

            <h4 className="text-primary mb-0">
              {progress}%
            </h4>

          </div>

        </div>

        <div className="progress rounded-pill" style={{ height: 12 }}>

          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{
              width: `${progress}%`,
              transition: "width .4s ease"
            }}
          />

        </div>

        <div className="mt-4">

          {progress < 100 ? (

            <div className="text-muted">
              <i className="fas fa-spinner fa-spin me-2"></i>
              Sedang memproses data...
            </div>

          ) : (

            <div className="text-center">

              <div className="mb-3">

                <i
                  className="fas fa-check-circle text-success"
                  style={{ fontSize: 60 }}
                />

              </div>

              <h5 className="text-success">
                Import Data Berhasil
              </h5>

              <p className="text-muted">
                Seluruh data berhasil disimpan ke database.
              </p>

              <button
                className="btn btn-success"
                onClick={onFinish}
              >
                <i className="fas fa-check me-2"></i>
                Selesai
              </button>

            </div>

          )}

        </div>
      </div>

    </div>
  );
}