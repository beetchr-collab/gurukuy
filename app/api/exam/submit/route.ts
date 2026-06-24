/**
 * Contoh API Endpoint untuk Submit Ujian
 * Path: app/api/exam/submit/route.ts
 *
 * Endpoint untuk submit dan scoring ujian
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExamSession, StudentAnswer } from '@/app/cbt/types/exam';

/**
 * POST /api/exam/submit
 * Submit ujian dan hitung score
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answers, questions } = body as {
      sessionId: string;
      answers: StudentAnswer[];
      questions: any[];
    };

    // Validasi input
    if (!sessionId || !answers || !questions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Hitung score
    const result = calculateScore(answers, questions);

    // TODO: Simpan hasil ke database
    // await saveExamResult(sessionId, result);

    return NextResponse.json(
      {
        success: true,
        sessionId,
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        feedback: result.feedback,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function untuk hitung score
 */
function calculateScore(
  answers: StudentAnswer[],
  questions: any[]
) {
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  questions.forEach((question) => {
    const studentAnswer = answers.find((a) => a.questionId === question.id);
    totalPoints += question.poin;

    if (!studentAnswer || studentAnswer.status === 'belum-dijawab') {
      wrongAnswers++;
      return;
    }

    const isCorrect = checkAnswer(
      studentAnswer.jawaban,
      question.jawabanBenar,
      question.tipe
    );

    if (isCorrect) {
      correctAnswers++;
      earnedPoints += question.poin;
    } else {
      wrongAnswers++;
    }
  });

  const percentage = Math.round((earnedPoints / totalPoints) * 100);
  const feedback = getFeedback(percentage);

  return {
    score: earnedPoints,
    totalPoints,
    percentage,
    correctAnswers,
    wrongAnswers,
    feedback,
  };
}

/**
 * Helper function untuk cek jawaban
 */
function checkAnswer(
  studentAnswer: any,
  correctAnswer: any,
  questionType: string
): boolean {
  switch (questionType) {
    case 'pilihan-ganda':
      return studentAnswer === correctAnswer;

    case 'pilihan-ganda-kompleks':
      if (!Array.isArray(studentAnswer) || !Array.isArray(correctAnswer)) {
        return false;
      }
      // Cek jika semua jawaban benar (order tidak penting)
      return (
        studentAnswer.length === correctAnswer.length &&
        studentAnswer.every((ans) => correctAnswer.includes(ans))
      );

    case 'isian-singkat':
      // Case insensitive, trim whitespace
      return (
        (studentAnswer || '').trim().toLowerCase() ===
        (correctAnswer || '').trim().toLowerCase()
      );

    case 'menjodohkan':
      // Cek semua pasangan
      return Object.entries(studentAnswer).every(([key, value]) => {
        return correctAnswer[key] === value;
      });

    case 'essay':
      // Essay di-grade manual, always return true untuk automated scoring
      return true;

    default:
      return false;
  }
}

/**
 * Helper function untuk feedback berdasarkan score
 */
function getFeedback(percentage: number): string {
  if (percentage >= 90) return 'Luar biasa! Skor sempurna.';
  if (percentage >= 80) return 'Sangat baik! Pertahankan prestasi.';
  if (percentage >= 70) return 'Baik! Coba tingkatkan lagi.';
  if (percentage >= 60) return 'Cukup. Lebih banyak belajar diperlukan.';
  return 'Perlu banyak perbaikan. Belajar lebih giat lagi.';
}

/**
 * GET /api/exam/[sessionId]
 * Get exam result by session ID
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.pathname.split('/').pop();

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  try {
    // TODO: Fetch dari database
    // const result = await getExamResult(sessionId);

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          // ...result
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting exam result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
