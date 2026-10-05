import { expect } from "vitest";
import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";

/** 結果ページが読む保存形式のうち、出題内容を復元するための部分 */
interface SavedQuestion {
  readonly tehai: string;
  readonly bakaze: string;
  readonly jikaze: string;
  readonly agariHai: string;
}

/** 保存前の出題のうち、復元先として突き合わせる部分 */
interface GeneratedQuestion {
  readonly tehai: {
    readonly closed: readonly unknown[];
    readonly exposed: readonly unknown[];
  };
  readonly context: {
    readonly bakaze: unknown;
    readonly jikaze: unknown;
    readonly agariHai: unknown;
  };
}

/**
 * 保存形式から出題内容（手牌・場風・自風・和了牌）が復元できることを確かめる
 * 出題復元アサーション
 *
 * 結果ページはこの復元に依存して手牌を再表示するため、手牌を出す練習は
 * どれも同じことを確かめている。練習ごとに同じ 6 行を書き写すと、確かめ方を
 * 直したいときに直し漏れが出る。ツモ・リーチ・ドラのように練習によって
 * 増える項目は、呼び出し側でこれに続けて書くこと。
 */
export function expectRestoresQuestion(
  result: SavedQuestion,
  question: GeneratedQuestion,
): void {
  const tehai = parseTehai(result.tehai);
  expect(tehai).toBeDefined();
  expect(tehai?.closed.length).toBe(question.tehai.closed.length);
  expect(tehai?.exposed.length).toBe(question.tehai.exposed.length);

  expect(parseKazehai(result.bakaze)).toBe(question.context.bakaze);
  expect(parseKazehai(result.jikaze)).toBe(question.context.jikaze);
  expect(parseHais(result.agariHai)[0]).toBe(question.context.agariHai);
}
