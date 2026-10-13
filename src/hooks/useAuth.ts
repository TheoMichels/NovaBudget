import { useCallback, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import {
  getSession,
  onAuthStateChange,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
} from "../services/authService";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook gérant l'état d'authentification Supabase pour NovaBudget.
 * Fournit l'état utilisateur, la session active, le statut de chargement et les actions d'authentification.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const initialSession = await getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { unsubscribe } = onAuthStateChange((newSession, newUser) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newUser);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      setIsLoading(true);
      setError(null);
      const res = await apiSignIn(email, password);
      setIsLoading(false);

      if (res.error) {
        const msg = res.error.message || "Erreur de connexion";
        setError(msg);
        return { success: false, error: msg };
      }

      setUser(res.user);
      setSession(res.session);
      return { success: true };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      setIsLoading(true);
      setError(null);
      const res = await apiSignUp(email, password);
      setIsLoading(false);

      if (res.error) {
        const msg = res.error.message || "Erreur lors de la création du compte";
        setError(msg);
        return { success: false, error: msg };
      }

      setUser(res.user);
      setSession(res.session);
      return { success: true };
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const res = await apiSignOut();
    setIsLoading(false);

    if (res.error) {
      setError(res.error.message || "Erreur de déconnexion");
    } else {
      setUser(null);
      setSession(null);
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: Boolean(user),
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };
}
