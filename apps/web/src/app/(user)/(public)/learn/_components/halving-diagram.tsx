import { getTranslations } from "next-intl/server";
import type { TsumoPayment } from "@mahjong-scoring/core";

import { ArrowRightIcon } from "@/app/(user)/_components/icons/arrow-right-icon";
import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";
import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import { deriveKoTsumoFromRon } from "../_lib/ko-tsumo-halving";

interface HalvingDiagramProps {
  /** 図の上に出す見出し（どの符・翻、どの区分の話かを言う） */
  readonly caption: string;
  /** 出発点になる子のロン */
  readonly ron: number;
  /** 点数表に載っている実際の子ツモ。導いた値との答え合わせに出す */
  readonly payment: TsumoPayment;
}

/**
 * 子のロンを2回半分にして子ツモへたどり着く図
 * 半分ずつの図
 *
 * 「同じ操作を2回するだけ」をそのまま絵にしたもの。表で列を突き合わせると
 * 「割れば合う」ことを読者に見つけさせる形になるが、ここでは何を何で割るのかと、
 * その順番までを1目で決める。
 *
 * 鎖の途中は1つの数字なので素の数字で描き、最後だけ早見表と同じ
 * {@link TsumoScore} を通す。2つのスカラーが点数表のどの段に入るのかは、
 * 実際に読む2段表示に戻して初めて確かめられる。
 *
 * 導出は {@link deriveKoTsumoFromRon} を通し、答え合わせの側は呼び出し元が
 * 点数表から取って渡す。図の中で数字を組み直すと、章が主張している手順とは
 * 別の経路で出した数字を並べることになる。
 *
 * 満貫以上の章（子のツモ）と点数記憶術の章（ロンからツモを導く）が共有する。
 * 満貫以上では切り上げが一度も効かないぶん鎖が素直に見え、満貫未満では
 * 端数が出る。同じ絵で見せるのは、後者が前者の一般化だと読ませるため。
 */
export async function HalvingDiagram({
  caption,
  ron,
  payment,
}: HalvingDiagramProps) {
  const t = await getTranslations("learnCurriculum.halvingDiagram");
  const derived = deriveKoTsumoFromRon(ron);
  if (derived.type !== "koTsumo") {
    throw new Error("deriveKoTsumoFromRon が子ツモ以外の支払いを返した");
  }

  return (
    <figure className="space-y-3 rounded-xl border-3 border-ink bg-white p-5">
      <figcaption className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {caption}
      </figcaption>

      {/* 狭い画面では矢印を下向きにして縦に積む */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
        <DiagramStep label={t("ronLabel")} value={ron} />
        <DiagramArrow label={t("arrowLabel")} />
        <DiagramStep
          label={t("oyaLabel")}
          value={derived.fromOya}
          highlighted
        />
        <DiagramArrow label={t("arrowLabel")} />
        <DiagramStep label={t("koLabel")} value={derived.fromKo} highlighted />
      </div>

      <div className="flex items-center justify-center gap-3 border-t-2 border-dashed border-surface-200 pt-3">
        <span className="text-xs font-medium text-surface-500">
          {t("resultLabel")}
        </span>
        <span className="text-lg font-semibold text-surface-900">
          <TsumoScore payment={payment} />
        </span>
      </div>
    </figure>
  );
}

/** 鎖の1項。導出の途中で出た数字を、何を指す額なのかと一緒に置く */
function DiagramStep({
  label,
  value,
  highlighted = false,
}: {
  readonly label: string;
  readonly value: number;
  readonly highlighted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-surface-500">{label}</span>
      <span
        className={
          highlighted
            ? `rounded-md px-3 py-1 text-lg font-bold text-primary-700 ${TABLE_HIGHLIGHT_CELL_CLASS}`
            : "px-3 py-1 text-lg font-semibold text-surface-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

/** 鎖のつなぎ目。矢印の下に、そこで何をしたのかを書く */
function DiagramArrow({ label }: { readonly label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-surface-500">
      <ArrowRightIcon className="size-6 rotate-90 sm:rotate-0" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
