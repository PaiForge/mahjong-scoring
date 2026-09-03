/**
 * Server Action の標準結果型。
 * 成功時は `{ success: true }` に追加フィールド、失敗時は `{ error: E }` を返す。
 * サーバーアクション結果型
 *
 * `E` はそのアクションが返しうるエラーコードの union で、省略できない。
 * ここを `string` に広げると、返す側の打ち間違い（`"ratelimited"`）も、
 * 受け取る側の突き合わせの打ち間違い（`code === "rateLimted"`）も
 * 型検査を素通りし、UI では黙って汎用エラー文言に落ちる。
 * コードは i18n のメッセージキーとして UI へ渡るため、サーバーと
 * クライアントの間で綴りが一致していることを型で担保する。
 *
 * エラーコードは既存の union を組み合わせて書く
 * （{@link RateLimitErrorCode} / `AuthGateErrorCode` / 各バリデータの
 * エラー型など）。アクション固有のものだけをリテラルで足す。
 *
 * @template E そのアクションが返しうるエラーコード
 * @template T 成功時に追加するフィールドの型
 */
export type ActionResult<
  E extends string,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- 交差の単位元として使う（成功時に追加フィールドを持たないアクションの既定）
  T extends Record<string, unknown> = {},
> = ({ success: true } & T) | { error: E };
