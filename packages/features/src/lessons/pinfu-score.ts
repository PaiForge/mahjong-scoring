import {
  PINFU_RON_FU,
  PINFU_TSUMO_FU,
  calculateKoScore,
  isInvalidCell,
  type Fu,
  type WinType,
} from "@mahjong-scoring/core";

import { sumMenzenHan } from "./agari-quiz";
import type { LessonChoice, LessonQuestion, LessonQuiz } from "./quiz";

/** 平和の役名（`YAKU_HAN_ENTRIES` の名前） */
const PINFU = "平和";

/** ツモ和了で必ず付く役（平和は門前なので、ツモなら必ず複合する） */
const MENZEN_TSUMO = "門前清自摸和";

/**
 * 確認問題で問う和了（出題順。どれも子）
 *
 * ロンとツモを交互に並べ、ロンは 30 符・ツモは 20 符で表を引き分けることを
 * 確かめる。
 * 1. 平和のみのロン（1 翻）— 30 符
 * 2. ツモ（門前清自摸和が付いて 2 翻）— 20 符。ツモの支払いの形で答える
 * 3. 断么九が複合したロン（2 翻）— 複合しても 30 符のまま
 * 4. 断么九が複合したツモ（3 翻）— 複合しても 20 符のまま
 * 親は子の表と引き方が同じなので、表で見るに留める。4 翻のロン（30 符 4 翻）
 * は切り上げ満貫の設定で答えが割れるので問わない。
 */
const QUESTIONS: readonly {
  readonly key: string;
  readonly winType: WinType;
  readonly yaku: readonly string[];
}[] = [
  { key: "ron", winType: "ron", yaku: [PINFU] },
  { key: "tsumo", winType: "tsumo", yaku: [PINFU, MENZEN_TSUMO] },
  { key: "tanyaoRon", winType: "ron", yaku: [PINFU, "断么九"] },
  {
    key: "tanyaoTsumo",
    winType: "tsumo",
    yaku: [PINFU, MENZEN_TSUMO, "断么九"],
  },
];

/** 表の翻数の列（平和のみの 1 翻から満貫の手前まで） */
const HAN_COLS = [1, 2, 3, 4] as const;

/** 和了方法ごとの平和の符 */
function pinfuFu(winType: WinType): Fu {
  return winType === "tsumo" ? PINFU_TSUMO_FU : PINFU_RON_FU;
}

/** 子の点数表の 1 セルを選択肢にする（ロンは点数、ツモは支払いの組） */
function koCell(han: number, winType: WinType): LessonChoice {
  const score = calculateKoScore(han, pinfuFu(winType));
  return winType === "tsumo"
    ? {
        kind: "koTsumo",
        fromKo: score.tsumo.fromKo,
        fromOya: score.tsumo.fromOya,
      }
    : { kind: "points", points: score.ron };
}

/**
 * 「平和での点数計算」レッスンの確認問題
 * 平和レッスン確認問題
 *
 * 子のロン / ツモと役の組み合わせ・翻数を示して、点数を選ばせる。符は
 * 言わない（ツモ 20 符・ロン 30 符を知っているかを確かめる）。点数は core の
 * `PINFU_TSUMO_FU` / `PINFU_RON_FU` と点数計算（教本の点数表と同じ）から
 * 引く。選択肢は章の子の表そのもの（ツモの行 → ロンの行。存在しない
 * 1 翻のツモは除く）で、ロンとツモで答えの形が違うのは表の行の違いのまま。
 */
export const PINFU_SCORE_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map(({ key, winType, yaku }): LessonQuestion => {
    const han = sumMenzenHan(yaku);
    return {
      key,
      prompt: { kind: "agari", role: "ko", winType, yaku, han },
      answer: koCell(han, winType),
    };
  }),
  choices: (["tsumo", "ron"] as const).flatMap((winType) =>
    HAN_COLS.filter(
      (han) => !isInvalidCell(han, pinfuFu(winType), winType),
    ).map((han) => koCell(han, winType)),
  ),
};
