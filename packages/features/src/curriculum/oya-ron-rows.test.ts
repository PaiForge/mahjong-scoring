import { describe, expect, it } from "vitest";

import {
  buildOyaRonRows,
  countOyaRonCells,
  type OyaRonRowsOptions,
} from "./oya-ron-rows";

const STANDARD: OyaRonRowsOptions = { kiriageMangan: false };
const KIRIAGE: OyaRonRowsOptions = { kiriageMangan: true };

function deviatingCells(options: OyaRonRowsOptions = STANDARD): string[] {
  return buildOyaRonRows(options).flatMap((row) =>
    row.cells.flatMap((cell) =>
      cell.kind === "score" && cell.deviates
        ? [`${row.fu}符${cell.han}翻`]
        : [],
    ),
  );
}

describe("buildOyaRonRows", () => {
  it("20符はロンが存在しないので行ごと落とす", () => {
    expect(buildOyaRonRows(STANDARD).map((row) => row.fu)).toEqual([
      25, 30, 40, 50, 60, 70, 80, 90, 100, 110,
    ]);
  });

  // 章は「ずれるのはこの14マス」と本文で言い切っているので、一覧ごと固定する
  it("1.5倍からずれるのは14マス", () => {
    expect(deviatingCells()).toEqual([
      "30符2翻",
      "30符3翻",
      "30符4翻",
      "40符1翻",
      "40符3翻",
      "60符1翻",
      "60符2翻",
      "60符3翻",
      "70符1翻",
      "70符2翻",
      "80符2翻",
      "90符1翻",
      "110符1翻",
      "110符2翻",
    ]);
  });

  it("満貫未満の点数が載るマスは26、ずれるのは14", () => {
    expect(countOyaRonCells(buildOyaRonRows(STANDARD))).toEqual({
      scored: 26,
      deviating: 14,
    });
  });

  // 章のコラムは「この2マスが満貫になってずれるマスから外れる」と書いている
  it("切り上げ満貫では30符4翻・60符3翻が満貫になり、ずれるのは12マス", () => {
    const rows = buildOyaRonRows(KIRIAGE);
    const cellOf = (fu: number, han: number) =>
      rows.find((row) => row.fu === fu)?.cells.find((cell) => cell.han === han);
    expect(cellOf(30, 4)).toEqual({ kind: "mangan", han: 4 });
    expect(cellOf(60, 3)).toEqual({ kind: "mangan", han: 3 });
    expect(deviatingCells(KIRIAGE)).toEqual(
      deviatingCells().filter(
        (cell) => cell !== "30符4翻" && cell !== "60符3翻",
      ),
    );
    expect(countOyaRonCells(rows)).toEqual({ scored: 24, deviating: 12 });
  });

  it("章の例: 30符1翻はちょうど1.5倍、30符2翻はずれる", () => {
    const row30 = buildOyaRonRows(STANDARD).find((row) => row.fu === 30);
    expect(row30?.cells[0]).toMatchObject({
      oyaRon: 1500,
      koRonTimesOneAndHalf: 1500,
      deviates: false,
    });
    expect(row30?.cells[1]).toMatchObject({
      oyaRon: 2900,
      koRonTimesOneAndHalf: 3000,
      deviates: true,
    });
  });

  it("25・50・100符はどのマスもずれない", () => {
    const clean = buildOyaRonRows(STANDARD).filter((row) =>
      row.cells.every((cell) => cell.kind !== "score" || !cell.deviates),
    );
    expect(clean.map((row) => row.fu)).toEqual([25, 50, 100]);
  });
});
