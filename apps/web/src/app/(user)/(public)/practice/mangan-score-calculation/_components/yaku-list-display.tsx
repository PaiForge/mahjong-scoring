"use client";

import { useTranslations } from "next-intl";
import type { YakuDetail } from "@mahjong-scoring/core";

import { DetailTable } from "../../_components/detail-table";

interface YakuListDisplayProps {
  readonly yakuDetails: readonly YakuDetail[];
}

/**
 * 役一覧と翻数を表示するコンポーネント
 * 役一覧表示
 *
 * この練習は役と翻数を与えたうえで点数だけを答えさせるので、この一覧は
 * 答え合わせではなく出題の一部（与件）。手牌の盤面と設問の間に置く。
 *
 * 表は結果ページの翻数の内訳と同じ {@link DetailTable}、文言も共通の
 * `challenge.yakuBreakdown` から引く。同じ手の同じ役を、解いている間と
 * 結果とで違う体裁・違う語で読ませない。見出しだけは練習側の「成立役」を
 * 使う（「翻数の内訳」は伏せてあったものを開く側の言い方で、最初から
 * 見えている条件には合わない）。
 *
 * 結果ページの {@link import("../../_components/yaku-breakdown").YakuBreakdown}
 * そのものは使わない。あれは折りたたんで閉じた状態から始まり（与件が閉じて
 * いては解けない）、役名が役一覧モーダルを開くボタンになる（制限時間の中で
 * モーダルを開かせない）。共有するのは表の体裁までにする。
 *
 * 琥珀は使わない。このアプリで琥珀が意味するのは教本のコラム
 * （{@link import("@/app/(user)/_components/highlight-panel").HighlightPanel}）と
 * 表の注目セル（{@link import("@/app/(user)/_components/_lib/table-highlight")}）、
 * つまり「地の文から浮かせて読ませる」合図で、常に出ている与件には合わない
 * （`globals.css` の状態色の項も、意味を持つ色に Tailwind 既定の amber-* を
 * 直接書くことを禁じている）。表示だけの面の既定どおり、太枠と淡い地で
 * 区切る（影は押せる面の記号なので付けない）。
 *
 * 高さは出題待ちのプレースホルダと `loading.tsx` が先に場所を確保している
 * （{@link import("../../_lib/board-area-height").BOARD_AREA_HEIGHT} の
 * `manganScoreCalculation`）。余白・文字サイズ・枠の太さを変えるとその実測値が
 * ずれて盤面が現れた瞬間に画面が跳ねるため、変えるときは測り直すこと。
 */
export function YakuListDisplay({ yakuDetails }: YakuListDisplayProps) {
  const t = useTranslations("manganScoreCalculationChallenge");
  const tBreakdown = useTranslations("challenge.yakuBreakdown");

  const totalHan = yakuDetails.reduce((sum, yaku) => sum + yaku.han, 0);

  return (
    <div className="rounded-lg border-3 border-ink bg-surface-50 p-3">
      <DetailTable
        title={t("yakuListTitle")}
        rows={yakuDetails.map((yaku) => ({
          label: yaku.name,
          value: tBreakdown("han", { count: yaku.han }),
        }))}
        total={{
          label: tBreakdown("total"),
          value: tBreakdown("han", { count: totalHan }),
        }}
      />
    </div>
  );
}
