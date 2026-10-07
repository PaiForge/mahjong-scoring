import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { panelFrame } from "../../../lib/panel-styles";
import { CollapsibleDetail } from "../../components/collapsible-detail";
import { DetailTable } from "../../components/detail-table";

/** 内訳の 1 行（役名と翻数 / 符の理由と符） */
export interface DetailItem {
  readonly name: string;
  readonly value: number;
}

/**
 * 結果表の中に置く内訳の行（web の `DetailsPanelRow`）
 * 符詳細・役詳細の展開表示
 *
 * 翻数・符の行の直後に置き、その値の内訳を閉じた状態から開かせる。開いた
 * 内訳は白い角丸の枠に沈める — 内訳の合計の実線が結果表の項目の境目と
 * 同じ姿で並び、どこまでが内訳か読めなくなるため（web と同じ）。
 */
export function DetailsPanelRow({
  title,
  items,
  total,
  suffix,
  roundedTotal,
  roundUpLabel,
}: {
  /** 内訳の見出し（「翻数の内訳」「符の内訳」） */
  readonly title: string;
  readonly items: readonly DetailItem[];
  readonly total: number;
  readonly suffix: string;
  readonly roundedTotal?: number;
  readonly roundUpLabel?: string;
}) {
  const t = useTranslations("score");
  const withSuffix = (value: number) => `${value}${suffix}`;

  return (
    <View style={styles.row}>
      <CollapsibleDetail title={title}>
        <View style={styles.panel}>
          <DetailTable
            rows={items.map((detail) => ({
              label: detail.name,
              value: withSuffix(detail.value),
            }))}
            total={{
              label: t("result.details.total"),
              value: withSuffix(total),
            }}
            note={
              roundedTotal !== undefined && total !== roundedTotal
                ? `${withSuffix(total)} → ${withSuffix(roundedTotal)}（${roundUpLabel ?? ""}）`
                : undefined
            }
          />
        </View>
      </CollapsibleDetail>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 8,
  },
  panel: {
    ...panelFrame,
    padding: 12,
  },
});
