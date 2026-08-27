/**
 * next-intl のテスト用スタブ
 * i18nモック
 *
 * 「翻訳キーがそのまま出る」だけの中身のないスタブ。文言そのものを
 * 検証したいテストは無く（辞書の整合性は *-i18n-integrity.test.ts が担う）、
 * 各テストが同じ3行を書いていたのでここへまとめる。
 *
 * `next-intl` / `next-intl/server` のどちらのモックにも使える:
 *
 * ```ts
 * vi.mock("next-intl", async () => await import("@/test/intl-mock"));
 * vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
 * ```
 *
 * 補間した値まで見たいテスト（`t(key, values)`）は独自のスタブを書くこと。
 *
 * このモジュールはテスト専用。
 */

/** 翻訳関数。`t(key)` と `t.rich(key, tags)` のどちらもキーを返す */
interface StubTranslator {
  (key: string): string;
  /**
   * リッチテキスト版。タグの中身は本物の辞書にしか無いため、ここでは
   * 差し込む要素を描かずキーだけを返す。タグごと消えることで、
   * テストは「どの文言が出ているか」だけを見る。
   */
  rich: (key: string) => string;
}

function createTranslator(): StubTranslator {
  const t = (key: string) => key;
  t.rich = (key: string) => key;
  return t;
}

/** クライアントコンポーネント用（キーをそのまま返す） */
export function useTranslations(): StubTranslator {
  return createTranslator();
}

/** サーバーコンポーネント用（キーをそのまま返す） */
export function getTranslations(): Promise<StubTranslator> {
  return Promise.resolve(createTranslator());
}
