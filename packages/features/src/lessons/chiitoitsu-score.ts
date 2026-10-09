import {
  compareNumbers,
  CHIITOITSU_FU,
  type Role,
} from "@mahjong-scoring/core";

import { scoreOf, sumMenzenHan } from "./agari-quiz";
import type { LessonQuestion, LessonQuiz } from "./quiz";

/** 七対子の役名（`YAKU_HAN_ENTRIES` の名前） */
const CHIITOITSU = "七対子";

/**
 * 確認問題で問う和了（出題順）
 *
 * 1. 七対子のみ（2 翻）の子のロン — 符が 25 符であること
 * 2. 断么九が複合して 3 翻 — 複合しても符は変わらず、翻数だけが上がる
 * 3. 立直・断么九が複合して 4 翻 — 同じく。表の右端
 * 4. 立直が複合した親のロン（3 翻）— 親の表も同じ 25 符の列
 * どれもロン。ツモは七対子のみ（2 翻）の欄が無く（門前清自摸和が付く）、
 * 支払いの形も変わるので、表で見るに留める。満貫に届く組み合わせ（5 翻
 * 以上）は符を使わないので問わない。
 */
const QUESTIONS: readonly {
  readonly key: string;
  readonly role: Role;
  readonly yaku: readonly string[];
}[] = [
  { key: "only", role: "ko", yaku: [CHIITOITSU] },
  { key: "tanyao", role: "ko", yaku: [CHIITOITSU, "断么九"] },
  { key: "riichiTanyao", role: "ko", yaku: [CHIITOITSU, "立直", "断么九"] },
  { key: "oyaRiichi", role: "oya", yaku: [CHIITOITSU, "立直"] },
];

/** 選択肢に並べる翻数（七対子のみの 2 翻から満貫の手前まで） */
const HAN_RANGE = [2, 3, 4] as const;

/**
 * 「七対子での点数計算」レッスンの確認問題
 * 七対子レッスン確認問題
 *
 * 立場・役の組み合わせとその翻数を示して、ロンの点数を選ばせる。符は
 * 言わない（25 符を知っているかを確かめる）。点数は core の
 * `CHIITOITSU_FU` と点数計算（教本の点数表と同じ）から引き、選択肢は
 * 子と親の 25 符・2〜4 翻のロンの点数すべて（章の 2 つの表のロンの行）。
 */
export const CHIITOITSU_SCORE_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map(({ key, role, yaku }): LessonQuestion => {
    const han = sumMenzenHan(yaku);
    return {
      key,
      prompt: { kind: "agari", role, winType: "ron", yaku, han },
      answer: { kind: "points", points: scoreOf(role, han, CHIITOITSU_FU).ron },
    };
  }),
  choices: [
    ...new Set(
      (["ko", "oya"] as const).flatMap((role) =>
        HAN_RANGE.map((han) => scoreOf(role, han, CHIITOITSU_FU).ron),
      ),
    ),
  ]
    .sort(compareNumbers)
    .map((points) => ({ kind: "points", points })),
};
