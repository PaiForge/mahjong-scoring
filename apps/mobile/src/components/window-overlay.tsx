import type { ReactNode } from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

/**
 * ネイティブのモーダルより上に描く層
 * 窓の最前面
 *
 * ルートに置いた RN の view（トースト・更新必須の覆い）は、iOS ではネイティブの
 * モーダル（解答中の全画面・アカウントのモーダル・詳細のシート）の下になる。
 * モーダルは別の UIViewController として窓の上に提示され、ルートの view の
 * 兄弟にはならないため。解答中に出す「回数制限に達しました」等のトーストが
 * 見えなくなるので、iOS では react-native-screens の `FullWindowOverlay`
 * （窓の最前面の view）に描く。その view の外側（子の無いところ）のタップは
 * 下の画面へ通る。
 *
 * Android はモーダルも同じ view の木の中に描くので、包まずそのまま描く
 * （`FullWindowOverlay` も iOS 以外では何もしない）。
 */
export function WindowOverlay({ children }: { readonly children: ReactNode }) {
  if (Platform.OS !== "ios") return children;
  return <FullWindowOverlay>{children}</FullWindowOverlay>;
}
