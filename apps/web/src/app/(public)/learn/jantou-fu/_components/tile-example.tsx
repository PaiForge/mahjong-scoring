"use client";

import { Hai } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";
import { useTranslations } from "next-intl";

interface TileExampleProps {
  readonly tiles: readonly HaiKindId[];
  readonly fu: number;
  readonly label: string;
}

export function TileExample({ tiles, fu, label }: TileExampleProps) {
  const t = useTranslations("jantouFu.learn");

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {tiles.map((hai, i) => (
          <Hai key={i} hai={hai} size="sm" />
        ))}
      </div>
      <div className="text-sm">
        <span className="font-semibold text-surface-900">{t("fuUnit", { value: fu })}</span>
        <span className="ml-2 text-surface-500">{label}</span>
      </div>
    </div>
  );
}
