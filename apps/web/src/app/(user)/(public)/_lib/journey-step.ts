import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import type { JourneyStep } from "@mahjong-scoring/features/journey/journey";
import { practiceTitleKey } from "@mahjong-scoring/features/practice/catalog";
import { practiceMenuBySlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  rankRequiringMenu,
  rankTier,
} from "@mahjong-scoring/features/ranks/registry";
import {
  chapterHref,
  lessonHref,
  practiceHref,
} from "@mahjong-scoring/features/routes";
import { practiceVariantLabel } from "./practice-variant-label";

/**
 * 辞書全体を引ける翻訳関数。サーバーの `getTranslations()` でもクライアントの
 * `useTranslations()` でもよい（レッスンの完了画面は、記録のあとに返ってきた
 * 一歩をクライアントで名指しする）
 */
type RootTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * 黒帯への道の一歩の行き先
 * 一歩の行き先
 */
export function journeyStepHref(step: JourneyStep): string {
  switch (step.kind) {
    case "lesson":
      return lessonHref(step.lessonSlug);
    case "read":
      return chapterHref(step.chapterSlug);
    case "practice":
      return practiceHref(step.slug, step.variant);
    case "exam":
      return practiceHref(step.slug);
  }
}

/**
 * 黒帯への道の一歩が指すものの名前（章・練習・試験）
 * 一歩の名前
 *
 * ダッシュボードの「次にやること」とレッスンの完了画面が、同じ一歩を同じ名前で
 * 呼ぶためのもの。名前は各レジストリの辞書キーから引く。バリアント付きの
 * 練習は練習名にバリアント名を添える（章末の練習リンクと同じ）。
 */
export function journeyStepTitle(
  step: JourneyStep,
  tAll: RootTranslator,
): string {
  switch (step.kind) {
    case "lesson":
    case "read": {
      const chapter = getChapterBySlug(step.chapterSlug);
      return chapter
        ? tAll(`learnCurriculum.${getChapterI18nPath(chapter)}.title`)
        : "";
    }
    case "practice": {
      const title = tAll(`practice.${practiceTitleKey(step.slug)}`);
      const variantLabel = practiceVariantLabel(tAll, step.slug, step.variant);
      return variantLabel ? `${title}（${variantLabel}）` : title;
    }
    case "exam": {
      const rank = rankRequiringMenu(
        practiceMenuBySlug(step.slug).menuType,
      )?.rank;
      if (rank === undefined) return "";
      return tAll(`ranks.examTitle.${rankTier(rank.slug)}`, {
        rank: tAll(`ranks.names.${rank.slug}`),
      });
    }
  }
}
