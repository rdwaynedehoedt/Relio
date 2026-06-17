"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

const actionCodeSettings = {
  url: "http://localhost:3000/auth/callback",
  handleCodeInApp: true,
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string, url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (!auth) return;

    await firebaseSignOut(auth);
  };

  const sendMagicLink = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
  };

  const completeMagicLinkSignIn = async (email: string, url: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    if (!isSignInWithEmailLink(auth, url)) {
      throw new Error("This sign-in link is invalid or has expired.");
    }

    await signInWithEmailLink(auth, email, url);
    window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        sendMagicLink,
        completeMagicLinkSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
