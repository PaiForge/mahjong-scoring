/**
 * テストで `server-only` の代わりに読む空のモジュール
 *
 * 本物の `server-only` は react-server 条件の外で import されると投げる。
 * vitest はその条件で解決しないため、`vitest.config.ts` の alias でここへ
 * 向ける。各テストで `vi.mock("server-only", ...)` を書かない。
 */
export {};
