/**
 * API Route: Fetch Soal Ujian
 * Path: app/api/exam/questions/route.ts
 * 
 * Fungsi:
 * - Ambil soal dari bank soal tertentu
 * - Support filter by token untuk keamanan
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bankSoalId = searchParams.get('bankSoalId') || searchParams.get('examId');
    const token = searchParams.get('token');

    console.log('GET /api/exam/questions', { bankSoalId, token });

    // Validasi input
    if (!bankSoalId) {
      return NextResponse.json(
        { success: false, error: 'bankSoalId atau examId harus diisi' },
        { status: 400 }
      );
    }

    // Ambil data bank soal
    const bankSoalRef = doc(db, 'bank_soal', bankSoalId);
    const bankSoalSnap = await getDoc(bankSoalRef);

    if (!bankSoalSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Bank soal tidak ditemukan' },
        { status: 404 }
      );
    }

    const bankSoalData = bankSoalSnap.data();

    // Validasi token jika disediakan (case-insensitive)
    if (token) {
      const storedToken = String(bankSoalData.token || bankSoalData.Token || '').toUpperCase().trim();
      const providedToken = String(token || '').toUpperCase().trim();
      if (!storedToken || storedToken !== providedToken) {
        return NextResponse.json({ success: false, error: 'Token tidak cocok' }, { status: 403 });
      }
    }

    // Validasi exam status (toleransi nama field dan case)
    const examStatus = String(bankSoalData.examStatus || bankSoalData.status || bankSoalData.Status || '').toLowerCase();
    if (!/mulai|aktif|started/.test(examStatus)) {
      return NextResponse.json({ success: false, error: 'Ujian tidak sedang berlangsung' }, { status: 403 });
    }

    // Ambil soal dari subcollection 'soal'
    const questionsSnapshot = await getDocs(
      collection(db, 'bank_soal', bankSoalId, 'soal')
    );

    const questions: any[] = [];

    questionsSnapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort berdasarkan urutan (order field) jika ada
    questions.sort((a, b) => {
      const orderA = a.order || a.urutan || 999;
      const orderB = b.order || b.urutan || 999;
      return orderA - orderB;
    });

    return NextResponse.json({
      success: true,
      data: {
        examId: bankSoalId,
        examName: bankSoalData.name || bankSoalData.examName || '',
        mapel: bankSoalData.mapel || bankSoalData.subject || '',
        totalTime: bankSoalData.totalTime || bankSoalData.durasi || 3600,
        questions: questions,
        totalQuestions: questions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
