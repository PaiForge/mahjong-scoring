import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { BottomSheet } from "../../../components/bottom-sheet";
import { ScrollIntoViewScrollView } from "../../../components/scroll-into-view";

/**
 * 参照シート（web の `ReferenceModal`）
 * 早見表モーダル
 *
 * 答え合わせから出題ループを離脱せずに早見表を確かめるための器。見出しと
 * スクロール枠の体裁だけを持ち、中身と開閉の制御は呼び出し側に任せる。
 * web は中央のモーダルだが、モバイルでは表を読ませるものは下からのシート
 * （{@link BottomSheet}）に置く — 中央のダイアログは確認だけに使う。
 *
 * シートの高さは中身に合わせず固定する。点数早見表は符×翻と満貫以上で
 * 行数が、ロンとツモでセルの段数が違い、中身に合わせるとタブを切り替える
 * たびにシートの上端が上下して、押した切り替えの位置まで動いてしまう。
 */
export function ReferenceModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** シートの見出し（参照先のページタイトル） */
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} size="tall">
      {/* 中身（点数早見表）が注目セルを中央へ寄せられるスクロール枠 */}
      <ScrollIntoViewScrollView style={styles.body}>
        {children}
      </ScrollIntoViewScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
