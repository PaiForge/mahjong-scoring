import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  calculateStandaloneMentsuFu,
  type CompletedMentsu,
  type HaiKindId,
} from "@mahjong-scoring/core";

import type { LessonQuestion, LessonQuiz } from "./quiz";

/**
 * 鳴いた面子の鳴き元
 *
 * 教本の例（web の `example-mentsu`）と同じ対面にし、章で見た並び（中央の
 * 1 枚が横向き）がそのまま問題に出るようにする。
 */
const FURO_FROM = Tacha.Toimen;

/** 刻子（`open` ならポン） */
function koutsu(hai: HaiKindId, open: boolean): CompletedMentsu {
  return open
    ? {
        type: MentsuType.Koutsu,
        hais: [hai, hai, hai],
        furo: { type: FuroType.Pon, from: FURO_FROM, nakiHai: hai },
      }
    : { type: MentsuType.Koutsu, hais: [hai, hai, hai] };
}

/** 槓子（`open` なら大明槓、そうでなければ暗槓） */
function kantsu(hai: HaiKindId, open: boolean): CompletedMentsu {
  return open
    ? {
        type: MentsuType.Kantsu,
        hais: [hai, hai, hai, hai],
        furo: { type: FuroType.Daiminkan, from: FURO_FROM, nakiHai: hai },
      }
    : { type: MentsuType.Kantsu, hais: [hai, hai, hai, hai] };
}

/**
 * 確認問題で問う面子（出題順）
 *
 * 章の「刻子の符を基準に、暗で 2 倍・么九牌で 2 倍・槓子で 4 倍」を
 * 1 つずつ積み上げる順に並べる。
 * 1. 中張牌の明刻（2 符）— 基準
 * 2. 么九牌の暗刻（8 符）— 暗と么九牌の 2 倍が重なる
 * 3. 中張牌の明槓（8 符）— 槓子は刻子の 4 倍
 * 4. 么九牌の暗槓（32 符）— すべてが重なる最大
 * 順子（いつでも 0 符）は覚えることが 1 つだけなので説明に留める。
 */
const QUESTIONS: readonly {
  readonly key: string;
  readonly mentsu: CompletedMentsu;
}[] = [
  { key: "minkouSimple", mentsu: koutsu(HaiKind.ManZu5, true) },
  { key: "ankouYaochu", mentsu: koutsu(HaiKind.SouZu9, false) },
  { key: "minkanSimple", mentsu: kantsu(HaiKind.SouZu5, true) },
  { key: "ankanYaochu", mentsu: kantsu(HaiKind.Chun, false) },
];

/**
 * 面子の種類すべて（形 × 明暗 × 中張牌 / 么九牌）の代表
 *
 * 選択肢を章のまとめの表の符の列と同じ集合にするために使う。
 */
const ALL_KINDS: readonly CompletedMentsu[] = [
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
  },
  ...[HaiKind.ManZu5, HaiKind.ManZu1].flatMap((hai) =>
    [true, false].flatMap((open) => [koutsu(hai, open), kantsu(hai, open)]),
  ),
];

/**
 * 「面子の符」レッスンの確認問題
 * 面子符レッスン確認問題
 *
 * 面子 1 つを示して、その符を選ばせる。符は core の
 * `calculateStandaloneMentsuFu`（面子符の練習と同じ `calculateMentsuFu` で
 * 数える）から引き、選択肢は面子の種類すべてに現れる符（章のまとめの表の
 * 符の列）。
 */
export const MENTSU_FU_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map(({ key, mentsu }): LessonQuestion => ({
    key,
    prompt: { kind: "mentsu", mentsu },
    answer: { kind: "fu", fu: calculateStandaloneMentsuFu(mentsu) },
  })),
  choices: [...new Set(ALL_KINDS.map(calculateStandaloneMentsuFu))]
    .sort((a, b) => a - b)
    .map((fu) => ({ kind: "fu", fu })),
};
