import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { hasYakuCheatsheetEntry } from "@mahjong-scoring/features/yaku/examples";

import { Screen } from "../../components/screen";
import { YakuReferenceBody } from "../../reference/yaku-reference-body";

/**
 * 役一覧（早見表）
 *
 * @description
 * 役を翻数別に並べた早見表（web の `/reference/yaku`）。`?yaku=<役名>` で
 * 開くとその役を開いてスクロールする（web のアンカーの代わり。レッスンの
 * 翻数表の役名から開く）。早見表のタブの「役一覧」と同じ本文を、今の画面の
 * 上に積んで出す（タブへ移ると読んでいたレッスンから離れるため）。
 *
 * @flow
 * レッスンの役名やお知らせのリンクから開いて閲覧し、戻るで元の画面へ。
 */
export default function ReferenceYakuScreen() {
  const t = useTranslations("reference.yaku");
  const { yaku } = useLocalSearchParams<{ yaku?: string }>();
  const focused =
    typeof yaku === "string" && hasYakuCheatsheetEntry(yaku) ? yaku : undefined;

  return (
    <Screen title={t("title")} back>
      <YakuReferenceBody focusedYakuName={focused} />
    </Screen>
  );
}
