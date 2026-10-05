import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "../lib/theme";

interface BottomSheetProps {
  readonly isOpen: boolean;
  /** 背景のタップ・Android の戻るボタンで閉じるとき */
  readonly onClose: () => void;
  /** 上端の見出し。省略すると出さない */
  readonly title?: string;
  /** 背景の読み上げ名（「閉じる」）。背景を押すと閉じることを伝える */
  readonly closeLabel: string;
  /**
   * シートの高さ
   *
   * 既定は中身の高さ（画面の 85% が上限）。一覧のように中身が自分で
   * スクロールするものは固定の高さ（画面の割合）を渡し、中身がそれを埋める
   */
  readonly height?: DimensionValue;
  readonly children: ReactNode;
}

/**
 * 下からせり上がるシート（ボトムシート）
 * ボトムシート
 *
 * 説明・選択肢の一覧・補足の設定など、画面の上に一時的に重ねて読ませる /
 * 選ばせるものの器。スマホアプリでは中央のダイアログより下からのシートが
 * 定石（親指で届き、背景を押せば閉じる）。上端の取っ手は「引き下げて
 * 閉じられる」印で、OS 標準のシートと同じ記号。
 *
 * 押せる面ではないので影は持たず、web のモーダルの太枠も持たない（画面の
 * 下端から生える面なので、枠で区切るより地の暗さで浮かせる）。
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  closeLabel,
  height,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        />
        <View
          style={[
            styles.sheet,
            height === undefined ? styles.sheetAuto : { height },
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.grabber} />
          {title !== undefined && <Text style={styles.title}>{title}</Text>}
          <View style={height === undefined ? styles.content : styles.fill}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  sheetAuto: {
    maxHeight: "85%",
  },
  content: {
    flexShrink: 1,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface300,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  fill: {
    flex: 1,
  },
});
