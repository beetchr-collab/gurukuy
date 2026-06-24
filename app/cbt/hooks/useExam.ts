/**
 * Custom Hook untuk Mengelola Session Ujian
 * Menangani state ujian, jawaban, dan navigasi soal
 */

import { useCallback, useEffect, useState } from 'react';
import { StudentAnswer, ExamSession, Question, AnswerStatus } from '../types/exam';
import { validateAnswer } from '../utils/helpers';

interface UseExamProps {
  initialSession: ExamSession;
  questions: Question[];
  onSessionUpdate?: (session: ExamSession) => void;
}

/**
 * Hook untuk mengelola state ujian
 */
export const useExam = ({ initialSession, questions, onSessionUpdate }: UseExamProps) => {
  const [session, setSession] = useState<ExamSession>(initialSession);
  const [answers, setAnswers] = useState<StudentAnswer[]>(initialSession.answers);

  // Update jawaban untuk soal tertentu
  const updateAnswer = useCallback(
    (questionId: string, jawaban: any, status: AnswerStatus = 'sudah-dijawab') => {
      setAnswers((prev) => {
        const existingIndex = prev.findIndex((a) => a.questionId === questionId);
        const newAnswer: StudentAnswer = {
          questionId,
          jawaban,
          status,
          timestamp: Date.now(),
        };

        let updated: StudentAnswer[];
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = newAnswer;
        } else {
          updated = [...prev, newAnswer];
        }

        // Validate jawaban
        const question = questions.find((q) => q.id === questionId);
        if (question && !validateAnswer(jawaban, question) && status === 'sudah-dijawab') {
          // Jika jawaban tidak valid, ubah status ke belum dijawab
          newAnswer.status = 'belum-dijawab';
        }

        return updated;
      });

      // Update session
      setSession((prev) => ({
        ...prev,
        answers: answers,
        lastSeen: Date.now(),
      }));

      onSessionUpdate?.({ ...session, answers });
    },
    [answers, questions, session, onSessionUpdate]
  );

  // Tandai soal sebagai ragu-ragu
  const markUnsure = useCallback(
    (questionId: string) => {
      const existingAnswer = answers.find((a) => a.questionId === questionId);
      if (existingAnswer) {
        updateAnswer(questionId, existingAnswer.jawaban, 'ragu-ragu');
      } else {
        setAnswers((prev) => [
          ...prev,
          {
            questionId,
            jawaban: '',
            status: 'ragu-ragu',
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [answers, updateAnswer]
  );

  // Pindah ke soal sebelumnya
  const goToPreviousQuestion = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentQuestion: Math.max(0, prev.currentQuestion - 1),
      lastSeen: Date.now(),
    }));
  }, []);

  // Pindah ke soal selanjutnya
  const goToNextQuestion = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentQuestion: Math.min(questions.length - 1, prev.currentQuestion + 1),
      lastSeen: Date.now(),
    }));
  }, [questions.length]);

  // Pindah ke soal tertentu
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setSession((prev) => ({
        ...prev,
        currentQuestion: index,
        lastSeen: Date.now(),
      }));
    }
  }, [questions.length]);

  // Cek apakah ada soal selanjutnya
  const hasNextQuestion = useCallback(
    () => session.currentQuestion < questions.length - 1,
    [session.currentQuestion, questions.length]
  );

  // Cek apakah ada soal sebelumnya
  const hasPreviousQuestion = useCallback(() => session.currentQuestion > 0, [session.currentQuestion]);

  // Update status online/offline
  const setOnlineStatus = useCallback((isOnline: boolean) => {
    setSession((prev) => ({
      ...prev,
      isOnline,
      lastSeen: Date.now(),
    }));
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isDarkMode: !prev.isDarkMode,
    }));
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
    }));
  }, []);

  return {
    session,
    answers,
    currentQuestion: questions[session.currentQuestion],
    questionIndex: session.currentQuestion,
    updateAnswer,
    markUnsure,
    goToPreviousQuestion,
    goToNextQuestion,
    goToQuestion,
    hasNextQuestion: hasNextQuestion(),
    hasPreviousQuestion: hasPreviousQuestion(),
    setOnlineStatus,
    toggleDarkMode,
    toggleFullscreen,
  };
};
