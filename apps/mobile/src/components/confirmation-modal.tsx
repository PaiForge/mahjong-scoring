import { Modal, StyleSheet, Text, View } from "react-native";

import { borderWidth, colors, floatingShadow, radius } from "../lib/theme";
import { Button, type ButtonVariant } from "./button";

interface ConfirmationModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly message?: string;
  readonly confirmText: string;
  readonly cancelText: string;
  readonly confirmVariant?: ButtonVariant;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  /** Maestro のフローで引く印。確定のボタンに `<testID>-confirm` を付ける */
  readonly testID?: string;
}

/**
 * 確認モーダル（web の `ConfirmationModal`）
 *
 * 画面の上に浮く層なので、細枠に柔らかい影（`floatingShadow`）を添えて
 * 暗い幕から離す。地に置かれた面には影を付けない。
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = "primary",
  onConfirm,
  onClose,
  testID,
}: ConfirmationModalProps) {
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
          {message !== undefined && (
            <Text style={styles.message}>{message}</Text>
          )}
          <View style={styles.actions}>
            <Button
              variant="neutral"
              onPress={onClose}
              style={styles.action}
              fullWidth
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              onPress={onConfirm}
              testID={testID === undefined ? undefined : `${testID}-confirm`}
              style={styles.action}
              fullWidth
            >
              {confirmText}
            </Button>
          </View>
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
    maxWidth: 400,
    backgroundColor: colors.card,
    borderWidth: borderWidth.panel,
    borderColor: colors.panel,
    borderRadius: radius["2xl"],
    padding: 24,
    gap: 12,
    ...floatingShadow,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface600,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  action: {
    flex: 1,
  },
});
