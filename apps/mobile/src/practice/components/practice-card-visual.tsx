import { Hai } from "@pai-forge/mahjong-react-ui";
import { StyleSheet, Text, View } from "react-native";
import type {
  PracticeCardVisual as CardVisual,
  ResolvedSubject,
} from "@mahjong-scoring/features/practice/card-visual";
import { orderFuHan } from "@mahjong-scoring/features/settings/fu-han-order";

import { TehaiHand } from "../../board/tehai-hand";
import { useFuHanOrder } from "../../hooks/use-display-settings-store";
import { colors, radius } from "../../lib/theme";

/** 出題があらかじめ示している値のピル（鳴き・翻数）。琥珀色は「前提」の色 */
function VisualPill({ label }: { readonly label: string }) {
  return <Text style={styles.pill}>{label}</Text>;
}

/** 帯の上段 */
function SubjectContent({ subject }: { readonly subject: ResolvedSubject }) {
  const fuHanOrder = useFuHanOrder();
  if (subject.kind === "hand") {
    return (
      <View style={styles.hand}>
        <TehaiHand tehai={{ closed: subject.tiles, exposed: [] }} />
      </View>
    );
  }
  if (subject.kind === "fuHan") {
    return (
      <Text style={styles.label}>
        {orderFuHan(fuHanOrder, { fu: subject.fu, han: subject.han }).join(" ")}
      </Text>
    );
  }
  if (subject.kind === "labels") {
    return (
      <View style={styles.inline}>
        {subject.pill !== undefined && <VisualPill label={subject.pill} />}
        <Text style={styles.label}>{subject.text}</Text>
      </View>
    );
  }
  const size = subject.size ?? "sm";
  return (
    <View style={styles.inline}>
      {/* まとまりの間は牌と牌の間より広く空ける（面子と雀頭が 1 続きに見えないように） */}
      <View style={[styles.inline, styles.groups]}>
        {subject.groups.map((group, i) => (
          <View key={i} style={styles.tiles}>
            {group.map((hai, j) => (
              <Hai key={j} hai={hai} size={size} alt="" />
            ))}
          </View>
        ))}
      </View>
      {subject.agariHai !== undefined && (
        <>
          <Text style={styles.plus}>+</Text>
          <Hai hai={subject.agariHai} size={size} alt="" />
        </>
      )}
    </View>
  );
}

/**
 * 練習カードの例示の帯（web の `PracticeCardVisual`）
 * 例示の帯
 *
 * 卓と同じ濃い緑に、その練習の出題で見えるもの（牌・役名・符と翻）と
 * 答えの単位（「符は？」）を並べる。何を例示するかは features の
 * `practiceCardVisual` が決める。読み上げには載せない（練習名と重複する）。
 */
export function PracticeCardVisual({
  visual,
}: {
  readonly visual: CardVisual;
}) {
  return (
    <View
      style={styles.band}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SubjectContent subject={visual.subject} />
      <View style={styles.inline}>
        {visual.note !== undefined && <VisualPill label={visual.note} />}
        <Text style={styles.unit}>{visual.unitLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    height: 80,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.primary800,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  hand: {
    alignSelf: "stretch",
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  groups: {
    gap: 12,
  },
  tiles: {
    flexDirection: "row",
    gap: 4,
  },
  plus: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  pill: {
    overflow: "hidden",
    borderRadius: 9999,
    backgroundColor: colors.amber50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "#b45309",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  unit: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
});
