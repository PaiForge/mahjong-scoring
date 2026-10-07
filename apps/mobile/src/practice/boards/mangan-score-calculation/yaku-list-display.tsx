import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { YakuDetail } from "@mahjong-scoring/core";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";

import { useYakuOrder } from "../../../hooks/use-yaku-order-store";
import { colors, radius } from "../../../lib/theme";
import { DetailTable } from "../../components/detail-table";

/**
 * 役一覧と翻数を表示するコンポーネント
 * 役一覧表示
 *
 * web の `YakuListDisplay` の移植。この練習は役と翻数を与えたうえで点数だけを
 * 答えさせるので、この一覧は答え合わせではなく出題の一部（与件）。手牌の
 * 盤面と設問の間に置く。
 *
 * 表は結果の翻数の内訳と同じ {@link DetailTable}、文言も共通の
 * `challenge.yakuBreakdown` から引く。見出しだけは練習側の「成立役」を使う。
 * 並びは設定の役の並び順（{@link orderYakuDetails}）に載せ替える — 判定順の
 * ままだと問題ごとに同じ役の位置が変わり、制限時間の中で翻数を拾う目が迷う。
 *
 * 折りたたまない（与件が閉じていては解けない）。表示だけの面なので影は
 * 付けず、太枠と淡い地で区切る。
 */
export function YakuListDisplay({
  yakuDetails,
}: {
  readonly yakuDetails: readonly YakuDetail[];
}) {
  const t = useTranslations("manganScoreCalculationChallenge");
  const tBreakdown = useTranslations("challenge.yakuBreakdown");
  const yakuOrder = useYakuOrder();

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const totalHan = ordered.reduce((sum, yaku) => sum + yaku.han, 0);

  return (
    <View style={styles.frame}>
      <DetailTable
        title={t("yakuListTitle")}
        rows={ordered.map((yaku) => ({
          label: yaku.name,
          value: tBreakdown("han", { count: yaku.han }),
        }))}
        total={{
          label: tBreakdown("total"),
          value: tBreakdown("han", { count: totalHan }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.surface50,
    padding: 12,
  },
});
