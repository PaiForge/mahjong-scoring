"use client";

import { useTranslations } from "next-intl";
import type { HaiKindId } from "@mahjong-scoring/core";
import { LocaleHai } from "@/app/[locale]/(user)/_components/locale-hai";
import { PromptLabel } from "../../_components/prompt-label";

interface MachiFuPromptProps {
  /** 待ちの形を作る牌 */
  readonly tiles: readonly HaiKindId[];
  /** 和了牌 */
  readonly agariHai: HaiKindId;
}

/**
 * 待ち符の出題提示（待ち牌 + 和了牌）
 * 待ち符出題提示
 *
 * 出題盤面（MachiFuBoard）と遊び方デモ（MachiFuHowToPlay）で共有する、
 * 待ち形の「見せ方」の単一実装。
 */
export function MachiFuPrompt({ tiles, agariHai }: MachiFuPromptProps) {
  const t = useTranslations("machiFu");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <PromptLabel>{t("machiLabel")}</PromptLabel>
        <div className="flex gap-0.5 scale-125 origin-center">
          {tiles.map((tile, i) => (
            <LocaleHai key={i} hai={tile} />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-surface-100" />

      <div className="flex flex-col items-center gap-2">
        <PromptLabel>{t("agariLabel")}</PromptLabel>
        <div className="scale-125 origin-center">
          <LocaleHai hai={agariHai} />
        </div>
      </div>
    </div>
  );
}
