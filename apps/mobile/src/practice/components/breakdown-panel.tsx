import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BreakdownKind } from "@mahjong-scoring/features/results/breakdown-tabs";

import { ChevronDownIcon } from "../../components/icons/icons";
import { ToggleGroup } from "../../components/toggle-group";
import { panelFrame } from "../../lib/panel-styles";
import { colors, radius } from "../../lib/theme";

/** 切り替えの 1 枠（翻数の内訳 / 符の内訳） */
export interface BreakdownPanelSection {
  readonly kind: BreakdownKind;
  /** 切り替えの文言。何の内訳かと、その合計（例: 「翻数 3翻」） */
  readonly tabLabel: string;
  /** 選んだときに出す内訳の表 */
  readonly content: ReactNode;
}

/**
 * 翻数・符の内訳をまとめた展開エリア（web の `BreakdownPanel`）
 * 内訳パネル
 *
 * 答え合わせの下に 1 行の入口だけを置き、開いたときだけ「符 / 翻数」の
 * 切り替え（{@link ToggleGroup}）と選んだ内訳を出す。翻数・符の行の直後に
 * それぞれ開閉を挟むと、開いたときに翻・符・点数の比較が縦に引き離される。
 *
 * - 既定で閉じる。不正解でも勝手に開かない
 * - 開いたときの選択は呼び出し側が `initialKind` で渡す（間違えたほうの内訳）。
 *   選び直したらそれを保つ
 * - 内訳が 1 種類なら切り替えを出さず、その内訳をそのまま出す
 * - 問題が変わったら閉じた状態に戻す。置く側が問題ごとに作り直す（`key`）
 *
 * 入口は押せる行の定石（文言を左・右端に矢印・押している間は地の色）で、
 * 開くと矢印が上を向く。開いても入口は同じ位置に残り、その下に切り替えと
 * 内訳が続く。
 */
export function BreakdownPanel({
  title,
  sections,
  initialKind,
  surface = "raised",
  testID,
}: {
  /** 開閉の入口の文言（「内訳を確認」） */
  readonly title: string;
  /** 並べる内訳。並びはこの配列の順（`resolveBreakdownTabs` の `kinds`） */
  readonly sections: readonly BreakdownPanelSection[];
  /** 開いたときに選ぶ内訳。省略時は先頭 */
  readonly initialKind?: BreakdownKind;
  /**
   * 内訳の表を載せる面（既定 `raised`）。`raised` は白地に淡い枠（灰の地や
   * 面を持たない盤面の末尾に置くとき）、`sunken` は枠なしの淡い灰（白い面 =
   * 答え合わせの表の枠の中に置くとき。白い枠を入れ子にしない）
   */
  readonly surface?: "raised" | "sunken";
  /** Maestro のフローで引く印。入口に付け、切り替えには `<testID>-tab-<種類>` を付ける */
  readonly testID?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [chosenKind, setChosenKind] = useState<BreakdownKind | undefined>(
    undefined,
  );

  const selected =
    sections.find((section) => section.kind === chosenKind) ??
    sections.find((section) => section.kind === initialKind) ??
    sections[0];
  if (selected === undefined) return undefined;

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        testID={testID}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Text style={styles.triggerLabel}>{title}</Text>
        <View style={isOpen && styles.chevronOpen}>
          <ChevronDownIcon size={18} color={colors.surface400} />
        </View>
      </Pressable>
      {isOpen && (
        <View style={styles.body}>
          {sections.length > 1 && (
            <View style={styles.tabs}>
              <ToggleGroup
                groups={[
                  sections.map((section) => ({
                    value: section.kind,
                    label: section.tabLabel,
                  })),
                ]}
                selected={selected.kind}
                onSelect={setChosenKind}
                testID={testID === undefined ? undefined : `${testID}-tab`}
              />
            </View>
          )}
          {/* 内訳の表は合計の線を持つので、答え合わせの表の罫線と紛れない
              よう地の色を変えた面に載せる */}
          <View style={SURFACE_STYLES[surface]}>{selected.content}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: radius.md,
  },
  pressed: {
    backgroundColor: colors.surface100,
  },
  triggerLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface700,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  body: {
    gap: 12,
    paddingBottom: 4,
  },
  tabs: {
    alignItems: "center",
  },
  raised: {
    ...panelFrame,
    padding: 12,
  },
  sunken: {
    borderRadius: radius.panel,
    backgroundColor: colors.surface50,
    padding: 12,
  },
});

const SURFACE_STYLES = {
  raised: styles.raised,
  sunken: styles.sunken,
} as const;
