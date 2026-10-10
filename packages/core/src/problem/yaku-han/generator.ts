import {
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import {
  canPromptNaki,
  DEFAULT_YAKU_HAN_RANGE,
  getYakuHanEntries,
} from "./constants";
import type { YakuHanRange } from "./constants";
import type { YakuHanQuestion } from "./types";

/** 役名と門前 / 鳴きの組を 1 つの文字列にする（同じ問題かどうかの比較に使う） */
function questionKey(question: YakuHanQuestion): string {
  return `${question.yakuName}/${question.isMenzen ? "menzen" : "naki"}`;
}

/**
 * 出題範囲で出しうる問題をすべて列挙する
 * 役翻数問題一覧
 *
 * 役ごとに門前の問題を 1 つ、鳴き状態で出題してよい役（{@link canPromptNaki}）
 * には鳴きの問題をもう 1 つ持つ。それ以外の役は常に門前で出題する。
 */
function listYakuHanQuestions(range: YakuHanRange): readonly YakuHanQuestion[] {
  return getYakuHanEntries(range).flatMap((entry) => [
    { yakuName: entry.name, isMenzen: true, correctHan: entry.menzenHan },
    ...(canPromptNaki(entry)
      ? [{ yakuName: entry.name, isMenzen: false, correctHan: entry.nakiHan }]
      : []),
  ]);
}

/**
 * 役翻数問題を1問生成する
 * 役翻数問題生成
 *
 * 出題範囲の問題（役 × 門前 / 鳴き）を一巡するまで同じ問題を出さない。
 * 毎回独立に引くと、同じ役が続けて出ることが目に付くため。履歴を頭から
 * 辿り、範囲の問題を出し切った時点で巡を区切る — 出し切った後は既に
 * 出した問題を出すしかないので、次の巡に入る。
 *
 * まだ出していない問題のうち、直前と違う役を優先する。同じ役の門前と
 * 鳴きは別の問題なので、残りがそれだけなら続けて出す。巡の変わり目でも
 * 直前と同じ問題は避ける。
 *
 * @param range - 出題範囲
 * @param asked - このセッションで既に出した問題（古い順。今出している問題を含む）
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateYakuHanQuestion(
  range: YakuHanRange = DEFAULT_YAKU_HAN_RANGE,
  asked: readonly YakuHanQuestion[] = [],
  rng: RandomSource = defaultRandomSource,
): YakuHanQuestion {
  const pool = listYakuHanQuestions(range);
  const poolKeys = new Set(pool.map(questionKey));

  let askedInRound = new Set<string>();
  for (const question of asked) {
    const key = questionKey(question);
    if (!poolKeys.has(key)) continue;
    askedInRound.add(key);
    if (askedInRound.size === poolKeys.size) askedInRound = new Set();
  }

  const last = asked.at(-1);
  const lastKey = last && questionKey(last);
  const unasked = pool.filter((question) => {
    const key = questionKey(question);
    return !askedInRound.has(key) && key !== lastKey;
  });
  const otherYaku = unasked.filter(
    (question) => question.yakuName !== last?.yakuName,
  );

  if (otherYaku.length > 0) return randomChoice(otherYaku, rng);
  if (unasked.length > 0) return randomChoice(unasked, rng);
  return randomChoice(pool, rng);
}
