/**
 * Server Action の標準結果型。
 * 成功時は `{ success: true }` に追加フィールド、失敗時は `{ error: string }` を返す。
 * サーバーアクション結果型
 *
 * @template T 成功時に追加するフィールドの型
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ActionResult<T extends Record<string, unknown> = {}> =
  | ({ success: true } & T)
  | { error: string };
