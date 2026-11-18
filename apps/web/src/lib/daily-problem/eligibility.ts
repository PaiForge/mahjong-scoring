/**
 * 本日の問題に出してよい盤面か
 * 本日の問題の適格判定
 *
 * @description
 * 本日の問題は全員に同じ盤面を出し、盤面は閲覧者のルール設定（端末ローカル）で
 * 組み立て直して採点する（`@mahjong-scoring/features/daily-problem/question`）。
 * 全員に同じ正解を出すには、ルール設定で正解が割れる手を選ぶ段階で落とす必要が
 * ある。ここはその判定で、候補の選出（`today.ts`）と、選んだ行を読むたびの
 * 再確認の両方が使う。
 *
 * @design 4 通りのルールで組み立て直し、正解がすべて一致して役満でない手だけを通す
 * 連風牌の雀頭の符（2 / 4）× 切り上げ満貫（無 / 有）の 4 通り（役満のルールは
 * 既定の設定）で `rebuildAgariQuestion` がすべて成功し、正解（`ScoreResult`）が
 * 構造的にすべて一致し、役満（役満役・数え役満）でない手。チャレンジで設定に
 * よって正解が割れる手を出題から落とす考え方（`features/challenge/rule-boundary.ts`）と
 * 同じ。役満はルール（ダブル役満・複合）で割れやすく、日課の 1 問として極端なので
 * 外す。採らなかった案: サーバーで標準ルールに固定して採点する — 練習の「ルールは
 * 閲覧者のもの」と食い違い、解説の符が利用者の設定と合わなくなる。
 */
import "server-only";

import { isDeepStrictEqual } from "node:util";

import {
  DEFAULT_RULE_SETTINGS,
  isYakumanHan,
  rebuildAgariQuestion,
  type AgariProblemPayload,
  type RuleSettings,
  type ScoreQuestion,
} from "@mahjong-scoring/core";
import { ruleConfigOfSettings } from "@mahjong-scoring/features/daily-problem/question";

/** 正解の点数計算結果（ライブラリの `ScoreResult`） */
type ScoreResult = ScoreQuestion["answer"];

/**
 * 正解が割れないことを確かめるルール設定（連風牌の符 × 切り上げ満貫の 4 通り）
 *
 * 役満のルールは既定のまま。役満の手は別に落とすので、役満のルールの組み合わせは
 * 試さなくてよい。
 */
export const DAILY_PROBLEM_RULE_VARIANTS: readonly RuleSettings[] = [
  false,
  true,
].flatMap((renfonpaiAs4Fu) =>
  [false, true].map((kiriageMangan) => ({
    ...DEFAULT_RULE_SETTINGS,
    renfonpaiAs4Fu,
    kiriageMangan,
  })),
);

/** 役満（役満役を含む手か、数え役満）の正解か */
function isYakumanAnswer(answer: ScoreResult): boolean {
  return answer.yakumanMultiplier >= 1 || isYakumanHan(answer.han);
}

/**
 * 盤面が本日の問題に出せるか
 * 本日の問題適格判定
 *
 * 条件と理由はこのモジュールの説明のとおり。乱数は使わず、同じ盤面には
 * 常に同じ答えを返す（採点ロジックが変われば答えも変わりうる）。
 *
 * @param payload - 保存してある和了形の盤面
 * @returns 4 通りのルールすべてで組み立てられ、正解が一致し、役満でなければ true
 */
export function isDailyProblemEligible(payload: AgariProblemPayload): boolean {
  let first: ScoreResult | undefined;
  for (const settings of DAILY_PROBLEM_RULE_VARIANTS) {
    const rebuilt = rebuildAgariQuestion(
      payload,
      ruleConfigOfSettings(settings),
    );
    if (rebuilt.isErr()) return false;
    const { answer } = rebuilt.value;
    if (isYakumanAnswer(answer)) return false;
    if (first === undefined) first = answer;
    else if (!isDeepStrictEqual(first, answer)) return false;
  }
  return first !== undefined;
}
