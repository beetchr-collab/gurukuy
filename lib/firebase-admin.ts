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
import { getAuth, type Auth } from "firebase-admin/auth";

function getFirebaseAdminApp(): App {
  const appName = "gurukuy-admin";
  const existingApp = getApps().find((app) => app.name === appName);

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

  const normalizedPrivateKey = privateKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\+([rn])/g, (_match, escapedChar: string) =>
      escapedChar === "n" ? "\n" : "\r"
    );

  if (
    !normalizedPrivateKey.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !normalizedPrivateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY bukan private key PEM yang valid. Pastikan nilainya mencakup header dan footer PEM."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: normalizedPrivateKey,
    }),
  }, appName);
}

export function initializeFirebaseAdmin(): void {
  const app = getFirebaseAdminApp();
  getFirestore(app);
  getAuth(app);
}

export const adminDb = new Proxy({} as Firestore, {
  get(_target, property) {
    const firestore = getFirestore(getFirebaseAdminApp());
    const value = Reflect.get(firestore, property, firestore);
    return typeof value === "function" ? value.bind(firestore) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, property) {
    const auth = getAuth(getFirebaseAdminApp());
    const value = Reflect.get(auth, property, auth);
    return typeof value === "function" ? value.bind(auth) : value;
  },
});