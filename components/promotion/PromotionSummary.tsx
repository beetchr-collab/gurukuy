"use client";

import { PromotionSummary as PromotionSummaryType } from "@/types/promotion";

interface PromotionSummaryProps {
  summary: PromotionSummaryType;
}

export default function PromotionSummary({
  summary,
}: PromotionSummaryProps) {
  return (
    <div className="card card-outline card-success">

      <div className="card-header">
        <h3 className="card-title">
          Ringkasan Kenaikan Tingkat
        </h3>
      </div>

      <div className="card-body">

        <div className="row">

          {/* Total */}

          <div className="col-md-6 col-xl-3">

            <div className="small-box bg-info">

              <div className="inner">
                <h3>{summary.total}</h3>

                <p>Total Siswa</p>
              </div>

              <div className="icon">
                <i className="fas fa-users" />
              </div>

            </div>

          </div>

          {/* Naik */}

          <div className="col-md-6 col-xl-3">

            <div className="small-box bg-success">

              <div className="inner">
                <h3>{summary.promoted}</h3>

                <p>Naik Kelas</p>
              </div>

              <div className="icon">
                <i className="fas fa-arrow-up" />
              </div>

            </div>

          </div>

          {/* Tetap */}

          <div className="col-md-6 col-xl-3">

            <div className="small-box bg-warning">

              <div className="inner">
                <h3>{summary.retained}</h3>

                <p>Tetap Kelas</p>
              </div>

              <div className="icon">
                <i className="fas fa-equals" />
              </div>

            </div>

          </div>

          {/* Lulus */}

          <div className="col-md-6 col-xl-3">

            <div className="small-box bg-primary">

              <div className="inner">
                <h3>{summary.graduated}</h3>

                <p>Lulus</p>
              </div>

              <div className="icon">
                <i className="fas fa-graduation-cap" />
              </div>

            </div>

          </div>

        </div>

        <hr />

        <table className="table table-sm table-bordered mb-0">

          <tbody>

            <tr>
              <th style={{ width: "50%" }}>Total Siswa</th>
              <td>{summary.total}</td>
            </tr>

            <tr>
              <th>Naik Kelas</th>
              <td>{summary.promoted}</td>
            </tr>

            <tr>
              <th>Tetap Kelas</th>
              <td>{summary.retained}</td>
            </tr>

            <tr>
              <th>Lulus</th>
              <td>{summary.graduated}</td>
            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}