import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

import {
  practiceHref,
  practiceMenuFromCatalog,
  practiceSlugFromHref,
} from "../../practice/_lib/practice-catalog";

/**
 * 学習カリキュラム — 章メタデータのレジストリ
 *
 * @description
 * `/learn/<slug>` 配下の章を順序付きで管理する単一の真実のソース。
 * 章の追加・削除・並び替えはこのファイル内で完結し、DB マイグレーションを
 * 必要としない（`learn_chapter_reads` は `chapter_slug` を文字列として保持）。
 *
 * @design i18nKey — 章タイトル等の翻訳キーの名前空間
 * 実際の文言は `ja.json` の `learnCurriculum.chapters.*` に置く。
 */

/** カリキュラムのセクション — 章をまとめる論理グループ */
export const CURRICULUM_SECTIONS = [
  "foundation",
  "mangan",
  "yaku",
  "fu",
  "score",
  "memorization",
] as const;
export type CurriculumSection = (typeof CURRICULUM_SECTIONS)[number];

/**
 * 章メタデータの記述形式（型導出用）
 *
 * `slug` を `string` にしてあるのは、章スラッグの union を
 * {@link CURRICULUM_REGISTRY} から導出するため。公開する形は
 * {@link CurriculumChapter}。`lib/db/practice-menu-types.ts` と同じ組み方。
 */
interface CurriculumChapterEntry {
  readonly slug: string;
  /**
   * 公開日（ISO 8601 の日付、JST）。Article の `datePublished`・sitemap の
   * `lastmod`・章末の表示に使う。初出はその章のディレクトリの初回コミット日。
   * 内容を大きく書き直したときはこの日付を進める（検索側には「更新日」として
   * 見える。推測で入れないこと — 実際に書き直した日だけ）。
   */
  readonly publishedAt: string;
  readonly section: CurriculumSection;
  readonly order: number;
  readonly practiceHrefs?: readonly string[];
  /**
   * この章の読了が前提となる昇級試験（練習スラッグ）。
   * 章末に「昇級試験へ」の CTA を出す。`practiceHrefs`（読んだら解く練習）
   * とは意味が違うため別フィールドにしている。
   */
  readonly examSlug?: PracticeMenuSlug;
  readonly i18nKey: string;
}

/** 章メタデータのマスタ配列（order 昇順で並べる） */
const CURRICULUM_REGISTRY = [
  {
    slug: "about-this-app",
    publishedAt: "2026-04-18",
    section: "foundation",
    order: 10,
    i18nKey: "learnCurriculum.chapters.aboutThisApp",
  },
  {
    slug: "why-scoring-is-complex",
    publishedAt: "2026-04-18",
    section: "foundation",
    order: 20,
    i18nKey: "learnCurriculum.chapters.whyScoringIsComplex",
  },
  // 満貫のセクションは役割ごとに読む（子のロン → 子のツモ → 親のロン →
  // 親のツモ）。和了方法ごと（ロン2章 → ツモ2章）ではないのは、点数表早引きの
  // 土俵が親子で分かれていて、和了方法では分かれないため。この順なら
  // ツモの章を読み終えた時点でその役割の満貫以上がちょうど揃い、練習が
  // 「読んだ範囲だけ」を出題できる。本文の参照（親は子の1.5倍、ツモの合計は
  // ロンと同じ）も参照先が直前の章になる
  {
    slug: "mangan-ko-ron",
    publishedAt: "2026-06-27",
    section: "mangan",
    order: 21,
    // 練習リンクを持たない。この時点で読んだのは子のロンだけで、
    // 子・満貫以上の練習は子のツモも出すため（次の章で揃う）
    i18nKey: "learnCurriculum.chapters.manganKoRon",
  },
  {
    slug: "mangan-ko-tsumo",
    publishedAt: "2026-06-27",
    section: "mangan",
    order: 22,
    // ここで子の満貫以上（ロン・ツモ）が揃うので、同じ範囲の練習へ送る。
    // ツモとロンで土俵を分けないのは、同じ点数の表裏で、片方だけ覚える
    // 練習が暗記の単位として不自然なため
    practiceHrefs: [practiceHref("score-table", "ko_mangan_plus")],
    i18nKey: "learnCurriculum.chapters.manganKoTsumo",
  },
  {
    slug: "mangan-oya-ron",
    publishedAt: "2026-06-27",
    section: "mangan",
    order: 23,
    // 練習リンクを持たない（子のロンの章と同じ理由。次の章で親が揃う）
    i18nKey: "learnCurriculum.chapters.manganOyaRon",
  },
  {
    slug: "mangan-oya-tsumo",
    publishedAt: "2026-06-27",
    section: "mangan",
    order: 24,
    // ここで親の満貫以上が揃う（子のツモの章と同じ理由）。
    // 満貫以上点数計算もここから送る — 出題は親子・満貫以上の固定で、
    // 満貫のセクションを読み終えた範囲とちょうど一致する（役は翻数まで
    // 提示されるため、役の章より前でも解ける）
    practiceHrefs: [
      practiceHref("score-table", "oya_mangan_plus"),
      "/practice/mangan-score-calculation",
    ],
    i18nKey: "learnCurriculum.chapters.manganOyaTsumo",
  },
  {
    slug: "yaku",
    publishedAt: "2026-04-02",
    section: "yaku",
    order: 25,
    practiceHrefs: [
      "/practice/yaku-han",
      "/practice/yaku",
      "/practice/han-count",
    ],
    // 満貫の章（役の前）と本章で5級試験の前提知識が揃う
    examSlug: "mangan-exam",
    i18nKey: "learnCurriculum.chapters.yaku",
  },
  {
    slug: "jantou-fu",
    publishedAt: "2026-04-02",
    section: "fu",
    order: 30,
    practiceHrefs: ["/practice/jantou-fu"],
    i18nKey: "learnCurriculum.chapters.jantouFu",
  },
  {
    slug: "mentsu-fu",
    publishedAt: "2026-04-02",
    section: "fu",
    order: 40,
    practiceHrefs: ["/practice/mentsu-fu"],
    i18nKey: "learnCurriculum.chapters.mentsuFu",
  },
  {
    slug: "machi-fu",
    publishedAt: "2026-04-02",
    section: "fu",
    order: 50,
    practiceHrefs: ["/practice/machi-fu"],
    i18nKey: "learnCurriculum.chapters.machiFu",
  },
  {
    slug: "tehai-fu",
    publishedAt: "2026-04-02",
    section: "fu",
    order: 60,
    // 要素ごとに符を答える練習と、手牌1つに符1つで答える練習。本章が
    // 教えるのは後者の積み上げ方なので、要素の復習から通しの計算へ続ける
    practiceHrefs: ["/practice/mentsu-jantou-fu", "/practice/total-fu"],
    // 符のセクションの前3章と本章で4級試験の前提知識が揃う
    examSlug: "fu-exam",
    i18nKey: "learnCurriculum.chapters.tehaiFu",
  },
  {
    slug: "chiitoitsu-score",
    publishedAt: "2026-08-29",
    section: "score",
    order: 70,
    // 対応する練習は自由練習（/practice/score の役絞り込み）だが、
    // practiceHrefs はカタログ登録済みの練習しか指せない（記録対象・
    // おすすめ導線の前提。practice-catalog.test.ts が固定している）。
    // 導線は章本文（chiitoitsu-score-guide.tsx）の CTA が持つ
    //
    // 3級試験の前提知識はこの章だけで揃う（符は25符固定で、翻数の数え方は
    // 5級までで済んでいる）
    examSlug: "chiitoitsu-exam",
    i18nKey: "learnCurriculum.chapters.chiitoitsuScore",
  },
  {
    slug: "pinfu-score",
    publishedAt: "2026-08-28",
    section: "score",
    order: 80,
    // 七対子の章と同じ理由で practiceHrefs を持たない（導線は
    // pinfu-score-guide.tsx の CTA）
    //
    // 2級試験の前提知識はこの章だけで揃う（符はツモ20符・ロン30符の
    // 2通りで、翻数の数え方は5級までで済んでいる）
    examSlug: "pinfu-exam",
    i18nKey: "learnCurriculum.chapters.pinfuScore",
  },
  {
    slug: "menzen-mentsu-score",
    publishedAt: "2026-08-29",
    section: "score",
    order: 90,
    // 七対子・平和の章と同じ理由で practiceHrefs を持たない（導線は
    // menzen-mentsu-score-guide.tsx の CTA）
    i18nKey: "learnCurriculum.chapters.menzenMentsuScore",
  },
  {
    slug: "furo-score",
    publishedAt: "2026-08-29",
    section: "score",
    order: 100,
    // 点数の計算セクションの他の章と同じ理由で practiceHrefs を持たない
    // （導線は furo-score-guide.tsx の CTA）
    //
    // 1級試験の前提知識は門前の面子手の章と本章で揃う。試験 CTA は
    // 前提が揃う最後の章に出すため、門前の章ではなくこちらに持たせる
    examSlug: "fu-score-exam",
    i18nKey: "learnCurriculum.chapters.furoScore",
  },
  {
    slug: "fu-doubling",
    publishedAt: "2026-08-31",
    section: "memorization",
    // 点数の計算セクション（〜100）から番号を離す。記憶術セクションは
    // 章を足していく前提なので、基礎側が伸びても番号がぶつからないようにする
    order: 200,
    // 点数表早引きの満貫未満だけ。この章が減らすのはまさにその範囲の暗記量で、
    // 符×翻を1マスずつ引く練習がそのまま腕試しになる。子から覚えるのが定石
    // なので子のバリアントへ送る
    practiceHrefs: [practiceHref("score-table", "ko_non_mangan")],
    i18nKey: "learnCurriculum.chapters.fuDoubling",
  },
  {
    slug: "ron-to-tsumo",
    publishedAt: "2026-09-02",
    section: "memorization",
    order: 210,
    // 子に絞った点数表早引き。この章が導出できるようにするのはまさに
    // 子ツモの2つの数字で、子のセルを引く練習がそのまま腕試しになる
    // （ツモだけに絞るバリアントは持たない — ロンとツモは同じセルの表裏）
    practiceHrefs: [practiceHref("score-table", "ko_non_mangan")],
    i18nKey: "learnCurriculum.chapters.ronToTsumo",
  },
  {
    slug: "tsumo-payments",
    publishedAt: "2026-08-31",
    section: "memorization",
    order: 220,
    // 点数表早引きの全部。この章が要らなくする暗記はまさに親ツモの列で、
    // 親子のセルを引く練習がそのまま腕試しになる
    // （ツモだけに絞るバリアントは持たない — ロンとツモは同じセルの表裏）
    practiceHrefs: [practiceHref("score-table", "all")],
    i18nKey: "learnCurriculum.chapters.tsumoPayments",
  },
] as const satisfies readonly CurriculumChapterEntry[];

/** 章スラッグ — `/learn/<slug>` の slug 部分に対応 */
export type CurriculumChapterSlug =
  (typeof CURRICULUM_REGISTRY)[number]["slug"];

/** 1 章分のメタデータ */
export interface CurriculumChapter {
  readonly slug: CurriculumChapterSlug;
  /**
   * 公開日（ISO 8601 の日付、JST）。Article の `datePublished`・sitemap の
   * `lastmod`・章末の表示に使う。初出はその章のディレクトリの初回コミット日。
   * 内容を大きく書き直したときはこの日付を進める（検索側には「更新日」として
   * 見える。推測で入れないこと — 実際に書き直した日だけ）。
   */
  readonly publishedAt: string;
  readonly section: CurriculumSection;
  readonly order: number;
  readonly practiceHrefs?: readonly string[];
  /** この章の読了が前提となる昇級試験（練習スラッグ）。章末に CTA を出す */
  readonly examSlug?: PracticeMenuSlug;
  readonly i18nKey: string;
}

/** 章メタデータのマスタ配列（order 昇順で並べる） */
export const CURRICULUM: readonly CurriculumChapter[] = CURRICULUM_REGISTRY;

/** 章スラッグの一覧（CURRICULUM と同じ順序） */
export const CURRICULUM_CHAPTER_SLUGS: readonly CurriculumChapterSlug[] =
  CURRICULUM.map((chapter) => chapter.slug);

/**
 * order 昇順にソート済みの章配列。
 *
 * @remarks
 * `CURRICULUM` 自体はソース上で order 昇順に定義されているため通常は順序一致するが、
 * 将来 CURRICULUM の定義順序が崩れた場合でも API の振る舞いを安定させるために
 * モジュール読込時に 1 回だけソートしておく。
 */
const CURRICULUM_SORTED_BY_ORDER: readonly CurriculumChapter[] = [
  ...CURRICULUM,
].sort((a, b) => a.order - b.order);

/**
 * slug から CurriculumChapter を O(1) で引くための lookup map。
 * モジュール読込時に 1 回だけ構築される。
 */
const CURRICULUM_BY_SLUG: ReadonlyMap<
  CurriculumChapterSlug,
  CurriculumChapter
> = new Map(CURRICULUM.map((c) => [c.slug, c]));

/**
 * 章ページのパスを返す。
 * 章パス
 *
 * `/learn/<slug>` の組み立てをこの 1 箇所に閉じる。目次・前後章ナビ・練習からの
 * 導線がそれぞれ文字列を組み立てると、ルートを変えたときに追随漏れが出る。
 *
 * @param slug 対象章のスラッグ
 */
export function chapterHref(slug: CurriculumChapterSlug): string {
  return `/learn/${slug}`;
}

/**
 * slug から章メタデータを O(1) で取得する。
 * 章メタデータ取得
 *
 * @param slug 対象章のスラッグ
 * @returns 該当する章。slug が不正な場合は undefined。
 */
export function getChapterBySlug(
  slug: CurriculumChapterSlug,
): CurriculumChapter | undefined {
  return CURRICULUM_BY_SLUG.get(slug);
}

/**
 * 次に読むべき章を返す。order 昇順で readSlugs に含まれない最初の章。
 * 全章読了済の場合は undefined を返す。
 *
 * @param readSlugs 読了済み章スラッグの集合
 */
export function pickNextChapter(
  readSlugs: ReadonlySet<string>,
): CurriculumChapter | undefined {
  return CURRICULUM_SORTED_BY_ORDER.find((c) => !readSlugs.has(c.slug));
}

/**
 * 指定 slug の前後章を返す。
 * 指定 slug が存在しない場合は `{ prev: undefined, next: undefined }`。
 *
 * @param slug 対象章のスラッグ
 */
export function getAdjacentChapters(slug: CurriculumChapterSlug): {
  prev: CurriculumChapter | undefined;
  next: CurriculumChapter | undefined;
} {
  const idx = CURRICULUM_SORTED_BY_ORDER.findIndex((c) => c.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined };
  return {
    prev: CURRICULUM_SORTED_BY_ORDER[idx - 1],
    next: CURRICULUM_SORTED_BY_ORDER[idx + 1],
  };
}

/**
 * slug が curriculum に存在するかを判定（Server Action バリデーション用）。
 *
 * @param value 検査対象の値
 */
export function isCurriculumChapterSlug(
  value: unknown,
): value is CurriculumChapterSlug {
  return (
    typeof value === "string" &&
    (CURRICULUM_CHAPTER_SLUGS as readonly string[]).includes(value)
  );
}

/**
 * 章の i18n キーから "learnCurriculum." プレフィックスを剥がしたパスを返す。
 *
 * @example
 * const chapter = CURRICULUM[0];
 * // chapter.i18nKey === "learnCurriculum.chapters.aboutThisApp"
 * getChapterI18nPath(chapter); // "chapters.aboutThisApp"
 *
 * @remarks
 * next-intl の useTranslations("learnCurriculum") / getTranslations("learnCurriculum") スコープ内で
 * t(getChapterI18nPath(ch) + ".title") のように使う想定。
 * slug は kebab-case、i18n キーは camelCase という仕様のギャップを本関数で吸収する。
 *
 * @param chapter 対象の章メタデータ
 */
export function getChapterI18nPath(chapter: CurriculumChapter): string {
  const prefix = "learnCurriculum.";
  return chapter.i18nKey.startsWith(prefix)
    ? chapter.i18nKey.slice(prefix.length)
    : chapter.i18nKey;
}

/**
 * その練習へ送っている章を、カリキュラムの順で返す。
 * 練習を扱う章
 *
 * 章の `practiceHrefs` の逆引き。「この章を読んだら解く練習」という関係を
 * 練習の側から見ると「この練習を扱っている章」になり、章から来た人が
 * 戻る先としてそのまま使える。
 *
 * 逆引きで済ませるのは、この向きが章側の宣言から一意に決まるため。練習の
 * カタログに書き写すと、章を足したときに片側だけ古くなる。バリアント付きの
 * href（`?variant=`）も練習単位で畳む — 点数表早引きのように 1 つの練習へ
 * 違う範囲で送る章が並ぶ場合、戻る先はどれも「その章」だから。
 *
 * @param slug 対象の練習スラッグ
 */
export function chaptersLinkingToPractice(
  slug: PracticeMenuSlug,
): readonly CurriculumChapterSlug[] {
  return CURRICULUM_SORTED_BY_ORDER.filter((chapter) =>
    (chapter.practiceHrefs ?? []).some(
      (href) => practiceSlugFromHref(href) === slug,
    ),
  ).map((chapter) => chapter.slug);
}

/**
 * 練習に関連する教本の章を、カリキュラムの順で返す。
 * 関連章
 *
 * 2 つの出どころを畳む。どちらも「読んでおくと解きやすい章」を指すが、
 * 宣言する側が違う。
 *
 * - カタログの `learnChapter` — その練習の前提になる章（章側がその練習へ
 *   送っているとは限らない。手牌の合計符のような、章の練習リンクには
 *   挙がらないが前提はある練習のため）
 * - 章の `practiceHrefs` の逆引き（{@link chaptersLinkingToPractice}）—
 *   その練習へ送っている章。専用の章を持たない練習（役の翻数・翻数即答・
 *   点数表早引き）はここからだけ引ける
 *
 * 昇級試験はこれを使わない。試験の前提章は段級位レジストリ
 * （`RANK_REGISTRY` の `learnChapterSlugs`）が正典で、合格に必要な知識の
 * 全体という別の意味を持つ。
 *
 * @param slug 対象の練習スラッグ
 */
export function relatedChaptersForPractice(
  slug: PracticeMenuSlug,
): readonly CurriculumChapterSlug[] {
  const related = new Set<CurriculumChapterSlug>(
    chaptersLinkingToPractice(slug),
  );
  const learnChapter = practiceMenuFromCatalog(slug)?.learnChapter;
  if (learnChapter !== undefined) related.add(learnChapter);

  return CURRICULUM_SORTED_BY_ORDER.filter((chapter) =>
    related.has(chapter.slug),
  ).map((chapter) => chapter.slug);
}

/**
 * セクションに属する章を、カリキュラムの順で返す。
 * セクションの章
 *
 * 記録を取らない総合演習（`/practice/score`）が「関連する教本の章」を出すのに
 * 使う。あの練習はカタログにも章の `practiceHrefs` にも載らない（記録対象外
 * のため前者に、出題条件付きの自由練習のため後者に載せられない）ので、
 * {@link relatedChaptersForPractice} の逆引きでは引けない。代わりに「点数の
 * 計算セクションの章がそろって送っている練習」という関係をセクションで表す —
 * 章を書き足したときに一覧へ写し忘れる余地が無い。
 *
 * @param section 対象のセクション
 */
export function chaptersInSection(
  section: CurriculumSection,
): readonly CurriculumChapterSlug[] {
  return CURRICULUM_SORTED_BY_ORDER.filter(
    (chapter) => chapter.section === section,
  ).map((chapter) => chapter.slug);
}
