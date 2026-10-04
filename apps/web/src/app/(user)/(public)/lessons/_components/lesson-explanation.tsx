import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { JantouFuGuide } from "@/app/(user)/(public)/learn/jantou-fu/_components/jantou-fu-guide";
import { MentsuFuGuide } from "@/app/(user)/(public)/learn/mentsu-fu/_components/mentsu-fu-guide";
import { ManganKoRonGuide } from "@/app/(user)/(public)/learn/mangan-ko-ron/_components/mangan-ko-ron-guide";
import { ManganOyaRonGuide } from "@/app/(user)/(public)/learn/mangan-oya-ron/_components/mangan-oya-ron-guide";
import { ManganOyaTsumoGuide } from "@/app/(user)/(public)/learn/mangan-oya-tsumo/_components/mangan-oya-tsumo-guide";
import { ManganKoTsumoGuide } from "@/app/(user)/(public)/learn/mangan-ko-tsumo/_components/mangan-ko-tsumo-guide";
import { YakuGuide } from "@/app/(user)/(public)/learn/yaku/_components/yaku-guide";
import type { LessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { stripTermMarkup } from "@/lib/glossary/term-markup";

/**
 * レッスンの説明の出所
 *
 * 説明は教本の章の本文をそのまま出す。レッスン用に絞った要約を別に持つと、
 * 章とほぼ同じ文を二重に持つことになり、確認問題のヒントが指す説明が
 * 片方にしか無い、という食い違いが起きる。章の本文がヒントの拠り所を
 * 欠くときは、要約を足すのではなく章のほうを直す（役の章の食い下がりの
 * 翻数が前例）。
 *
 * - `guide`: 章の本文のコンポーネント
 * - `excerptKeys`: 抜粋（{@link lessonExcerpt}）に使う章の段落の辞書キー
 *   （名前空間付き）
 */
interface LessonExplanationSource {
  readonly guide: ReactNode;
  readonly excerptKeys: readonly string[];
}

/**
 * レッスンごとの説明
 *
 * 表は教本の章と同じコンポーネントなので、レッスンで見た表がそのまま章にもあり、
 * 確認問題の選択肢（features の `lessonQuiz`）も表と同じ出所（core）から
 * 導いている。`Record<LessonSlug, …>` なので、レッスンを足したら説明を
 * 決めるまで型検査が通らない。
 */
const LESSON_EXPLANATIONS: Readonly<
  Record<LessonSlug, LessonExplanationSource>
> = {
  "mangan-ko-ron": {
    guide: <ManganKoRonGuide />,
    // 章の本文（`ManganGuideLayout`）のうち表より前の 2 段落
    excerptKeys: ["manganKoRon.learn.body1", "manganKoRon.learn.body2"],
  },
  "mangan-ko-tsumo": {
    // 導出の節（ロンを半分にする）まで出す。確認問題のヒントはその節の
    // 手順を指しているため、表の節だけでは拠り所が無くなる
    guide: <ManganKoTsumoGuide />,
    excerptKeys: ["manganKoTsumo.learn.body1", "manganKoTsumo.learn.body2"],
  },
  "mangan-oya-ron": {
    // 章は表の節 1 つだけ。確認問題のヒントは「子の点数の 1.5 倍」を指し、
    // その拠り所（子の 1.5 倍・倍率は子と同じ）は本文の冒頭と表の後にある
    guide: <ManganOyaRonGuide />,
    excerptKeys: ["manganOyaRon.learn.body1", "manganOyaRon.learn.body2"],
  },
  "mangan-oya-tsumo": {
    // 導出の節（ロンを 3 で割る）まで出す。確認問題のヒントはその節の
    // 手順を指しているため（子のツモと同じ理由）
    guide: <ManganOyaTsumoGuide />,
    excerptKeys: ["manganOyaTsumo.learn.body1", "manganOyaTsumo.learn.body2"],
  },
  yaku: {
    // 章の全部を出す。確認問題のヒントは門前限定・食い下がりの 1 翻・
    // 鳴いても変わらない役（門前と鳴きの節）と、表が門前の翻数であること
    // （まとめの節）を指す。まとめの節の「役一覧を見る」は外へ出る導線だが、
    // 翻数を確かめに行く先なので残す
    guide: <YakuGuide />,
    excerptKeys: ["yaku.learn.whatIsYakuBody1", "yaku.learn.whatIsYakuBody2"],
  },
  "jantou-fu": {
    // 章の全部を出す。確認問題のヒントは役牌の節（三元牌・自風）・0 符の節
    // （オタ風）・まとめの表（数牌）を指す。連風牌のコラムの「設定」への
    // リンクは外へ出る導線だが、連風牌を出題しない理由（ルールで符が割れる）
    // の説明そのものなので残す
    guide: <JantouFuGuide />,
    excerptKeys: [
      "jantouFu.learn.whatIsJantouBody",
      "jantouFu.learn.yakuhaiBody",
    ],
  },
  "mentsu-fu": {
    // 章の全部を出す。確認問題のヒントは刻子の節（横向きの牌が鳴いた印・
    // 么九牌がどの牌か — 本文に無かったので章に足した）と槓子の節（刻子の
    // 4 倍・暗槓は両端を伏せる）を指す。外へ出るリンクは用語の説明だけ
    guide: <MentsuFuGuide />,
    excerptKeys: [
      "mentsuFu.learn.whatIsMentsuFuBody",
      "mentsuFu.learn.shuntsuBody",
    ],
  },
};

interface LessonExplanationProps {
  readonly slug: LessonSlug;
}

/**
 * レッスンの説明（確認問題の前に読む部分）
 * レッスン説明
 *
 * Server Component。章の見出しをそのまま使う。
 */
export function LessonExplanation({ slug }: LessonExplanationProps) {
  return LESSON_EXPLANATIONS[slug].guide;
}

/**
 * レッスンの説明の冒頭の文（表と見出しを除いた段落）
 * レッスン抜粋
 *
 * 前のレッスンの完了画面が「次のレッスン」として冒頭を見せるのに使う。
 * 説明と同じ辞書から引くので、説明を直せば抜粋も揃う。用語マークアップは
 * 外す（抜粋はリンクを置かずに文だけを見せる）。
 */
export async function lessonExcerpt(
  slug: LessonSlug,
): Promise<readonly string[]> {
  const t = await getTranslations();
  return LESSON_EXPLANATIONS[slug].excerptKeys.map((key) =>
    stripTermMarkup(t(key)),
  );
}
