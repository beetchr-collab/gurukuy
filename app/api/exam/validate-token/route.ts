/**
 * API Route: Validasi Token Ujian
 * Path: app/api/exam/validate-token/route.ts
 * 
 * Fungsi:
 * - Validasi token ujian
 * - Ambil data bank soal berdasarkan token
 * - Kembalikan exam details untuk initialize exam session
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokenRaw = body?.token;

    // Validasi input
    if (!tokenRaw || (typeof tokenRaw !== 'string' && typeof tokenRaw !== 'number')) {
      return NextResponse.json({ success: false, error: 'Token harus diisi' }, { status: 400 });
    }

    const token = String(tokenRaw).toUpperCase().trim();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token tidak boleh kosong' }, { status: 400 });
    }

    console.log('POST /api/exam/validate-token', { token });

    // Query bank_soal dengan token (cari exact match)
    const q = query(collection(db, 'bank_soal'), where('token', '==', token), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: 'Token tidak valid' }, { status: 404 });
    }

    const examDoc = snapshot.docs[0];
    // Gunakan any untuk data dari Firestore agar lebih fleksibel
    const rawData: any = examDoc.data();
    const examData: any = { id: examDoc.id, ...rawData };

    // Normalisasi status/flag yang mungkin memakai nama berbeda
    const statusRaw = String(examData.status || examData.Status || examData.examStatus || '').toLowerCase();
    const isActive = /aktif|aktifkan|active/.test(statusRaw) || /mulai|started/.test(statusRaw);
    console.log('validate-token document', { examId: examData.id, statusRaw, isActive });

    if (!isActive) {
      return NextResponse.json({ success: false, error: 'Ujian belum aktif atau belum mulai' }, { status: 403 });
    }

    const allowAccess = examData.allowAccess === undefined ? true : Boolean(examData.allowAccess);
    if (!allowAccess) {
      return NextResponse.json({ success: false, error: 'Akses ke ujian ditolak' }, { status: 403 });
    }

    // Cek waktu mulai / selesai apabila tersedia
    const parseTimestamp = (ts: any): Date | null => {
      if (!ts) return null;
      // Firestore Timestamp object
      if (typeof ts === 'object' && (ts.seconds || ts._seconds)) {
        const seconds = ts.seconds ?? ts._seconds;
        return new Date(seconds * 1000);
      }
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    };

    const startedAt = parseTimestamp(examData.startedAt || examData.startTime || examData.started_at);
    // durasi mungkin disimpan dalam menit (durasi) atau detik (totalTime)
    const durationSeconds =
      Number(examData.totalTime) || (Number(examData.durasi) ? Number(examData.durasi) * 60 : null) || null;

    const now = new Date();
    if (startedAt && durationSeconds) {
      const endTime = new Date(startedAt.getTime() + durationSeconds * 1000);
      if (now < startedAt) {
        return NextResponse.json({ success: false, error: 'Ujian belum dimulai' }, { status: 403 });
      }
      if (now > endTime) {
        return NextResponse.json({ success: false, error: 'Waktu ujian telah berakhir' }, { status: 403 });
      }
    }

    // Prepare response data konsisten dengan frontend
    const resp = {
      examId: examData.id,
      examName: examData.namaBankSoal || examData.name || examData.examName || examData.nama || '',
      mapel: examData.mataPelajaran || examData.mapel || examData.subject || '',
      totalTime: durationSeconds || Number(examData.totalTime) || (Number(examData.durasi) ? Number(examData.durasi) * 60 : 3600),
      totalQuestions: Number(examData.totalQuestions) || Number(examData.jumlahSoal) || (Array.isArray(rawData?.soal) ? rawData.soal.length : 0),
      bankSoalId: examData.id,
      token,
      startedAt: startedAt ? startedAt.toISOString() : null,
      raw: rawData,
    };

    return NextResponse.json({ success: true, data: resp }, { status: 200 });
  } catch (error) {
    console.error('Error validating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
