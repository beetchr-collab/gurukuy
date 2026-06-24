/**
 * Firebase Service untuk CBT E-Ujian
 * Path: app/ujian/services/firebase.ts
 *
 * Menyediakan fungsi-fungsi:
 * - Fetch soal dari Firestore
 * - Save jawaban ke Firestore
 * - Get session data
 * - Submit ujian
 *
 * TODO: Implementasi Firebase Firestore
 * Saat ini menggunakan mock data
 */

import { ExamSession, StudentAnswer, Question } from '../types/exam';

/**
 * Fetch soal dari Firestore
 * @param bankSoalId ID bank soal
 * @returns Array soal
 */
export async function fetchQuestionsFromFirestore(bankSoalId: string): Promise<Question[]> {
  try {
    // TODO: Implementasi Firebase Firestore
    // const docRef = collection(db, 'bank_soal');
    // const q = query(docRef, where('id', '==', bankSoalId));
    // const snapshot = await getDocs(q);

    // Simulasi delay API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return dummy data
    console.log(`Fetching questions for bank soal: ${bankSoalId}`);
    return [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}

/**
 * Save jawaban ke Firestore
 * @param sessionId Session ID
 * @param answers Array jawaban siswa
 */
export async function saveAnswersToFirestore(sessionId: string, answers: StudentAnswer[]): Promise<void> {
  try {
    // TODO: Implementasi Firebase Firestore
    // const docRef = doc(db, 'exam-sessions', sessionId);
    // await updateDoc(docRef, {
    //   answers: answers,
    //   updatedAt: serverTimestamp(),
    //   lastSeen: serverTimestamp(),
    // });

    console.log(`Saving ${answers.length} answers for session: ${sessionId}`);
  } catch (error) {
    console.error('Error saving answers:', error);
    throw error;
  }
}

/**
 * Get session data dari Firestore
 * @param sessionId Session ID
 * @returns ExamSession
 */
export async function getSessionFromFirestore(sessionId: string): Promise<ExamSession> {
  try {
    // TODO: Implementasi Firebase Firestore
    // const docRef = doc(db, 'exam-sessions', sessionId);
    // const docSnap = await getDoc(docRef);
    // return docSnap.data() as ExamSession;

    throw new Error('Session not found');
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}

/**
 * Submit ujian ke server
 * @param sessionId Session ID
 * @param answers Array jawaban siswa
 */
export async function submitExamToServer(
  sessionId: string,
  answers: StudentAnswer[]
): Promise<{ score: number; feedback: string }> {
  try {
    // TODO: Implementasi API submit ujian
    // const response = await fetch('/api/exam/submit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ sessionId, answers }),
    // });
    // return await response.json();

    console.log(`Submitting exam session: ${sessionId}`);
    return {
      score: 85,
      feedback: 'Ujian berhasil dikumpulkan',
    };
  } catch (error) {
    console.error('Error submitting exam:', error);
    throw error;
  }
}

/**
 * Update status online
 * @param sessionId Session ID
 * @param isOnline Status online
 */
export async function updateOnlineStatus(sessionId: string, isOnline: boolean): Promise<void> {
  try {
    // TODO: Implementasi Firebase Firestore
    // const docRef = doc(db, 'exam-sessions', sessionId);
    // await updateDoc(docRef, {
    //   isOnline: isOnline,
    //   lastSeen: serverTimestamp(),
    // });

    console.log(`Updating online status for session ${sessionId}: ${isOnline}`);
  } catch (error) {
    console.error('Error updating online status:', error);
  }
}

/**
 * Save current question
 * @param sessionId Session ID
 * @param currentQuestion Nomor soal saat ini
 */
export async function saveCurrentQuestion(sessionId: string, currentQuestion: number): Promise<void> {
  try {
    // TODO: Implementasi Firebase Firestore
    // const docRef = doc(db, 'exam-sessions', sessionId);
    // await updateDoc(docRef, {
    //   currentQuestion: currentQuestion,
    //   lastSeen: serverTimestamp(),
    // });

    console.log(`Saving current question ${currentQuestion} for session: ${sessionId}`);
  } catch (error) {
    console.error('Error saving current question:', error);
  }
}
