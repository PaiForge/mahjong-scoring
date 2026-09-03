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
  describe("入力全体が配列として読めない場合", () => {
    it.each([
      ["undefined", undefined],
      ["空文字列", ""],
      ["壊れた JSON", "{"],
      ["配列でない JSON（オブジェクト）", JSON.stringify({ foo: "bar" })],
      ["配列でない JSON（文字列）", JSON.stringify("hello")],
      ["配列でない JSON（数値）", JSON.stringify(42)],
    ])("%s は空配列を返す", (_label, raw) => {
      expect(parseRows(raw)).toEqual([]);
    });

    it("空配列の JSON 文字列は空配列を返す", () => {
      expect(parseRows("[]")).toEqual([]);
    });
  });

  describe("要素の選別", () => {
    it("妥当な要素を並び順のまま返す", () => {
      const second = { label: "b", count: 2 };
      expect(parseRows(JSON.stringify([validRow, second]))).toEqual([
        validRow,
        second,
      ]);
    });

    it.each([
      ["必須フィールドを欠く", { label: "a" }],
      ["フィールドの型が違う", { label: "a", count: "1" }],
      ["null", null],
      ["数値", 42],
      ["文字列", "invalid"],
    ])("%s 要素は除外し、妥当な要素だけ返す", (_label, broken) => {
      const results = parseRows(JSON.stringify([broken, validRow]));
      expect(results).toEqual([validRow]);
    });
  });

  it("スキーマに無いキーを落とさず、保存されていたオブジェクトをそのまま返す", () => {
    // 選別であって整形ではない。zod の出力を返すと未知のキーが消え、
    // スキーマを更新するまでの間だけ保存された結果が壊れて見える。
    const withExtra = { ...validRow, note: "後から足したフィールド" };
    expect(parseRows(JSON.stringify([withExtra]))[0]).toEqual(withExtra);
  });
});
