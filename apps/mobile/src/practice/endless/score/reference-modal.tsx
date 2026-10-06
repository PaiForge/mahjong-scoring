import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslations } from "use-intl";

import { colors, radius } from "../../../lib/theme";

/**
 * 参照モーダル（web の `ReferenceModal`）
 * 早見表モーダル
 *
 * 答え合わせから出題ループを離脱せずに早見表を確かめるための器。見出し・
 * 閉じるボタン・スクロール枠の体裁だけを持ち、中身と開閉の制御は呼び出し側に
 * 任せる。パネルは押せないので影を持たず、太枠で区切る。
 */
export function ReferenceModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** モーダルの見出し（参照先のページタイトル） */
  readonly title: string;
  readonly children: ReactNode;
}) {
  const tCommon = useTranslations("common");

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={tCommon("close")}
              hitSlop={12}
            >
              {({ pressed }) => (
                <Text style={[styles.close, pressed && styles.closePressed]}>
                  {"×"}
                </Text>
              )}
            </Pressable>
          </View>
          <ScrollView style={styles.body}>{children}</ScrollView>
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
    padding: 12,
  },
  panel: {
    width: "100%",
    maxWidth: 672,
    maxHeight: "90%",
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  close: {
    fontSize: 24,
    lineHeight: 24,
    color: colors.surface400,
  },
  closePressed: {
    color: colors.surface600,
  },
  body: {
    flexGrow: 0,
  },
});
