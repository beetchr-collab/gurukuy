/**
 * Contoh Implementasi Firebase Firestore
 * Path: app/ujian/docs/FIREBASE_SETUP.md
 *
 * Dokumentasi setup Firebase untuk CBT E-Ujian
 */

# 📡 Firebase Firestore Setup Guide

## 1. Instalasi Firebase

```bash
npm install firebase
# atau
yarn add firebase
```

## 2. Inisialisasi Firebase

Sudah ada di `lib/firebase.ts` (root project):

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

## 3. Environment Variables

File `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Firestore Collection Structure

### A. Collection: `bank_soal`

```
bank_soal/
├── {bankSoalId}/
│   ├── nama: string
│   ├── mapel: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── soal/ (subcollection)
│       ├── {soalId}/
│       │   ├── pertanyaan: string
│       │   ├── tipe: string (pilihan-ganda | pilihan-ganda-kompleks | menjodohkan | isian-singkat | essay)
│       │   ├── opsi: array
│       │   │   ├── id: string
│       │   │   └── teks: string
│       │   ├── pasangan: array (for menjodohkan)
│       │   │   ├── id: string
│       │   │   ├── kiri: string
│       │   │   └── kanan: string
│       │   ├── gambar: string (optional)
│       │   ├── jawabanBenar: string | array
│       │   ├── poin: number
│       │   ├── catatan: string (optional)
│       │   └── createdAt: timestamp
```

**Contoh Document:**

```javascript
{
  id: "soal-001",
  pertanyaan: "Berapakah 2 + 2?",
  tipe: "pilihan-ganda",
  opsi: [
    { id: "a", teks: "3" },
    { id: "b", teks: "4" },
    { id: "c", teks: "5" },
    { id: "d", teks: "6" }
  ],
  jawabanBenar: "b",
  poin: 10,
  catatan: "Soal mudah tentang penjumlahan",
  createdAt: timestamp
}
```

### B. Collection: `exam-sessions`

```
exam-sessions/
├── {sessionId}/
│   ├── id: string
│   ├── examId: string
│   ├── studentId: string
│   ├── studentName: string
│   ├── examName: string
│   ├── mapel: string
│   ├── token: string
│   ├── totalQuestions: number
│   ├── totalTime: number (in seconds)
│   ├── startTime: timestamp
│   ├── endTime: timestamp (optional)
│   ├── answers: array
│   │   ├── questionId: string
│   │   ├── jawaban: string | array | object
│   │   ├── status: string (belum-dijawab | sudah-dijawab | ragu-ragu)
│   │   └── timestamp: timestamp
│   ├── currentQuestion: number
│   ├── isOnline: boolean
│   ├── lastSeen: timestamp
│   ├── isDarkMode: boolean
│   ├── isFullscreen: boolean
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

**Contoh Document:**

```javascript
{
  id: "session-001",
  examId: "exam-001",
  studentId: "siswa-001",
  studentName: "Ahmad Reza Pratama",
  examName: "Ujian Tengah Semester Biologi",
  mapel: "Biologi",
  token: "TOKEN-2024-BIO-001",
  totalQuestions: 10,
  totalTime: 3600,
  startTime: timestamp,
  answers: [
    {
      questionId: "soal-1",
      jawaban: "b",
      status: "sudah-dijawab",
      timestamp: timestamp
    },
    {
      questionId: "soal-2",
      jawaban: ["a", "b", "d"],
      status: "sudah-dijawab",
      timestamp: timestamp
    }
  ],
  currentQuestion: 2,
  isOnline: true,
  lastSeen: timestamp,
  isDarkMode: false,
  isFullscreen: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### C. Collection: `ujian`

```
ujian/
├── {examId}/
│   ├── id: string
│   ├── nama: string
│   ├── mapel: string
│   ├── bankSoalId: string (reference to bank_soal)
│   ├── totalSoal: number
│   ├── durasi: number (in minutes)
│   ├── tanggalMulai: timestamp
│   ├── tanggalSelesai: timestamp
│   ├── status: string (draft | published | closed)
│   ├── createdBy: string (teacher ID)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

## 5. Implementasi Service Functions

### A. Fetch Questions

```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question } from '../types/exam';

export async function fetchQuestions(bankSoalId: string): Promise<Question[]> {
  try {
    const soalRef = collection(db, 'bank_soal', bankSoalId, 'soal');
    const snapshot = await getDocs(soalRef);
    
    const questions: Question[] = [];
    snapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      } as Question);
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
}
```

### B. Save Answers

```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StudentAnswer } from '../types/exam';

export async function saveAnswers(
  sessionId: string,
  answers: StudentAnswer[]
): Promise<void> {
  try {
    const docRef = doc(db, 'exam-sessions', sessionId);
    
    await updateDoc(docRef, {
      answers: answers,
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
    
    console.log('✓ Answers saved successfully');
  } catch (error) {
    console.error('Error saving answers:', error);
    throw error;
  }
}
```

### C. Submit Exam

```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExamSession, StudentAnswer } from '../types/exam';

export async function submitExam(
  session: ExamSession,
  answers: StudentAnswer[]
): Promise<void> {
  try {
    const docRef = doc(db, 'exam-sessions', session.id);
    
    await updateDoc(docRef, {
      endTime: serverTimestamp(),
      answers: answers,
      updatedAt: serverTimestamp(),
      status: 'submitted',
    });
    
    // TODO: Call scoring API
    const result = await scoreExam(session.id, answers);
    
    console.log('✓ Exam submitted:', result);
    return result;
  } catch (error) {
    console.error('Error submitting exam:', error);
    throw error;
  }
}
```

### D. Get Session

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExamSession } from '../types/exam';

export async function getSession(sessionId: string): Promise<ExamSession> {
  try {
    const docRef = doc(db, 'exam-sessions', sessionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Session not found');
    }
    
    return docSnap.data() as ExamSession;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}
```

## 6. Firestore Rules (Security)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Bank Soal - Read only untuk siswa
    match /bank_soal/{bankSoalId}/soal/{soalId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'teacher' || request.auth.token.role == 'admin';
    }
    
    // Exam Sessions - Siswa hanya bisa akses milik mereka
    match /exam_sessions/{sessionId} {
      allow read: if request.auth.uid == resource.data.studentId || request.auth.token.role == 'teacher' || request.auth.token.role == 'admin';
      allow create: if request.auth.uid == request.resource.data.studentId;
      allow update: if request.auth.uid == resource.data.studentId && !request.resource.data.endTime;
      allow delete: if request.auth.token.role == 'admin';
    }
    
    // Ujian - Public read
    match /ujian/{examId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'teacher' || request.auth.token.role == 'admin';
    }
  }
}
```

## 7. Indexes (untuk queries kompleks)

Di Firebase Console, buat index untuk:

```
Collection: exam_sessions
Fields:
  - studentId (Ascending)
  - startTime (Descending)
```

```
Collection: bank_soal
Fields:
  - mapel (Ascending)
  - createdAt (Descending)
```

## 8. Testing dengan Firebase Emulator (Optional)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulator
firebase emulators:start

# Connect di code
import { connectFirestoreEmulator } from 'firebase/firestore';

if (location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## 9. Monitoring & Analytics

```typescript
// Enable Analytics
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Log exam start
logEvent(analytics, 'exam_started', {
  exam_id: session.examId,
  exam_name: session.examName,
  student_id: session.studentId,
});

// Log exam submitted
logEvent(analytics, 'exam_submitted', {
  exam_id: session.examId,
  total_time: Date.now() - session.startTime,
});
```

## 10. Troubleshooting

### Permission Denied
- Pastikan user authenticated
- Check Firestore Security Rules
- Verify token role/claims

### Data Not Saved
- Check network connection
- Verify offline persistence enabled
- Check local storage fallback

### Slow Performance
- Enable indexes
- Limit query scope
- Use pagination

---

**Dokumentasi lengkap Firebase:**
https://firebase.google.com/docs/firestore
