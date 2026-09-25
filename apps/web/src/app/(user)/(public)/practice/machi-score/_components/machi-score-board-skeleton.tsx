"use client";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ScoreBoardSkeletonFrame } from "../../score/_components/score-board-skeleton-frame";

/**
 * プレイ画面のローディングスケルトン
 * 待ち別練習ボードスケルトン
 *
 * 本体（MachiScoreBoardInner の最初の段階 = 待ち牌の選択）の回答欄の形を、
 * 総合演習と共通の外枠（{@link ScoreBoardSkeletonFrame}）に入れる。
 */
export function MachiScoreBoardSkeleton() {
  return (
    <ScoreBoardSkeletonFrame translationNamespace="machiScore">
      {/* 出題文 + 牌の一覧（種類ごとに 1 行、9 列） + 選択数 + 回答ボタン */}
      <div className="space-y-4">
        <SkeletonBar className="mx-auto h-5 w-48" tone={100} />
        <div className="space-y-2">
          {["manzu", "pinzu", "souzu", "jihai"].map((row) => (
            <div key={row} className="grid grid-cols-9 gap-1 sm:gap-2">
              {Array.from({ length: row === "jihai" ? 7 : 9 }, (_, i) => (
                <SkeletonBar
                  key={i}
                  radius="lg"
                  className="min-h-12 sm:min-h-16"
                  tone={100}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <SkeletonBar className="mx-auto h-4 w-24" tone={100} />
          <SkeletonBar radius="lg" className="h-12 w-full" />
        </div>
      </div>
    </ScoreBoardSkeletonFrame>
  );
}
