import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius } from "../lib/theme";
import { DashedDivider } from "./dashed-divider";
import { ChevronRightIcon } from "./icons/icons";

interface AccordionCardProps {
  /** 見出し（常に見える行）。文字は呼び出し側が `Text` で包む */
  readonly title: ReactNode;
  /** 見出しの右端に添えるもの（正誤の印など） */
  readonly trailing?: ReactNode;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

/**
 * 開閉する枠（web の `AccordionCard`）
 *
 * 押せる面ではあるが、読み物を畳んでいるだけなので影は付けない。
 */
export function AccordionCard({
  title,
  trailing,
  defaultOpen = false,
  children,
}: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <View style={isOpen && styles.chevronOpen}>
            <ChevronRightIcon size={12} color={colors.surface400} />
          </View>
          {title}
        </View>
        {trailing !== undefined && (
          <View style={styles.trailing}>{trailing}</View>
        )}
      </Pressable>
      {isOpen && (
        <View style={styles.body}>
          <DashedDivider thickness={2} />
          <View style={styles.bodyInner}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  chevronOpen: {
    transform: [{ rotate: "90deg" }],
  },
  trailing: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  body: {
    backgroundColor: colors.surface50,
  },
  bodyInner: {
    padding: 12,
    gap: 12,
  },
});
