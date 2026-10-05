import { useTranslations } from "use-intl";
import type { YakuDetail } from "@mahjong-scoring/core";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";

import { useYakuOrder } from "../../hooks/use-yaku-order-store";
import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";

/**
 * 翻数の内訳表示（web の `YakuBreakdown`）
 * 翻内訳表示
 *
 * 成立していた役とその翻数、合計を示す。並びは役選択練習の選択肢と同じ順
 * （{@link orderYakuDetails}）。文言は共通の `challenge.yakuBreakdown` から
 * 引く。常に既定で閉じる。
 *
 * web は早見表に載る役の行を押すと役一覧モーダルが開くが、モバイルには
 * まだ役一覧が無いため役名は文字のまま。
 */
export function YakuBreakdown({
  yakuDetails,
  note,
}: {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 合計の後に効く丸めの補足（役満止まりなど）。持たない画面もある */
  readonly note?: string;
}) {
  const t = useTranslations("challenge.yakuBreakdown");
  const yakuOrder = useYakuOrder();

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const total = ordered.reduce((sum, detail) => sum + detail.han, 0);

  return (
    <CollapsibleDetail title={t("title")}>
      <DetailTable
        // 見出しは開閉ボタンが持つため、表側の見出しは出さない
        rows={ordered.map((detail) => ({
          label: detail.name,
          value: t("han", { count: detail.han }),
        }))}
        total={{ label: t("total"), value: t("han", { count: total }) }}
        note={note}
      />
    </CollapsibleDetail>
  );
}
