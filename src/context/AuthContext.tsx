"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  deleteUser,
  isSignInWithEmailLink,
  onAuthStateChanged,
  reauthenticateWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleContactsProvider, googleProvider } from "@/lib/firebase";
import {
  clearStoredEmailForSignIn,
  getMagicLinkCallbackUrl,
  storeEmailForSignIn,
} from "@/lib/auth-utils";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth-cookie";
import { deleteAllUserData, saveGoogleIntegration } from "@/lib/firestore";

export const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string, url: string) => Promise<void>;
  connectGoogleContacts: () => Promise<string | null>;
  deleteAccount: () => Promise<void>;
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
      if (user) {
        setAuthCookie();
      } else {
        clearAuthCookie();
      }
    });

    return unsubscribe;
  }, []);

  const persistGoogleAccessToken = async (
    firebaseUser: User,
    accessToken: string | undefined,
  ) => {
    if (!accessToken) return;

    await saveGoogleIntegration(firebaseUser.uid, {
      accessToken,
      connectedAt: new Date().toISOString(),
    });
  };

  const connectGoogleContacts = async (): Promise<string | null> => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    const result = await signInWithPopup(auth, googleContactsProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken ?? null;

    if (result.user && accessToken) {
      await persistGoogleAccessToken(result.user, accessToken);
    }

    return accessToken;
  };

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

  const deleteAccount = async () => {
    if (!auth?.currentUser) {
      throw new Error("You must be signed in to delete your account.");
    }

    const firebaseUser = auth.currentUser;

    await reauthenticateWithPopup(firebaseUser, googleProvider);
    await deleteAllUserData(firebaseUser.uid);
    await deleteUser(firebaseUser);
  };

  const sendMagicLink = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    await sendSignInLinkToEmail(auth, email, {
      url: getMagicLinkCallbackUrl(),
      handleCodeInApp: true,
    });
    storeEmailForSignIn(email);
  };

  const completeMagicLinkSignIn = async (email: string, url: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    if (!isSignInWithEmailLink(auth, url)) {
      throw new Error("This sign-in link is invalid or has expired.");
    }

    await signInWithEmailLink(auth, email, url);
    clearStoredEmailForSignIn();
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
        connectGoogleContacts,
        deleteAccount,
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
