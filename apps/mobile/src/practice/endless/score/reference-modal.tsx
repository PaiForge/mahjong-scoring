import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { BottomSheet } from "../../../components/bottom-sheet";

/**
 * 参照シート（web の `ReferenceModal`）
 * 早見表モーダル
 *
 * 答え合わせから出題ループを離脱せずに早見表を確かめるための器。見出しと
 * スクロール枠の体裁だけを持ち、中身と開閉の制御は呼び出し側に任せる。
 * web は中央のモーダルだが、モバイルでは表を読ませるものは下からのシート
 * （{@link BottomSheet}）に置く — 中央のダイアログは確認だけに使う。
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
  const tCommon = useTranslations("common");

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeLabel={tCommon("close")}
    >
      <ScrollView style={styles.body}>{children}</ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 0,
  },
});
