import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { HashAnchorScroll } from "@/app/_components/hash-anchor-scroll";
import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { AdminPaginationNav } from "@/app/admin/_components/admin-pagination-nav";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { countProblemFacetCoverage } from "@/lib/practice-problems/facets";
import { ARCHIVE_KINDS, SCORING_VERSION } from "@mahjong-scoring/core";
import {
  findProblemCategory,
  PROBLEM_CATEGORIES,
  PROBLEM_CATEGORY_GROUPS,
} from "@mahjong-scoring/features/problem-facets/categories";

import {
  CategoryCountTable,
  type CategoryCountTableRow,
} from "./_components/category-count-table";
import { CategoryProblemCard } from "./_components/category-problem-card";
import { CoverageTable } from "./_components/coverage-table";
import { FillFacetsButton } from "./_components/fill-facets-button";
import {
  fetchCategoryCounts,
  fetchCategoryProblems,
  type CategoryProblemFilter,
} from "./_lib/queries";
import {
  ProblemSearchForm,
  ProblemSearchSummary,
} from "./_components/problem-search-form";
import { parseProblemSearch, problemSearchQuery } from "./_lib/search";
import { RULE_FLAGS } from "./_lib/rule-flags";

const searchParamsCache = createSearchParamsCache({
  category: parseAsString,
  flag: parseAsStringLiteral(RULE_FLAGS),
  page: parseAsInteger.withDefault(1),
});

/** 節の見出し（問題の保存状況のページと同じ形） */
const SECTION_HEADING_CLASSES = "mb-4 text-lg font-semibold text-surface-900";

const BASE_PATH = "/admin/problem-categories";

/** 一覧の見出しへ着地させるアンカー */
const PROBLEMS_ANCHOR = "problems";

/**
 * 問題の分類
 *
 * @description
 * 保存問題（`practice_problems`）を、役・符・待ち・和了の仕方・点数の区分の分類
 * （features の `problem-facets/categories.ts`）で分けた結果を見るページ。出すのは
 * 属性の網羅の状況（計算済み成功 / 失敗 / 未計算 / 全件）、単一値を軸別に数えた表、名前付き条件の表、
 * ルール設定で正解か属性が変わる問題の数、選んだ分類（または印）に当てはまる問題の一覧、
 * 属性の不足分を埋める手動の実行。
 *
 * 分類は、盤面を標準ルールで組み立て直して取り出した属性（翻・符・役・待ち）に条件を
 * 当てて決める。表は排他的な分布ではなく、同じ聴牌形が複数の符の行に入る。
 * 属性は保存のたびと日次の cron で計算するが、採点の版を上げた直後などは
 * 未計算の問題が残る。未計算と計算に失敗した問題はどの分類にも数えないので、分類の数は
 * 必ず網羅の表と一緒に読む。数えているのは問題の数で、和了の数ではない（聴牌形は
 * 待ち × ツモ/ロンの和了を持つが 1 問と数え、どれかの和了が条件を満たせば入る）。
 * この表から出せないもの: 解答の数・正答率（このページは問題だけを見る）、盤面に無い
 * 状況の役（一発・海底など）、採用されなかった解釈で成立する役。
 *
 * @design 「問題の保存状況」のページに足さず、「統計」グループの独立したページにする
 * 保存状況は期間（`from` / `to`）で切る貯まり方のページで、分類は期間を持たない累計と
 * 一覧のページ。1 枚にすると、期間ピッカーが効く節と効かない節が混ざり、一覧のページ
 * 送りが期間の URL と絡む。
 *
 * @design ページを開いただけでは不足分を埋めない
 * 描画のたびに計算と書き込みを走らせると、未計算が多いときにページが開かず、GET が
 * 副作用を持つ。不完全な版を許して件数を併記する方針どおり、網羅の表を出し、埋めるのは
 * ボタン（と cron）にする。
 *
 * @design 件数の表と自由検索は別の操作として扱う
 * 分類・印のリンクは従来どおり 1 つだけで絞る。検索フォームは軸を組み合わせ、
 * GET の URL に保持する。検索中も件数の表は全体を示す。検索と分類・印の混在や
 * 不正な条件は検索せずエラーを出す（条件を黙って外して結果を広げない）。
 *
 * @design 分類を選んだら一覧の見出しへ着地させる（`HashAnchorScroll`）
 * 一覧は属性別の表・名前付き条件・ルールの表の下に出るので、リンクは `#problems` 付きにしている。ただしこのページは
 * loading.tsx を持ち、遷移した瞬間に描かれているのはスケルトンで、一覧の見出しはまだ
 * DOM に無い。Next はその時点で一度だけ対象を探して諦めるので、本体と一緒にマウント
 * される `HashAnchorScroll` で着地をやり直す。同じページの中で分類やページ番号だけを
 * 切り替えたときも着地し直すよう、絞り込みとページ番号を key にする。
 *
 * @flow 網羅の表で未計算が残っていないかを見る →（残っていれば）不足分を埋める →
 * 分類ごとの問題数を見る → 分類の名前を押して該当する問題の一覧を見る → 和了ごとの
 * 翻・符・役・待ちと「ルールで変わる」の印を確かめる
 */
export default async function AdminProblemCategoriesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const rawParams = await searchParams;
  const search = parseProblemSearch(rawParams);
  const params = await searchParamsCache.parse(rawParams);
  const category = search.active
    ? undefined
    : findProblemCategory(params.category);
  const filter: CategoryProblemFilter | undefined = search.active
    ? search.query
      ? { type: "search", search: search.query }
      : undefined
    : category
      ? { type: "category", category }
      : params.flag
        ? { type: "flag", flag: params.flag }
        : undefined;

  const [t, coverage, counts, problems] = await Promise.all([
    getTranslations("admin.problemCategories"),
    countProblemFacetCoverage(),
    fetchCategoryCounts(),
    filter ? fetchCategoryProblems(filter, params.page) : undefined,
  ]);

  const countsByKind = new Map(counts.map((row) => [row.kind, row]));
  const filterQuery = search.active
    ? problemSearchQuery(search.fields)
    : category
      ? `category=${category.id}`
      : params.flag
        ? `flag=${params.flag}`
        : "";
  const filterLabel = category
    ? // 例: admin.problemCategories.categories.machi-ryanmen
      t(`categories.${category.id}`)
    : params.flag
      ? // 例: admin.problemCategories.flags.renfonpai
        t(`flags.${params.flag}`)
      : "";

  const categoryRows = PROBLEM_CATEGORIES.map((item) => ({
    key: item.id,
    group: item.group,
    kind: item.kind,
    // 例: admin.problemCategories.categories.fu-60
    label: t(`categories.${item.id}`),
    href: `${BASE_PATH}?category=${item.id}#${PROBLEMS_ANCHOR}`,
    current: category?.id === item.id,
    counts: Object.fromEntries(
      ARCHIVE_KINDS.map((kind) => [
        kind,
        countsByKind.get(kind)?.categories[item.id] ?? 0,
      ]),
    ),
  }));
  const flagRows: CategoryCountTableRow[] = RULE_FLAGS.map((flag) => ({
    key: flag,
    label: t(`flags.${flag}`),
    href: `${BASE_PATH}?flag=${flag}#${PROBLEMS_ANCHOR}`,
    current: !search.active && !category && params.flag === flag,
    counts: Object.fromEntries(
      ARCHIVE_KINDS.map((kind) => [
        kind,
        countsByKind.get(kind)?.flags[flag] ?? 0,
      ]),
    ),
  }));

  return (
    <>
      <AdminPageTitle className="mb-2">{t("title")}</AdminPageTitle>
      <p className="mb-6 text-sm text-surface-600">{t("description")}</p>

      <div className="space-y-6">
        <section>
          <h3 className={SECTION_HEADING_CLASSES}>{t("coverage.title")}</h3>
          <p className="mb-4 text-sm text-surface-600">
            {t("coverage.note", { version: SCORING_VERSION })}
          </p>
          <CoverageTable rows={coverage} />
          <div className="mt-4">
            <FillFacetsButton />
          </div>
        </section>

        <section>
          <h3 className={SECTION_HEADING_CLASSES}>{t("search.title")}</h3>
          <ProblemSearchForm state={search} />
        </section>

        <section>
          <h3 className={SECTION_HEADING_CLASSES}>{t("counts.title")}</h3>
          <p className="mb-4 text-sm text-surface-600">{t("counts.note")}</p>
          <div className="space-y-6">
            {PROBLEM_CATEGORY_GROUPS.map((group) => (
              <div key={group}>
                {/* 例: admin.problemCategories.groups.fu */}
                <h4 className="mb-3 font-semibold text-surface-900">
                  {t(`groups.${group}`)}
                </h4>
                <CategoryCountTable
                  rows={categoryRows.filter(
                    (row) => row.kind === "value" && row.group === group,
                  )}
                  nameLabel={t("counts.name")}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className={SECTION_HEADING_CLASSES}>
            {t("namedConditions.title")}
          </h3>
          <p className="mb-4 text-sm text-surface-600">
            {t("namedConditions.note")}
          </p>
          <CategoryCountTable
            rows={categoryRows.filter((row) => row.kind === "named")}
            nameLabel={t("namedConditions.name")}
          />
        </section>

        <section>
          <h3 className={SECTION_HEADING_CLASSES}>{t("ruleFlags.title")}</h3>
          <p className="mb-4 text-sm text-surface-600">{t("ruleFlags.note")}</p>
          <CategoryCountTable rows={flagRows} nameLabel={t("ruleFlags.name")} />
        </section>

        {problems && (
          <section id={PROBLEMS_ANCHOR} className="scroll-mt-4">
            {/* 分類・ページを切り替えるたびにマウントし直して、一覧へ着地し直す */}
            <HashAnchorScroll
              key={`anchor-${filterQuery}-${String(problems.page)}`}
            />
            <h3 className={SECTION_HEADING_CLASSES}>
              {search.active
                ? t("search.results", { count: problems.total })
                : t("problems.title", {
                    name: filterLabel,
                    count: problems.total,
                  })}
            </h3>
            {search.query && <ProblemSearchSummary fields={search.fields} />}
            <p className="mb-4 text-sm">
              <Link href={BASE_PATH} className={TEXT_LINK_CLASSES}>
                {t("problems.clear")}
              </Link>
            </p>
            {problems.problems.length === 0 ? (
              <p className="admin-panel p-5 text-sm text-surface-600">
                {t("problems.empty")}
              </p>
            ) : (
              <div className="space-y-4">
                {problems.problems.map((problem) => (
                  <CategoryProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            )}
            <AdminPaginationNav
              currentPage={problems.page}
              totalPages={problems.totalPages}
              buildHref={(page) =>
                `${BASE_PATH}?${filterQuery}&page=${String(page)}#${PROBLEMS_ANCHOR}`
              }
            />
          </section>
        )}
      </div>
    </>
  );
}
