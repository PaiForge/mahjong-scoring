import { Button } from "./button";

/**
 * 一覧の末尾の「さらに読み込む」（web のページ送りに当たる）
 * さらに読み込むボタン
 *
 * `useLoadMore` の状態をそのまま受ける。続きが無ければ何も描かず、読み込んで
 * いる間は押せない。文言は一覧ごとの辞書から引いた文字を渡す。
 */
export function LoadMoreButton({
  hasMore,
  loading,
  onPress,
  label,
  testID,
}: {
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly onPress: () => void;
  readonly label: string;
  /** Maestro のフローで引く印 */
  readonly testID: string;
}) {
  if (!hasMore) return null;
  return (
    <Button
      variant="secondary"
      fullWidth
      testID={testID}
      disabled={loading}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
