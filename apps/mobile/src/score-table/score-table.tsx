import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { type Role, type WinType } from "@mahjong-scoring/core";

import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import { buildScoreGrid } from "@mahjong-scoring/features/score-table/score-grid";
import { useScoreTableOptions } from "@mahjong-scoring/features/score-table/use-score-table-options";
import { useScoreTableSelection } from "@mahjong-scoring/features/score-table/use-score-table-selection";

import { useScrollIntoView } from "../components/scroll-into-view";
import { ToggleGroup } from "../components/toggle-group";
import { useRuleSettingsStore } from "../hooks/use-rule-settings-store";
import { colors } from "../lib/theme";
import { HighScoreTable } from "./high-score-table";
import { KiriageManganNote } from "./kiriage-mangan-note";
import { NormalScoreTable } from "./normal-score-table";

interface ScoreTableProps {
  /**
   * 注目させる和了。親子・ロンツモのタブと表示モードの初期値になり、
   * 該当セル（満貫以上なら区分行）をハイライトして、囲んでいる
   * `ScrollIntoViewScrollView` の中央までスクロールする。タブを focus と
   * 別の組へ切り替えている間、ハイライトは出さない
   */
  readonly focus?: ScoreTableFocus;
  /** focus なしでタブ初期値だけ指定する場合の親/子 */
  readonly initialRole?: Role;
  /** focus なしでタブ初期値だけ指定する場合のロン/ツモ */
  readonly initialWinType?: WinType;
  /**
   * セルタップで数字を隠す切り替え（暗記用）を有効にするか。
   * 答え合わせの参照用では誤タップで数字が消えないよう無効にする。
   */
  readonly blurToggleEnabled?: boolean;
  /**
   * 切り替えの帯と表の描画を外へ渡す。帯を画面のスクロールに追従させるには
   * スクロールの直接の子として置く必要がある（`stickyHeaderIndices`）。
   * 省略時は縦に並べて返す。
   */
  readonly renderLayout?: (parts: ScoreTableParts) => ReactNode;
}

/** 点数早見表を組む部品 */
interface ScoreTableParts {
  /** 親子・ロンツモ・表示モードの切り替え */
  readonly controls: ReactNode;
  /** ツモの凡例・表・切り上げ満貫の注記 */
  readonly body: ReactNode;
}

/**
 * 点数早見表のコンテナ（web の `ScoreTable`）
 * 点数早見表
 *
 * 親子・ツモロン・表示モードの切り替え状態（features の `useScoreTableSelection`）と
 * 点数グリッドの計算を持ち、
 * 表本体の描画は NormalScoreTable / HighScoreTable に委譲する。
 * 練習の答え合わせから開いたときは `focus` で正解のセルを指す（web と同じ）。
 */
export function ScoreTable({
  focus,
  initialRole = "ko",
  initialWinType = "ron",
  blurToggleEnabled = true,
  renderLayout,
}: ScoreTableProps) {
  const t = useTranslations("scoreTable");
  const {
    focusTarget,
    activeTab,
    setActiveTab,
    winType,
    setWinType,
    viewMode,
    setViewMode,
    isKo,
    isFocusView,
    hiddenCells,
    toggleCell,
  } = useScoreTableSelection({
    focus,
    initialRole,
    initialWinType,
    initialViewMode: "normal",
  });
  const { roleOptions, winTypeOptions, viewModeOptions } =
    useScoreTableOptions();
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);

  // 注目セルが置かれたら一度だけ中央へ寄せる（タブを行き来して戻っても
  // 動かさない — 読んでいる位置を奪わないため）
  const scrollIntoView = useScrollIntoView();
  const focusRef = useRef<View>(null);
  const hasScrolled = useRef(false);
  const handleFocusLayout = useCallback(() => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    scrollIntoView(focusRef.current);
  }, [scrollIntoView]);
  const focusAnchor = { ref: focusRef, onLayout: handleFocusLayout };

  /** 符・翻の点数計算結果グリッド（親子 / ロンツモ / 切り上げ満貫設定に依存） */
  const scoreGrid = useMemo(
    () => buildScoreGrid(activeTab, winType, { kiriageMangan }),
    [activeTab, winType, kiriageMangan],
  );

  const onToggleCell = blurToggleEnabled ? toggleCell : undefined;

  const controls = (
    <View style={styles.controlsWrap}>
      {/* 狭い画面ではグループ単位で折り返す */}
      <View style={styles.controls}>
        <View style={styles.control}>
          <ToggleGroup
            groups={[roleOptions]}
            selected={activeTab}
            onSelect={setActiveTab}
          />
        </View>
        <View style={styles.control}>
          <ToggleGroup
            groups={[winTypeOptions]}
            selected={winType}
            onSelect={setWinType}
          />
        </View>
        <View style={styles.control}>
          <ToggleGroup
            groups={[viewModeOptions]}
            selected={viewMode}
            onSelect={setViewMode}
          />
        </View>
      </View>
    </View>
  );

  const body = (
    <View style={styles.body}>
      {/* ツモの2段表示（子は上下、親はオール）の読み方を表の直前で補う */}
      {winType === "tsumo" && (
        <Text style={styles.note}>
          {isKo ? t("tsumoNote.ko") : t("tsumoNote.oya")}
        </Text>
      )}
      {viewMode === "normal" ? (
        <NormalScoreTable
          scoreGrid={scoreGrid}
          activeTab={activeTab}
          winType={winType}
          hiddenCells={hiddenCells}
          onToggleCell={onToggleCell}
          highlight={isFocusView ? focusTarget.normalCell : undefined}
          focusAnchor={focusAnchor}
        />
      ) : (
        <HighScoreTable
          activeTab={activeTab}
          winType={winType}
          hiddenCells={hiddenCells}
          onToggleCell={onToggleCell}
          highlightKey={isFocusView ? focusTarget.highScoreKey : undefined}
          focusAnchor={focusAnchor}
        />
      )}
      {/* 切り上げ満貫が動かすのは符×翻の表だけなので、満貫+ の表では出さない */}
      {kiriageMangan && viewMode === "normal" && (
        <View style={styles.kiriage}>
          <KiriageManganNote />
        </View>
      )}
    </View>
  );

  if (renderLayout !== undefined) return renderLayout({ controls, body });
  return (
    <View style={styles.stack}>
      {controls}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 4,
  },
  controlsWrap: {
    // 追従中に下の表が透けないよう地で塗る
    backgroundColor: colors.card,
    paddingBottom: 12,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  control: {
    flexShrink: 0,
  },
  body: {
    gap: 8,
  },
  note: {
    fontSize: 12,
    color: colors.surface500,
  },
  kiriage: {
    marginTop: 8,
  },
});
