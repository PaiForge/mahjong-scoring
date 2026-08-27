"use client";

import {
  type ReactNode,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/_actions/sign-out";
import {
  type ViewerProfile,
  fetchViewerProfile,
} from "@/app/_lib/viewer-profile";

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
  /**
   * 表示用のプロフィール（アバター・表示名）。未ログイン・プロフィール未作成
   * （仮登録）・取得失敗はいずれも undefined。
   */
  readonly profile: ViewerProfile | undefined;
  /**
   * `profile` の取得中かどうか。`isLoading`（認証状態の解決中）とは別に持つ。
   * 認証だけを見る呼び出し元をプロフィールの往復ぶん待たせないため。
   */
  readonly isProfileLoading: boolean;
  readonly signOut: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  /** プロフィールを取り直す（アバター変更後にヘッダーへ反映させる用） */
  readonly refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * 認証状態を提供するプロバイダー
 * 認証コンテキストプロバイダー
 *
 * 状態更新はすべて `startTransition` で包む。このプロバイダーはアプリ全体の祖先
 * なので、初回ロード直後（ページのクライアントチャンクがまだ届いておらず
 * `loading.tsx` の Suspense 境界が未ハイドレートのとき）に同期的な更新を流すと、
 * React はその境界をハイドレートできずクライアントレンダーに切り替え、SSR 済みの
 * 本文を捨てて一瞬 loading のスケルトンへ巻き戻す。transition にしておけば
 * ハイドレーション完了まで更新を待てるため巻き戻らない。
 */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ViewerProfile | undefined>(undefined);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | undefined>(undefined);
  const router = useRouter();

  const loadUser = useCallback(async (): Promise<User | null> => {
    const supabase = supabaseRef.current ?? createClient();
    const [
      {
        data: { user: currentUser },
      },
      {
        data: { session: currentSession },
      },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    startTransition(() => {
      setUser(currentUser);
      setSession(currentSession);
    });
    return currentUser;
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentProfile = await fetchViewerProfile();
    startTransition(() => setProfile(currentProfile));
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await loadUser();
    if (currentUser) {
      await refreshProfile();
    } else {
      startTransition(() => setProfile(undefined));
    }
  }, [loadUser, refreshProfile]);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    // プロフィールは認証状態が解決してから取りに行く。未ログインの訪問者に
    // サーバーへの往復をさせないため、ここだけは並列にしない。
    void (async () => {
      // 取得に失敗したときは未ログイン扱いで表示を確定させる
      const currentUser = await loadUser().catch(() => null);
      startTransition(() => setIsLoading(false));

      if (!currentUser) {
        startTransition(() => setIsProfileLoading(false));
        return;
      }
      try {
        await refreshProfile();
      } finally {
        startTransition(() => setIsProfileLoading(false));
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      startTransition(() => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      });

      if (event === "SIGNED_IN") {
        void refreshProfile();
      }

      if (event === "SIGNED_OUT") {
        startTransition(() => setProfile(undefined));
        router.refresh();
      }

      if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, loadUser, refreshProfile]);

  const signOut = useCallback(async () => {
    // サーバー側で activity-log 記録 + セッション無効化を行い、
    // クライアント側で Supabase のローカルセッション状態をクリアする
    await signOutAction();
    const supabase = supabaseRef.current ?? createClient();
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext
      value={{
        user,
        session,
        isLoading,
        profile,
        isProfileLoading,
        signOut,
        refreshUser,
        refreshProfile,
      }}
    >
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
