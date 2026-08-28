"use client";

import { useTranslations } from "next-intl";
import { parseTehai } from "@mahjong-scoring/core";
import { TehaiHand } from "../../../_components/tehai-hand";
import type { YakuExampleSet } from "../_lib/yaku-examples";

interface YakuExampleListProps {
  readonly examples: YakuExampleSet;
}

/** 例示手牌1つ（ラベルは門前限定役では付けない） */
function YakuExample({
  mspz,
  label,
}: {
  readonly mspz: string;
  readonly label?: string;
}) {
  const tehai = parseTehai(mspz);
  if (!tehai) return null;

  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-surface-400">{label}</p>}
      <TehaiHand tehai={tehai} />
    </div>
  );
}

/**
 * 役チートシートの例示手牌一覧
 * 役例示手牌
 *
 * 鳴いて成立する役は門前形と副露形を並べ、どちらの形でも成立することを
 * 手牌そのもので示す。門前限定役は形が1つしかないのでラベルを出さない
 * （「門前」とだけ書かれたラベルは、比べる相手がいないと何も足さない）。
 * 手牌は出題盤面と同じ TehaiHand で描画する。開閉は親の `AccordionCard` が担う。
 */
export function YakuExampleList({ examples }: YakuExampleListProps) {
  const t = useTranslations("reference.yaku");

  if (examples.naki === undefined) {
    return (
      <div className="space-y-3">
        <YakuExample mspz={examples.menzen} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <YakuExample mspz={examples.menzen} label={t("exampleMenzen")} />
      <YakuExample mspz={examples.naki} label={t("exampleNaki")} />
    </div>
  );
}
