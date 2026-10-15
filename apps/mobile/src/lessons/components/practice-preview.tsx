import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { panelFrame } from "../../lib/panel-styles";
import { colors } from "../../lib/theme";
import { GuideFigure } from "./guide-figure";

/**
 * 練習画面のプレビュー（web の `PracticePreview`）
 *
 * 本文で説明したことを、実際の練習の盤面で見せる図。実物のコンポーネントを
 * 描くため、練習の画面を直せば勝手に追従する。
 *
 * 図の中はタッチを通さず（`pointerEvents="none"`）、読み上げからも外す。
 * 盤面の選択肢は見た目だけで答えを受け付けないため。何の画面かは
 * キャプションが言葉で伝え、練習へのリンクもそこに置く。
 */
export function PracticePreview({
  caption,
  children,
}: {
  /** 図の下に添える説明（どの練習の、どんな画面か） */
  readonly caption: ReactNode;
  /** 練習の盤面 */
  readonly children: ReactNode;
}) {
  return (
    <GuideFigure caption={caption}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.frame}
      >
        {children}
      </View>
    </GuideFigure>
  );
}

const styles = StyleSheet.create({
  frame: {
    ...panelFrame,
    backgroundColor: colors.surface50,
    padding: 16,
  },
});
