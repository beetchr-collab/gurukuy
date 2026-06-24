import { useState } from "react";

export interface FailedImportItem<T = Record<string, any>> {
    row:number;
    reason:string;
    data:T;
}

export default function useUploadProgress() {
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const [progress, setProgress] = useState(0);

  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState(0);

  const [failed, setFailed] = useState<FailedImportItem[]>([]);

  // ==========================
  // Mulai Upload
  // ==========================
  const start = (totalData: number) => {
    setLoading(true);
    setFinished(false);

    setProgress(0);

    setTotal(totalData);
    setSuccess(0);

    setFailed([]);
  };

  // ==========================
  // Update Progress
  // ==========================
  const update = (current: number) => {
    if (total === 0) return;

    setProgress(Math.round((current / total) * 100));
  };

  // ==========================
  // Berhasil
  // ==========================
  const addSuccess = () => {
    setSuccess((prev) => prev + 1);
  };

  // ==========================
  // Gagal
  // ==========================
  const addFailed = (item: FailedImportItem) => {
    setFailed((prev) => [...prev, item]);
  };

  // ==========================
  // Finish
  // ==========================
  const finish = () => {
    setProgress(100);
    setFinished(true);
  };

  // ==========================
  // Reset
  // ==========================
  const reset = () => {
    setLoading(false);
    setFinished(false);

    setProgress(0);

    setTotal(0);
    setSuccess(0);

    setFailed([]);
  };

  return {
    loading,
    finished,

    progress,

    total,
    success,
    failed,

    failedCount: failed.length,

    start,
    update,
    addSuccess,
    addFailed,
    finish,
    reset,
  };
}