"use client";

import { useCallback } from "react";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import { withRetries } from "@mahjong-scoring/features/session/with-retries";
import { logExternalError } from "@/lib/log-error";
import {
  isRetryableChallengeFailure,
  type FinishErrorCode,
} from "../_lib/challenge-failure-policy";
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
  | { readonly error: FinishErrorCode };

/**
 * 1 回の送信の結果。Action が投げた例外（通信の失敗・Server Action の
 * 枠組みの失敗）も応答と同じ形に畳み、送り直しの判定に掛ける
 */
type FinishAttemptOutcome<TSuccess extends Record<string, unknown>> =
  FinishActionResponse<TSuccess> | { readonly thrown: unknown };

/**
 * 応答が失敗（`{ error }`）か。`"error" in response` では成功の追加フィールド
 * （`TSuccess`）が `error` を持たないと型で言えず、`error` が unknown に
 * 広がるので、`success` を持たないことで判定する
 */
function isFailureResponse<TSuccess extends Record<string, unknown>>(
  response: FinishActionResponse<TSuccess>,
): response is { readonly error: FinishErrorCode } {
  return !("success" in response);
}

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
 * 一時的な失敗（回数制限・DB の失敗・認証サーバーの不通・例外）は、同じ挑戦 ID を
 * 間を空けて数回送り直す（`withRetries`。分け方は `challenge-failure-policy.ts`、
 * アプリの確定の送信と同じ間隔）。送り直す間は盤面が結果ページ形のスケルトンの
 * まま（`ChallengeShell`）で、利用者に待たせるのは合計 3.5 秒ほど。送り直しても
 * 通らなければ undefined を返して結果ページへ進む — 挑戦は未確定のまま残るが、
 * 挑戦 ID は盤面と一緒に捨てられるので、結果ページからは送り直せない
 * （記録できなかったことも伝わらない。伝えるには結果ページへ挑戦 ID を渡す
 * 必要がある）。
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

      const result = await withRetries(
        async (): Promise<FinishAttemptOutcome<TSuccess>> => {
          try {
            return await action(challenge.id);
          } catch (error: unknown) {
            return { thrown: error };
          }
        },
        (outcome) =>
          "thrown" in outcome ||
          (isFailureResponse(outcome) &&
            isRetryableChallengeFailure(outcome.error)),
      );
      if ("thrown" in result) {
        logExternalError(name, menuType, result.thrown);
        return undefined;
      }
      if (isFailureResponse(result)) {
        logExternalError(name, menuType, result.error);
        return undefined;
      }
      if ("skipped" in result) {
        // 匿名ユーザー: 期待される no-op（エラーではない）
        return undefined;
      }
      return toResult(result);
    },
    [menuType, challenge, action, name, toResult],
  );
}
