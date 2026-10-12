import {
  DEFAULT_RULE_SETTINGS,
  HaiKind,
  buildScoreQuestion,
  doubleWindJantouFu,
  sortTehai,
  validateTehai13,
} from "@mahjong-scoring/core";
import type {
  HaiKindId,
  ScoreQuestion,
  Tehai13,
  TenpaiScoreQuestion,
  TenpaiScoreWait,
} from "@mahjong-scoring/core";

import { buildDemoTehai } from "../../board/demo-tehai";

/**
 * デモの聴牌形（234m 234s 34p 777s 88p、二筒・五筒待ち）
 *
 * 待ちで役が割れる形を選んでいる。二筒なら 234 の三色同順が付いて満貫に
 * 届き、五筒なら立直・断么九（ツモなら門前清自摸和も）だけになる。和了形の
 * 問題として切り出すと「どちらの牌で和了ったか」しか残らず、この差は
 * 出題から消える — 聴牌形の点数計算が実戦に近い理由をそのまま見せる例。
 * 七七七索の暗刻は平和を消して、ツモとロンで符が変わるようにするため。
 */
const DEMO_TENPAI_CLOSED: readonly HaiKindId[] = [
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.SouZu2,
  HaiKind.SouZu3,
  HaiKind.SouZu4,
  HaiKind.PinZu3,
  HaiKind.PinZu4,
  HaiKind.SouZu7,
  HaiKind.SouZu7,
  HaiKind.SouZu7,
  HaiKind.PinZu8,
  HaiKind.PinZu8,
];

/** {@link DEMO_TENPAI_CLOSED} の待ち（牌種 ID の昇順） */
const DEMO_TENPAI_WAITS: readonly HaiKindId[] = [
  HaiKind.PinZu2,
  HaiKind.PinZu5,
];

/** 東場・南家（子）。表ドラは東、裏ドラは北で、どちらも手牌に乗らない */
const DEMO_TENPAI_SITUATION = {
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
  doraMarkers: [HaiKind.Pei],
  uraDoraMarkers: [HaiKind.Sha],
} as const;

/**
 * 聴牌形の 13 枚を組み立てる
 *
 * 牌姿は固定値なので検証は必ず通るが、書き間違えたときに黙って描画が
 * 消えないよう投げる（{@link buildDemoTehai} と同じ）。
 */
function buildDemoTehai13(closed: readonly HaiKindId[]): Tehai13 {
  const result = validateTehai13({ closed: [...closed], exposed: [] });
  if (result.isErr()) {
    throw new Error("デモ用の手牌が 13 枚の手牌として不正です");
  }
  return sortTehai(result.value);
}

/** 待ち 1 つの和了方法 1 つを採点する。デモの牌姿は必ず役が付く */
function scoreDemoWait(agariHai: HaiKindId, isTsumo: boolean): ScoreQuestion {
  const result = buildScoreQuestion({
    tehai: buildDemoTehai([...DEMO_TENPAI_CLOSED, agariHai]),
    agariHai,
    isTsumo,
    bakaze: DEMO_TENPAI_SITUATION.bakaze,
    jikaze: DEMO_TENPAI_SITUATION.jikaze,
    doraMarkers: DEMO_TENPAI_SITUATION.doraMarkers,
    ruleConfig: {
      doubleWindJantouFu: doubleWindJantouFu(
        DEFAULT_RULE_SETTINGS.renfonpaiAs4Fu,
      ),
      kiriageMangan: DEFAULT_RULE_SETTINGS.kiriageMangan,
    },
    riichi: { uraDoraMarkers: DEMO_TENPAI_SITUATION.uraDoraMarkers },
  });
  if (result.isErr()) {
    throw new Error("デモ用の聴牌形の点数を組み立てられません");
  }
  return result.value;
}

/**
 * 聴牌形の点数計算のデモの出題
 * 聴牌形デモ出題
 *
 * 生成器（`generateTenpaiScoreQuestion`）と同じく、待ちごとにツモ・ロンの
 * 点数計算問題を持つ。リーチしている手なので裏ドラ表示牌も持つ（出題と同じ。
 * 盤面に裏ドラが無いリーチの手は実戦に無い）。
 */
export const TENPAI_SCORE_DEMO_QUESTION: TenpaiScoreQuestion = {
  tehai: buildDemoTehai13(DEMO_TENPAI_CLOSED),
  bakaze: DEMO_TENPAI_SITUATION.bakaze,
  jikaze: DEMO_TENPAI_SITUATION.jikaze,
  doraMarkers: DEMO_TENPAI_SITUATION.doraMarkers,
  isRiichi: true,
  uraDoraMarkers: DEMO_TENPAI_SITUATION.uraDoraMarkers,
  waits: DEMO_TENPAI_WAITS.map((agariHai): TenpaiScoreWait => ({
    agariHai,
    tsumo: scoreDemoWait(agariHai, true),
    ron: scoreDemoWait(agariHai, false),
  })),
};
