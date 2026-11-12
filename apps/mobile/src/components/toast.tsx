import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from "react-native-toast-message";

import { CircleCheckIcon, CircleInfoIcon } from "./icons/icons";
import { borderWidth, colors, floatingShadow, radius } from "../lib/theme";

/**
 * 出し方（web の `ToastCard` の 2 段の強さ）
 *
 * - `success` — 濃い塗りに白文字の「完了」（登録・保存・ログアウト）
 * - `notice` — 淡い琥珀に濃い文字の「報告」（練習を終了した等、正誤でも完了でもないもの）
 */
export type ToastTone = "notice" | "success";

/** 表示時間。web（`GlobalToaster`）と同じ 3 秒 */
const VISIBLE_MS = 3000;

/** 帯の下端と、下の縁（タブバー・ホームインジケーター）との間 */
const EDGE_GAP = 12;

/**
 * タブの入口で、画面下端の safe area の上に空ける高さ（タブバーのぶん）
 *
 * タブバーは OS のもの（`NativeTabs`）で、高さを JS から読めない（iOS 26 以降は
 * 浮いて、スクロールで縮む）。そこで OS ごとの定数で持ち、トーストは縮む前の
 * タブバーの上端より上に出す（縮んだときは間が少し開くだけで重ならない）。
 *
 * 値の測り方: Release ビルド（`sim:release`）でタブの入口を開き、
 * `maestro hierarchy` で `tab-home` 等のタブの要素の枠（bounds）の上端を読む。
 * 画面の高さ − 上端 − 下端の safe area がこの値（タブの要素の枠はタブバーの
 * ガラスの面より数 pt 内側なので、面の縁まで少し足す）。iPhone 17 Pro
 * （iOS 27）で測った。OS を上げてタブバーの形が変わったら測り直す。
 * Android は Material 3 のタブバーの既定の高さ（80dp）。下端の safe area
 * （ナビゲーションバー）は NativeTabs が包むので、ここでは別に足す。
 */
const TAB_BAR_CLEARANCE = Platform.OS === "ios" ? 62 : 80;

/**
 * 画面下に短い知らせを出す
 * トースト
 *
 * 出すのは「読み流してよい完了」だけ（登録した・保存した・練習を終了した）。
 * 次の行動が要る知らせ（確認メールを送った・退会を受け付けた）は画面や
 * パネルに残し、失敗の理由はフォームの下（`FormMessage`）に出す。取り返しの
 * つかない操作の確認は `ConfirmationModal` で、トーストで代用しない。
 *
 * 画面を離れる操作では、遷移を呼んだ直後に出してよい。ホスト（{@link ToastHost}）は
 * ルートレイアウトにいて遷移をまたいで生き、ネイティブの遷移は 0.3 秒ほどで
 * 終わるため、web の `toastOnArrival`（着地を待ってから出す）は要らない。
 *
 * 帯は見た目だけで読み上げに届かないので、出すと同時に読み上げさせる。
 */
export function showToast(message: string, tone: ToastTone = "notice"): void {
  Toast.show({ type: tone, text1: message });
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * トーストの置き場所
 *
 * 位置は Android の Snackbar と同じ画面下で、タブバーがある画面ではその上に
 * 出す（iOS には OS 標準のトーストが無く、他のアプリもアプリ自身が画面下か
 * 上端に帯を描く。上端は OS の通知バナーと重なるので使わない）。キーボードが
 * 出ていればその上へ逃げる（ライブラリが持つ）。
 *
 * タブバーは iOS 26 以降は本文の上に浮くので、帯をタブバーの上端で切らない
 * （切る線が浮いたバーの縁と揃わず、帯の影が水平線になって見える）。
 * タブバーぶんの高さは {@link TAB_BAR_CLEARANCE}。
 *
 * ルートレイアウトで `WindowOverlay` の中に置く（iOS のネイティブのモーダルより
 * 上に出すため。解答中の全画面のモーダルでも見える）。
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const segments: readonly string[] = useSegments();
  const onTabs = segments[0] === "(tabs)";
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.area,
        { bottom: insets.bottom + (onTabs ? TAB_BAR_CLEARANCE : 0) },
      ]}
    >
      <Toast
        config={TOAST_CONFIG}
        position="bottom"
        bottomOffset={EDGE_GAP}
        visibilityTime={VISIBLE_MS}
      />
    </View>
  );
}

function ToastBar({
  tone,
  text1,
  isVisible,
}: ToastConfigParams<unknown> & { readonly tone: ToastTone }) {
  if (text1 === undefined) return null;
  const success = tone === "success";
  const foreground = success ? colors.white : colors.warningStrong;
  const Icon = success ? CircleCheckIcon : CircleInfoIcon;
  return (
    <View
      // 消えている間（退出の途中を含む）は下の画面のタップを奪わない
      pointerEvents={isVisible ? "box-none" : "none"}
      style={styles.row}
    >
      <View
        style={[styles.bar, success ? styles.success : styles.notice]}
        testID="toast"
      >
        <Icon size={20} color={foreground} />
        <Text style={[styles.text, { color: foreground }]}>{text1}</Text>
      </View>
    </View>
  );
}

const TOAST_CONFIG: ToastConfig = {
  success: (params) => <ToastBar {...params} tone="success" />,
  notice: (params) => <ToastBar {...params} tone="notice" />,
};

const styles = StyleSheet.create({
  area: {
    ...StyleSheet.absoluteFill,
  },
  row: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bar: {
    ...floatingShadow,
    width: "100%",
    // タブレットで横に伸びすぎないよう抑える（Material の Snackbar の上限と同じ）
    maxWidth: 560,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    // web の `border-black/5`。塗りが下地に溶けても縁が残る
    borderWidth: borderWidth.panel,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  // 色は状態色の値をそのまま引く（web の `ToastCard`）。報告に白ではなく淡い
  // 琥珀を使うのは、白だと下地の白い画面に溶けて出たことに気づけないため
  success: {
    backgroundColor: colors.success,
  },
  notice: {
    backgroundColor: colors.warningSubtle,
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
});
