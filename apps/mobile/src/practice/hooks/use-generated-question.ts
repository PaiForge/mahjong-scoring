import { useCallback, useState } from "react";

/**
 * 盤面の出題状態
 * 出題状態
 *
 * web の `useClientGeneratedQuestion` に当たる。web はサーバー描画との食い違いを
 * 避けるためクライアントに来てから問題を作り、記録ありのチャレンジでは
 * サーバーが出題するが、モバイルはどちらも無いので初回描画で作る。
 *
 * 戻り値の `next` は新しい問題を作って差し替える。`generate` が変わっても
 * 出題中の問題はそのまま（設定を変えたら次の問題から効く）。
 */
export function useGeneratedQuestion<TQuestion>(
  generate: () => TQuestion,
): readonly [TQuestion, () => void] {
  const [question, setQuestion] = useState<TQuestion>(generate);
  const next = useCallback(() => setQuestion(generate()), [generate]);
  return [question, next] as const;
}
