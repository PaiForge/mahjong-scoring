/**
 * sessionStorage パーサーファクトリー
 * セッションストレージパーサー生成
 *
 * JSON 文字列から型安全に配列をパースする共通ロジックを提供する。
 * 各練習の結果型に対応した型ガード関数を渡すことで、専用パーサーを生成できる。
 *
 * @param guard - 要素が型 T として妥当かを判定する型ガード関数
 * @returns sessionStorage の生文字列を受け取り、バリデーション済みの配列を返すパーサー関数
 */
export function createSessionStorageParser<T>(
  guard: (v: unknown) => v is T,
): (raw: string | undefined) => readonly T[] {
  return (raw: string | undefined): readonly T[] => {
    if (raw === undefined) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(guard);
    } catch {
      return [];
    }
  };
}
