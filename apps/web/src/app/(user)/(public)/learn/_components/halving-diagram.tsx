import { getTranslations } from "next-intl/server";
import type { TsumoPayment } from "@mahjong-scoring/core";

import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import { deriveKoTsumoFromRon } from "../_lib/ko-tsumo-halving";
import {
  DerivationArrow,
  DerivationFigure,
  DerivationResult,
  DerivationStep,
} from "./derivation-figure";

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
    <DerivationFigure
      caption={caption}
      footer={
        <DerivationResult label={t("resultLabel")}>
          <TsumoScore payment={payment} />
        </DerivationResult>
      }
    >
      <DerivationStep label={t("ronLabel")}>{ron}</DerivationStep>
      <DerivationArrow label={t("arrowLabel")} />
      <DerivationStep label={t("oyaLabel")} highlighted>
        {derived.fromOya}
      </DerivationStep>
      <DerivationArrow label={t("arrowLabel")} />
      <DerivationStep label={t("koLabel")} highlighted>
        {derived.fromKo}
      </DerivationStep>
    </DerivationFigure>
  );
}
