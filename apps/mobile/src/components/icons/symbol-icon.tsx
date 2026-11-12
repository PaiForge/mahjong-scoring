import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { colors } from "../../lib/theme";

/** アプリが使う記号の名前（OS の記号の名前に依らない呼び名） */
export type SymbolName =
  | "chevronRight"
  | "chevronLeft"
  | "close"
  | "help"
  | "person"
  | "chart"
  | "trophy"
  | "star"
  | "bell"
  | "settings"
  | "home"
  | "dojo"
  | "practice"
  | "lessons"
  | "scoreTable";

/**
 * 呼び名と OS の記号の対応表（iOS は SF Symbols、Android は Material Symbols）
 *
 * タブの 5 つ（home〜scoreTable）は `app/(tabs)/_layout.tsx` のタブのアイコンと
 * 同じ記号にする（タブは選択中に塗りの記号へ替えるので、そちらは自分で持つ）。
 */
const SYMBOLS: Readonly<Record<SymbolName, SymbolViewProps["name"]>> = {
  chevronRight: { ios: "chevron.right", android: "chevron_right" },
  chevronLeft: { ios: "chevron.left", android: "chevron_left" },
  close: { ios: "xmark", android: "close" },
  help: { ios: "questionmark", android: "question_mark" },
  person: { ios: "person", android: "person" },
  chart: { ios: "chart.bar", android: "bar_chart" },
  trophy: { ios: "trophy", android: "trophy" },
  star: { ios: "star", android: "star" },
  bell: { ios: "bell", android: "notifications" },
  settings: { ios: "gearshape", android: "settings" },
  home: { ios: "house", android: "home" },
  dojo: { ios: "figure.martial.arts", android: "sports_martial_arts" },
  practice: { ios: "dumbbell", android: "fitness_center" },
  lessons: { ios: "book", android: "menu_book" },
  scoreTable: { ios: "tablecells", android: "table_chart" },
};

/**
 * OS の記号で描くアイコン
 * 記号アイコン
 *
 * タブ・ヘッダー・行のアイコンは OS の記号（`expo-symbols`）で描く。iOS は
 * SF Symbols（文字の太さと揃い、Dynamic Type や Liquid Glass のヘッダーの中でも
 * OS のボタンと同じ見た目になる）、Android は Material Symbols のフォント。
 * 盤面・ボタンの中のアイコンは対象外で、これまでどおり SVG（`icons.tsx`）で描く —
 * 盤面の絵柄は OS の記号に無く、ボタンの中は web と同じ形を保つため。
 *
 * 記号を描けないとき（Android でフォントの記号名が無い等）は `fallback` を描く。
 * 呼び出し側は従来の SVG を渡しておけば、OS の記号が無い環境でも形が消えない。
 */
export function SymbolIcon({
  name,
  size = 24,
  color = colors.surface700,
  fallback,
}: {
  readonly name: SymbolName;
  readonly size?: number;
  readonly color?: ColorValue;
  readonly fallback?: ReactNode;
}): ReactNode {
  return (
    <SymbolView
      name={SYMBOLS[name]}
      size={size}
      tintColor={color}
      fallback={fallback}
      // 記号は飾り。読み上げは押す部品（ボタン・行）の名前で行う
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}
