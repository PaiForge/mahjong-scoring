import {
  allowsDoubleYakuman,
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

import type { ScorePracticeModeFlags } from "../practice/score/generator-options";

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
 * 正解がすべて一致し、役満でない手だけを本日の問題にする（同じディレクトリの `eligibility.ts`）。
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
 * 判定モードは、閲覧者の和了形の点数計算（実践練習）の「回答する項目」の設定
 * （`mode`。役・翻数と符・5翻以上の翻数・満貫以上の符を答えるか）に、ルール設定から
 * ダブル役満を別の答えとして扱うかを重ねる（練習の和了形の点数計算と同じ扱い）。
 * 回答欄も同じ設定で組むので、問う項目と判定する項目は一致する。
 *
 * @design 答える項目は人によって変わってよい
 *
 * 本日の問題は全員に同じ 1 問を出すが、記録は本人にしか見せない「解いた」と正誤
 * だけで、ランキングも他人との比較も無い。このため「正解」の基準を全員で揃える
 * 必要が無く、盤面を実践練習と同じ形に保つことを優先する（点数だけを答える
 * 既定の人には、本日の問題でも点数だけを問う）。
 *
 * @design 答え合わせはクライアントで行い、統計の判定はサーバーが受付時に付ける
 *
 * web・アプリとも、閲覧者のルール設定で組み立てた問題をこの関数で採点して
 * 答え合わせを出し、その正誤と解答の中身（`build-answer-detail.ts`）を記録の API へ
 * 送る。本日の問題の記録は本人にしか見せず、ランキングも特典も無いので、正誤を
 * 偽る動機が無い — ホームの「解答済み」は端末の正誤をそのまま使う。
 *
 * 統計が使う判定は別で、サーバーが受付のたびに標準ルールで組み立て直して付ける
 * （`answer-receipt.ts`）。端末の正誤を統計に使わないのは、端末のビルドによって
 * 採点の版が違いうるため。解答の形の契約は zod スキーマ 1 つ（`answer-detail.ts`）、
 * 採点は core の関数 1 つ（`judgeAnswerFields`。この関数が呼ぶ `judgeAnswer` も
 * そこから導く）なので、クライアントとサーバーで二重に持つ規則は無い。
 *
 * @param question - {@link buildDailyProblemQuestion} で組み立てた問題
 * @param answer - 利用者の解答
 * @param settings - 閲覧者のルール設定（問題を組み立てたときと同じもの）
 * @param mode - 閲覧者の和了形の点数計算の「回答する項目」の設定
 */
export function judgeDailyProblemAnswer(
  question: ScoreQuestion,
  answer: UserAnswer,
  settings: RuleSettings,
  mode: ScorePracticeModeFlags,
): JudgementResult {
  return judgeAnswer(question, answer, {
    ...mode,
    // ダブル役満採用時は 26 翻を役満へ丸めずに別の答えとして判定する
    allowDoubleYakuman: allowsDoubleYakuman(toYakumanRuleConfig(settings)),
  });
}
