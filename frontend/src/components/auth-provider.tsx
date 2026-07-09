"use client";

import { browserLocalPersistence, onAuthStateChanged, setPersistence, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/firebase/firebase";
import { signInWithEmailPassword, signOutUser } from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: typeof signInWithEmailPassword;
  logout: typeof signOutUser;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize persistence and mount state listener
  useEffect(() => {
    // Proactively purge old local storage bypass user data
    if (typeof window !== "undefined") {
      localStorage.removeItem("mock_admin_user");
    }

    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    void setPersistence(auth, browserLocalPersistence)
      .catch((err) => {
        console.error("Firebase persistence initialization failed:", err);
      })
      .finally(() => {
        if (!mounted) return;

        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          if (mounted) {
            setUser(nextUser);
            setLoading(false);
          }
        });
      });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: signInWithEmailPassword,
      logout: signOutUser,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}