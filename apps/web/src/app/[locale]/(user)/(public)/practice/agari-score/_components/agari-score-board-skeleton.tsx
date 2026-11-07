"use client";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ScoreBoardSkeletonFrame } from "./score-board-skeleton-frame";

/**
 * プレイ画面のローディングスケルトン
 * 練習ボードスケルトン
 *
 * 本体（AgariScoreBoardInner の最終レンダリング）の回答欄の形を、聴牌形
 * 点数計算と共通の外枠（{@link ScoreBoardSkeletonFrame}）に入れる。
 *
 * @param requireHanFu - 翻数・符の欄を出すか。URL を読む前（Suspense の
 *   fallback）は分からないので、設定の既定（出さない）に合わせる
 */
export function AgariScoreBoardSkeleton({
  requireHanFu = false,
}: {
  readonly requireHanFu?: boolean;
}) {
  return (
    <ScoreBoardSkeletonFrame translationNamespace="agariScore">
      <ScoreAnswerFormSkeleton requireHanFu={requireHanFu} />
    </ScoreBoardSkeletonFrame>
  );
}

/**
 * 回答フォーム（{@link ScorePracticeAnswerForm}）のスケルトン
 * 回答フォームスケルトン
 *
 * 翻・符・点数の select（各 label 付き）と回答するボタンの形。フォームは
 * 端末ローカルのルール設定で選択肢が変わるため、サーバーの HTML には出せず
 * ハイドレーション後に差し替える。その間この形で高さを確保する
 * （和了形の点数計算の盤面と体験ページが共有する）。
 *
 * @param requireHanFu - 翻数・符の欄を出すか（既定 true。体験ページは常に出す）
 */
export function ScoreAnswerFormSkeleton({
  requireHanFu = true,
}: {
  readonly requireHanFu?: boolean;
}) {
  const fields = requireHanFu ? ["han", "fu", "score"] : ["score"];
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field} className="space-y-2">
          <SkeletonBar className="h-4 w-16" tone={100} />
          <SkeletonBar radius="lg" className="h-12" tone={100} />
        </div>
      ))}
      {/* 回答するボタン（実体は primary 色のため一段濃いトーンで表現） */}
      <SkeletonBar radius="lg" className="h-12 w-full" />
    </div>
  );
}
