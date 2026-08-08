"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

type UserData = {
  uid: string;
  email: string | null;
  role: "superadmin" | "admin" | "guru" | "siswa";
  username?: string;
  photo?: string;
  ownerId?: string;
  schoolId?: string;
};

type AuthContextType = {
  user: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AUTO_LOGOUT_MS = 60 * 60 * 1000; // 1 jam

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

const setLastActivity = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("lastActivity", Date.now().toString());
};

const clearLastActivity = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("lastActivity");
};

const getLastActivity = () => {
  if (typeof window === "undefined") return Date.now();
  return Number(window.localStorage.getItem("lastActivity") || Date.now().toString());
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("AuthContext: logout failed", error);
    } finally {
      setUser(null);
      setLoading(false);
      clearLastActivity();
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const normalizeRole = (value: any) => {
      const normalized = String(value || "").trim().toLowerCase();
      return ['superadmin', 'admin', 'guru', 'siswa'].includes(normalized)
        ? (normalized as UserData['role'])
        : null;
    };

    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        clearLastActivity();
        return;
      }

      const docRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const rawPhoto = firebaseUser.photoURL || data.photo || null;
        const role = normalizeRole(data.role);

        if (role) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role,
            username: data.username,
            photo: rawPhoto
              ? rawPhoto.replace(/"/g, '') + '?sz=100'
              : 'node_modules/admin-lte/dist/assest/img/default-avatar.png',
            ownerId: data.ownerId,
            schoolId: data?.schoolId,
          });
          setLastActivity();
        } else {
          console.warn('AuthContext: role tidak valid untuk user', firebaseUser.uid, data.role);
          setUser(null);
          clearLastActivity();
        }
      } else {
        setUser(null);
        clearLastActivity();
      }

      setLoading(false);
    });

    return () => unsub();
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    setLastActivity();

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
    ];

    const handleActivity = () => {
      setLastActivity();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    const intervalId = window.setInterval(() => {
      if (Date.now() - getLastActivity() >= AUTO_LOGOUT_MS) {
        logout();
      }
    }, 60000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      window.clearInterval(intervalId);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
