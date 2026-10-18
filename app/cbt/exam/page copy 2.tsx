"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { sanitizeQuestionHtml } from "@/lib/sanitize-question-html";
import styles from "../cbt.module.css";

type CbtStudent = {
  id: string;
  nama: string;
  nis?: string;
  nisn?: string;
  jk?: string;
  kelas: string;
  tingkatKelas: string;
};

type Exam = {
  namaBankSoal?: string;
  mataPelajaran?: string;
  kelas?: string;
  status?: string;
  examStatus?: string;
  allowAccess?: boolean;
  examDate?: string;
  endTime?: string;
  duration?: number;
  startedAt?: number | null;
};

type Question = {
  id: string;
  tipeSoal?: string;
  pertanyaan?: string;
  gambarUrl?: string;
  opsi?: string[];
  benarSalah?: { statement: string; jawaban?: string }[];
  pasangan?: { left: string; right: string }[];
};

type Answer = string | string[] | Record<string, string>;

type MatchEndpoint = {
  side: "left" | "right";
  index: number;
};

const shuffleIndexes = (length: number) => {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[randomIndex]] = [indexes[randomIndex], indexes[index]];
  }
  return indexes;
};

function MatchingAnswer({
  questionId,
  pairs,
  answer,
  onChange,
}: {
  questionId: string;
  pairs: { left: string; right: string }[];
  answer: Record<string, string>;
  onChange: (answer: Record<string, string>) => void;
}) {
  const [leftOrder] = useState(() => shuffleIndexes(pairs.length));
  const [rightOrder] = useState(() => shuffleIndexes(pairs.length));
  const [activeEndpoint, setActiveEndpoint] = useState<MatchEndpoint | null>(null);
  const [dragging, setDragging] = useState<{
    from: MatchEndpoint;
    point: { x: number; y: number };
  } | null>(null);
  const [lineLayout, setLineLayout] = useState<{
    width: number;
    height: number;
    points: Record<string, { x: number; y: number }>;
  }>({ width: 0, height: 0, points: {} });
  const boardRef = useRef<HTMLDivElement>(null);
  const leftNodes = useRef(new Map<number, HTMLButtonElement>());
  const rightNodes = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    const updateLineLayout = () => {
      const board = boardRef.current;
      if (!board) return;
      const boardRect = board.getBoundingClientRect();
      const points: Record<string, { x: number; y: number }> = {};
      for (const [side, nodes] of [
        ["left", leftNodes.current],
        ["right", rightNodes.current],
      ] as const) {
        nodes.forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          points[`${side}-${index}`] = {
            x: (side === "left" ? rect.right : rect.left) - boardRect.left,
            y: rect.top + rect.height / 2 - boardRect.top,
          };
        });
      }
      setLineLayout({ width: boardRect.width, height: boardRect.height, points });
    };

    updateLineLayout();
    const resizeObserver = new ResizeObserver(updateLineLayout);
    if (boardRef.current) resizeObserver.observe(boardRef.current);
    window.addEventListener("resize", updateLineLayout);
    window.addEventListener("scroll", updateLineLayout, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLineLayout);
      window.removeEventListener("scroll", updateLineLayout, true);
    };
  }, [answer, pairs.length]);

  const connectEndpoints = (first: MatchEndpoint, second: MatchEndpoint) => {
    if (first.side === second.side) {
      setActiveEndpoint(second);
      return;
    }
    const leftIndex = first.side === "left" ? first.index : second.index;
    const rightIndex = first.side === "right" ? first.index : second.index;
    const selectedRight = pairs[rightIndex]?.right;
    if (selectedRight === undefined) return;

    const nextAnswer = { ...answer };
    Object.entries(nextAnswer).forEach(([index, value]) => {
      if (value === selectedRight && index !== String(leftIndex)) delete nextAnswer[index];
    });
    nextAnswer[String(leftIndex)] = selectedRight;
    onChange(nextAnswer);
    setActiveEndpoint(null);
  };

  const activateEndpoint = (endpoint: MatchEndpoint) => {
    if (activeEndpoint && activeEndpoint.side !== endpoint.side) {
      connectEndpoints(activeEndpoint, endpoint);
    } else if (
      activeEndpoint?.side === endpoint.side &&
      activeEndpoint.index === endpoint.index
    ) {
      setActiveEndpoint(null);
    } else {
      setActiveEndpoint(endpoint);
    }
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    endpoint: MatchEndpoint
  ) => {
    event.preventDefault();
    const from = activeEndpoint && activeEndpoint.side !== endpoint.side
      ? activeEndpoint
      : endpoint;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    board.setPointerCapture(event.pointerId);
    setDragging({
      from,
      point: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDragging({
      ...dragging,
      point: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const endpointButton = target instanceof Element
      ? target.closest<HTMLButtonElement>("[data-match-side][data-match-index]")
      : null;
    const side = endpointButton?.dataset.matchSide;
    const index = Number(endpointButton?.dataset.matchIndex);
    if (
      (side === "left" || side === "right") &&
      Number.isInteger(index) &&
      side !== dragging.from.side
    ) {
      connectEndpoints(dragging.from, { side, index });
    } else {
      setActiveEndpoint(dragging.from);
    }
    setDragging(null);
  };

  const handleKeyboardClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    endpoint: MatchEndpoint
  ) => {
    if (event.detail === 0) activateEndpoint(endpoint);
  };

  const connectionLines = Object.entries(answer).flatMap(([leftIndex, rightValue]) => {
    const left = lineLayout.points[`left-${Number(leftIndex)}`];
    const rightIndex = pairs.findIndex((pair) => pair.right === rightValue);
    const right = lineLayout.points[`right-${rightIndex}`];
    return left && right ? [{ key: leftIndex, left, right }] : [];
  });
  const dragStart = dragging && lineLayout.points[`${dragging.from.side}-${dragging.from.index}`];

  return (
    <div className={styles.matchingQuestion}>
      <p className={styles.matchingInstruction}>
        Tarik garis untuk memasangkan jawaban, atau pilih satu item di kiri lalu pasangannya di kanan.
      </p>
      <div
        className={styles.matchingBoard}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragging(null)}
        ref={boardRef}
      >
        {lineLayout.width > 0 && lineLayout.height > 0 && (
          <svg
            aria-hidden="true"
            className={styles.matchingLines}
            viewBox={`0 0 ${lineLayout.width} ${lineLayout.height}`}
          >
            {connectionLines.map(({ key, left, right }) => (
              <line
                key={key}
                x1={left.x}
                y1={left.y}
                x2={right.x}
                y2={right.y}
                className={styles.matchingLine}
              />
            ))}
            {dragging && dragStart && (
              <line
                x1={dragStart.x}
                y1={dragStart.y}
                x2={dragging.point.x}
                y2={dragging.point.y}
                className={styles.matchingLinePreview}
              />
            )}
          </svg>
        )}
        <div className={styles.matchingColumn} aria-label="Pernyataan" role="group">
          {leftOrder.map((pairIndex) => {
            const endpoint = { side: "left" as const, index: pairIndex };
            const isConnected = answer[String(pairIndex)] !== undefined;
            return (
              <button
                aria-pressed={activeEndpoint?.side === "left" && activeEndpoint.index === pairIndex}
                className={`${styles.matchingItem} ${styles.matchingLeft} ${activeEndpoint?.side === "left" && activeEndpoint.index === pairIndex ? styles.matchingItemActive : ""} ${isConnected ? styles.matchingItemConnected : ""}`}
                data-match-side="left"
                data-match-index={pairIndex}
                key={`${questionId}-left-${pairIndex}`}
                onClick={(event) => handleKeyboardClick(event, endpoint)}
                onPointerDown={(event) => handlePointerDown(event, endpoint)}
                ref={(node) => {
                  if (node) leftNodes.current.set(pairIndex, node);
                  else leftNodes.current.delete(pairIndex);
                }}
                type="button"
              >
                <span dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(pairs[pairIndex].left) }} />
              </button>
            );
          })}
        </div>
        <div className={styles.matchingColumn} aria-label="Pilihan pasangan" role="group">
          {rightOrder.map((pairIndex) => {
            const endpoint = { side: "right" as const, index: pairIndex };
            const isConnected = Object.values(answer).includes(pairs[pairIndex].right);
            return (
              <button
                aria-pressed={activeEndpoint?.side === "right" && activeEndpoint.index === pairIndex}
                className={`${styles.matchingItem} ${styles.matchingRight} ${activeEndpoint?.side === "right" && activeEndpoint.index === pairIndex ? styles.matchingItemActive : ""} ${isConnected ? styles.matchingItemConnected : ""}`}
                data-match-side="right"
                data-match-index={pairIndex}
                key={`${questionId}-right-${pairIndex}`}
                onClick={(event) => handleKeyboardClick(event, endpoint)}
                onPointerDown={(event) => handlePointerDown(event, endpoint)}
                ref={(node) => {
                  if (node) rightNodes.current.set(pairIndex, node);
                  else rightNodes.current.delete(pairIndex);
                }}
                type="button"
              >
                <span dangerouslySetInnerHTML={{ __html: sanitizeQuestionHtml(pairs[pairIndex].right) }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const isQuestionAnswered = (question: Question, answer: Answer | undefined) => {
  if (question.tipeSoal === "PG") {
    return typeof answer === "string" && answer.trim().length > 0;
  }

  if (question.tipeSoal === "PGK") {
    return Array.isArray(answer) &&
      answer.length > 0 &&
      new Set(answer).size === answer.length &&
      answer.every((label) => {
        const optionIndex = label.charCodeAt(0) - 65;
        return label.length === 1 && optionIndex >= 0 && optionIndex < (question.opsi?.length || 0);
      });
  }

  if (
    question.tipeSoal === "Benar/Salah" ||
    question.tipeSoal === "Sesuai/Tidak Sesuai" ||
    question.tipeSoal === "Mendukung/Tidak mendukung" ||
    question.tipeSoal === "Fakta/Pendapat"
  ) {
    const statementCount = question.benarSalah?.length || 0;
    if (statementCount === 0 || !answer || typeof answer === "string" || Array.isArray(answer)) {
      return false;
    }
    const allowedAnswers =
      question.tipeSoal === "Benar/Salah"
        ? ["Benar", "Salah"]
        : question.tipeSoal === "Sesuai/Tidak Sesuai"
          ? ["Sesuai", "Tidak Sesuai"]
          : question.tipeSoal === "Mendukung/Tidak mendukung"
            ? ["Mendukung", "Tidak mendukung"]
            : ["Fakta", "Pendapat"];
    return Array.from({ length: statementCount }, (_, index) => answer[String(index)])
      .every((value) => allowedAnswers.includes(value));
  }

  if (question.tipeSoal === "Menjodohkan") {
    const pairCount = question.pasangan?.length || 0;
    if (pairCount === 0 || !answer || typeof answer === "string" || Array.isArray(answer)) {
      return false;
    }
    return Array.from({ length: pairCount }, (_, index) => answer[String(index)])
      .every((value) => typeof value === "string" && value.trim().length > 0);
  }

  return typeof answer === "string" && answer.trim().length > 0;
};

export default function CbtExamPage() {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<CbtStudent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [questionNavigationOpen, setQuestionNavigationOpen] = useState(false);
  const [finishConfirmationOpen, setFinishConfirmationOpen] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [progressSaveError, setProgressSaveError] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [violationMessage, setViolationMessage] = useState("");
  const [violationWarningOpen, setViolationWarningOpen] = useState(false);
  const [examLocked, setExamLocked] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastViolationAt = useRef(0);
  const fullscreenWasActive = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadExam = async () => {
      try {
        const storedStudent = localStorage.getItem("cbtStudent");
        const examId = new URLSearchParams(window.location.search).get("examId");
        if (!storedStudent) {
          router.replace(`/cbt${examId ? `?examId=${encodeURIComponent(examId)}` : ""}`);
          return;
        }

        let student: CbtStudent;
        try {
          student = JSON.parse(storedStudent) as CbtStudent;
        } catch {
          localStorage.removeItem("cbtStudent");
          router.replace(`/cbt${examId ? `?examId=${encodeURIComponent(examId)}` : ""}`);
          return;
        }

        setStudent(student);
        if (!examId) {
          setError("Ujian tidak ditemukan.");
          return;
        }

        const token = sessionStorage.getItem(`cbtExamToken:${examId}`);
        if (!token) {
          setError("Token ujian tidak ditemukan. Silakan kembali ke dashboard dan masukkan token.");
          return;
        }

        const response = await fetch("/api/cbt/exam", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ examId, studentId: student.id, token }),
        });
        const result = await response.json() as {
          success: boolean;
          message?: string;
          exam?: Exam;
          violationCount?: number;
          resumedSession?: boolean;
          resumedAfterLock?: boolean;
          questions?: Question[];
          answers?: Record<string, Answer>;
          currentQuestionId?: string | null;
        };

        if (!response.ok || !result.success || !result.exam) {
          if (response.status === 423) {
            setExamLocked(true);
            setViolationMessage(result.message || "Akses ujian ini dikunci. Hubungi guru.");
          }
          setError(result.message || "Soal ujian gagal dimuat. Silakan kembali dan coba lagi.");
          return;
        }
        if (cancelled) return;

        setExam(result.exam);
        const restoredQuestions = result.questions || [];
        setQuestions(restoredQuestions);
        setAnswers(result.answers || {});
        if (result.resumedSession || result.resumedAfterLock) {
          setResumeMessage("Sesi sebelumnya telah dilanjutkan. Jawaban tersimpan dan sisa waktu tetap berjalan.");
        }
        if (result.currentQuestionId) {
          const restoredIndex = restoredQuestions.findIndex(
            (question) => question.id === result.currentQuestionId
          );
          if (restoredIndex >= 0) setCurrentQuestionIndex(restoredIndex);
        }
        setProgressReady(true);
        if ((result.violationCount || 0) === 1) {
          setViolationMessage(
            "Peringatan: satu pelanggaran telah tercatat pada ujian ini. Pelanggaran berikutnya akan mengunci akses Anda."
          );
          setViolationWarningOpen(true);
        }
      } catch (loadError) {
        console.error("Gagal memuat soal CBT:", loadError);
        setError("Soal ujian gagal dimuat. Silakan kembali dan coba lagi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadExam();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const recordViolation = useCallback(async (kind: string) => {
    if (!student || examFinished || examLocked) return;
    const now = Date.now();
    if (now - lastViolationAt.current < 1_200) return;
    lastViolationAt.current = now;

    const examId = new URLSearchParams(window.location.search).get("examId");
    if (!examId) return;

    try {
      const response = await fetch("/api/cbt/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, studentId: student.id, kind }),
        keepalive: kind === "leave-attempt",
      });
      const result = await response.json() as {
        success: boolean;
        message?: string;
        violations?: number;
        locked?: boolean;
      };
      if (!response.ok || !result.success) {
        if (response.status === 409) return;
        throw new Error(result.message || "Pelanggaran gagal dicatat.");
      }

      setViolationMessage(result.message || "");
      if (result.locked) {
        setExamLocked(true);
        setViolationWarningOpen(false);
      } else {
        setViolationWarningOpen(true);
      }
    } catch (violationError) {
      console.error("Gagal mencatat pelanggaran CBT:", violationError);
    }
  }, [examFinished, examLocked, student]);

  useEffect(() => {
    if (!exam || !student || examFinished || examLocked) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void recordViolation("tab-hidden");
      }
    };
    const handleFullscreenChange = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFullscreenActive(isFullscreen);
      if (isFullscreen) {
        fullscreenWasActive.current = true;
      } else if (fullscreenWasActive.current) {
        fullscreenWasActive.current = false;
        void recordViolation("fullscreen-exit");
      }
    };
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link) return;
      const destination = new URL(link.getAttribute("href") || "", window.location.href);
      if (destination.origin === window.location.origin &&
          destination.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      void recordViolation("leave-attempt");
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const examId = new URLSearchParams(window.location.search).get("examId");
      if (!examId || !student || Date.now() - lastViolationAt.current < 1_200) return;
      lastViolationAt.current = Date.now();
      const payload = JSON.stringify({
        examId,
        studentId: student.id,
        kind: "leave-attempt",
      });
      navigator.sendBeacon(
        "/api/cbt/violations",
        new Blob([payload], { type: "application/json" })
      );
      event.preventDefault();
      event.returnValue = "";
    };
    const examUrl = window.location.href;
    const handlePopState = () => {
      window.history.pushState({ cbtExamGuard: true }, "", examUrl);
      void recordViolation("leave-attempt");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState({ cbtExamGuard: true }, "", examUrl);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [exam, examFinished, examLocked, recordViolation, student]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (fullscreenError) {
      console.error("Gagal mengubah mode fullscreen CBT:", fullscreenError);
      setSubmissionError("Mode layar penuh tidak dapat diaktifkan pada browser ini.");
    }
  };

  const setAnswer = (questionId: string, answer: Answer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  };

  useEffect(() => {
    if (
      !progressReady ||
      !student ||
      questions.length === 0 ||
      examFinished ||
      savingSubmission
    ) return;

    let cancelled = false;
    const examId = new URLSearchParams(window.location.search).get("examId");
    const currentQuestionId = questions[currentQuestionIndex]?.id || "";
    if (!examId || !currentQuestionId) return;
    const progress = JSON.stringify({
      examId,
      studentId: student.id,
      answers,
      currentQuestionId,
      progressUpdatedAt: Date.now(),
    });

    const saveProgress = async () => {
      const response = await fetch("/api/cbt/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: progress,
        keepalive: true,
      });
      const result = await response.json() as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Progres ujian gagal disimpan.");
      }
    };

    const timeout = window.setTimeout(async () => {
      try {
        await saveProgress();
        if (!cancelled) setProgressSaveError("");
      } catch (progressError) {
        if (cancelled) return;
        console.error("Gagal menyimpan progres CBT:", progressError);
        setProgressSaveError(
          progressError instanceof Error
            ? progressError.message
            : "Progres ujian gagal disimpan. Periksa koneksi internet."
        );
      }
    }, 500);
    const handlePageHide = () => {
      const queued = navigator.sendBeacon(
        "/api/cbt/progress",
        new Blob([progress], { type: "application/json" })
      );
      if (!queued) {
        console.error("CBT progress could not be queued before leaving the page.");
      }
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [
    answers,
    currentQuestionIndex,
    examFinished,
    progressReady,
    questions,
    savingSubmission,
    student,
  ]);

  useEffect(() => {
    if (!exam) return;

    const scheduledEnd = exam.examDate && exam.endTime
      ? new Date(`${exam.examDate}T${exam.endTime}`).getTime()
      : Number.NaN;
    const deadline = Number.isFinite(scheduledEnd)
      ? scheduledEnd
      : typeof exam.duration === "number" && exam.duration > 0
        ? (exam.startedAt || Date.now()) + exam.duration * 60 * 1000
        : null;

    if (deadline === null) return;

    const updateRemainingTime = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(interval);
  }, [exam]);

  useEffect(() => {
    if (!exam || !student || examFinished || examLocked) return;

    const sendPresence = async () => {
      try {
        const examId = new URLSearchParams(window.location.search).get("examId");
        if (!examId) return;

        const response = await fetch("/api/cbt/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId, studentId: student.id }),
        });

        if (!response.ok) {
          console.error("CBT presence heartbeat failed:", response.status);
          if (response.status === 423) {
            const result = await response.json() as { message?: string };
            setViolationMessage(
              result.message || "Akses ujian Anda dikunci karena pelanggaran."
            );
            setExamLocked(true);
            return;
          }
          if (response.status === 404) {
            router.replace("/cbt/dashboard");
          }
        }
      } catch (presenceError) {
        console.error("CBT presence heartbeat failed:", presenceError);
      }
    };

    void sendPresence();
    const interval = window.setInterval(() => {
      void sendPresence();
    }, 20_000);

    return () => window.clearInterval(interval);
  }, [exam, examFinished, examLocked, router, student]);

  const answeredCount = useMemo(
    () => questions.filter((question) => isQuestionAnswered(question, answers[question.id])).length,
    [answers, questions]
  );
  const canFinishExam = questions.length > 0 &&
    answeredCount === questions.length &&
    doubtfulQuestions.size === 0;

  useEffect(() => {
    if (!questionNavigationOpen && !finishConfirmationOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuestionNavigationOpen(false);
        setFinishConfirmationOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finishConfirmationOpen, questionNavigationOpen]);

  const saveAndFinishExam = async () => {
    if (!exam || !student || savingSubmission || !canFinishExam) return;

    setSavingSubmission(true);
    setSubmissionError("");
    try {
      const examId = new URLSearchParams(window.location.search).get("examId");
      if (!examId) throw new Error("ID ujian tidak ditemukan.");

      const response = await fetch("/api/cbt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          studentId: student.id,
          answers,
          doubtfulQuestionIds: Array.from(doubtfulQuestions),
        }),
      });
      const result = await response.json() as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Jawaban gagal disimpan. Silakan coba lagi.");
      }

      setFinishConfirmationOpen(false);
      setExamFinished(true);
      setProgressReady(false);
      if (examId) sessionStorage.removeItem(`cbtExamToken:${examId}`);
    } catch (submitError) {
      console.error("Gagal menyimpan jawaban CBT:", submitError);
      setSubmissionError(
        submitError instanceof Error
          ? submitError.message
          : "Jawaban gagal disimpan. Silakan coba lagi."
      );
    } finally {
      setSavingSubmission(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--:--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    return [hours, minutes, remaining].map((part) => String(part).padStart(2, "0")).join(":");
  };

  if (loading) {
    return <main className={styles.dashboardLoading}>Memuat soal ujian...</main>;
  }

  if (error || !exam) {
    return (
      <main className={styles.examPage}>
        <div className={styles.examShell}>
          {examLocked ? (
            <div className={styles.finishOverlay} role="presentation">
              <section className={styles.finishDialog} role="alert">
                <div className={styles.finishDialogIcon} aria-hidden="true">!</div>
                <h2>Akses ujian dikunci</h2>
                <p>{violationMessage || error}</p>
                <div className={styles.finishDialogActions}>
                  <button
                    className={styles.finishConfirmButton}
                    onClick={() => {
                      const examId = new URLSearchParams(window.location.search).get("examId");
                      localStorage.removeItem("cbtStudent");
                      router.replace(`/cbt${examId ? `?examId=${encodeURIComponent(examId)}` : ""}`);
                    }}
                    type="button"
                  >
                    Kembali ke login
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <>
              <p className={styles.examError} role="alert">{error || "Ujian tidak tersedia."}</p>
              <button className={styles.examBackButton} onClick={() => router.push("/cbt/dashboard")}>
                Kembali ke dashboard
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <main className={styles.examPage}>
      <div className={styles.examShell}>
        <header className={styles.examHeader}>
          <div className={styles.examIdentity}>
            <p className={styles.dashboardEyebrow}>RUANG UJIAN CBT</p>
            <h1>{exam.namaBankSoal || "Ujian CBT"}</h1>
            <p>{exam.mataPelajaran || "Mata pelajaran"} · {exam.kelas || "Kelas tidak ditentukan"}</p>
          </div>
          <div className={styles.examHeaderTools}>
            <section className={styles.examParticipant} aria-label="Identitas peserta">
              <span className={styles.participantAvatar} aria-hidden="true">
                {(student?.nama || "P").trim().charAt(0).toUpperCase()}
              </span>
              <span className={styles.participantDetails}>
                <small>Peserta ujian</small>
                <strong>{student?.nama || "Peserta"}</strong>
                <span>{student?.kelas || student?.tingkatKelas || "Kelas tidak ditentukan"}</span>
              </span>
            </section>
            <section className={styles.examTimer} aria-label="Sisa waktu ujian">
              <span className={styles.timerIcon} aria-hidden="true">◷</span>
              <span>
                <small>SISA WAKTU</small>
                <strong>{formatTime(remainingSeconds)}</strong>
              </span>
            </section>
            <button
              className={styles.questionNavigationTrigger}
              onClick={() => void toggleFullscreen()}
              type="button"
            >
              <i className={`bi ${fullscreenActive ? "bi-fullscreen-exit" : "bi-fullscreen"}`} aria-hidden="true" />
              {fullscreenActive ? "Keluar fullscreen" : "Aktifkan fullscreen"}
            </button>
          </div>
        </header>

        {questions.length === 0 ? (
          <div className={styles.examEmpty}>Belum ada soal pada ujian ini.</div>
        ) : (
          <section className={styles.examWorkspace} aria-label="Area pengerjaan ujian">
            <div className={styles.questionMain}>
              <button
                className={styles.questionNavigationTrigger}
                onClick={() => setQuestionNavigationOpen(true)}
                type="button"
                aria-haspopup="dialog"
              >
                <span aria-hidden="true">▦</span>
                Daftar Soal
                <strong>{answeredCount}/{questions.length}</strong>
              </button>
              <article className={styles.questionItem} key={currentQuestion.id}>
                <div className={styles.questionHeading}>
                  <span>Soal {currentQuestionIndex + 1} <small>/ {questions.length}</small></span>
                  <span>{currentQuestion.tipeSoal || "Soal"}</span>
                </div>
                <div
                  className={styles.questionPrompt}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeQuestionHtml(currentQuestion.pertanyaan || ""),
                  }}
                />
                {currentQuestion.gambarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.questionImage} src={currentQuestion.gambarUrl} alt="Ilustrasi soal" />
                )}

                {currentQuestion.tipeSoal === "PG" && (
                  <div className={styles.answerOptions}>
                    {(currentQuestion.opsi || []).map((option, optionIndex) => {
                      const letter = String.fromCharCode(65 + optionIndex);
                      return (
                        <label className={styles.answerOption} key={`${currentQuestion.id}-${letter}`}>
                          <input
                            type="radio"
                            name={currentQuestion.id}
                            checked={currentAnswer === letter}
                            onChange={() => setAnswer(currentQuestion.id, letter)}
                          />
                          <span className={styles.answerOptionContent}>
                            <b>{letter}.</b>{" "}
                            <span
                              dangerouslySetInnerHTML={{
                                __html: sanitizeQuestionHtml(option),
                              }}
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.tipeSoal === "PGK" && (
                  <div className={styles.answerOptions}>
                    <p className={styles.multipleAnswerInstruction}>
                      Pilih semua jawaban yang benar! Jawaban benar lebih dari satu.
                    </p>
                    {(currentQuestion.opsi || []).map((option, optionIndex) => {
                      const letter = String.fromCharCode(65 + optionIndex);
                      const selectedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                      return (
                        <label className={styles.answerOption} key={`${currentQuestion.id}-${letter}`}>
                          <input
                            type="checkbox"
                            name={currentQuestion.id}
                            checked={selectedAnswers.includes(letter)}
                            onChange={(event) => {
                              const nextAnswers = event.target.checked
                                ? [...selectedAnswers, letter]
                                : selectedAnswers.filter((answer) => answer !== letter);
                              setAnswer(currentQuestion.id, nextAnswers);
                            }}
                          />
                          <span className={styles.answerOptionContent}>
                            <b>{letter}</b>{" "}
                            <span
                              dangerouslySetInnerHTML={{
                                __html: sanitizeQuestionHtml(option),
                              }}
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {(currentQuestion.tipeSoal === "Benar/Salah" ||
                  currentQuestion.tipeSoal === "Sesuai/Tidak Sesuai" ||
                  currentQuestion.tipeSoal === "Mendukung/Tidak mendukung" ||
                  currentQuestion.tipeSoal === "Fakta/Pendapat") && (
                  (() => {
                    const statements = currentQuestion.benarSalah || [];
                    const statementAnswers =
                      typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                        ? currentAnswer
                        : {};
                    const answerOptions =
                      currentQuestion.tipeSoal === "Benar/Salah"
                        ? ["Benar", "Salah"]
                        : currentQuestion.tipeSoal === "Sesuai/Tidak Sesuai"
                          ? ["Sesuai", "Tidak Sesuai"]
                          : currentQuestion.tipeSoal === "Mendukung/Tidak mendukung"
                            ? ["Mendukung", "Tidak mendukung"]
                            : ["Fakta", "Pendapat"];

                    return (
                      <div className={styles.answerTableWrap}>
                        <table className={styles.answerTable}>
                          <thead>
                            <tr>
                              <th scope="col">Pernyataan</th>
                              {answerOptions.map((value) => (
                                <th scope="col" key={value}>
                                  {value}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {statements.map((statement, statementIndex) => {
                              const rowKey = String(statementIndex);
                              return (
                                <tr key={`${currentQuestion.id}-${statementIndex}`}>
                                  <th
                                    scope="row"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeQuestionHtml(statement.statement),
                                    }}
                                  />
                                  {answerOptions.map((value) => (
                                    <td key={value}>
                                      <label className={styles.answerTableChoice}>
                                        <input
                                          type="radio"
                                          name={`${currentQuestion.id}-${statementIndex}`}
                                          aria-label={`${value} untuk pernyataan ${statementIndex + 1}`}
                                          checked={statementAnswers[rowKey] === value}
                                          onChange={() =>
                                            setAnswer(currentQuestion.id, {
                                              ...statementAnswers,
                                              [rowKey]: value,
                                            })
                                          }
                                        />
                                      </label>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}

                {currentQuestion.tipeSoal === "Menjodohkan" && (
                  <MatchingAnswer
                    key={currentQuestion.id}
                    questionId={currentQuestion.id}
                    pairs={currentQuestion.pasangan || []}
                    answer={
                      currentAnswer && typeof currentAnswer === "object" && !Array.isArray(currentAnswer)
                        ? currentAnswer
                        : {}
                    }
                    onChange={(answer) => setAnswer(currentQuestion.id, answer)}
                  />
                )}

                {currentQuestion.tipeSoal === "Isian Singkat" && (
                  <input
                    className={styles.shortAnswer}
                    aria-label={`Jawaban soal ${currentQuestionIndex + 1}`}
                    value={typeof currentAnswer === "string" ? currentAnswer : ""}
                    onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                  />
                )}

                {currentQuestion.tipeSoal === "Uraian" && (
                  <textarea
                    className={styles.longAnswer}
                    aria-label={`Jawaban soal ${currentQuestionIndex + 1}`}
                    value={typeof currentAnswer === "string" ? currentAnswer : ""}
                    onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                    rows={5}
                  />
                )}
              </article>

              <div className={styles.questionControls}>
                <button
                  className={styles.previousButton}
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                  type="button"
                >
                  ← Sebelumnya
                </button>
                <button
                  className={`${styles.doubtfulButton} ${doubtfulQuestions.has(currentQuestion.id) ? styles.doubtfulButtonActive : ""}`}
                  aria-pressed={doubtfulQuestions.has(currentQuestion.id)}
                  onClick={() => setDoubtfulQuestions((current) => {
                    const next = new Set(current);
                    if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
                    else next.add(currentQuestion.id);
                    return next;
                  })}
                  type="button"
                >
                  ⚑ {doubtfulQuestions.has(currentQuestion.id) ? "Hapus Ragu-ragu" : "Ragu-ragu"}
                </button>
                <button
                  className={styles.nextButton}
                  disabled={currentQuestionIndex === questions.length - 1 && !canFinishExam}
                  onClick={() => {
                    if (currentQuestionIndex === questions.length - 1) {
                      setSubmissionError("");
                      setFinishConfirmationOpen(true);
                    } else {
                      setCurrentQuestionIndex((index) => index + 1);
                    }
                  }}
                  type="button"
                >
                  {currentQuestionIndex === questions.length - 1
                    ? canFinishExam ? "Selesai Ujian dan Simpan" : "Berikutnya"
                    : "Berikutnya →"}
                </button>
              </div>
              {currentQuestionIndex === questions.length - 1 && !canFinishExam && (
                <p className={styles.finishRequirement}>
                  Lengkapi semua jawaban dan hapus semua tanda ragu-ragu untuk menyelesaikan ujian.
                </p>
              )}
              {resumeMessage && <p className={styles.resumeNotice} role="status">{resumeMessage}</p>}
              {progressSaveError && (
                <p className={styles.finishRequirement} role="alert">{progressSaveError}</p>
              )}
            </div>
          </section>
        )}
      </div>
      {questionNavigationOpen && (
        <div
          className={styles.finishOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuestionNavigationOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="question-navigation-title"
            aria-modal="true"
            className={styles.navigationDialog}
            role="dialog"
          >
            <div className={styles.navigationDialogHeader}>
              <div>
                <h2 id="question-navigation-title">Navigasi soal</h2>
                <p>{answeredCount} dari {questions.length} terjawab</p>
              </div>
              <button
                aria-label="Tutup navigasi soal"
                className={styles.navigationCloseButton}
                onClick={() => setQuestionNavigationOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className={styles.questionGrid}>
              {questions.map((question, index) => {
                const answered = isQuestionAnswered(question, answers[question.id]);
                const isDoubtful = doubtfulQuestions.has(question.id);
                const classes = [
                  styles.questionNumber,
                  answered ? styles.numberAnswered : "",
                  index === currentQuestionIndex ? styles.numberActive : "",
                  isDoubtful ? styles.numberDoubtful : "",
                ].filter(Boolean).join(" ");
                return (
                  <button
                    aria-label={`Buka soal ${index + 1}${answered ? ", sudah dijawab" : ", belum dijawab"}${isDoubtful ? ", ragu-ragu" : ""}`}
                    aria-current={index === currentQuestionIndex ? "step" : undefined}
                    className={classes}
                    key={question.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setQuestionNavigationOpen(false);
                    }}
                    type="button"
                  >
                    {index + 1}
                    {isDoubtful && <span aria-hidden="true">!</span>}
                  </button>
                );
              })}
            </div>
            <div className={styles.questionLegend}>
              <span><i className={styles.legendUnanswered} />Belum dijawab</span>
              <span><i className={styles.legendAnswered} />Sudah dijawab</span>
              <span><i className={styles.legendActive} />Soal aktif</span>
              <span><i className={styles.legendDoubtful} />Ragu-ragu</span>
            </div>
          </section>
        </div>
      )}
      {violationWarningOpen && !examLocked && (
        <div className={styles.finishOverlay} role="presentation">
          <section
            aria-labelledby="violation-warning-title"
            aria-modal="true"
            className={styles.finishDialog}
            role="alertdialog"
          >
            <div className={styles.finishDialogIcon} aria-hidden="true">!</div>
            <h2 id="violation-warning-title">Peringatan pelanggaran pertama</h2>
            <p>{violationMessage}</p>
            <div className={styles.finishDialogActions}>
              <button
                className={styles.finishConfirmButton}
                onClick={() => setViolationWarningOpen(false)}
                type="button"
              >
                Saya mengerti
              </button>
            </div>
          </section>
        </div>
      )}
      {examLocked && (
        <div className={styles.finishOverlay} role="presentation">
          <section
            aria-labelledby="violation-locked-title"
            aria-modal="true"
            className={styles.finishDialog}
            role="alertdialog"
          >
            <div className={styles.finishDialogIcon} aria-hidden="true">!</div>
            <h2 id="violation-locked-title">Ujian dikunci</h2>
            <p>{violationMessage || "Pelanggaran kedua tercatat. Hubungi guru untuk membuka kunci ujian ini."}</p>
            <div className={styles.finishDialogActions}>
              <button
                className={styles.finishConfirmButton}
                onClick={() => {
                  const examId = new URLSearchParams(window.location.search).get("examId");
                  localStorage.removeItem("cbtStudent");
                  router.replace(`/cbt${examId ? `?examId=${encodeURIComponent(examId)}` : ""}`);
                }}
                type="button"
              >
                Keluar dari ujian
              </button>
            </div>
          </section>
        </div>
      )}
      {finishConfirmationOpen && (
        <div className={styles.finishOverlay} role="presentation">
          <section
            aria-labelledby="finish-title"
            aria-modal="true"
            className={styles.finishDialog}
            role="dialog"
          >
            <span className={styles.finishDialogIcon} aria-hidden="true">✓</span>
            <h2 id="finish-title">Selesaikan ujian?</h2>
            <p>
              Semua {questions.length} soal sudah dijawab dan tidak ada yang ditandai ragu-ragu.
              Jawaban Anda akan disimpan dan ujian diakhiri.
            </p>
            {submissionError && <p className={styles.submissionError} role="alert">{submissionError}</p>}
            <div className={styles.finishDialogActions}>
              <button
                className={styles.previousButton}
                disabled={savingSubmission}
                onClick={() => setFinishConfirmationOpen(false)}
                type="button"
              >
                Kembali mengerjakan
              </button>
              <button
                className={styles.finishConfirmButton}
                disabled={savingSubmission}
                onClick={() => void saveAndFinishExam()}
                type="button"
              >
                {savingSubmission ? "Menyimpan..." : "Simpan dan akhiri ujian"}
              </button>
            </div>
          </section>
        </div>
      )}
      {examFinished && (
        <div className={styles.finishOverlay} role="presentation">
          <section aria-labelledby="finished-title" className={styles.finishDialog} role="status">
            <span className={styles.finishDialogIcon} aria-hidden="true">✓</span>
            <h2 id="finished-title">Ujian selesai</h2>
            <p>{answeredCount} dari {questions.length} soal sudah dijawab.</p>
            <button
              className={styles.finishConfirmButton}
              onClick={() => router.push("/cbt")}
              type="button"
            >
              Kembali ke dashboard
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
