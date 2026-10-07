import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import type { YakuDetail } from "@mahjong-scoring/core";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";

import { useYakuOrder } from "../../hooks/use-yaku-order-store";
import { linkStyles } from "../../lib/link-styles";
import { useYakuCheatsheetModal } from "../use-yaku-cheatsheet-modal";
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
 * 早見表に載る役の名前は押せて、押すと役一覧のシートをその役で開く
 * （web と同じ）。
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
  const tChallenge = useTranslations("challenge");
  const yakuOrder = useYakuOrder();
  const yakuNames = useMemo(
    () => yakuDetails.map((detail) => detail.name),
    [yakuDetails],
  );
  const { canOpenYakuCheatsheet, openYakuCheatsheet, yakuCheatsheetModal } =
    useYakuCheatsheetModal(yakuNames);

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const total = ordered.reduce((sum, detail) => sum + detail.han, 0);

  return (
    <>
      <CollapsibleDetail title={t("title")}>
        <DetailTable
          // 見出しは開閉ボタンが持つため、表側の見出しは出さない
          rows={ordered.map((detail) => ({
            label: canOpenYakuCheatsheet(detail.name) ? (
              <Text
                onPress={() => openYakuCheatsheet(detail.name)}
                accessibilityRole="link"
                accessibilityHint={tChallenge("openInYakuList")}
                style={[styles.yakuLink, linkStyles.textButton]}
              >
                {detail.name}
              </Text>
            ) : (
              detail.name
            ),
            value: t("han", { count: detail.han }),
          }))}
          total={{ label: t("total"), value: t("han", { count: total }) }}
          note={note}
        />
      </CollapsibleDetail>
      {yakuCheatsheetModal}
    </>
  );
}

const styles = StyleSheet.create({
  yakuLink: {
    fontSize: 14,
  },
});
