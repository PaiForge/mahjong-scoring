import {
  buildScoreQuestion,
  DEFAULT_RULE_SETTINGS,
  doubleWindJantouFu,
  HaiKind,
  toYakumanRuleConfig,
} from "@mahjong-scoring/core";
import type { RuleConfig, ScoreQuestion } from "@mahjong-scoring/core";
import { DEMO_YAKUHAI_KOUTSU_HAND } from "@mahjong-scoring/features/board/demo-score-question";
import { buildDemoTehai } from "@mahjong-scoring/features/board/demo-tehai";

/**
 * 体験問題が前提にするルール（標準ルール）
 * 体験ルール
 *
 * 端末ローカルのルール設定（`/preferences`）は読まない。体験は未登録・初訪問の
 * 人が解く 1 問で、設定を触る前の状態が前提になるため。牌姿も設定で正解が
 * 割れない形（連風牌の雀頭なし・切り上げ満貫の対象外・役満なし）を選んでいる。
 */
const STANDARD_RULES: RuleConfig = {
  doubleWindJantouFu: doubleWindJantouFu(DEFAULT_RULE_SETTINGS.renfonpaiAs4Fu),
  kiriageMangan: DEFAULT_RULE_SETTINGS.kiriageMangan,
  ...toYakumanRuleConfig(DEFAULT_RULE_SETTINGS),
};

/**
 * 体験ページの固定問題を組み立てる
 * 体験問題構築
 *
 * 牌姿は昇級試験の遊び方デモと同じ役牌（發）の暗刻の手。東場・南家・三筒ロンで
 * 副底 20 + 發の暗刻 8 + 門前ロン 10 = 38 符 → 40 符、役は役牌 1 翻だけの
 * 1 翻 40 符 = 1300 点。符を自分で積み上げないと点数が出ない形で、かつ
 * 役の見落としが起きにくい（役牌の暗刻は一目で分かる）ため、初めて解く
 * 1 問に選んだ。平和の手は符が 20 / 30 に固定され、ツモ 20 符という初学者が
 * 最初に躓く例外を体験の 1 問目に置くことになるので避けた。
 *
 * ドラ表示牌は一索（ドラは二索）で手牌に乗らない。ドラが乗ると翻数が増えて
 * 符の話が霞む。
 *
 * 牌姿・状況はコード内の固定値なので構築は必ず通る。失敗したら書き間違いで、
 * 黙って盤面が消えないよう {@link buildDemoTehai} と同じく投げる（開発中に
 * 必ず気付ける）。
 */
function buildTryQuestion(): ScoreQuestion {
  const built = buildScoreQuestion({
    tehai: buildDemoTehai(DEMO_YAKUHAI_KOUTSU_HAND.closed),
    agariHai: DEMO_YAKUHAI_KOUTSU_HAND.agariHai,
    isTsumo: DEMO_YAKUHAI_KOUTSU_HAND.isTsumo,
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    doraMarkers: [HaiKind.SouZu1],
    ruleConfig: STANDARD_RULES,
  });
  if (built.isErr()) {
    throw new Error(
      `体験問題の牌姿から問題を組み立てられません: ${built.error}`,
    );
  }
  return built.value;
}

/**
 * 体験ページ（`/try`）で出す固定の 1 問
 * 体験問題
 *
 * 毎回同じ問題なのは意図したもの。体験の目的は「どんな練習か」を登録なしで
 * 触らせることで、繰り返し解かせることではない。固定なので無料枠
 * （`practice/score` の 1 日の上限）を消費せず、サーバーにも問い合わせない。
 */
export const TRY_QUESTION: ScoreQuestion = buildTryQuestion();
