"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { Button } from "@/app/(user)/_components/button";
import { completeLessons } from "@/app/(user)/(public)/lessons/_actions/complete-lesson";
import {
  forgetPendingLessonCompletions,
  readPendingLessonCompletions,
} from "@/app/(user)/(public)/lessons/_lib/pending-completions-storage";
import { useIsClient } from "@/app/_hooks/use-is-client";
import { logExternalError } from "@/lib/log-error";
import { selectSyncableLessonCompletions } from "@mahjong-scoring/features/lessons/pending-completions";

interface PendingLessonSyncProps {
  /** ログインしている本人の id（サーバーが cookie から確定したもの） */
  readonly userId: string;
}

/**
 * 同期の結末。結果が返るまでは `pending`
 *
 * `blocked` は BAN で記録を拒まれたとき。再試行しても通らないので何も描かない
 */
type SyncOutcome = "pending" | "synced" | "failed" | "blocked";

/**
 * 端末に預けてあったレッスンの完了を、ログイン済みのホームで本人の記録にする
 * レッスン完了の同期
 *
 * 登録前（未ログイン）に終えたレッスンと、ログイン済みの保存が失敗して
 * 残った完了（`pending-completions-storage`）を、ホームを開いたときに
 * `completeLessons` へ送る。成功したら預かりから外し、`router.refresh()` で
 * サーバーに「次にやること」を組み直させる（完了が増えると次の一歩が進む）。
 *
 * 同期するのは、持ち主の無い預かり（未ログインで終えた分）と本人の id が
 * 付いた預かりだけ（`selectSyncableLessonCompletions`）。別のアカウントの
 * 失敗分は触らない。誰の記録にするかはサーバーが cookie から決め、ここで
 * 渡す `userId` は預かりの選別にしか使わない。
 *
 * 失敗したら預かりは残し、その場で再試行できる注記を出す。何もしなくても
 * 次にホームを開いたときにまた試みる。同期するものが無ければ何も描かない。
 * BAN で拒まれたときも預かりは残し（BAN が解かれたら次のホームで記録できる）、
 * 再試行の注記は出さない。
 *
 * 預かりは localStorage にあるので、クライアント判定（`useIsClient`）が
 * 立ってから読む（サーバーの HTML とハイドレーションの描画を揃えるため）。
 * 送信は effect で始めるが state の更新は結果が返ってからだけ行う
 * （`react-hooks/set-state-in-effect`）。送信中は預かりの有無と結末から
 * 導く。
 */
export function PendingLessonSync({ userId }: PendingLessonSyncProps) {
  const t = useTranslations("dashboard.pendingLessons");
  const router = useRouter();
  const isClient = useIsClient();
  // 再試行のたびに進める。effect の依存に入れて送信をやり直させる
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<SyncOutcome>("pending");
  // 同じ送信の結果を 2 回扱わない（開発時の StrictMode は effect を 2 度走らせる。
  // サーバーは冪等なので 2 度送っても記録は 1 つ）
  const handled = useRef(false);

  const pendingSlugs = useMemo(
    () =>
      isClient
        ? selectSyncableLessonCompletions(
            readPendingLessonCompletions(),
            userId,
          ).map((item) => item.slug)
        : [],
    // attempt を依存に含めて、再試行のときに預かりを読み直す
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attempt は読み直しの合図
    [isClient, userId, attempt],
  );

  useEffect(() => {
    if (pendingSlugs.length === 0 || outcome !== "pending") return;
    handled.current = false;
    void (async () => {
      try {
        const result = await completeLessons(pendingSlugs);
        if (handled.current) return;
        handled.current = true;
        if (!result.success) {
          // BAN。預かりは残すが、押しても通らない再試行は出さない
          setOutcome("blocked");
          return;
        }
        if ("skipped" in result) {
          // サーバーにセッションが無い。預かりは残し、次の表示で再び試みる
          setOutcome("failed");
          return;
        }
        forgetPendingLessonCompletions([
          ...result.completed,
          ...result.rejected,
        ]);
        setOutcome("synced");
        if (result.completed.length > 0) {
          toast.success(t("synced"));
          router.refresh();
        }
      } catch (error: unknown) {
        if (handled.current) return;
        handled.current = true;
        logExternalError("completeLessons", "pending lesson sync", error);
        setOutcome("failed");
      }
    })();
  }, [pendingSlugs, outcome, router, t]);

  const handleRetry = () => {
    setOutcome("pending");
    setAttempt((count) => count + 1);
  };

  if (
    pendingSlugs.length === 0 ||
    outcome === "synced" ||
    outcome === "blocked"
  )
    return undefined;

  if (outcome === "pending") {
    return (
      <p
        role="status"
        data-testid="pending-lesson-syncing"
        className="text-sm text-surface-500"
      >
        {t("syncing")}
      </p>
    );
  }

  return (
    <div
      role="alert"
      data-testid="pending-lesson-failed"
      className="flex flex-col gap-3 rounded-panel border border-destructive bg-destructive-subtle p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm leading-relaxed text-destructive-strong">
        {t("failed")}
      </p>
      <Button size="sm" variant="neutral" onClick={handleRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}
