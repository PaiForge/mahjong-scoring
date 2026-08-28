"use client";

import { useTranslations } from "next-intl";
import { parseTehai } from "@mahjong-scoring/core";
import { TehaiHand } from "../../../_components/tehai-hand";
import type { YakuExampleSet } from "../_lib/yaku-examples";

interface YakuExampleListProps {
  readonly examples: readonly YakuExampleSet[];
}

/** 例示手牌1つ（ラベルは門前限定かつ牌の区別もない役では付けない） */
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
 * 手牌そのもので示す。役牌のように複数の牌で示す役は、牌ごとにその対を並べる。
 * ラベルは「牌・形」の1行に畳んで入れ子の見出しを作らない（3種×2形で6段に
 * なるため、階層を足すと手牌より見出しの方が目立つ）。門前限定で牌の区別も
 * ない役は形が1つしかないのでラベルを出さない。
 * 手牌は出題盤面と同じ TehaiHand で描画する。開閉は親の `AccordionCard` が担う。
 */
export function YakuExampleList({ examples }: YakuExampleListProps) {
  const t = useTranslations("reference.yaku");

  /** 「牌・形」のラベル。牌の区別がなければ形だけ、形が1つなら牌だけを出す。 */
  const label = (variant: string | undefined, form: string | undefined) => {
    if (variant === undefined) return form;
    if (form === undefined) return variant;
    return t("exampleVariant", { variant, form });
  };

  return (
    <div className="space-y-4">
      {examples.map((example) => (
        <div key={example.variant ?? example.menzen} className="space-y-3">
          <YakuExample
            mspz={example.menzen}
            label={label(
              example.variant,
              example.naki === undefined ? undefined : t("exampleMenzen"),
            )}
          />
          {example.naki !== undefined && (
            <YakuExample
              mspz={example.naki}
              label={label(example.variant, t("exampleNaki"))}
            />
          )}
        </div>
      ))}
    </div>
  );
}
