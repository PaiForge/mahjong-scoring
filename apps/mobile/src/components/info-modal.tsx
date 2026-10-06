import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";
import { BottomSheet } from "./bottom-sheet";
import { Button } from "./button";

interface InfoModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel: string;
  /** 本文。文字列なら段落として描く */
  readonly children: ReactNode;
  /** 閉じるボタンの下に区切って置く補足（設定へのリンク等） */
  readonly footnote?: ReactNode;
}

/**
 * 説明のモーダル（web の `InfoModal`）
 *
 * 「?」から開く補足の説明。下からせり上がるシート（{@link BottomSheet}）で
 * 出し、本文が長いときはシートの中でスクロールする。
 */
export function InfoModal({
  isOpen,
  onClose,
  title,
  closeLabel,
  children,
  footnote,
}: InfoModalProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeLabel={closeLabel}
    >
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
        {typeof children === "string" ? (
          <Text style={styles.text}>{children}</Text>
        ) : (
          children
        )}
      </ScrollView>
      <View style={styles.actions}>
        <Button variant="neutral" fullWidth onPress={onClose}>
          {closeLabel}
        </Button>
      </View>
      {footnote !== undefined && (
        <View style={styles.footnote}>{footnote}</View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyInner: {
    paddingVertical: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  actions: {
    marginTop: 8,
  },
  footnote: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface300,
    paddingTop: 16,
  },
});
