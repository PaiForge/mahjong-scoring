import { BottomSheet as NativeBottomSheet, RNHostView } from "@expo/ui";
import type { ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { colors } from "../lib/theme";

/**
 * 高い方のシートの高さ（画面の割合）
 *
 * 中身なり（`content`）の上限もこれ。超える分は中身のスクロール枠が受け持つ。
 * 上に元の画面を少し残し、シート（一時的に重ねたもの）だと分かるようにする
 */
const TALL_HEIGHT_RATIO = 0.85;

/**
 * シートの高さ
 *
 * - `content` — 中身の高さ（画面の 85% が上限）。説明・短い選択肢
 * - `tall` — 高さを固定し、中身がそれを埋める。一覧や表のように中身が自分で
 *   スクロールするもの・中身を切り替えても上端を動かしたくないもの。iOS は
 *   画面の 85%、Android は全画面（Material 3 のシートは半分と全画面の 2 段
 *   しか持たず、半分では一覧が窮屈）
 */
export type BottomSheetSize = "content" | "tall";

interface BottomSheetProps {
  readonly isOpen: boolean;
  /** 背景のタップ・引き下げ・Android の戻るボタンで閉じるとき */
  readonly onClose: () => void;
  /** 上端の見出し。省略すると出さない */
  readonly title?: string;
  /** シートの高さ。既定は中身の高さ */
  readonly size?: BottomSheetSize;
  readonly children: ReactNode;
}

/**
 * 下からせり上がるシート（ボトムシート）
 * ボトムシート
 *
 * 説明・選択肢の一覧・補足の設定など、画面の上に一時的に重ねて読ませる /
 * 選ばせるものの器。スマホアプリでは中央のダイアログより下からのシートが
 * 定石（親指で届き、背景を押せば閉じる）。
 *
 * 中身は OS 標準のシート（`@expo/ui` の `BottomSheet`。iOS は SwiftUI の
 * `.sheet`、Android は Material 3 の `ModalBottomSheet`）。引き下げ・払い・
 * 中身のスクロールが先頭に戻ってからの引き下げ・閉じるときの動き・幕・
 * 取っ手は、どれも各 OS のものがそのまま出る。iOS の見た目を Android に
 * 寄せるのではなく、それぞれの OS で指が覚えている振る舞いに合わせる。
 *
 * 以前は RN の `Modal` に `PanResponder` と `Animated` で引き下げを自作して
 * いたが、次の 2 点で標準のシートと食い違った:
 *
 * - 掴めるのは取っ手と見出しの細い帯だけで、本文を引いても動かない
 *   （スクロールの先頭からの引っ張りは指を離した瞬間に判定するだけで、
 *   シートが指に付いてこない。Android にはその経路も無い）
 * - 閉じる動きが時間固定のイージングで、指を離した速さを引き継がない。
 *   標準のシートは離した速さを初速にしたばねで下がる
 *
 * スクロールとの受け渡しを手で書き足すより、OS の部品に任せる方が確実。
 * `@gorhom/bottom-sheet`（reanimated と gesture-handler で JS から再現する）も
 * 採らなかった。調整で手触りを寄せられても標準のシートそのものにはならず、
 * OS の更新（iOS のシートの動きの変更等）にも追随しない。
 *
 * OS 標準のシートでも expo-router の `presentation: "formSheet"` は使わない。
 * 画面（ルート）として開く仕組みで、選択欄のようにその場で開いて値を返す
 * 使い方に合わない。`@expo/ui` のシートは `isPresented` で開閉する部品。
 *
 * RN の中身は `RNHostView` で包んでネイティブのシートへ載せる。中身なりの
 * 高さは `matchContents`（Yoga の高さをシートへ伝える）、Android の全画面は
 * シートの高さを Yoga へ伝えて中身が埋める。
 *
 * 下端の余白はシートがホームインジケーター / ナビゲーションバーの分を取るので、
 * `useSafeAreaInsets().bottom` を足すと二重になる。キーボードの回避も OS が行う
 * （iOS はシートが large まで上がる）。
 *
 * 背景（幕）には読み上げ名を付けられない（OS が描く）。閉じる操作は
 * iOS の VoiceOver の標準の操作（2 本指の Z）と Android の幕・戻るが担い、
 * 中身の側にも閉じる / 完了のボタンを置く。
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  size = "content",
  children,
}: BottomSheetProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // シートの高さを中身から決めるか（iOS は常に。Android は中身なりのときだけ）。
  // iOS の割合の段（presentationDetents の fraction）は、RN の中身へ段の高さが
  // 伝わらず全高で描かれる（一覧の下端と下のボタンがシートの外にはみ出す）。
  // 中身なり（fitToContents）は中身の Yoga の高さを段にするので、固定の高さも
  // 中身の側で高さを決めて中身なりで出す
  const sizesFromContent = Platform.OS === "ios" || size === "content";

  return (
    <NativeBottomSheet
      isPresented={isOpen}
      onDismiss={onClose}
      // Android の tall は全画面にして中身に高さを与える（中身なりだと
      // 一覧の高さが決まらない）
      snapPoints={sizesFromContent ? undefined : ["full"]}
      contentPadding={0}
      containerColor={colors.card}
    >
      <RNHostView matchContents={sizesFromContent}>
        <View
          style={[
            styles.sheet,
            // 中身なりのときは幅も中身なり（fit-content）に測られ、段落が
            // 折り返さずに横へ伸びる。幅はシート（画面幅）に合わせる
            { width: windowWidth },
            size === "content"
              ? { maxHeight: windowHeight * TALL_HEIGHT_RATIO }
              : sizesFromContent
                ? { height: windowHeight * TALL_HEIGHT_RATIO }
                : styles.fill,
          ]}
        >
          {title !== undefined && <Text style={styles.title}>{title}</Text>}
          <View style={size === "content" ? styles.content : styles.fill}>
            {children}
          </View>
        </View>
      </RNHostView>
    </NativeBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    // 取っ手は OS が描く。見出しをその下に置く
    paddingTop: Platform.OS === "ios" ? 24 : 0,
    paddingHorizontal: 20,
    // ホームインジケーター・ナビゲーションバーの分はシートが取る
    paddingBottom: 16,
    gap: 12,
  },
  content: {
    flexShrink: 1,
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
