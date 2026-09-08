import {
  DataTable,
  DataTableHeaderCell,
  DATA_TABLE_CELL_PADDING,
} from "@/app/(user)/_components/data-table";
import {
  TOGGLE_GROUP_CONTAINER_METRICS_CLASSES,
  TOGGLE_ITEM_METRICS_CLASSES,
} from "@/app/(user)/_components/_lib/toggle-group-classes";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { HAN_COLS, FU_ROWS } from "../_lib/score-table-utils";

/**
 * 切り替えトグル 1 グループ分のプレースホルダ幅
 *
 * 実物のラベル（子 / 親、ロン / ツモ、符×翻 / 満貫+）の文字数に合わせる。
 * 1 文字 = text-xs のおよそ 12px。
 */
const TOGGLE_LABEL_WIDTHS = ["w-3", "w-6", "w-9"] as const;

/**
 * 点数早見表の本体（切り替えトグル + 表）のスケルトン
 * 点数早見表スケルトン
 *
 * @description
 * ルートの `loading.tsx` と、ページ内で `useSearchParams` を包む Suspense の
 * どちらからも使う。片方だけを実物に寄せると、遷移中とハイドレート待ちで
 * 別の形が出てしまうため 1 つに寄せている。
 *
 * 高さは固定の `h-*` を書かずに実物の部品と定数から取る。表の行数は
 * {@link FU_ROWS}・列数は {@link HAN_COLS}、セルの余白は
 * {@link DATA_TABLE_CELL_PADDING}、トグルの寸法は
 * `TOGGLE_GROUP_CONTAINER_METRICS_CLASSES` / `TOGGLE_ITEM_METRICS_CLASSES` を
 * 実物と共有しているため、符の行が増えても文字サイズが変わっても付いてくる。
 * 以前はここを 400px の矩形 1 枚で近似していて、実物（符 11 行）との差が
 * 150px ほどあった。
 *
 * @design 実物の色を写さない
 *
 * トグルの枠は実物が苔緑（`border-ink`）だが灰色にする。読み込み中の画面が
 * 実物より賑やかに見えるため（`ProblemListSkeleton` と同じ理由）。表の枠だけは
 * `DataTable` をそのまま使う — 表の骨格は枠と行の区切りそのもので、これを
 * 矩形 1 枚に均すと行の高さを実物から取れなくなる。中身のセルは灰色の矩形なので、
 * 空の表として読める。
 *
 * 行の高さはロン（1 行表示）に合わせる。ツモは 2 段になるぶん実物が高くなるが、
 * 初期表示はロンで、ツモは URL の focus 経由でしか最初から選ばれない。
 */
export function ScoreTableSkeleton() {
  return (
    <div aria-hidden="true" className="w-full">
      {/* 実物の操作列と同じ位置・同じ折り返し方（右寄せ・狭い画面は詰める） */}
      <div className="pb-3 mb-1">
        <div className="flex flex-wrap gap-1.5 items-center justify-end sm:gap-2">
          {TOGGLE_LABEL_WIDTHS.map((width) => (
            <div
              key={width}
              className={`${TOGGLE_GROUP_CONTAINER_METRICS_CLASSES} border-surface-200`}
            >
              {[0, 1].map((index) => (
                <SkeletonBar
                  key={index}
                  as="span"
                  radius="full"
                  className={`inline-block ${TOGGLE_ITEM_METRICS_CLASSES} ${width}`}
                >
                  &nbsp;
                </SkeletonBar>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <DataTable
          tableClassName="text-center"
          header={
            <>
              <DataTableHeaderCell align="left" density="dense">
                <SkeletonBar as="span" className="inline-block w-9">
                  &nbsp;
                </SkeletonBar>
              </DataTableHeaderCell>
              {HAN_COLS.map((han) => (
                <DataTableHeaderCell key={han} density="dense">
                  <SkeletonBar as="span" className="inline-block w-6">
                    &nbsp;
                  </SkeletonBar>
                </DataTableHeaderCell>
              ))}
            </>
          }
        >
          {FU_ROWS.map((fu) => (
            <tr key={fu} className="bg-white">
              <td className={`${DATA_TABLE_CELL_PADDING.dense} text-left`}>
                <SkeletonBar as="span" className="inline-block w-8">
                  &nbsp;
                </SkeletonBar>
              </td>
              {HAN_COLS.map((han) => (
                <td key={han} className={DATA_TABLE_CELL_PADDING.dense}>
                  <SkeletonBar as="span" className="inline-block w-10">
                    &nbsp;
                  </SkeletonBar>
                </td>
              ))}
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
