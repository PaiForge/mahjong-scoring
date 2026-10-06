import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface AutoScaleProps {
  /**
   * 行の高さを決める基準の自然幅（px）
   *
   * 中身の幅で行の高さを決めると、出題が変わるたびに行の高さが揺れて下の
   * ボタンが動く。基準幅が収まる倍率で高さを固定し、それより広い中身は行の
   * 中でさらに縮める（web の `useAutoScale` の `referenceWidth` と同じ）。
   */
  readonly referenceWidth: number;
  /** 倍率 1 のときの行の高さ（px） */
  readonly naturalHeight: number;
  /** 倍率の上限（既定 1。拡大はしない） */
  readonly maxScale?: number;
  /** 縮める軸。手牌は下端（和了ラベルの分の余白を上に出す）、状況行は上端 */
  readonly anchor?: "top" | "bottom";
  readonly onScaleChange?: (scale: number) => void;
  readonly children: ReactNode;
}

/**
 * 幅に収まるまで中身を縮める行
 * 自動縮小
 *
 * web の `useAutoScale`（中身の自然幅を測って `transform: scale` で縮める）を
 * React Native で行う。中身は折り返さない自然幅のまま描いて測り、左端を軸に
 * 縮める。牌の並びのように折り返すと読めないものに使う。
 */
export function AutoScale({
  referenceWidth,
  naturalHeight,
  maxScale = 1,
  anchor = "bottom",
  onScaleChange,
  children,
}: AutoScaleProps) {
  const [available, setAvailable] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const referenceScale =
    available > 0 ? Math.min(maxScale, available / referenceWidth) : 0;
  const scale =
    available > 0 && contentWidth > 0
      ? Math.min(referenceScale, available / contentWidth)
      : referenceScale;

  useEffect(() => {
    if (scale > 0) onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  return (
    <View
      style={[styles.row, { height: naturalHeight * referenceScale }]}
      onLayout={(e) => setAvailable(e.nativeEvent.layout.width)}
    >
      <View
        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        style={[
          styles.content,
          anchor === "bottom" ? styles.bottom : styles.top,
          {
            opacity: available > 0 ? 1 : 0,
            transformOrigin: anchor === "bottom" ? "left bottom" : "left top",
            transform: [{ scale: scale > 0 ? scale : 1 }],
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    overflow: "hidden",
    alignSelf: "stretch",
  },
  content: {
    position: "absolute",
    left: 0,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bottom: {
    bottom: 0,
  },
  top: {
    top: 0,
    alignItems: "center",
  },
});
