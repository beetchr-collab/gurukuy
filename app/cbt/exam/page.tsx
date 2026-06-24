/**
 * Halaman CBT/E-Ujian Siswa - Main Page
 * Path: app/ujian/page.tsx
 *
 * Fitur:
 * - Layout responsive dengan sidebar navigasi soal
 * - Timer countdown realtime dengan status warning/danger
 * - Autosave jawaban ke Firestore
 * - Support 5 tipe soal dengan UI dinamis
 * - Status koneksi realtime
 * - Fullscreen mode
 * - Dark mode support
 * - Loading skeleton
 * - Konfirmasi selesai ujian
 *
 * Tech Stack:
 * - Next.js 15+ App Router
 * - TypeScript
 * - Bootstrap 5
 * - Firebase Firestore (mock)
 * - Custom Hooks
 * - Client Component
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  TimerBox,
  ExamHeader,
  QuestionSidebar,
  QuestionCard,
  QuestionNavigation,
  ExamPageSkeleton,
} from '../components';
import {
  useTimer,
  useExam,
  useAutoSave,
  useConnectionStatus,
  useDocumentVisibility,
} from '../hooks';
import { ExamSession, Question } from '../types/exam';
import { DUMMY_EXAM_SESSION, DUMMY_QUESTIONS } from '../utils/dummy-data';
import { MESSAGES, STORAGE_KEYS } from '../utils/constants';
import { saveToLocalStorage, getFromLocalStorage, requestFullscreen, exitFullscreen, isFullscreenSupported } from '../utils/helpers';

/**
 * Main Component - CBT E-Ujian Page
 */
const UjianPage = () => {
  // ========================
  // STATE & INITIALIZATION
  // ========================

  // Query params
  const [queryParams, setQueryParams] = useState<{
    token?: string;
    examId?: string;
  }>({});

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam data
  const [initialSession, setInitialSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // ========================
  // GET QUERY PARAMS
  // ========================

  useEffect(() => {
    // Get query params dari URL
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const examId = searchParams.get('examId');

    setQueryParams({
      token: token || undefined,
      examId: examId || undefined,
    });
  }, []);

  // ========================
  // INITIALIZE DATA
  // ========================

  useEffect(() => {
    const initializeExam = async () => {
      try {
        const token = queryParams.token;
        const examId = queryParams.examId;

        // Jika ada token, fetch soal dari API
        if (token && examId) {
          // Fetch soal berdasarkan token dan examId
          const response = await fetch(
            `/api/exam/questions?bankSoalId=${examId}&token=${token}`
          );

          const result = await response.json();

          if (!result.success) {
            throw new Error(
              result.error || 'Gagal memuat soal ujian'
            );
          }

          // Ambil data peserta dari localStorage
          const pesertaData = getFromLocalStorage<any>(
            'peserta_ujian'
          );
          const examData = getFromLocalStorage<any>(
            'exam_data'
          );

          // Buat session baru
          const newSession: ExamSession = {
            id: `exam_${Date.now()}`,
            examId: examId || '',
            studentId: pesertaData?.nisn || '',
            studentName: pesertaData?.nama || '',
            examName: result.data.examName,
            mapel: result.data.mapel,
            token: token,
            totalQuestions: result.data.questions.length,
            totalTime: result.data.totalTime,
            startTime: Date.now(),
            currentQuestion: 0,
            answers: [],
            isOnline: true,
            isDarkMode: false,
            isFullscreen: false,
            lastSeen: Date.now(),
          };

          setInitialSession(newSession);
          setQuestions(result.data.questions);

          // Simpan ke localStorage
          saveToLocalStorage(
            STORAGE_KEYS.EXAM_SESSION,
            newSession
          );

          setIsLoading(false);
        } else {
          // Fallback: Load dari localStorage (untuk resume)
          const savedSession = getFromLocalStorage<ExamSession>(
            STORAGE_KEYS.EXAM_SESSION
          );

          if (savedSession) {
            setInitialSession(savedSession);
            // TODO: Fetch soal dari localStorage atau API
            setQuestions([]);
            setIsLoading(false);
          } else {
            // Jika tidak ada session, redirect ke beranda
            window.location.href = '/ujian/beranda';
          }
        }
      } catch (err) {
        console.error('Error initializing exam:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat data ujian. Silakan refresh halaman.'
        );
        setIsLoading(false);
      }
    };

    if (Object.keys(queryParams).length > 0) {
      initializeExam();
    }
  }, [queryParams]);

  // ========================
  // HOOKS
  // ========================

  // Timer hook - mengelola countdown
  const timer = useTimer({
    totalTime: initialSession?.totalTime || 3600,
    isActive: !isLoading,
    onTimeExpired: () => {
      showToast('Waktu ujian telah habis! Sistem akan otomatis mengumpulkan ujian.', 'error');
      setTimeout(() => handleFinishExam(), 2000);
    },
  });

  // Exam hook - mengelola state ujian
  const exam = useExam({
    initialSession: initialSession || DUMMY_EXAM_SESSION,
    questions,
    onSessionUpdate: (session) => {
      saveToLocalStorage(STORAGE_KEYS.EXAM_SESSION, session);
    },
  });

  // AutoSave hook - simpan jawaban otomatis
  useAutoSave({
    answers: exam.answers,
    sessionId: exam.session.id,
    onSaveSuccess: (message) => {
      showToast(message, 'success');
    },
    onSaveError: (error) => {
      console.error('Autosave error:', error);
      // showToast(error.message, 'error');
    },
  });

  // Connection status hook
  const connectionStatus = useConnectionStatus();

  // Document visibility hook - deteksi jika user meninggalkan tab
  const isVisible = useDocumentVisibility();

  // ========================
  // EVENT HANDLERS
  // ========================

  /**
   * Handle perubahan jawaban
   */
  const handleAnswerChange = useCallback(
    (jawaban: any) => {
      exam.updateAnswer(exam.currentQuestion.id, jawaban);
    },
    [exam]
  );

  /**
   * Handle tandai ragu-ragu
   */
  const handleMarkUnsure = useCallback(() => {
    exam.markUnsure(exam.currentQuestion.id);
    showToast('Soal ditandai sebagai ragu-ragu', 'info');
  }, [exam]);

  /**
   * Handle soal sebelumnya
   */
  const handlePreviousQuestion = useCallback(() => {
    exam.goToPreviousQuestion();
  }, [exam]);

  /**
   * Handle soal selanjutnya
   */
  const handleNextQuestion = useCallback(() => {
    exam.goToNextQuestion();
  }, [exam]);

  /**
   * Handle pilih soal dari sidebar
   */
  const handleSelectQuestion = useCallback(
    (index: number) => {
      exam.goToQuestion(index);
    },
    [exam]
  );

  /**
   * Handle finish exam
   */
  const handleFinishExam = useCallback(async () => {
    try {
      // Simpan session akhir
      const finalSession: ExamSession = {
        ...exam.session,
        endTime: Date.now(),
        answers: exam.answers,
      };

      saveToLocalStorage(STORAGE_KEYS.EXAM_SESSION, finalSession);

      // TODO: Kirim hasil ujian ke server
      console.log('Ujian selesai:', finalSession);

      showToast('Ujian berhasil dikumpulkan!', 'success');

      // Redirect ke halaman hasil (nanti)
      setTimeout(() => {
        window.location.href = '/ujian/hasil';
      }, 2000);
    } catch (err) {
      console.error('Error finishing exam:', err);
      showToast('Gagal mengumpulkan ujian', 'error');
    }
  }, [exam.session, exam.answers]);

  /**
   * Handle toggle dark mode
   */
  const handleToggleDarkMode = useCallback(() => {
    exam.toggleDarkMode();
    saveToLocalStorage(STORAGE_KEYS.DARK_MODE, exam.session.isDarkMode);
  }, [exam]);

  /**
   * Handle toggle fullscreen
   */
  const handleToggleFullscreen = useCallback(async () => {
    if (!isFullscreenSupported()) {
      showToast(MESSAGES.FULLSCREEN_NOT_SUPPORTED, 'error');
      return;
    }

    try {
      if (!exam.session.isFullscreen) {
        // Enter fullscreen
        const elem = document.documentElement;
        await requestFullscreen(elem);
        exam.toggleFullscreen();
      } else {
        // Exit fullscreen
        await exitFullscreen();
        exam.toggleFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [exam]);

  /**
   * Update online status
   */
  useEffect(() => {
    exam.setOnlineStatus(connectionStatus.isOnline);
  }, [connectionStatus.isOnline, exam]);

  /**
   * Deteksi jika user meninggalkan tab (warning)
   */
  useEffect(() => {
    if (!isVisible) {
      console.warn('User left the exam tab!');
      // TODO: Implementasi warning atau pause timer
    }
  }, [isVisible]);

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ========================
  // ERROR STATE
  // ========================

  if (error) {
    return (
      <div className={`d-flex align-items-center justify-content-center min-vh-100 ${exam.session.isDarkMode ? 'bg-dark' : 'bg-light'}`}>
        <div className="text-center">
          <h2 className={exam.session.isDarkMode ? 'text-white' : ''}>⚠️ Error</h2>
          <p className={exam.session.isDarkMode ? 'text-muted' : 'text-muted'}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise me-2" />
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  // ========================
  // LOADING STATE
  // ========================

  if (isLoading || !initialSession) {
    return <ExamPageSkeleton isDarkMode={exam.session.isDarkMode} />;
  }

  // ========================
  // RENDER
  // ========================

  return (
    <div
      className={`d-flex flex-column h-100 ${
        exam.session.isDarkMode ? 'bg-dark' : 'bg-light'
      }`}
    >
      {/* Timer Box */}
      <TimerBox
        timer={timer}
        connectionStatus={connectionStatus}
        isDarkMode={exam.session.isDarkMode}
        isFullscreen={exam.session.isFullscreen}
        onFullscreenClick={handleToggleFullscreen}
      />

      {/* Exam Header */}
      <ExamHeader session={exam.session} isDarkMode={exam.session.isDarkMode} />

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Sidebar Navigasi Soal (Desktop Only) */}
        <div
          className={`d-none d-lg-block border-end ${
            exam.session.isDarkMode ? 'border-secondary' : ''
          }`}
          style={{
            width: '250px',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <QuestionSidebar
            questions={questions}
            answers={exam.answers}
            currentQuestionIndex={exam.questionIndex}
            onQuestionSelect={handleSelectQuestion}
            isDarkMode={exam.session.isDarkMode}
          />
        </div>

        {/* Main Content - Soal */}
        <div
          className="flex-grow-1 p-3 p-md-4"
          style={{
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          <div className="container-fluid">
            {exam.currentQuestion && (
              <QuestionCard
                question={exam.currentQuestion}
                questionIndex={exam.questionIndex}
                currentAnswer={exam.answers.find((a) => a.questionId === exam.currentQuestion.id)}
                isDarkMode={exam.session.isDarkMode}
                onAnswerChange={handleAnswerChange}
                onMarkUnsure={handleMarkUnsure}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar (Horizontal Scroll) */}
      <div className="d-lg-none border-top" style={{ maxHeight: '120px', overflowX: 'auto' }}>
        <QuestionSidebar
          questions={questions}
          answers={exam.answers}
          currentQuestionIndex={exam.questionIndex}
          onQuestionSelect={handleSelectQuestion}
          isDarkMode={exam.session.isDarkMode}
        />
      </div>

      {/* Navigation */}
      <QuestionNavigation
        questionIndex={exam.questionIndex}
        totalQuestions={questions.length}
        hasNext={exam.hasNextQuestion}
        hasPrevious={exam.hasPreviousQuestion}
        isMarkedUnsure={
          exam.answers.find((a) => a.questionId === exam.currentQuestion.id)?.status === 'ragu-ragu'
        }
        onPrevious={handlePreviousQuestion}
        onNext={handleNextQuestion}
        onMarkUnsure={handleMarkUnsure}
        onFinish={handleFinishExam}
        isDarkMode={exam.session.isDarkMode}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast show align-items-center text-white border-0 rounded-3 shadow-lg`}
            role="alert"
            style={{
              backgroundColor:
                toast.type === 'success'
                  ? '#198754'
                  : toast.type === 'error'
                  ? '#dc3545'
                  : '#0dcaf0',
            }}
          >
            <div className="d-flex">
              <div className="toast-body">
                <i
                  className={`bi bi-${
                    toast.type === 'success'
                      ? 'check-circle'
                      : toast.type === 'error'
                      ? 'exclamation-circle'
                      : 'info-circle'
                  } me-2`}
                />
                {toast.message}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Warning jika offline */}
      {!connectionStatus.isOnline && (
        <div className="position-fixed top-0 start-0 w-100 p-2">
          <div className="alert alert-danger mb-0 rounded-3">
            <i className="bi bi-wifi-off me-2" />
            Koneksi internet terputus. Data akan disimpan saat koneksi kembali.
          </div>
        </div>
      )}
    </div>
  );
};

export default UjianPage;
