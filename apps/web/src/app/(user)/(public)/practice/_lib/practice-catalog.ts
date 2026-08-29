import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import {
  isPracticeMenuSlug,
  menuTypeToSlug,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { RANK_REGISTRY, type RankSlug } from "@/lib/ranks/registry";
import { PRACTICE_SETUP_HASH } from "./scroll-anchor";

/**
 * 練習メニューのカタログ — 一覧の並び・段級位・教本リンクの単一の真実のソース
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

/** 練習一覧のカテゴリ（`practice.categories.*` に対応） */
export const PRACTICE_CATEGORIES = ["fuCalculation", "han", "scoring"] as const;
export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number];

/** カタログ 1 件分 */
export interface PracticeMenu {
  readonly slug: PracticeMenuSlug;
  readonly category: PracticeCategory;
  /**
   * その練習が身につける段級位。一覧のカードに段級位ピルとして出す。
   * どの級の範囲にも入らない練習（3級以降で扱う点数表早引き・点数即答）は
   * undefined で、カードにピルが付かない。
   *
   * 「初級・中級・上級」の難易度ラベルをやめてこれにしている。難易度は
   * カテゴリを跨ぐと比較できず（符の上級と点数計算の上級は別物）、
   * このアプリが実際に用意している目標（段級位）とも無関係だった。
   * 級なら「次に取る級のための練習はどれか」がそのまま読める。
   *
   * 正典は段級位レジストリ（`RANK_REGISTRY`）の側にある — 昇級試験は
   * その級の要件が指す試験そのもの、それ以外の練習は前提章
   * （`learnChapterSlugs`）に含まれる章を持つ級。ここはその対応を一覧の
   * 表示用に写したもので、食い違いはカタログのテストが落とす。
   */
  readonly rank?: RankSlug;
  /**
   * 関連する教本の章。専用の章を持たない練習（翻数即答など）は undefined。
   * 昇級試験も持たない — 合格の前提となる章はランクの決定事項で、
   * 段級位レジストリ（`RANK_REGISTRY` の `learnChapterSlugs`）が正典。
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
    rank: "kyu-4",
    learnChapter: "jantou-fu",
  },
  {
    slug: "machi-fu",
    category: "fuCalculation",
    rank: "kyu-4",
    learnChapter: "machi-fu",
  },
  {
    slug: "mentsu-fu",
    category: "fuCalculation",
    rank: "kyu-4",
    learnChapter: "mentsu-fu",
  },
  {
    slug: "mentsu-jantou-fu",
    category: "fuCalculation",
    rank: "kyu-4",
    learnChapter: "tehai-fu",
  },
  {
    slug: "total-fu",
    category: "fuCalculation",
    rank: "kyu-4",
    learnChapter: "tehai-fu",
  },
  {
    // 昇級試験の前提章は段級位レジストリ（`RANK_REGISTRY` の
    // `learnChapterSlugs`）が持つため `learnChapter` を持たない
    slug: "fu-exam",
    category: "fuCalculation",
    rank: "kyu-4",
  },
  { slug: "yaku-han", category: "han", rank: "kyu-5" },
  {
    slug: "yaku",
    category: "han",
    rank: "kyu-5",
    learnChapter: "yaku",
  },
  { slug: "han-count", category: "han", rank: "kyu-5" },
  // 点数表早引きと点数即答は満貫未満の点数を扱う。現行の段級位（5級=満貫
  // 以上の点数計算 / 4級=手牌の符）のどちらの範囲でもないため級を持たない。
  // 3級以降を定義したらそこに寄せる
  { slug: "score-table", category: "scoring" },
  {
    slug: "mangan-score-calculation",
    category: "scoring",
    rank: "kyu-5",
  },
  { slug: "score-calculation", category: "scoring" },
  {
    // 昇級試験の前提章は段級位レジストリ（`RANK_REGISTRY` の
    // `learnChapterSlugs`）が持つため `learnChapter` を持たない。
    // 合格に必要な章は 1 つではなく、どの章が要るかはランクの決定事項。
    slug: "mangan-exam",
    category: "scoring",
    rank: "kyu-5",
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

/**
 * 練習が `/practice` の URL 名前空間の外（昇級試験の `/exam` 配下）に
 * 住んでいるか。
 * 昇級試験判定
 *
 * 昇級試験は記録・結果ページの仕組みを練習と共有するためカタログには
 * 載るが、入口は道場（`/dojo`）が持つ。練習一覧のカードやパンくずの
 * 「練習一覧 >」はこの判定で出し分ける。判定はレジストリの `basePath`
 * から導出する — どの URL 名前空間に置くかの決定がそのまま所属の決定。
 */
export function isExamMenu(slug: PracticeMenuSlug): boolean {
  return !practiceHref(slug).startsWith("/practice/");
}

/**
 * カテゴリに属する練習を一覧の表示順で返す。
 * 昇級試験は含まない（練習一覧のカードにせず、道場から入る）。
 */
export function practiceMenusByCategory(
  category: PracticeCategory,
): readonly PracticeMenu[] {
  return PRACTICE_CATALOG.filter(
    (menu) => menu.category === category && !isExamMenu(menu.slug),
  );
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

/**
 * 段級位のピルを押した先 — その級の昇級試験の説明ページ
 * 段級位の行き先
 *
 * 練習カードの段級位ピルが「4級」と名乗っている以上、押した先はその級の
 * 話をしていなければならない。このアプリで級そのものを説明している場所は
 * 試験の説明ページで、合格条件と出題形式がそこに揃っている（道場は
 * 「次に取る級」しか出さないため、5級を持たない人が4級のピルを押すと
 * 5級の話に着地してしまう）。
 *
 * 要件を 2 つ以上持つ級は、どの試験が「その級のページ」なのか決められない
 * ため道場へ送る。現行の級はどちらも試験 1 つで、その分岐には入らない。
 *
 * @param slug 段級位スラッグ
 */
export function rankExamHref(slug: RankSlug): string {
  const rank = RANK_REGISTRY.find((entry) => entry.slug === slug);
  const exams = (rank?.requirements ?? []).filter(
    (requirement) => requirement.type === "challenge_score",
  );
  const [only] = exams;
  if (only === undefined || exams.length > 1) return "/dojo";
  return practiceHref(menuTypeToSlug(only.menuType));
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
