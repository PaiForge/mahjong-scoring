import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";

import { YAKU_TO_KEY } from "@/app/_lib/yaku-labels";

/**
 * 出題役絞り込みの URL パラメータ規約
 * 出題役パラメータ
 *
 * 役の識別子は core の日本語表示名（`yakuDetails.name` の語彙）だが、
 * URL 上は ASCII トークンを使う（点数帯の "non" / "plus" と同じ流儀）。
 * トークンには辞書キー対応表 `YAKU_TO_KEY` の値（例: 平和 → "pinfu"）を
 * 再利用し、新しい語彙を作らない。
 */

/** 出題する役を指定するクエリパラメータ名（複数指定 = OR） */
export const YAKU_PARAM = "yaku";

/**
 * URL トークン → 役名（日本語）の対応。
 * allowlist（SCORE_FILTERABLE_YAKU）に載る役だけを解釈対象にする。
 * ここに無いトークンを解釈すると、生成器が作れない役を URL から
 * 指定できてしまい、リトライを使い切って黙って失敗する。
 */
const NAME_BY_TOKEN: ReadonlyMap<string, string> = new Map(
  SCORE_FILTERABLE_YAKU.flatMap((name) => {
    const token = YAKU_TO_KEY[name];
    return token === undefined ? [] : [[token, name] as const];
  }),
);

/**
 * 役名（日本語）から URL トークンを引く。allowlist 外は undefined。
 * 役トークン変換
 */
export function yakuTokenOf(name: string): string | undefined {
  return SCORE_FILTERABLE_YAKU.includes(name) ? YAKU_TO_KEY[name] : undefined;
}

/**
 * `yaku` の値の並びを役名（日本語）の配列へ解釈する。
 * 出題役解釈
 *
 * 未知のトークンは黙って捨てる（手打ち URL や古いリンクで生成不能な
 * 条件が入るのを防ぐ）。空配列 = 絞り込みなし。
 */
export function parseYakuValues(values: readonly string[]): readonly string[] {
  const names: string[] = [];
  for (const value of values) {
    const name = NAME_BY_TOKEN.get(value);
    if (name !== undefined && !names.includes(name)) names.push(name);
  }
  return names;
}
