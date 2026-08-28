"use client";

import { useTranslations } from "next-intl";
import { parseHais, parseTehai } from "@mahjong-scoring/core";
import { TehaiHand } from "../../../_components/tehai-hand";
import type { YakuExampleHand, YakuExampleSet } from "../_lib/yaku-examples";

interface YakuExampleListProps {
  readonly examples: readonly YakuExampleSet[];
}

/** 例示手牌1つ。見出す相手がない例（形も牌も1通り）はラベルを持たない。 */
function YakuExample({
  hand,
  label,
}: {
  readonly hand: YakuExampleHand;
  readonly label?: string;
}) {
  const t = useTranslations("common");

  const tehai = parseTehai(hand.mspz);
  if (!tehai) return null;

  const { agari } = hand;

  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-surface-400">{label}</p>}
      <TehaiHand
        tehai={tehai}
        agariHai={agari && parseHais(agari.hai)[0]}
        agariLabel={agari && (agari.type === "tsumo" ? t("tsumo") : t("ron"))}
        agariLabelTone="light"
      />
    </div>
  );
}

/**
 * 役チートシートの例示手牌一覧
 * 役例示手牌
 *
 * 鳴いて成立する役は門前形と副露形を並べ、どちらの形でも成立することを
 * 手牌そのもので示す。役牌のように複数の牌で示す役は、牌ごとにその対を並べる。
 * 並びだけではその役と読めない例は和了牌まで出す（`YakuExampleHand.agari`）。
 * 和了牌を一番右に離してツモ・ロンを添える出し方は出題盤面と同じで、そちらで
 * 覚えた読み方がそのまま通る。
 *
 * ラベルは「牌・形」を1行に畳んで入れ子の見出しを作らない（役牌は3種×2形で
 * 6段になるため、階層を足すと手牌より見出しの方が目立つ）。
 * 手牌は出題盤面と同じ TehaiHand で描画する。開閉は親の `AccordionCard` が担う。
 */
export function YakuExampleList({ examples }: YakuExampleListProps) {
  const t = useTranslations("reference.yaku");

  /** 与えられた見出しを1行に畳む。見出しが1つも無ければラベル自体を出さない。 */
  const label = (...segments: readonly (string | undefined)[]) => {
    const parts = segments.filter((segment) => segment !== undefined);
    return parts.length === 0
      ? undefined
      : parts.join(t("exampleLabelSeparator"));
  };

  return (
    <div className="space-y-4">
      {examples.map((example) => (
        <div key={example.variant ?? example.menzen.mspz} className="space-y-3">
          <YakuExample
            hand={example.menzen}
            label={label(
              example.variant,
              // 副露形と並ぶときだけ「門前」と断る（1つしか無い形は断る相手がない）
              example.naki === undefined ? undefined : t("exampleMenzen"),
            )}
          />
          {example.naki !== undefined && (
            <YakuExample
              hand={example.naki}
              label={label(example.variant, t("exampleNaki"))}
            />
          )}
        </div>
      ))}
    </div>
  );
}
