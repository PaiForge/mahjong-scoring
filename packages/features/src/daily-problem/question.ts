import {
  allowsDoubleYakuman,
  DEFAULT_SCORE_JUDGEMENT_MODE,
  doubleWindJantouFu,
  judgeAnswer,
  rebuildAgariQuestion,
  toYakumanRuleConfig,
} from "@mahjong-scoring/core";
import type {
  AgariProblemPayload,
  JudgementResult,
  RuleConfig,
  RuleSettings,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";

/**
 * 本日の問題の盤面の組み立てと採点 — web とアプリで共有する規則
 * 本日の問題の組み立て
 *
 * 本日の問題は全員に同じ和了形の点数計算 1 問を 1 日 1 問出す。保存してある
 * のは盤面（{@link AgariProblemPayload}）だけで、正解は持たない。盤面を
 * 問題にする規則（ルール設定の読み方）と採点の規則をここに 1 つだけ置き、
 * web とアプリが同じ答えを出すようにする。
 */

/**
 * `rebuildAgariQuestion` の戻り値（`Result<ScoreQuestion, ArchiveRebuildError>`）
 *
 * features は neverthrow に直接依存しないので、core の関数の戻り値から型を取る。
 */
type DailyProblemQuestionResult = ReturnType<typeof rebuildAgariQuestion>;

/**
 * 端末ローカルのルール設定を点数計算ライブラリへ渡すルールにする
 * ルール設定変換
 *
 * 連風牌の雀頭の符・切り上げ満貫・役満ルールの 3 つを写す。体験ページの
 * 固定問題（標準ルール）の組み立てと同じ式。
 *
 * @param settings - 閲覧者のルール設定（`/preferences`）
 */
export function ruleConfigOfSettings(settings: RuleSettings): RuleConfig {
  return {
    doubleWindJantouFu: doubleWindJantouFu(settings.renfonpaiAs4Fu),
    kiriageMangan: settings.kiriageMangan,
    ...toYakumanRuleConfig(settings),
  };
}

/**
 * 本日の問題の盤面を閲覧者のルール設定で問題に組み立てる
 * 本日の問題構築
 *
 * @design 盤面は閲覧者のルール設定で組み立て直す
 *
 * ルール設定（連風牌の雀頭の符・切り上げ満貫等）は端末ローカルで、練習でも
 * 「ルールは閲覧者のもの」として盤面を組み立てる。本日の問題も同じにし、
 * 解説に出る符・翻・点数が利用者の設定と食い違わないようにする。
 *
 * 全員に同じ正解を出すため、出題する盤面は選ぶ段階で絞る — 連風牌の符
 * （2 / 4）× 切り上げ満貫（無 / 有）の 4 通りのルールで組み立てがすべて通り、
 * 正解がすべて一致し、役満でない手だけを本日の問題にする（web 側の適格判定）。
 * このため、どの設定で組み立てても正解は変わらない。サーバーで標準ルールに
 * 固定して組み立てる案は採らなかった — 練習の「ルールは閲覧者のもの」と
 * 食い違い、解説の符が利用者の設定と合わなくなるため。
 *
 * @param payload - 保存してある和了形の盤面
 * @param settings - 閲覧者のルール設定
 * @returns 組み立てた問題。盤面が和了形として成り立たなければ組み立て直しの失敗
 */
export function buildDailyProblemQuestion(
  payload: AgariProblemPayload,
  settings: RuleSettings,
): DailyProblemQuestionResult {
  return rebuildAgariQuestion(payload, ruleConfigOfSettings(settings));
}

/**
 * 本日の問題の解答を採点する
 * 本日の問題採点
 *
 * 判定モードは標準（`DEFAULT_SCORE_JUDGEMENT_MODE`。翻・符・点数を問い、
 * 役は問わない）に、閲覧者の設定からダブル役満を別の答えとして扱うかだけを
 * 重ねる（練習の和了形の点数計算と同じ扱い）。
 *
 * @design 採点はクライアントで行い、サーバーには正誤だけを送る
 *
 * 本日の問題の記録は本人にしか見せず、ランキングも特典も無いので、正誤を
 * 偽る動機が無い。サーバーで採点すると、解答の形の契約と採点をクライアントと
 * サーバーで二重に持つことになる。このため web・アプリとも、閲覧者の
 * ルール設定で組み立てた問題をこの関数で採点し、結果の正誤だけを記録の
 * API へ送る。
 *
 * @param question - {@link buildDailyProblemQuestion} で組み立てた問題
 * @param answer - 利用者の解答
 * @param settings - 閲覧者のルール設定（問題を組み立てたときと同じもの）
 */
export function judgeDailyProblemAnswer(
  question: ScoreQuestion,
  answer: UserAnswer,
  settings: RuleSettings,
): JudgementResult {
  return judgeAnswer(question, answer, {
    ...DEFAULT_SCORE_JUDGEMENT_MODE,
    // ダブル役満採用時は 26 翻を役満へ丸めずに別の答えとして判定する
    allowDoubleYakuman: allowsDoubleYakuman(toYakumanRuleConfig(settings)),
  });
}
