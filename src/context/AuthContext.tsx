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
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  isSignInWithEmailLink,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, googleContactsProvider, googleProvider } from "@/lib/firebase";
import {
  clearStoredEmailForSignIn,
  getMagicLinkCallbackUrl,
  storeEmailForSignIn,
} from "@/lib/auth-utils";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth-cookie";
import { deleteAllUserData, saveGoogleIntegration, syncUserProfile } from "@/lib/firestore";

export const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string, url: string) => Promise<void>;
  connectGoogleContacts: () => Promise<string | null>;
  deleteAccount: (password?: string) => Promise<void>;
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
        void syncUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          providers: user.providerData.map((provider) => provider.providerId),
          authCreatedAt: user.metadata.creationTime ?? undefined,
        });
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

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    if (!auth) {
      throw new Error("Firebase is not configured. Add credentials to .env.local.");
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
  };

  const signOut = async () => {
    if (!auth) return;

    await firebaseSignOut(auth);
  };

  const deleteAccount = async (password?: string) => {
    if (!auth?.currentUser) {
      throw new Error("You must be signed in to delete your account.");
    }

    const firebaseUser = auth.currentUser;
    const providerIds = firebaseUser.providerData.map((provider) => provider.providerId);
    const hasPassword = providerIds.includes("password");
    const hasGoogle = providerIds.includes("google.com");

    if (hasPassword) {
      if (!password?.trim()) {
        throw new Error("Enter your password to confirm account deletion.");
      }

      if (!firebaseUser.email) {
        throw new Error("Your account email could not be verified.");
      }

      await reauthenticateWithCredential(
        firebaseUser,
        EmailAuthProvider.credential(firebaseUser.email, password.trim()),
      );
    } else if (hasGoogle) {
      await reauthenticateWithPopup(firebaseUser, googleProvider);
    } else {
      throw new Error("Unable to verify your identity for account deletion.");
    }

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
        signInWithEmail,
        signUpWithEmail,
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
