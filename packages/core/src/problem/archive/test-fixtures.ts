/**
 * 保存形式のテストに使う固定の盤面
 * 保存形式テスト盤面
 *
 * テスト専用。`*.test.ts` からだけ読む。固定値から組むので、組めなければ
 * テストの書き間違いとして投げる。
 */
import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  type RuleConfig,
} from "@pai-forge/riichi-mahjong";
import { tehaiOf } from "../../test-utils/tehai";
import { buildScoreQuestion } from "../score/build-question";
import { parseHais } from "../score/mpsz-serializer";
import type { ScoreQuestion } from "../score/types";
import { finalizeTehai13 } from "../shared/hand-skeleton";
import { buildTenpaiScoreQuestion } from "../tenpai-score/generator";
import type { TenpaiScoreQuestion } from "../tenpai-score/types";
import { toAgariProblemPayload, toTenpaiProblemPayload } from "./to-payload";
import type { PracticeProblemArchiveRequest } from "./types";

/** 標準ルール（連風牌の雀頭 2 符・切り上げ満貫なし・役満ルールすべて無効） */
export const STANDARD_RULES: RuleConfig = {
  doubleWindJantouFu: 2,
  kiriageMangan: false,
};

/** 問題を保存の要求にする */
export function agariRequest(
  question: ScoreQuestion,
): PracticeProblemArchiveRequest {
  return {
    kind: "agari-score",
    schemaVersion: 1,
    payload: toAgariProblemPayload(question),
  };
}

/** 問題を保存の要求にする */
export function tenpaiRequest(
  question: TenpaiScoreQuestion,
): PracticeProblemArchiveRequest {
  return {
    kind: "tenpai-score",
    schemaVersion: 1,
    payload: toTenpaiProblemPayload(question),
  };
}

/** 送信経路（JSON）を通した形にする。サーバーが受け取るのはこれ */
export function overTheWire(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

/**
 * 4 副露の和了形（ツモ）。鳴いた順: チー 234m（3m を鳴く）→ ポン 白（下家）→
 * 大明槓 9p（上家）→ 加槓 1s（対面）。単騎 6m で和了
 */
export function meldedAgariQuestion(): ScoreQuestion {
  const tehai = tehaiOf({
    closed: parseHais("66m"),
    exposed: [
      {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
        furo: {
          type: FuroType.Chi,
          from: Tacha.Kamicha,
          nakiHai: HaiKind.ManZu3,
        },
      },
      {
        type: MentsuType.Koutsu,
        hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
        furo: {
          type: FuroType.Pon,
          from: Tacha.Shimocha,
          nakiHai: HaiKind.Haku,
        },
      },
      {
        type: MentsuType.Kantsu,
        hais: [HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9],
        furo: {
          type: FuroType.Daiminkan,
          from: Tacha.Kamicha,
          nakiHai: HaiKind.PinZu9,
        },
      },
      {
        type: MentsuType.Kantsu,
        hais: [HaiKind.SouZu1, HaiKind.SouZu1, HaiKind.SouZu1, HaiKind.SouZu1],
        furo: {
          type: FuroType.Kakan,
          from: Tacha.Toimen,
          nakiHai: HaiKind.SouZu1,
          kakanHai: HaiKind.SouZu1,
        },
      },
    ],
  });
  return buildScoreQuestion({
    tehai,
    agariHai: HaiKind.ManZu6,
    isTsumo: true,
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    doraMarkers: [HaiKind.Pei, HaiKind.ManZu1, HaiKind.SouZu5],
    ruleConfig: STANDARD_RULES,
  })._unsafeUnwrap();
}

/** 暗槓 2p を持つ門前のリーチ（ツモ）。789s の 9s で和了 */
export function ankanRiichiAgariQuestion(): ScoreQuestion {
  const tehai = tehaiOf({
    closed: parseHais("123456m789s33s"),
    exposed: [
      {
        type: MentsuType.Kantsu,
        hais: [HaiKind.PinZu2, HaiKind.PinZu2, HaiKind.PinZu2, HaiKind.PinZu2],
      },
    ],
  });
  return buildScoreQuestion({
    tehai,
    agariHai: HaiKind.SouZu9,
    isTsumo: true,
    jikaze: HaiKind.Sha,
    bakaze: HaiKind.Nan,
    doraMarkers: [HaiKind.Pei, HaiKind.ManZu1],
    ruleConfig: STANDARD_RULES,
    riichi: { uraDoraMarkers: [HaiKind.Sha, HaiKind.PinZu5] },
  })._unsafeUnwrap();
}

/** MPSZ の 13 枚（純手牌だけ）を聴牌形にする */
function tenpaiTehai(mpsz: string) {
  const tehai = finalizeTehai13(parseHais(mpsz), []);
  if (!tehai) throw new Error(mpsz);
  return tehai;
}

/**
 * 役なしのロン待ちを持つ門前の聴牌形（リーチなし）
 *
 * 222m 456p 789p 33s 99s の 3s・9s の双碰。ロンはどちらも役なし
 */
export function noYakuRonTenpaiQuestion(): TenpaiScoreQuestion {
  return buildTenpaiScoreQuestion({
    tehai: tenpaiTehai("222m456789p3399s"),
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    doraMarkers: [HaiKind.Pei],
    ruleConfig: STANDARD_RULES,
  })._unsafeUnwrap();
}

/** リーチした門前の両面待ち（2・5・8p の三面）の聴牌形 */
export function riichiTenpaiQuestion(): TenpaiScoreQuestion {
  return buildTenpaiScoreQuestion({
    tehai: tenpaiTehai("234m34567p678s55s"),
    jikaze: HaiKind.Ton,
    bakaze: HaiKind.Ton,
    doraMarkers: [HaiKind.Hatsu],
    riichi: { uraDoraMarkers: [HaiKind.ManZu9] },
    ruleConfig: STANDARD_RULES,
  })._unsafeUnwrap();
}
