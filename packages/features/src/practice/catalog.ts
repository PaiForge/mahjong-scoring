import {
  isExamMenuType,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "../practice-menu-types";
import {
  chaptersLinkingToPractice,
  sortChapterSlugs,
  type CurriculumChapterSlug,
} from "../curriculum/registry";
import { RANK_REGISTRY, type RankSlug } from "../ranks/registry";

/**
 * 練習メニューのカタログ — 一覧の並び・段級位・教本リンクの単一の真実のソース
 *
 * @description
 * 練習一覧の表示順とカテゴリ分けをここで管理する。ダッシュボードの
 * おすすめ練習など一覧以外の画面からも参照し、web とモバイルで同じ並びを使う。
 *
 * @design 導出できるものは持たない
 * パス・i18n キーは slug から導出する（パスは `routes.ts` の `practiceHref`、
 * 練習名のキーは {@link practiceTitleKey}）。教本へのリンクも章スラッグだけを
 * 持ち、パスは `chapterHref()` に任せる。slug と messageKey の対応は
 * `practice-menu-types.ts` のレジストリが正典で、そこに載らない練習
 * （記録対象外の `/practice/score`）はカタログにも含めない。
 */

/** 練習一覧のカテゴリ（`practice.categories.*` に対応） */
export const PRACTICE_CATEGORIES = ["fuCalculation", "han", "scoring"] as const;
export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number];

const categorySet: ReadonlySet<string> = new Set(PRACTICE_CATEGORIES);

/** 値が有効な練習カテゴリかを判定する型ガード（URL クエリの検証用） */
export function isPracticeCategory(value: string): value is PracticeCategory {
  return categorySet.has(value);
}

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
   * 章側の `practiceLinks`（その章を読んだら解く練習）とは向きも意味も違う関係で、
   * 互いの逆写像ではない。点数即答のように「前提となる章はあるが、章の側からは
   * 送らない」練習や、役の翻数のように「章から勧められるが専用の章は持たない」
   * 練習がある。
   *
   * 説明ページと一覧カードが出す「関連する教本の章」は、これと章側の逆引きを
   * 畳んだ `relatedChaptersForPractice()`。このフィールドだけで戻り先を
   * 揃えようとしないこと（1 つの練習を複数の章が扱う場合がある）。
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
  // 満貫未満の点数を引く練習。その最初の級が3級（七対子＝25符の行を引く）
  // なのでそこに寄せている。上の級（平和・面子手）でも同じ表を引くが、
  // ピルは「次に取る級のための練習はどれか」を読ませるものなので、
  // その練習を最初に必要とする級を載せる
  { slug: "score-table", category: "scoring", rank: "kyu-3" },
  {
    slug: "mangan-score-calculation",
    category: "scoring",
    rank: "kyu-5",
  },
  // 符の計算から点数までを通しで解く総まとめ。符が固定される役だけを扱う
  // 3級までは出番が無く、平和（2級）で「ツモなら20符・ロンなら30符」と
  // 和了方法から符を出し始めるところから実戦的な練習になる。
  // 面子手・副露の級を定義したら置き直す余地はある
  {
    slug: "score-calculation",
    category: "scoring",
    rank: "kyu-2",
    // 実戦的になり始める章。逆に章の側からはこの練習へ送らない —
    // 出題範囲を絞るバリアントが無く、どの章から送っても「読んだ範囲」を
    // はみ出す（教本が 60符以上を扱っていないのは `RANK_REGISTRY` の
    // 初段の注記のとおり）。章末の総まとめは昇級試験の CTA が担う
    learnChapter: "pinfu-score",
  },
  {
    // 昇級試験の前提章は段級位レジストリ（`RANK_REGISTRY` の
    // `learnChapterSlugs`）が持つため `learnChapter` を持たない。
    // 合格に必要な章は 1 つではなく、どの章が要るかはランクの決定事項。
    slug: "mangan-exam",
    category: "scoring",
    rank: "kyu-5",
  },
  {
    // 昇級試験の前提章は段級位レジストリが持つ（他の試験と同じ理由）
    slug: "chiitoitsu-exam",
    category: "scoring",
    rank: "kyu-3",
  },
  {
    // 昇級試験の前提章は段級位レジストリが持つ（他の試験と同じ理由）
    slug: "pinfu-exam",
    category: "scoring",
    rank: "kyu-2",
  },
  {
    // 昇級試験の前提章は段級位レジストリが持つ（他の試験と同じ理由）
    slug: "fu-score-exam",
    category: "scoring",
    rank: "kyu-1",
  },
  {
    // 昇段試験。前提章は段級位レジストリが持つ（他の試験と同じ理由）
    slug: "score-exam",
    category: "scoring",
    rank: "dan-1",
  },
] as const;

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
 * 「練習一覧 >」はこの判定で出し分ける。
 *
 * 判定そのものはレジストリの {@link isExamMenuType} が持つ。slug で引く
 * 呼び出し側のための入口で、規則を二重に持たないよう委譲するだけにする。
 */
export function isExamMenu(slug: PracticeMenuSlug): boolean {
  return isExamMenuType(practiceMenuBySlug(slug).menuType);
}

/**
 * 練習一覧に並べる練習を表示順で返す。
 * 一覧掲載練習
 *
 * 昇級試験は含まない（練習カードにせず、道場から入る）。カテゴリごとの
 * 見出しは持たず 1 つのグリッドに並べるため、返すのは平坦な 1 本の配列。
 * カタログの並び自体がカテゴリ順（符 → 翻数 → 点数）なので、絞り込みを
 * 解除したときも分野ごとに固まって見える。
 */
export function listedPracticeMenus(): readonly PracticeMenu[] {
  return PRACTICE_CATALOG.filter((menu) => !isExamMenu(menu.slug));
}

/**
 * 練習一覧の級の絞り込みに出す段級位を、レジストリの順（学習順）で返す。
 * 一覧掲載段級位
 *
 * 全段級位ではなく、一覧に並ぶ練習を1つ以上持つ級だけを返す。段級位は
 * 昇級試験だけで完結するものがあり（1級 — 前提章の2つはどちらも専用の
 * 練習を持たない）、`RANK_SLUGS` をそのまま選択肢にすると押しても 0 件の
 * タブが並ぶ。選択肢は一覧の中身から導く。
 */
export function listedPracticeRanks(): readonly RankSlug[] {
  const listed = new Set(
    listedPracticeMenus()
      .map((menu) => menu.rank)
      .filter((rank) => rank !== undefined),
  );
  return RANK_REGISTRY.map((rank) => rank.slug).filter((slug) =>
    listed.has(slug),
  );
}

/** 練習名の i18n キー（`getTranslations("practice")` スコープ内で使う） */
export function practiceTitleKey(slug: PracticeMenuSlug): string {
  return `practices.${practiceMenuBySlug(slug).messageKey}.title`;
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
 * - 章の `practiceLinks` の逆引き（{@link chaptersLinkingToPractice}）—
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

  return sortChapterSlugs(related);
}
