"use client";

import { useTranslations } from "next-intl";

import { CollapsibleDetail } from "../../_components/collapsible-detail";
import { DetailTable } from "../../_components/detail-table";

interface DetailItem {
  readonly name: string;
  readonly value: number;
}

interface DetailsPanelRowProps {
  /** 内訳の見出し（「翻数の内訳」「符の内訳」） */
  readonly title: string;
  readonly items: readonly DetailItem[];
  readonly total: number;
  readonly suffix: string;
  readonly colSpan: number;
  readonly roundedTotal?: number;
  readonly roundUpLabel?: string;
}

/**
 * 結果表の中に置く内訳の行
 * 符詳細・役詳細の展開表示
 *
 * 翻数・符の行の直後に置き、その値の内訳を閉じた状態から開かせる。開閉の
 * 器は他の練習の内訳と同じ {@link CollapsibleDetail}（▶ が回る見出し・
 * 既定で閉じる）で、表そのものは {@link DetailTable} に委ねる。同じ内訳を
 * 翻数即答や合計符のトレーニング・結果ページの問題別フィードバックでも
 * 出しており、練習によって内訳の開き方や体裁が変わらないようにする。
 *
 * 開いた内訳は白い角丸の枠に沈める。内訳の表は行区切りの破線と合計の
 * 実線を持ち、結果表の中にそのまま並べると合計の実線が結果表の項目の
 * 境目（実線）と同じ位置・同じ姿で並び、どこまでが内訳か読めなくなる。
 * 線の種類で見分けさせるより、面を 1 段沈めて「その枠の中の話」にする
 * ほうが確実（左の縦棒で字下げする案は、合計の実線が右端まで伸びて結果表の
 * 行と揃うので紛れが残った）。{@link DetailTable} 自身は枠を持たない約束
 * なので、枠は置く側のここが持つ。
 *
 * `<tr>` なので `<tbody>` の直下に置くこと（セルの中に置くと hydration
 * error になる）。翻数・符の行と同じ `<tbody>` に入れる — 結果表は
 * tbody の境目に罫線を引くので、別の tbody にすると内訳が独立した項目に
 * 見える。
 */
export function DetailsPanelRow({
  title,
  items,
  total,
  suffix,
  colSpan,
  roundedTotal,
  roundUpLabel,
}: DetailsPanelRowProps) {
  const t = useTranslations("score");
  const withSuffix = (value: number) => `${value}${suffix}`;

  return (
    <tr>
      <td colSpan={colSpan} className="py-2">
        <CollapsibleDetail title={title}>
          <div className="rounded-lg border-2 border-surface-200 bg-white p-3">
            <DetailTable
              rows={items.map((detail) => ({
                label: detail.name,
                value: withSuffix(detail.value),
              }))}
              total={{
                label: t("result.details.total"),
                value: withSuffix(total),
              }}
              note={
                roundedTotal !== undefined && total !== roundedTotal
                  ? `${withSuffix(total)} → ${withSuffix(roundedTotal)}（${roundUpLabel}）`
                  : undefined
              }
            />
          </div>
        </CollapsibleDetail>
      </td>
    </tr>
  );
}

export type { DetailItem, DetailsPanelRowProps };
