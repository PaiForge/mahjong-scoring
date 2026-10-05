import { getTranslations } from "next-intl/server";
import {
  calculateKoScore,
  calculateOyaScore,
  type Fu,
} from "@mahjong-scoring/core";

import { TsumoScore } from "@/app/(user)/(public)/reference/score-table/_components/tsumo-score";

import {
  DerivationArrow,
  DerivationFigure,
  DerivationStep,
} from "../../_components/derivation-figure";

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
    <DerivationFigure
      caption={t("diagramCaption", { fu, han })}
      footer={
        <p className="text-center text-sm leading-relaxed text-surface-600">
          {t("diagramNote")}
        </p>
      }
    >
      <DerivationStep label={t("diagramKoLabel")}>
        <TsumoScore payment={ko} dimFromKo />
      </DerivationStep>
      <DerivationArrow label={t("diagramArrowLabel")} />
      <DerivationStep label={t("diagramOyaLabel")} highlighted>
        <TsumoScore payment={oya} />
      </DerivationStep>
    </DerivationFigure>
  );
}
