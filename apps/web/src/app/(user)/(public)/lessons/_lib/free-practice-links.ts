import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

import { scorePracticePlayHref } from "../../practice/agari-score/_lib/play-href";

/** カタログ外の練習への導線 1 つ */
export interface FreePracticeLink {
  /** 行き先（和了形の点数計算の絞り込み付き play） */
  readonly href: string;
  /** ボタンの文言の辞書キー（名前空間付き） */
  readonly labelKey: string;
}

/**
 * 章に対応する、カタログ外の練習（和了形の点数計算の絞り込み）への導線
 * 章の自由練習リンク
 *
 * 点数の計算セクションの章は、章の内容そのままの出題（七対子だけ・平和だけ・
 * 門前の面子手だけ・鳴いた手だけ、いずれも満貫未満）を和了形の点数計算の絞り込みで
 * 持つ。カタログに登録された練習ではないので `practiceLinks`（記録対象・
 * おすすめ導線の前提。`practice/catalog.test.ts` が固定）では指せず、ここで
 * 章ページの「関連する練習」の末尾に足す。以前は章本文の末尾に置いていたが、
 * 確認問題の「始める」と押して始めるボタンが 2 つ並ぶため、完了後の導線に
 * 移した。
 *
 * パスの組み立ては web の和了形の点数計算に結び付くので、features の章レジストリ
 * ではなくここに置く。
 */
export const FREE_PRACTICE_LINKS: Readonly<
  Partial<Record<CurriculumChapterSlug, FreePracticeLink>>
> = {
  "chiitoitsu-score": {
    href: scorePracticePlayHref({ yaku: ["七対子"], ranges: ["nonMangan"] }),
    labelKey: "chiitoitsuScore.learn.practiceCta",
  },
  "pinfu-score": {
    href: scorePracticePlayHref({ yaku: ["平和"], ranges: ["nonMangan"] }),
    labelKey: "pinfuScore.learn.practiceCta",
  },
  "menzen-mentsu-score": {
    href: scorePracticePlayHref({
      handShape: "menzen",
      ranges: ["nonMangan"],
    }),
    labelKey: "menzenMentsuScore.learn.practiceCta",
  },
  "furo-score": {
    href: scorePracticePlayHref({ handShape: "furo", ranges: ["nonMangan"] }),
    labelKey: "furoScore.learn.practiceCta",
  },
};
