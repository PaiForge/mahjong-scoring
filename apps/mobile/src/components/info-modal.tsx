import type { ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";
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
 * パネルは押せないので影を持たず、太枠で区切る。
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
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.body}>
            {typeof children === "string" ? (
              <Text style={styles.text}>{children}</Text>
            ) : (
              children
            )}
          </ScrollView>
          <View style={styles.actions}>
            <Button variant="neutral" onPress={onClose}>
              {closeLabel}
            </Button>
          </View>
          {footnote !== undefined && (
            <View style={styles.footnote}>{footnote}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface900,
  },
  body: {
    flexGrow: 0,
  },
  text: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface700,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  footnote: {
    borderTopWidth: 2,
    borderTopColor: colors.surface100,
    paddingTop: 16,
  },
});
