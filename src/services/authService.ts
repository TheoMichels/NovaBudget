import { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | Error | null;
}

export interface SignOutResponse {
  error: AuthError | Error | null;
}

export interface AuthSubscription {
  unsubscribe: () => void;
}

/**
 * Inscription par Email et Mot de passe via Supabase.
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: new Error(
        "Supabase n'est pas configuré. Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
      ),
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err : new Error("Erreur inconnue lors de l'inscription"),
    };
  }
}

/**
 * Connexion par Email et Mot de passe via Supabase.
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: new Error(
        "Supabase n'est pas configuré. Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
      ),
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err : new Error("Erreur inconnue lors de la connexion"),
    };
  }
}

/**
 * Déconnexion de la session active.
 */
export async function signOut(): Promise<SignOutResponse> {
  if (!supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ?? null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error("Erreur inconnue lors de la déconnexion"),
    };
  }
}

/**
 * Récupère l'utilisateur actuellement connecté depuis la session locale/serveur.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Récupère la session active persistée.
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Écoute les changements d'état d'authentification (connexion, déconnexion, rafraîchissement de token).
 */
export function onAuthStateChange(
  callback: (session: Session | null, user: User | null) => void
): AuthSubscription {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null);
  });

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}
