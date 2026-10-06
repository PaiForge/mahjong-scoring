import { getTranslations } from "next-intl/server";

import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { stripTermMarkup } from "@mahjong-scoring/features/glossary/term-markup";

/**
 * レッスンの抜粋に使う、章の本文の段落の辞書キー（名前空間付き）
 * レッスン抜粋キー
 *
 * 前のレッスンの完了画面が「次のレッスン」として冒頭を見せるのに使う。
 * 章の本文と同じ辞書から引くので、本文を直せば抜粋も揃う。表と見出しは
 * 含めない（抜粋は文だけを 3 行ほど見せる）。`Record<QuizLessonSlug, …>`
 * なので、確認問題を持つレッスンを足したら抜粋を決めるまで型検査が通らない。
 */
const LESSON_EXCERPT_KEYS: Readonly<Record<QuizLessonSlug, readonly string[]>> =
  {
    // 章の本文（`ManganGuideLayout`）のうち表より前の 2 段落
    "mangan-ko-ron": ["manganKoRon.learn.body1", "manganKoRon.learn.body2"],
    "mangan-ko-tsumo": [
      "manganKoTsumo.learn.body1",
      "manganKoTsumo.learn.body2",
    ],
    "mangan-oya-ron": ["manganOyaRon.learn.body1", "manganOyaRon.learn.body2"],
    "mangan-oya-tsumo": [
      "manganOyaTsumo.learn.body1",
      "manganOyaTsumo.learn.body2",
    ],
    yaku: ["yaku.learn.whatIsYakuBody1", "yaku.learn.whatIsYakuBody2"],
    "jantou-fu": [
      "jantouFu.learn.whatIsJantouBody",
      "jantouFu.learn.yakuhaiBody",
    ],
    "mentsu-fu": [
      "mentsuFu.learn.whatIsMentsuFuBody",
      "mentsuFu.learn.shuntsuBody",
    ],
    "machi-fu": ["machiFu.learn.whatIsMachiBody", "machiFu.learn.twoFuBody"],
    // チェックリストの導入と切り上げの段落（2 段落目の「足す順番は好みで」は、
    // 次のレッスンの書き出しとして中身が薄い）
    "tehai-fu": [
      "tehaiFu.learn.checklistLead",
      "tehaiFu.learn.checklistRoundBody",
    ],
    "chiitoitsu-score": [
      "chiitoitsuScore.learn.onePatternBody1",
      "chiitoitsuScore.learn.onePatternBody2",
    ],
    "pinfu-score": [
      "pinfuScore.learn.twoPatternsBody1",
      "pinfuScore.learn.twoPatternsBody2",
    ],
    "menzen-mentsu-score": [
      "menzenMentsuScore.learn.startBody1",
      "menzenMentsuScore.learn.startBody2",
    ],
    "furo-score": ["furoScore.learn.startBody1", "furoScore.learn.startBody2"],
  };

/**
 * レッスンの本文の冒頭の文（表と見出しを除いた段落）
 * レッスン抜粋
 *
 * 用語マークアップは外す（抜粋はリンクを置かずに文だけを見せる）。
 */
export async function lessonExcerpt(
  slug: QuizLessonSlug,
): Promise<readonly string[]> {
  const t = await getTranslations();
  return LESSON_EXCERPT_KEYS[slug].map((key) => stripTermMarkup(t(key)));
}
