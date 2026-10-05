import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 読み込み中に並べる行数。
 *
 * 実際の行数は母集団しだいで、データが来るまで分からない。loading.tsx は
 * ルートのパラメータを受け取れず件数を引けないため、ここは当て推量にしか
 * ならない。控えめな行数にしておく。
 *
 * 1 ページ分（20 行）を敷くと、埋まった土俵は完全に一致する代わりに、人が
 * 居ない土俵で表が 20 行ぶん縮んで下のボタン・パンくず・フッターが繰り上がる
 * （本番ビルドの実測で、総合 0.229 → 0.000 と引き換えに当月 0.075 → 0.318）。
 * 当月の土俵は月初や不人気の種目で普通に空になるため、外したときの被害が
 * 小さい側に倒している。
 */
const PLACEHOLDER_ROWS = 5;

/** 見出しセル。実物（`LeaderboardTableHeader`）と同じ余白・文字高で組む */
function HeaderCell({
  className,
  barWidthClassName,
}: {
  readonly className: string;
  readonly barWidthClassName: string;
}) {
  return (
    <th className={`px-3 py-3 ${className}`}>
      {/* 実物の見出しは text-xs（行ボックス 16px） */}
      <SkeletonBar className={`h-4 ${barWidthClassName}`} />
    </th>
  );
}

/**
 * ランキング表の読み込み中プレースホルダ
 * ランキング表スケルトン
 *
 * 詳細ページの Suspense フォールバックと loading.tsx が共有する。列幅
 * （`w-16` / `w-20` / `w-24`）とセルの余白（`px-3 py-3`）を実物の表と揃え、
 * 順位・アバターは実物と同じ 32px の丸にする。これで見出し行 41px・
 * データ行 58px（破線の区切り 2px 込み。最終行は 56px）が一致し、
 * データ到着で表の高さが動かない。
 *
 * ページ送り（`LeaderboardPagination`）の枠は出さない。実物は 2 ページ以上の
 * ときだけ描くもので、この行数（1 ページに満たない土俵）を想定した
 * スケルトンとは両立しない。
 *
 * 期間の切り替え（総合 / 月間）はここに含めない。URL だけで決まりデータを
 * 待たないため、詳細ページでは実物が Suspense の外に出ている。
 */
export function LeaderboardTableSkeleton() {
  return (
    <table className="w-full table-fixed" aria-hidden="true">
      <thead>
        <tr className="border-b-2 border-surface-200">
          <HeaderCell className="w-16" barWidthClassName="mx-auto w-8" />
          <HeaderCell className="" barWidthClassName="w-20" />
          <HeaderCell className="w-20" barWidthClassName="ml-auto w-12" />
          <HeaderCell className="w-24" barWidthClassName="ml-auto w-8" />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: PLACEHOLDER_ROWS }).map((_, i) => (
          // 実物と同じ破線の区切り（最終行だけ無し）。これが無いと 1 行
          // あたり 2px ずつ短くなる
          <tr
            key={i}
            className="border-b-2 border-dashed border-border/40 last:border-b-0"
          >
            <td className="w-16 px-3 py-3">
              <SkeletonBar
                radius="full"
                className="mx-auto size-8"
                tone={100}
              />
            </td>
            <td className="px-3 py-3">
              <div className="flex items-center gap-3">
                <SkeletonBar
                  radius="full"
                  className="size-8 shrink-0"
                  tone={100}
                />
                <SkeletonBar className="h-5 w-28" tone={100} />
              </div>
            </td>
            <td className="w-20 px-3 py-3">
              <SkeletonBar className="ml-auto h-5 w-10" tone={100} />
            </td>
            <td className="w-24 px-3 py-3">
              <SkeletonBar className="ml-auto h-5 w-8" tone={100} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
