"use client";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ScoreBoardSkeletonFrame } from "./score-board-skeleton-frame";

/**
 * プレイ画面のローディングスケルトン
 * 練習ボードスケルトン
 *
 * 本体（ScorePracticeBoardInner の最終レンダリング）の回答欄の形を、聴牌形
 * 点数計算と共通の外枠（{@link ScoreBoardSkeletonFrame}）に入れる。
 */
export function ScorePracticeBoardSkeleton() {
  return (
    <ScoreBoardSkeletonFrame translationNamespace="score">
      <ScoreAnswerFormSkeleton />
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
 */
export function ScoreAnswerFormSkeleton() {
  return (
    <div className="space-y-5">
      {["han", "fu", "score"].map((field) => (
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
