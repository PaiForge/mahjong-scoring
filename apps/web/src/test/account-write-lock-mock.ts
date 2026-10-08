/**
 * `@/lib/users/account-write-lock` のテスト用スタブ（退会を受け付けていない状態）
 * 退会と直列の書き込みモック
 *
 * 実物の `writeAsAccount` はトランザクションを開いて退会の受付を確かめてから
 * `write` を呼ぶ。本人のデータを書く処理のテストは「退会していない」前提で
 * 書き込みの中身を見たいので、渡したトランザクションの代わりで `write` を
 * そのまま通す:
 *
 * ```ts
 * vi.mock(
 *   "@/lib/users/account-write-lock",
 *   async () =>
 *     (await import("@/test/account-write-lock-mock")).passThroughAccountWrite({
 *       update: mockUpdate,
 *     }),
 * );
 * ```
 *
 * このモジュールはテスト専用。
 *
 * @param tx - `write` に渡すトランザクションの代わり（使う DB 操作のモックだけ持たせる）
 */
export function passThroughAccountWrite(tx: unknown) {
  return {
    writeAsAccount: async <T>(
      _userId: string,
      write: (tx: never) => Promise<T>,
    ) => ({ written: true as const, value: await write(tx as never) }),
  };
}
