import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import {
  isPracticeMenuSlug,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { PRACTICE_SETUP_HASH } from "./scroll-anchor";

/**
 * 練習メニューのカタログ — 一覧の並び・難易度・教本リンクの単一の真実のソース
 *
 * @description
 * 練習一覧（`/practice`）の表示順とカテゴリ分けをここで管理する。ダッシュボードの
 * おすすめ練習など一覧以外の画面からも参照するため、ページのローカル定数ではなく
 * `_lib` に置く。
 *
 * @design 導出できるものは持たない
 * href・i18n キーは slug から導出する（`practiceHref` / `practiceTitleKey` /
 * `practiceDescriptionKey`）。教本へのリンクも章スラッグだけを持ち、パスは
 * `chapterHref()` に任せる。slug と messageKey の対応は
 * `lib/db/practice-menu-types.ts` のレジストリが正典で、そこに載らない練習
 * （記録対象外の `/practice/score`）はカタログにも含めない。
 */

/** 練習の難易度 */
export type PracticeDifficulty = "beginner" | "intermediate" | "advanced";

/** 練習一覧のカテゴリ（`practice.categories.*` に対応） */
export const PRACTICE_CATEGORIES = ["fuCalculation", "han", "scoring"] as const;
export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number];

/** カタログ 1 件分 */
export interface PracticeMenu {
  readonly slug: PracticeMenuSlug;
  readonly category: PracticeCategory;
  readonly difficulty: PracticeDifficulty;
  /**
   * 前提知識となる教本の章。専用の章を持たない練習（翻数即答など）は undefined。
   *
   * 章側の `practiceHrefs`（その章を読んだら解く練習）とは向きも意味も違う関係で、
   * 互いの逆写像ではない。手牌の合計符のように「章の practiceHrefs には
   * 挙がっていないが前提となる章はある」練習や、役の翻数のように
   * 「章から勧められるが専用の章は持たない」練習がある。
   */
  readonly learnChapter?: CurriculumChapterSlug;
}

/** 練習メニューのマスタ配列（カテゴリごとに一覧の表示順で並べる） */
export const PRACTICE_CATALOG: readonly PracticeMenu[] = [
  {
    slug: "jantou-fu",
    category: "fuCalculation",
    difficulty: "beginner",
    learnChapter: "jantou-fu",
  },
  {
    slug: "machi-fu",
    category: "fuCalculation",
    difficulty: "beginner",
    learnChapter: "machi-fu",
  },
  {
    slug: "mentsu-fu",
    category: "fuCalculation",
    difficulty: "intermediate",
    learnChapter: "mentsu-fu",
  },
  {
    slug: "mentsu-jantou-fu",
    category: "fuCalculation",
    difficulty: "advanced",
    learnChapter: "tehai-fu",
  },
  {
    slug: "total-fu",
    category: "fuCalculation",
    difficulty: "advanced",
    learnChapter: "tehai-fu",
  },
  { slug: "yaku-han", category: "han", difficulty: "beginner" },
  {
    slug: "yaku",
    category: "han",
    difficulty: "intermediate",
    learnChapter: "yaku",
  },
  { slug: "han-count", category: "han", difficulty: "advanced" },
  { slug: "score-table", category: "scoring", difficulty: "intermediate" },
  {
    slug: "mangan-score-calculation",
    category: "scoring",
    difficulty: "intermediate",
  },
  { slug: "score-calculation", category: "scoring", difficulty: "advanced" },
  {
    slug: "mangan-exam",
    category: "scoring",
    difficulty: "advanced",
    learnChapter: "yaku",
  },
] as const;

/**
 * 記録を取らない総合演習（`/practice/score`）のパス。
 *
 * チャレンジではなく無限に解ける訓練なので `PRACTICE_MENU_REGISTRY` にも
 * カタログにも載らない。練習一覧のバナーとダッシュボードのフォールバックが参照する。
 */
export const COMPREHENSIVE_PRACTICE_HREF = "/practice/score";

const catalogBySlug: ReadonlyMap<PracticeMenuSlug, PracticeMenu> = new Map(
  PRACTICE_CATALOG.map((menu) => [menu.slug, menu]),
);

/** slug からカタログの 1 件を取得する。カタログ外なら undefined */
export function practiceMenuFromCatalog(
  slug: PracticeMenuSlug,
): PracticeMenu | undefined {
  return catalogBySlug.get(slug);
}

/** カテゴリに属する練習を一覧の表示順で返す */
export function practiceMenusByCategory(
  category: PracticeCategory,
): readonly PracticeMenu[] {
  return PRACTICE_CATALOG.filter((menu) => menu.category === category);
}

/**
 * 練習ページのパス
 *
 * 原則 `/practice/<slug>` だが、昇級試験のように別の URL 名前空間に置く
 * 練習はレジストリの `basePath` が上書きする。パスを直に組み立てず
 * 必ずここを通すこと（play / result は `practicePlayHref` 等を使う）。
 */
export function practiceHref(slug: PracticeMenuSlug): string {
  return practiceMenuBySlug(slug).basePath;
}

/** 練習のプレイページのパス */
export function practicePlayHref(slug: PracticeMenuSlug): string {
  return `${practiceHref(slug)}/play`;
}

/** 練習のトレーニングページのパス */
export function practiceTrainingHref(slug: PracticeMenuSlug): string {
  return `${practiceHref(slug)}/training`;
}

/**
 * 練習の出題設定へのパス（説明ページの設定セクションへのアンカー付き）。
 * 出題設定パス
 *
 * 出題設定を持たない練習（レジストリの `hasSetup` が false）は undefined を返す。
 * 結果ページはこれが undefined なら「設定を変更する」ボタン自体を出さない。
 */
export function practiceSetupHref(slug: PracticeMenuSlug): string | undefined {
  const { hasSetup, basePath } = practiceMenuBySlug(slug);
  return hasSetup ? `${basePath}${PRACTICE_SETUP_HASH}` : undefined;
}

/** 練習の結果ページのパス */
export function practiceResultHref(slug: PracticeMenuSlug): string {
  return `${practiceHref(slug)}/result`;
}

/** 練習名の i18n キー（`getTranslations("practice")` スコープ内で使う） */
export function practiceTitleKey(slug: PracticeMenuSlug): string {
  return `practices.${practiceMenuBySlug(slug).messageKey}.title`;
}

/** 練習の説明文の i18n キー（`getTranslations("practice")` スコープ内で使う） */
export function practiceDescriptionKey(slug: PracticeMenuSlug): string {
  return `practices.${practiceMenuBySlug(slug).messageKey}.description`;
}

/**
 * `/practice/<slug>` 形式のパスから slug を取り出す。
 * 練習スラッグ抽出
 *
 * 教本の `practiceHrefs` はクエリ付きのものがある（例:
 * `/practice/score-table?roles=ko&wins=ron&ranges=plus`）ため、クエリと
 * ハッシュを落としてから判定する。練習ページ以外や未登録の slug は undefined。
 *
 * @param href 練習ページへのパス
 */
export function practiceSlugFromHref(
  href: string,
): PracticeMenuSlug | undefined {
  const pathOnly = href.split(/[?#]/)[0] ?? "";
  const match = /^\/practice\/([a-z0-9-]+)\/?$/.exec(pathOnly);
  const slug = match?.[1];
  if (slug === undefined || !isPracticeMenuSlug(slug)) return undefined;
  return slug;
}
