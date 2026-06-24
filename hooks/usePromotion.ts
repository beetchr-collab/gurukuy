"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

import {
  loadPromotionPreview,
  processPromotion,
} from "@/services/promotion.service";

import {
  PromotionStudent,
  PromotionSummary,
} from "@/types/promotion";

import {
  calculatePromotionSummary,
} from "@/lib/promotion";

export function usePromotion() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [currentAcademicYear, setCurrentAcademicYear] =
    useState("");

  const [nextAcademicYear, setNextAcademicYear] =
    useState("");

  const [preview, setPreview] = useState<
    PromotionStudent[]
  >([]);

  const summary: PromotionSummary = useMemo(() => {
    return calculatePromotionSummary(preview);
  }, [preview]);

  const selectedStudents = useMemo(() => {
    return preview.filter((s) => s.selected);
  }, [preview]);

  /**
   * Load Preview
   */
  const loadPreview = useCallback(
    async (academicYear: string) => {
      if (!user) return;

      try {
        setLoading(true);

        const data = await loadPromotionPreview(
          user.ownerId ?? user.uid,
          user.schoolId ?? "",
          academicYear
        );

        setPreview(data);

        setCurrentAcademicYear(
          data[0]?.tahunAjaranLama ?? academicYear
        );

        setNextAcademicYear(
          data[0]?.tahunAjaranBaru ?? ""
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Checkbox
   */
  const toggleStudent = (id: string) => {
    setPreview((prev) =>
      prev.map((student) =>
        student.id === id
          ? {
              ...student,
              selected: !student.selected,
            }
          : student
      )
    );
  };

  /**
   * Modal
   */
  const openConfirm = () => {
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
  };

  /**
   * Process Promotion
   */
  const process = async () => {
    if (!user) return;

    try {
      setProcessing(true);

      await processPromotion({
        students: selectedStudents,

        ownerId: user.ownerId ?? user.uid,

        schoolId: user.schoolId ?? "",

        createdBy: user.username ?? user.email ?? "Admin",
      });

      setConfirmOpen(false);

      alert("Proses kenaikan tingkat berhasil.");
    } catch (error) {
      console.error(error);

      alert("Terjadi kesalahan.");
    } finally {
      setProcessing(false);
    }
  };

  return {
    loading,
    processing,

    confirmOpen,

    currentAcademicYear,
    nextAcademicYear,

    preview,

    summary,

    selectedStudents,

    loadPreview,

    processPromotion: process,

    toggleStudent,

    openConfirm,

    closeConfirm,
  };
}