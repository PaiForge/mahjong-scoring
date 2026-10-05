import { Modal, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";
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
}

/**
 * 確認モーダル（web の `ConfirmationModal`）
 *
 * パネルは押せないので影を持たず、太枠で区切る。
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
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  message: {
    fontSize: 14,
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
