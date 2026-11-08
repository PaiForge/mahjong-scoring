"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { sumYakuHan } from "@mahjong-scoring/core";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { useYakuCheatsheetModal } from "../_hooks/use-yaku-cheatsheet-modal";
import { BreakdownPanel } from "./breakdown-panel";
import { DetailTable } from "./detail-table";
import { ScoreTableValueButton } from "./score-table-value-button";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";
import { yakuLabel } from "@mahjong-scoring/features/yaku/yaku-labels";
import type {
  YakuBreakdownProps,
  YakuBreakdownTableProps,
} from "@mahjong-scoring/features/results/breakdown-props";

/**
 * 翻数の内訳表示
 * 翻内訳表示
 *
 * 成立していた役とその翻数、合計を示す。「何翻だったか」だけでは翻数の
 * 数え間違いを直せない — どの役を見落とし、どの役を数えすぎたのかは内訳を
 * 並べて初めて分かる。
 *
 * 並びはライブラリが役を判定した順ではなく、役選択練習の選択肢と同じ順
 * （{@link orderYakuDetails}）。問題ごとに立直の現れる位置が変わると、
 * 結果を続けて読むときに目が迷う。
 *
 * 文言は共通の `challenge.yakuBreakdown` から引く。翻数即答の結果ページでも
 * 点数系の問題別一覧でも同じ表を出すため、練習ごとの辞書に同じ語を持たせない
 * （{@link import("./fu-breakdown").FuBreakdown} は練習ごとに符の呼び名が
 * 変わりうるため名前空間を受け取るが、役の内訳は常にこの 3 語で足りる）。
 *
 * 早見表に載る役の行は役名を押せて、役一覧モーダルがその役に着地する
 * （役判定の答え合わせ・点数計算の結果表示と同じ導線）。数え落とした役が
 * どんな形だったかは、名前と翻数だけでは思い出せない。状況役・ドラの行は
 * 一覧に無いため文字のまま。
 *
 * 器は点数系の答え合わせと同じ {@link BreakdownPanel}（「内訳を確認」の
 * 1 行の入口で、既定で閉じる）。内訳が翻数だけなので切り替えは出ない
 * （符の内訳も同じ）。開いた表の面（`surface`）は置く側が決める。
 */
export function YakuBreakdown({
  surface,
  ...tableProps
}: YakuBreakdownProps<ReactNode>) {
  const t = useTranslations("challenge.scoreBreakdown");

  if (tableProps.yakuDetails.length === 0) return undefined;

  const total = sumYakuHan(tableProps.yakuDetails);

  return (
    <BreakdownPanel
      title={t("toggle")}
      surface={surface}
      sections={[
        {
          kind: "han",
          tabLabel: t("hanTab", { count: total }),
          content: <YakuBreakdownTable {...tableProps} />,
        },
      ]}
    />
  );
}

/**
 * 翻数の内訳の表（開閉の器なし）
 * 翻内訳表
 *
 * 符の内訳と切り替えて出す場所（`ScoreBreakdownPanel`）では、開閉は
 * 置く側が持つので表だけを使う。`onOpenScoreTable` を渡すと、合計の翻数が
 * 点数表を開くボタンになる。
 *
 * 役名は core の日本語（`detail.name`）を `yakuNames` の辞書で引いて出す
 * （{@link yakuLabel}）。英語のページに漢字を残さないため。日本語の `yakuNames` の
 * 値は core の役名と同じ文字列なので、日本語の表示は変わらない（`agariScore.yaku` は
 * 回答フォームの選択肢の呼び名で core の名前と食い違うため使わない）。早見表の
 * 着地先は辞書の訳ではなく core の名前で引く。
 */
export function YakuBreakdownTable({
  yakuDetails,
  note,
  conclusion,
  onOpenScoreTable,
}: YakuBreakdownTableProps<ReactNode>) {
  const t = useTranslations("challenge.yakuBreakdown");
  const tChallenge = useTranslations("challenge");
  const tYakuNames = useTranslations("yakuNames");
  const yakuOrder = useYakuOrder();
  const yakuNames = useMemo(
    () => yakuDetails.map((detail) => detail.name),
    [yakuDetails],
  );
  const { canOpenYakuCheatsheet, openYakuCheatsheet, yakuCheatsheetModal } =
    useYakuCheatsheetModal(yakuNames);

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const total = sumYakuHan(ordered);

  return (
    <>
      <DetailTable
        // 見出しは開閉の入口が持つため、表側の見出しは出さない
        rows={ordered.map((detail) => ({
          label: canOpenYakuCheatsheet(detail.name) ? (
            <button
              type="button"
              onClick={() => openYakuCheatsheet(detail.name)}
              title={tChallenge("openInYakuList")}
              className={TEXT_LINK_CLASSES}
            >
              {yakuLabel(detail.name, tYakuNames)}
            </button>
          ) : (
            yakuLabel(detail.name, tYakuNames)
          ),
          value: t("han", { count: detail.han }),
        }))}
        total={{
          label: t("total"),
          value:
            onOpenScoreTable === undefined ? (
              t("han", { count: total })
            ) : (
              <ScoreTableValueButton onClick={onOpenScoreTable}>
                {t("han", { count: total })}
              </ScoreTableValueButton>
            ),
        }}
        conclusion={conclusion}
        note={note}
      />
      {yakuCheatsheetModal}
    </>
  );
}
