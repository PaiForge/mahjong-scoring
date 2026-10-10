import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";
import { BottomSheet, SheetScrollView } from "./bottom-sheet";
import { Button } from "./button";

/**
 * ヘルプの 1 枚
 * ツアースライド
 */
export interface HelpTourStep {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  /**
   * 見本（実物のコンポーネント）。練習の進め方のように「始めた後の画面」を
   * 先に見せるときに渡す。押せないように描く。画面の操作の説明（web の
   * スポットライトツアー）は今の画面に実物があるので渡さない
   */
  readonly node?: ReactNode;
}

/** シートのボタンと進み具合の文言 */
export interface HelpTourLabels {
  readonly prev: string;
  readonly next: string;
  readonly close: string;
  /** 「2 / 5」の書式 */
  readonly progress: (current: number, total: number) => string;
}

/**
 * 「?」から開く、手順を 1 枚ずつ送るシート
 * ヘルプツアーシート
 *
 * web のヘルプは 2 種類ある。設定画面の「?」は練習の進め方を実物の
 * コンポーネントのカルーセルで見せ（`HelpTourModal`）、play 画面と道場の「?」は
 * 画面の要素を順に照らして 1〜2 文で説明する（`SpotlightTour`。driver.js）。
 * モバイルには要素を照らす仕組みが無いので、どちらも下からのシートで
 * 1 枚ずつ送る形にそろえ、前者だけ見本を添える。開くたびに 1 枚目へ戻る。
 */
export function HelpTourSheet({
  isOpen,
  onClose,
  title,
  steps,
  labels,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** シートの見出し（「練習の進め方」）。省略すると 1 枚ごとの題だけを出す */
  readonly title?: string;
  readonly steps: readonly HelpTourStep[];
  readonly labels: HelpTourLabels;
}) {
  const [index, setIndex] = useState(0);
  // 開き直したら 1 枚目から（描画中に前回の開閉と比べて戻す）
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setIndex(0);
  }

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <BottomSheet
      isOpen={isOpen && step !== undefined}
      onClose={onClose}
      title={title}
    >
      {step !== undefined && (
        <View style={styles.body}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.stepTitle}>
              {step.title}
            </Text>
            <Text style={styles.progress}>
              {labels.progress(index + 1, steps.length)}
            </Text>
          </View>
          <SheetScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollInner}
          >
            <Text style={styles.description}>{step.description}</Text>
            {step.node !== undefined && (
              <View
                style={styles.sample}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {step.node}
              </View>
            )}
          </SheetScrollView>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                variant="neutral"
                fullWidth
                disabled={isFirst}
                onPress={() => setIndex(index - 1)}
              >
                {labels.prev}
              </Button>
            </View>
            <View style={styles.action}>
              <Button
                fullWidth
                onPress={isLast ? onClose : () => setIndex(index + 1)}
              >
                {isLast ? labels.close : labels.next}
              </Button>
            </View>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    flexShrink: 1,
    gap: 12,
  },
  heading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  stepTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  progress: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    color: colors.surface500,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollInner: {
    gap: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  sample: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.surface50,
    padding: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 4,
  },
  action: {
    flex: 1,
  },
});
