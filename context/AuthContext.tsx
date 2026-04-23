"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserData = {
  uid: string;
  email: string | null;
  role: "admin" | "guru" | "siswa";
  username?: string;
  photo?: string; // ✅ tambahkan ini
};

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // ambil data user di firestore
      const docRef = doc(db, "users", firebaseUser.uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const rawPhoto = firebaseUser.photoURL || data.photo || null;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: data.role,
          username: data.username,
          photo: rawPhoto
            ? rawPhoto.replace(/"/g, '') + '?sz=100'
            : 'node_modules/admin-lte/dist/assest/img/default-avatar.png', //menghapus tanda kutip
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
