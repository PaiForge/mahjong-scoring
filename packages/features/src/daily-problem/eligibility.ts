/**
 * 本日の問題に出してよい盤面か
 * 本日の問題の適格判定
 *
 * @description
 * 本日の問題は全員に同じ盤面を出し、盤面は閲覧者のルール設定（端末ローカル）で
 * 組み立て直して採点する（同じディレクトリの `question.ts`）。
 * 全員に同じ正解を出すには、ルール設定で正解が割れる手を選ぶ段階で落とす必要が
 * ある。ここはその判定で、web のサーバーが候補の選出と、選んだ行を読むたびの
 * 再確認の両方に使う。
 *
 * 使うのはサーバーだけだが、DB にも乱数にも触れない純粋な規則なので features に置く。
 * 全員に出す問題を決める規則で、ミューテーションテストの対象（core と features の
 * `use-*.ts` 以外）に入れてテストの検出力を測るため。
 *
 * @design 4 通りのルールで組み立て直し、正解がすべて一致して役満でない手だけを通す
 * 連風牌の雀頭の符（2 / 4）× 切り上げ満貫（無 / 有）の 4 通り（役満のルールは
 * 既定の設定）で `rebuildAgariQuestion` がすべて成功し、正解（`ScoreResult`）が
 * 構造的にすべて一致し、役満（役満役・数え役満）でない手。チャレンジで設定に
 * よって正解が割れる手を出題から落とす考え方（`challenge/rule-boundary.ts`）と
 * 同じ。役満はルール（ダブル役満・複合）で割れやすく、日課の 1 問として極端なので
 * 外す。採らなかった案: サーバーで標準ルールに固定して採点する — 練習の「ルールは
 * 閲覧者のもの」と食い違い、解説の符が利用者の設定と合わなくなる。
 */
import {
  DEFAULT_RULE_SETTINGS,
  isYakumanHan,
  rebuildAgariQuestion,
  type AgariProblemPayload,
  type RuleSettings,
  type ScoreQuestion,
} from "@mahjong-scoring/core";

import { ruleConfigOfSettings } from "./question";

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

/**
 * 2 つの正解が構造的に同じか
 *
 * 正解（`ScoreResult`）は数値・文字列・配列・素のオブジェクトだけでできていて、
 * 同じ組み立ての経路が同じキーの順で作るので、JSON にした文字列で比べる。
 * キーの順だけが違う値は「違う」と出るが、そのとき手は出題から外れるだけで、
 * 割れる手を通す側には倒れない。Node の `isDeepStrictEqual` を使わないのは、
 * features のモジュールをアプリ（Hermes）からも読める状態に保つため。
 */
function isSameAnswer(a: ScoreResult, b: ScoreResult): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * 役満の正解か（役満役を含む手と数え役満）
 *
 * 役満役は 1 つ 13 翻として翻数に入るので、どちらも翻数が役満の区分に届く。
 */
function isYakumanAnswer(answer: ScoreResult): boolean {
  return isYakumanHan(answer.han);
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
    else if (!isSameAnswer(first, answer)) return false;
  }
  return true;
}
