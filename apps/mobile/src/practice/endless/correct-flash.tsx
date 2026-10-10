import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { borderWidth, colors, radius } from "../../lib/theme";

/** 表示しておく時間（web のトーストと同じ 1.5 秒） */
const FLASH_DURATION_MS = 1500;

/**
 * 正解したら自動で次へ進むときの「正解！」の一言
 * 正解フラッシュ
 *
 * web は短いトーストで知らせる。モバイルにはトーストの仕組みが無いため、
 * 画面上端に重ねて一定時間だけ出す（盤面の配置は動かさない）。`signal` が
 * 変わるたびに出し直す。
 */
export function CorrectFlash({
  signal,
  label,
}: {
  /** 出すたびに増える番号（0 は出さない） */
  readonly signal: number;
  readonly label: string;
}) {
  const insets = useSafeAreaInsets();
  // 出し終えた番号。`signal` がこれと違う間だけ出す
  const [expiredSignal, setExpiredSignal] = useState(0);

  useEffect(() => {
    if (signal === 0) return;
    const timer = setTimeout(() => setExpiredSignal(signal), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [signal]);

  if (signal === 0 || signal === expiredSignal) return undefined;
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + 8 }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.pill}>
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    borderWidth: borderWidth.panel,
    borderColor: colors.success,
    borderRadius: radius.full,
    backgroundColor: colors.successSubtle,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.successStrong,
  },
});
