import { getTranslations } from "next-intl/server";
import {
  calculateKoScore,
  calculateOyaScore,
  type Fu,
} from "@mahjong-scoring/core";

import { ArrowRightIcon } from "@/app/(user)/_components/icons/arrow-right-icon";
import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

interface TsumoCarryoverDiagramProps {
  readonly fu: Fu;
  readonly han: number;
}

/**
 * 子ツモの下段がそのまま親ツモになることを示す図
 * ツモの持ち越し図
 *
 * 章の結論（覚えるのは子ツモの行だけでよく、下段の数字をそのまま親ツモに
 * 使える）をそのまま絵にしたもの。表で2列を突き合わせると「同じ数字が並んで
 * いる」ことを読者に見つけさせる形になるが、ここでは矢印で移す向きまで描く
 * ので、何をどう使うのかが1目で決まる。
 *
 * 点数の表記は早見表と同じ {@link TsumoScore} を通す。図の側で数字を組み直すと、
 * 読者が実際に開く点数表と見た目の違うものを覚えることになる。子ツモは上段を
 * 落として下段を前に出し、矢印の起点がどこなのかを示す。
 *
 * 例は1つだけ置く。どの符・翻でも成り立つことは本文が述べ、テストが固定する。
 * 例を並べると表に戻ってしまい、結論より一覧のほうが目立つ。
 */
export async function TsumoCarryoverDiagram({
  fu,
  han,
}: TsumoCarryoverDiagramProps) {
  const t = await getTranslations("tsumoPayments.learn");
  const ko = calculateKoScore(han, fu).tsumo;
  const oya = calculateOyaScore(han, fu).tsumo;

  return (
    <figure className="space-y-3 rounded-xl border-3 border-ink bg-white p-5">
      <figcaption className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {t("diagramCaption", { fu, han })}
      </figcaption>

      {/* 狭い画面では矢印を下向きにして縦に積む */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-surface-500">
            {t("diagramKoLabel")}
          </span>
          <span className="text-lg font-semibold text-surface-900">
            <TsumoScore payment={ko} dimFromKo />
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-surface-500">
          <ArrowRightIcon className="size-6 rotate-90 sm:rotate-0" />
          <span className="text-xs font-medium">{t("diagramArrowLabel")}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-surface-500">
            {t("diagramOyaLabel")}
          </span>
          <span
            className={`rounded-md px-3 py-1 text-lg font-bold text-primary-700 ${TABLE_HIGHLIGHT_CELL_CLASS}`}
          >
            <TsumoScore payment={oya} />
          </span>
        </div>
      </div>

      <p className="text-center text-sm leading-relaxed text-surface-600">
        {t("diagramNote")}
      </p>
    </figure>
  );
}
