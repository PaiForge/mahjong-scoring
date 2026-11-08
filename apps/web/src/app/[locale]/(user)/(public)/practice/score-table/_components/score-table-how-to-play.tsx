"use client";

import { Suspense } from "react";
import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
  type PracticeVariantOf,
} from "@mahjong-scoring/features/practice-menu-types";
import { useScoreTableVariant } from "../_hooks/use-score-table-generator-options";
import { scoreTableDemoPromptOf } from "@mahjong-scoring/features/practice/score-table/variants";
import { ScoreTablePrompt } from "./score-table-prompt";

interface ScoreTableHowToPlayDemoProps {
  /** 出題のバリアント。デモの提示内容（親子・点数帯）をこれに合わせる */
  readonly variant: PracticeVariantOf<"score-table">;
}

/**
 * バリアントに合わせたデモの本体
 *
 * 実際の出題（親子・ツモロン・翻・符の提示）を静的に再現し、出題形式を端的に示す。
 * 何を見せるかはバリアントから {@link scoreTableDemoPromptOf} が決める。
 * バリアントを足してもこのファイルは変わらない。
 */
function ScoreTableHowToPlayDemo({ variant }: ScoreTableHowToPlayDemoProps) {
  const { isOya, han, fu } = scoreTableDemoPromptOf(variant);

  return (
    <div className="space-y-4">
      <ScoreTablePrompt isOya={isOya} isTsumo={false} han={han} fu={fu} />
    </div>
  );
}

function ScoreTableHowToPlayFromQuery() {
  return <ScoreTableHowToPlayDemo variant={useScoreTableVariant()} />;
}

/**
 * プリレンダー時に見せる既定のバリアント（レジストリの列挙の先頭）
 *
 * 直に書かず引き当てるのは、バリアントの並びを変えたときに fallback だけが
 * 取り残されないため。
 */
const DEFAULT_SCORE_TABLE_VARIANT = resolvePracticeVariant(
  PRACTICE_SLUG.scoreTable,
  undefined,
);

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * 教本からバリアント付きで遷移した場合（例: 親・満貫未満）は、URL のバリアントに
 * 即したサンプルを表示する。バリアントは `useSearchParams()` で読むため静的
 * ルートではクライアント描画になる。プリレンダー HTML には fallback として
 * 既定のバリアントのデモを出しておき、指定無しの通常表示ではクライアント描画後も
 * 見た目が変わらないようにする。
 */
export function ScoreTableHowToPlay() {
  return (
    <Suspense
      fallback={
        <ScoreTableHowToPlayDemo variant={DEFAULT_SCORE_TABLE_VARIANT} />
      }
    >
      <ScoreTableHowToPlayFromQuery />
    </Suspense>
  );
}
