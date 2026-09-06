"use client";

import { Suspense } from "react";
import type { PracticeVariantOf } from "@/lib/db/practice-menu-types";
import { useScoreTableVariant } from "../_hooks/use-score-table-generator-options";
import { ScoreTablePrompt } from "./score-table-prompt";

interface ScoreTableHowToPlayDemoProps {
  /** 出題のバリアント。デモの提示内容（親子）をこれに合わせる */
  readonly variant: PracticeVariantOf<"score-table">;
}

/**
 * バリアントに合わせたデモの本体
 *
 * 実際の出題（親子・ツモロン・翻・符の提示）を静的に再現し、出題形式を端的に示す。
 * 親だけのバリアントでは親の例、それ以外は代表値（子・ロン・3翻30符）。
 */
function ScoreTableHowToPlayDemo({ variant }: ScoreTableHowToPlayDemoProps) {
  const isOya = variant === "oya_non_mangan";

  return (
    <div className="space-y-4">
      <ScoreTablePrompt isOya={isOya} isTsumo={false} han={3} fu={30} />
    </div>
  );
}

function ScoreTableHowToPlayFromQuery() {
  return <ScoreTableHowToPlayDemo variant={useScoreTableVariant()} />;
}

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * 教本からバリアント付きで遷移した場合（例: 親・満貫未満）は、URL のバリアントに
 * 即したサンプルを表示する。バリアントは `useSearchParams()` で読むため静的
 * ルートではクライアント描画になる。プリレンダー HTML には fallback として
 * 既定のバリアントのデモ（子・ロン・3翻30符）を出しておき、指定無しの通常表示では
 * クライアント描画後も見た目が変わらないようにする。
 */
export function ScoreTableHowToPlay() {
  return (
    <Suspense fallback={<ScoreTableHowToPlayDemo variant="ko_non_mangan" />}>
      <ScoreTableHowToPlayFromQuery />
    </Suspense>
  );
}
