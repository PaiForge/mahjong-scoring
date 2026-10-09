import {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  type YakuHanEntry,
  compareNumbers,
} from "@mahjong-scoring/core";

import type { LessonChoice, LessonQuestion, LessonQuiz } from "./quiz";

/** 翻数を選択肢にする。役満は翻数ではなく「役満」として並べる */
function hanChoice(han: number): LessonChoice {
  return han === YAKUMAN_HAN ? { kind: "yakuman" } : { kind: "han", han };
}

/**
 * 確認問題で問う役（出題順）
 *
 * 章が教える 3 つの見方を 1 問ずつ順に確かめる。
 * 1. 役ごとに翻数が決まっている（立直 = 1 翻）
 * 2. 鳴いても翻数が変わらない役がある（対々和）
 * 3. 鳴くと翻数が下がる役がある（混一色の門前 → 鳴き。食い下がり）
 * 食い下がりは同じ役の門前と鳴きを続けて問い、差が 1 翻であることを
 * 並べて見せる。門前限定（鳴くと成立しない）は「成立しない」を選択肢に
 * 足す必要があり、翻数を答える形から外れるので説明に留める。
 */
const QUESTIONS: readonly {
  readonly key: string;
  readonly yaku: string;
  readonly naki: boolean;
}[] = [
  { key: "riichi", yaku: "立直", naki: false },
  { key: "toitoiNaki", yaku: "対々和", naki: true },
  { key: "honitsuMenzen", yaku: "混一色", naki: false },
  { key: "honitsuNaki", yaku: "混一色", naki: true },
];

/** 門前・鳴きの翻数を引く。鳴きで成立しない役を鳴きで問うのは定義の誤り */
function hanOf(entry: YakuHanEntry, naki: boolean): number {
  const han = naki ? entry.nakiHan : entry.menzenHan;
  if (han === undefined) {
    throw new Error(`${entry.name} は鳴くと成立しない`);
  }
  return han;
}

/**
 * 「役と翻数」レッスンの確認問題
 * 役レッスン確認問題
 *
 * 役名と門前 / 鳴きを示して、翻数を選ばせる。翻数は core の
 * `YAKU_HAN_ENTRIES`（教本の翻数表・役翻数練習と同じ一覧）から引き、
 * 選択肢はその一覧に現れる翻数すべて（役満を含む）。
 */
export const YAKU_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map(({ key, yaku, naki }): LessonQuestion => {
    const entry = YAKU_HAN_ENTRIES.find((candidate) => candidate.name === yaku);
    if (entry === undefined) {
      throw new Error(`YAKU_HAN_ENTRIES に ${yaku} がない`);
    }
    return {
      key,
      prompt: { kind: "yaku", yaku, naki },
      answer: hanChoice(hanOf(entry, naki)),
    };
  }),
  // 展開で作った新しい配列を並べ替える（一覧そのものは変えない）
  choices: [
    ...new Set(
      YAKU_HAN_ENTRIES.flatMap((entry) =>
        entry.nakiHan === undefined
          ? [entry.menzenHan]
          : [entry.menzenHan, entry.nakiHan],
      ),
    ),
  ]
    .sort(compareNumbers)
    .map(hanChoice),
};
