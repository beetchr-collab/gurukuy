import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserData {
  uid: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "guru" | "siswa";
  schoolId?: string;
  ownerId?: string;
  kodeSekolah?: string;
  photo?: string;
  status?: string;
  nip?: string;
  mapel?: string;
  jenjang?: string;
  jenisKelamin?: string;
  alamat?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  lastActive?: Timestamp;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<UserData, "uid">),
    }));
  } catch (error) {
    console.error("Error mengambil data users:", error);
    return [];
  }
}

export async function deleteUser(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function updateUserRole(
  uid: string,
  role: "superadmin" | "admin" | "guru" | "siswa"
) {
  await updateDoc(doc(db, "users", uid), {
    role,
  });
}