import { getTranslations } from "next-intl/server";
import type { TsumoPayment } from "@mahjong-scoring/core";

import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import {
  DerivationArrow,
  DerivationFigure,
  DerivationResult,
  DerivationStep,
} from "../../_components/derivation-figure";

/** 親のツモを分け合う人数（子3人） */
const KO_COUNT = 3;

interface OyaAllDiagramProps {
  /** 図の上に出す見出し（どの区分の話かを言う） */
  readonly caption: string;
  /** 出発点になる親のロン */
  readonly ron: number;
  /** 点数表に載っている実際の親ツモ。導いた値との答え合わせに出す */
  readonly payment: TsumoPayment;
}

/**
 * 親のロンを3で割ってオールへたどり着く図
 * オール導出図
 *
 * 子のツモの図（{@link import("../../_components/halving-diagram").HalvingDiagram}）と
 * 同じ体裁だが、矢印は1本しかない。子は「子・子・親」で分担が不均等なので
 * 半分を2回たどるのに対し、親は子3人が同額を出すので分ける先が1種類しかない。
 * 手順の軽さがそのまま鎖の短さになる。
 *
 * 割り算はこの図の中で行う。半分ずつの導出（{@link deriveKoTsumoFromRon}）と
 * 違って切り上げの心配が要らないため — 満貫以上の親のロンはどれも3で割り切れ、
 * この章はその範囲しか扱わない。関数に隠すと「切り上げがどこかで効くのでは」と
 * 読ませてしまう。割り切れることは章のテストが固定する。
 */
export async function OyaAllDiagram({
  caption,
  ron,
  payment,
}: OyaAllDiagramProps) {
  const t = await getTranslations("manganOyaTsumo.learn");

  return (
    <DerivationFigure
      caption={caption}
      footer={
        <DerivationResult label={t("divisionResultLabel")}>
          <TsumoScore payment={payment} />
        </DerivationResult>
      }
    >
      <DerivationStep label={t("divisionRonLabel")}>{ron}</DerivationStep>
      <DerivationArrow label={t("divisionArrowLabel")} />
      <DerivationStep label={t("divisionAllLabel")} highlighted>
        {ron / KO_COUNT}
      </DerivationStep>
    </DerivationFigure>
  );
}
