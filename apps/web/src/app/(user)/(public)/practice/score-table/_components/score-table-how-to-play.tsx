"use client";

import { Suspense } from "react";
import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
  type PracticeVariantOf,
} from "@/lib/db/practice-menu-types";
import { useScoreTableVariant } from "../_hooks/use-score-table-generator-options";
import { SCORE_TABLE_VARIANT_OPTIONS } from "../_lib/variants";
import { ScoreTablePrompt } from "./score-table-prompt";

/** 代表値のデモに使う満貫未満のセル（子・ロン・3翻30符） */
const NON_MANGAN_DEMO = { han: 3, fu: 30 } as const;

interface ScoreTableHowToPlayDemoProps {
  /** 出題のバリアント。デモの提示内容（親子・点数帯）をこれに合わせる */
  readonly variant: PracticeVariantOf<"score-table">;
}

/**
 * バリアントに合わせたデモの本体
 *
 * 実際の出題（親子・ツモロン・翻・符の提示）を静的に再現し、出題形式を端的に示す。
 * 何を見せるかはバリアントの絞り込み（{@link SCORE_TABLE_VARIANT_OPTIONS}）から
 * 導く — 親だけのバリアントでは親、満貫以上だけのバリアントでは符の無い満貫の例。
 * どちらでもないバリアントは代表値（子・ロン・3翻30符）。バリアントを足しても
 * このファイルは変わらない。
 */
function ScoreTableHowToPlayDemo({ variant }: ScoreTableHowToPlayDemoProps) {
  const { roles, ranges } = SCORE_TABLE_VARIANT_OPTIONS[variant];
  const isOya = roles?.length === 1 && roles[0] === "oya";
  // 満貫以上だけの出題は符を持たない（点数が符に依存しないため）
  const isManganPlusOnly = ranges?.includes("nonMangan") !== true;

  return (
    <div className="space-y-4">
      <ScoreTablePrompt
        isOya={isOya}
        isTsumo={false}
        han={isManganPlusOnly ? MANGAN_MIN_HAN : NON_MANGAN_DEMO.han}
        fu={isManganPlusOnly ? undefined : NON_MANGAN_DEMO.fu}
      />
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
