import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createSessionStorageParser } from "../create-session-storage-parser";

interface Row {
  readonly label: string;
  readonly count: number;
}

const rowSchema: z.ZodType<Row> = z.object({
  label: z.string(),
  count: z.number(),
});

const parseRows = createSessionStorageParser(rowSchema);

const validRow = { label: "a", count: 1 };

/**
 * ここで検証するのは、各練習のパーサーが共有する「入力の形」と「選別」の契約。
 * 練習ごとのスキーマが何を必須とするかは各 `_lib/__tests__/types.test.ts` の
 * 担当で、そちらでこの契約を再検証しないこと。
 */
describe("createSessionStorageParser", () => {
  describe("入力全体が配列でない場合", () => {
    it.each([
      ["undefined", undefined],
      ["オブジェクト", { foo: "bar" }],
      ["文字列", "hello"],
      ["数値", 42],
    ])("%s は空配列を返す", (_label, stored) => {
      expect(parseRows(stored)).toEqual([]);
    });

    it("空配列は空配列を返す", () => {
      expect(parseRows([])).toEqual([]);
    });
  });

  describe("要素の選別", () => {
    it("妥当な要素を並び順のまま返す", () => {
      const second = { label: "b", count: 2 };
      expect(parseRows([validRow, second])).toEqual([validRow, second]);
    });

    it.each([
      ["必須フィールドを欠く", { label: "a" }],
      ["フィールドの型が違う", { label: "a", count: "1" }],
      ["null", null],
      ["数値", 42],
      ["文字列", "invalid"],
    ])("%s 要素は除外し、妥当な要素だけ返す", (_label, broken) => {
      const results = parseRows([broken, validRow]);
      expect(results).toEqual([validRow]);
    });
  });

  it("スキーマに無いキーを落とさず、保存されていたオブジェクトをそのまま返す", () => {
    // 選別であって整形ではない。zod の出力を返すと未知のキーが消え、
    // スキーマを更新するまでの間だけ保存された結果が壊れて見える。
    const withExtra = { ...validRow, note: "後から足したフィールド" };
    expect(parseRows([withExtra])[0]).toEqual(withExtra);
  });
});
