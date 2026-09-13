import type { ZodType } from "zod";

/**
 * sessionStorage パーサーファクトリー
 * セッションストレージパーサー生成
 *
 * sessionStorage から読んだ値（JSON をデコードした後の unknown）を型安全な
 * 配列に選別する共通ロジックを提供する。各練習の結果型に対応した検証スキーマを
 * 渡すことで、専用パーサーを生成できる。JSON のデコードと封筒の開封は
 * 読む側（`useSessionStorageResult`）の担当で、ここは要素の形だけを見る。
 *
 * スキーマは `z.ZodType<結果型>` を注釈して渡すこと。注釈があると結果型に
 * フィールドが増えたときスキーマ側がコンパイルエラーになり、型と検証が
 * ずれたまま出荷されるのを防げる。
 *
 * 妥当な要素は**保存されていたオブジェクトをそのまま**返す（`safeParse` の
 * 出力ではない）。zod はスキーマに無いキーを落とすため、出力を返すと壊れた
 * 行を弾く以上のことをしてしまう。ここの役目は選別であって整形ではない。
 * この前提があるので、スキーマに `default` や `transform` を持たせないこと
 * （持たせても結果に反映されず、読み手を誤らせる）。
 *
 * @param schema - 要素が型 T として妥当かを判定するスキーマ
 * @returns デコード済みの値を受け取り、バリデーション済みの配列を返すパーサー関数
 */
export function createSessionStorageParser<T>(
  schema: ZodType<T>,
): (stored: unknown) => readonly T[] {
  return (stored: unknown): readonly T[] => {
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (value): value is T => schema.safeParse(value).success,
    );
  };
}
