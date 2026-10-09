"use client";

import {
  type ReactNode,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { signOutAction } from "@/app/_actions/sign-out";
import { whenPageIdle } from "@/app/_lib/page-idle";
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
 * Supabase のブラウザ用クライアントを読み込んで作る。
 *
 * SDK（supabase-js と @supabase/ssr、約 68KB）を静的に import すると、未ログインで
 * 開く LP を含む全ページの初期チャンクに載る。動的 import で別チャンクに分け、
 * 要る時点で読む。一度作ったクライアントを使い回す。
 *
 * 読み込みに失敗した Promise は保持しない。保持すると一時的な通信障害で
 * 動的 import が 1 度失敗しただけで、ページを再読み込みするまで同じ失敗を
 * 返し続ける。
 */
let supabaseClientPromise: Promise<SupabaseClient> | undefined;
function loadSupabaseClient(): Promise<SupabaseClient> {
  supabaseClientPromise ??= import("@/lib/supabase/client")
    .then((mod) => mod.createClient())
    .catch((error: unknown) => {
      supabaseClientPromise = undefined;
      throw error;
    });
  return supabaseClientPromise;
}

/** 認証状態の監視を張れなかったときの再試行の間隔（試行ごとに倍、上限あり） */
const SUBSCRIBE_RETRY_BASE_MS = 1000;
const SUBSCRIBE_RETRY_MAX_MS = 30_000;

/**
 * ブラウザに Supabase のセッションの cookie があるか。
 *
 * ブラウザ用クライアント（@supabase/ssr）はセッションを `sb-<プロジェクト>-auth-token`
 * （大きければ `.0`, `.1` … に分割）の cookie に JS から読める形で保存する。これが
 * 無ければ SDK を読むまでもなく未ログインと分かる。PKCE の途中で残る
 * `…-auth-token-code-verifier` も拾うが、そのときは SDK をすぐ読むだけで害は無い。
 */
function hasSessionCookie(): boolean {
  return document.cookie
    .split(";")
    .some((pair) => /^\s*sb-[^=]+-auth-token/.test(pair));
}

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
 *
 * セッションの cookie が無い訪問者（LP の大半）は SDK を読まずに未ログインで
 * 確定させ、SDK はページの読み込みが落ち着いてから読む。読んだ後は
 * `onAuthStateChange` が別タブでのログイン・ログアウトを拾う（読んだ時点で
 * 届く INITIAL_SESSION が、待っている間に変わった状態も反映する）。
 */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ViewerProfile | undefined>(undefined);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async (): Promise<User | null> => {
    const supabase = await loadSupabaseClient();
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
    let unsubscribe: (() => void) | undefined;
    let isDisposed = false;
    let retryTimer: number | undefined;
    let removeOnlineListener: (() => void) | undefined;

    // isDeferred: cookie が無く、認証状態を SDK を読まずに確定させた場合。読むまでの
    // 間に別タブでログインしていれば SIGNED_IN ではなく INITIAL_SESSION で届くので、
    // そのときもプロフィールを取る。
    const subscribe = async (isDeferred: boolean) => {
      const supabase = await loadSupabaseClient();
      if (isDisposed) {
        return;
      }
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, newSession) => {
        startTransition(() => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        });

        if (
          event === "SIGNED_IN" ||
          (isDeferred && event === "INITIAL_SESSION" && newSession)
        ) {
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
      unsubscribe = () => subscription.unsubscribe();
    };

    // SDK の読み込みに失敗すると監視が張られず、通信が戻っても認証状態が
    // 更新されない。間隔を空けて（オンラインに戻ったらすぐ）張り直す。
    // 再試行の時点では表示を SDK 抜きで確定させている（cookie 無し、または
    // loadUser の失敗で未ログイン扱い）ので、INITIAL_SESSION でもプロフィールを取る。
    const startSubscription = (isDeferred: boolean, attempt: number) => {
      subscribe(isDeferred).catch(() => {
        if (isDisposed) {
          return;
        }
        const retry = () => {
          window.clearTimeout(retryTimer);
          removeOnlineListener?.();
          removeOnlineListener = undefined;
          if (!isDisposed) {
            startSubscription(true, attempt + 1);
          }
        };
        retryTimer = window.setTimeout(
          retry,
          Math.min(
            SUBSCRIBE_RETRY_BASE_MS * 2 ** attempt,
            SUBSCRIBE_RETRY_MAX_MS,
          ),
        );
        window.addEventListener("online", retry, { once: true });
        removeOnlineListener = () =>
          window.removeEventListener("online", retry);
      });
    };

    const dispose = () => {
      isDisposed = true;
      window.clearTimeout(retryTimer);
      removeOnlineListener?.();
      unsubscribe?.();
    };

    if (!hasSessionCookie()) {
      startTransition(() => {
        setIsLoading(false);
        setIsProfileLoading(false);
      });
      const cancelIdle = whenPageIdle(() => startSubscription(true, 0));
      return () => {
        cancelIdle();
        dispose();
      };
    }

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

    startSubscription(false, 0);

    return dispose;
  }, [router, loadUser, refreshProfile]);

  const signOut = useCallback(async () => {
    // サーバー側で activity-log 記録 + セッション無効化を行い、
    // クライアント側で Supabase のローカルセッション状態をクリアする
    await signOutAction();
    const supabase = await loadSupabaseClient();
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
