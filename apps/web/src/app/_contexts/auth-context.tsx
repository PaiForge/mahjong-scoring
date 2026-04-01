"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * 認証コンテキストの値の型定義。
 *
 * `user` と `session` に `null` を使用しているのは、Supabase SDK の
 * `auth.getUser()` / `auth.getSession()` の戻り値型が `User | null` /
 * `Session | null` であるため。プロジェクトのコーディング規約では
 * `undefined` を推奨するが、SDK 境界では `null` をそのまま使用する。
 *
 * 認証コンテキスト値
 */
interface AuthContextValue {
  readonly user: User | null;
  readonly session: Session | null;
  readonly isLoading: boolean;
  readonly signOut: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * 認証状態を提供するプロバイダー
 * 認証コンテキストプロバイダー
 */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | undefined>(undefined);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const supabase = supabaseRef.current ?? createClient();
    if (!supabase) return;
    const [
      {
        data: { user: currentUser },
      },
      {
        data: { session: currentSession },
      },
    ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
    setUser(currentUser);
    setSession(currentSession);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabaseRef.current = supabase;

    refreshUser().finally(() => setIsLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (_event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, refreshUser]);

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current ?? createClient();
    if (!supabase) return;

    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch {
      // Logging failure must never prevent the user from signing out.
    }

    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext value={{ user, session, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext>
  );
}

/**
 * 認証コンテキストを取得するフック。
 *
 * `AuthProvider` の外で使用された場合は例外をスローする。
 * これは React Context のイディオムとして例外的に `throw` を使用しており、
 * プロジェクトの Railway Oriented Programming 規約の適用外とする。
 *
 * 認証フック
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
