"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { YakuDetail } from "@mahjong-scoring/core";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";
import { orderYakuDetails } from "../_lib/order-yaku-details";

interface YakuBreakdownProps {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 合計の後に効く丸めの補足（役満止まりなど）。持たない画面もある */
  readonly note?: ReactNode;
  /**
   * 見出しを押して開く形にし、既定で閉じておくか。
   * 内訳そのものが答えである画面（翻数即答）では閉じない
   */
  readonly collapsible?: boolean;
}

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
 * `collapsible` を渡すと既定で閉じる（{@link CollapsibleDetail}）。翻数が
 * 答えの一部でしかない点数系の問題別一覧では、内訳を開いたままにすると
 * 答え合わせが下へ押し出されるため閉じる。翻数即答のように内訳そのものが
 * 答えの画面では渡さない。
 */
export function YakuBreakdown({
  yakuDetails,
  note,
  collapsible = false,
}: YakuBreakdownProps) {
  const t = useTranslations("challenge.yakuBreakdown");
  const yakuOrder = useYakuOrder();

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const total = ordered.reduce((sum, detail) => sum + detail.han, 0);

  const table = (
    <DetailTable
      // 開閉式では見出しが開閉ボタンになるため、表側の見出しは出さない
      title={collapsible ? undefined : t("title")}
      rows={ordered.map((detail) => ({
        label: detail.name,
        value: t("han", { count: detail.han }),
      }))}
      total={{ label: t("total"), value: t("han", { count: total }) }}
      note={note}
    />
  );

  if (!collapsible) return table;

  return <CollapsibleDetail title={t("title")}>{table}</CollapsibleDetail>;
}
