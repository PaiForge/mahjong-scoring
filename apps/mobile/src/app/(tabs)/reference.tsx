/**
 * 早見表
 *
 * @description 点数表・役一覧・用語集を、画面の上の切り替えで 1 つのタブに
 * まとめる（web の `/reference` のハブと 3 つのページに当たる）。開いたときは
 * いちばん引かれる点数表を出す。点数表は符×翻（20〜110 符 × 1〜4 翻）と
 * 満貫以上の点数を親子・ロンツモで切り替えて引く表で、セルをタップすると
 * 数字を隠せる（暗記用）。
 *
 * web はハブのページから 3 つへ進むが、アプリはハブを挟まずタブの中で
 * 切り替える。以前は点数表だけをタブに置き、役一覧・用語集はヘッダーの
 * 虫眼鏡からハブへ進んでいたが、虫眼鏡は検索と読まれて入口だと気付かれず、
 * ハブの先頭の「点数表」は元のタブへ戻るだけの行だったため畳んだ。
 * レッスン等の文中から開く役一覧・用語集は `/reference/yaku`・
 * `/reference/glossary` に積む画面で、本文はここと共有する。
 *
 * @flow 下部タブ → 早見表（点数表）。上の切り替えで役一覧・用語集へ。
 * 用語集の語を押すと用語の画面を積む
 */
import { useRef, useState } from "react";
import { StyleSheet, View, type ScrollViewInstance } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { ToggleGroup } from "../../components/toggle-group";
import { GlossaryIndexBody } from "../../reference/glossary-index-body";
import { YakuReferenceBody } from "../../reference/yaku-reference-body";
import { ScoreTable } from "../../score-table/score-table";

/** 早見表の中身 */
type ReferenceView = "scoreTable" | "yaku" | "glossary";

/** 点数表の切り替えの帯の位置（`Screen` の子の並びで数える）。表の上に追従させる */
const SCORE_TABLE_CONTROLS_INDEX = 1;

export default function ReferenceTabScreen() {
  const t = useTranslations("reference");
  const tNav = useTranslations("nav");
  const [view, setView] = useState<ReferenceView>("scoreTable");
  const scrollRef = useRef<ScrollViewInstance>(null);

  const select = (next: ReferenceView) => {
    setView(next);
    // 前の中身のスクロール位置のまま別の中身を出すと、途中から始まって見える
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const switcher = (
    <View style={styles.switcher}>
      <ToggleGroup
        groups={[
          [
            { value: "scoreTable", label: tNav("scoreTable") },
            { value: "yaku", label: t("yaku.title") },
            { value: "glossary", label: t("glossary.title") },
          ],
        ]}
        selected={view}
        onSelect={select}
        fill
        accessibilityLabel={t("title")}
        testID="reference-view"
      />
    </View>
  );

  // 点数表は切り替えている間も組んだままにし、親子・ロンツモ・隠したセルを保つ
  return (
    <ScoreTable
      renderLayout={({ controls, body }) => (
        <Screen
          ref={scrollRef}
          title={t("title")}
          inTabs
          contentStyle={styles.content}
          stickyHeaderIndices={
            view === "scoreTable" ? [SCORE_TABLE_CONTROLS_INDEX] : undefined
          }
        >
          {switcher}
          {view === "scoreTable" && controls}
          {view === "scoreTable" && body}
          {view === "yaku" && <YakuReferenceBody />}
          {view === "glossary" && <GlossaryIndexBody />}
        </Screen>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
  },
  switcher: {
    paddingBottom: 16,
  },
});
