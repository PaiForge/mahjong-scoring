import { getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  NUMBER_CELL_CLASSES,
  TotalBarCell,
  UnknownValueCell,
} from "@/app/admin/_components/stats-table-cells";
import { TableHead } from "@/app/admin/_components/table-head";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { getChapterI18nPath } from "@mahjong-scoring/features/curriculum/registry";

import { curriculumPositionOf, type LessonStatRow } from "../_lib/lesson-stats";

/** 列の並び（左から）。見出しの辞書キー `admin.lessonStats.table.<key>` と同じ */
const COLUMNS = ["order", "lesson", "section", "period", "total"] as const;

/**
 * レッスンごとの完了数の表
 * レッスン完了数テーブル
 *
 * 列は左から 順路の番号 / レッスン / セクション / 期間内 / 累計。順路の番号は
 * 順路順での 1 始まりで、並び順を変えても同じレッスンは同じ番号になる
 * （多い順に並べても順路のどこにあるかが読める）。レジストリに無い行（廃止した
 * レッスン等）は番号を「—」にし、タイトルの代わりに slug をリンクにせず出す。
 *
 * @design 累計に添える横棒は「表の中での相対的な多さ」だけを表す
 * 幅は `total / maxTotal`（表の最大を 100%）で、完了「率」ではない。率の分母には
 * 全 auth ユーザーの取得（`listAllAuthUsers`）が要り、しかも未ログインの読者が
 * 入らないので、率は実態より低く読める。日次推移のチャートも持たない。横棒は
 * 追加のデータ無しで、どのレッスンが多いか少ないかを一目で分からせるためのもの。
 * 数字が本体なので棒は `aria-hidden`。
 */
export async function LessonStatsTable({
  rows,
  maxTotal,
}: {
  readonly rows: readonly LessonStatRow[];
  /** 横棒の分母（全行の total の最大）。0 なら棒は出ない */
  readonly maxTotal: number;
}) {
  const [t, tCurriculum] = await Promise.all([
    getTranslations("admin.lessonStats"),
    getTranslations("learnCurriculum"),
  ]);

  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        {/* 例: admin.lessonStats.table.order */}
        <TableHead labels={COLUMNS.map((key) => t(`table.${key}`))} />
        <tbody>
          {rows.map((row) => {
            const position = curriculumPositionOf(row.chapter);
            return (
              <tr key={row.slug} className="border-t border-surface-200">
                <td className="px-4 py-3 whitespace-nowrap text-surface-500 tabular-nums">
                  {position === undefined ? "—" : position}
                </td>
                {row.chapter === undefined ? (
                  <UnknownValueCell
                    value={row.slug}
                    note={t("unknownLesson")}
                  />
                ) : (
                  <td className="px-4 py-3">
                    <Link
                      href={`/lessons/${row.slug}`}
                      className={TEXT_LINK_CLASSES}
                    >
                      {/* 例: learnCurriculum.chapters.aboutThisApp.title */}
                      {tCurriculum(`${getChapterI18nPath(row.chapter)}.title`)}
                    </Link>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-surface-600">
                  {/* 例: learnCurriculum.sections.fu */}
                  {row.chapter === undefined
                    ? "—"
                    : tCurriculum(`sections.${row.chapter.section}`)}
                </td>
                <td className={NUMBER_CELL_CLASSES}>
                  {row.inPeriod.toLocaleString("ja-JP")}
                </td>
                <TotalBarCell total={row.total} maxTotal={maxTotal} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
