"use client";

import { useCallback } from "react";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import { logExternalError } from "@/lib/log-error";
import type {
  FinishCallbackArgs,
  FinishCallbackResult,
} from "./use-finish-redirect";
import { useVerifiedChallenge } from "./use-verified-challenge";

/**
 * 終了時に呼ぶ Server Action の応答。成功・匿名のスキップ・エラーの 3 通り
 * 終了時アクション応答
 */
type FinishActionResponse<TSuccess extends Record<string, unknown>> =
  | ({ readonly success: true } & TSuccess)
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly error: string };

interface FinishActionOptions<TSuccess extends Record<string, unknown>> {
  /** 終了時に呼ぶ Server Action。送るのは挑戦 ID だけ */
  readonly action: (
    attemptId: string,
  ) => Promise<FinishActionResponse<TSuccess>>;
  /** ログのタグ（Action の名前） */
  readonly name: string;
  /** 成功の応答を結果ページへ渡す値に写す */
  readonly toResult: (result: TSuccess) => FinishCallbackResult;
}

/**
 * チャレンジの終了時に、サーバー採点済みの挑戦を Server Action へ送るコールバックを返す
 * 終了時アクションフック
 *
 * 練習の保存（`useSaveOnFinish`）と昇級試験の採点（`useSubmitExamOnFinish`）が
 * 同じ座（`createChallengePlayView` の `onFinish`）に置く 2 つのフックの本体。
 * 違いは呼ぶ Action と、成功の応答を結果ページへ渡す値に写す関数だけ。
 *
 * 認証チェックは Server Action 側が行う（cookie ベースの Supabase サーバークライアントが
 * 唯一の信頼できる認証ソース）。クライアント側で認証状態を先読みしない。
 * 過去に認証コンテキストの初期ロード中にチャレンジが終了した場合の競合条件で、
 * 認証済みユーザーが匿名扱いされて EXP 付与がスキップされるバグを 2 回起こしたため、
 * **クライアント側の事前認証チェックは意図的に一切行わない**。
 *
 * Server Action は匿名ユーザーからの呼び出しを `{ success: true, skipped: 'anonymous' }`
 * として返し、このフックはそれを `undefined` に変換してサイレントに no-op する。
 * これにより匿名ユーザーに対する `console.error` のノイズも発生しない。
 *
 * @param menuType 練習種別（ログに添える）
 */
export function useFinishAction<TSuccess extends Record<string, unknown>>(
  menuType: PracticeMenuType,
  { action, name, toResult }: FinishActionOptions<TSuccess>,
): (args: FinishCallbackArgs) => Promise<FinishCallbackResult | undefined> {
  const challenge = useVerifiedChallenge();
  return useCallback(
    async (args: FinishCallbackArgs) => {
      if (args.totalCount === 0 || !challenge) return undefined;
      await challenge.settled();

      try {
        const result = await action(challenge.id);
        if ("error" in result) {
          logExternalError(name, menuType, result.error);
          return undefined;
        }
        if ("skipped" in result) {
          // 匿名ユーザー: 期待される no-op（エラーではない）
          return undefined;
        }
        return toResult(result);
      } catch (error: unknown) {
        logExternalError(name, menuType, error);
        return undefined;
      }
    },
    [menuType, challenge, action, name, toResult],
  );
}
