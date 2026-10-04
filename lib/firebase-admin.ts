import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

function getFirebaseAdminApp(): App {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    throw new Error(
      "FIREBASE_PROJECT_ID belum dikonfigurasi."
    );
  }

  if (!clientEmail) {
    throw new Error(
      "FIREBASE_CLIENT_EMAIL belum dikonfigurasi."
    );
  }

  if (!privateKey) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY belum dikonfigurasi."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const adminApp = getFirebaseAdminApp();

export const adminDb: Firestore =
  getFirestore(adminApp);