"use client";

import { parseTehai } from "@mahjong-scoring/core";
import { TehaiHand } from "../../../_components/tehai-hand";
import type { YakuExample } from "../_lib/yaku-examples";

interface YakuExampleListProps {
  readonly examples: readonly YakuExample[];
}

/**
 * 役チートシートの例示手牌一覧
 * 役例示手牌
 *
 * 手牌は出題盤面と同じ TehaiHand で描画し、鳴き形（副露）も含めて確認できる。
 * 開閉は親の `AccordionCard` が担う。
 */
export function YakuExampleList({ examples }: YakuExampleListProps) {
  return (
    <div className="space-y-3">
      {examples.map((example, i) => {
        const tehai = parseTehai(example.mspz);
        if (!tehai) return null;
        return (
          <div key={i} className="space-y-1">
            {example.label && (
              <p className="text-xs text-surface-400">{example.label}</p>
            )}
            <TehaiHand tehai={tehai} />
          </div>
        );
      })}
    </div>
  );
}
