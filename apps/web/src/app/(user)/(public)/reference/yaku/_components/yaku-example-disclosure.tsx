"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { parseTehai } from "@mahjong-scoring/core";
import { TehaiHand } from "../../../_components/tehai-hand";
import type { YakuExample } from "../_lib/yaku-examples";

interface YakuExampleDisclosureProps {
  readonly examples: readonly YakuExample[];
}

/**
 * 役チートシートの例示手牌の開閉表示
 * 役例示開閉
 *
 * 「例」リンクを押すと手牌を表示する。手牌は出題盤面と同じ TehaiHand で描画し、
 * 鳴き形（副露）も含めて確認できる。常時表示は圧迫感があるため既定は閉じる。
 */
export function YakuExampleDisclosure({
  examples,
}: YakuExampleDisclosureProps) {
  const t = useTranslations("reference.yaku");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
      >
        <svg
          className={`size-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        {t("example")}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
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
      )}
    </div>
  );
}
