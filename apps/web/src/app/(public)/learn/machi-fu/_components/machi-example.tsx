"use client";

import { Hai } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";

interface MachiExampleProps {
  tiles: readonly HaiKindId[];
  agariHai: HaiKindId;
  fu: number;
  label: string;
}

export function MachiExample({ tiles, agariHai, fu, label }: MachiExampleProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {tiles.map((hai, i) => (
            <Hai key={i} hai={hai} size="sm" />
          ))}
        </div>
        <span className="text-xs text-surface-400">+</span>
        <Hai hai={agariHai} size="sm" />
      </div>
      <div className="text-sm">
        <span className="font-semibold text-surface-900">{fu}符</span>
        <span className="ml-2 text-surface-500">{label}</span>
      </div>
    </div>
  );
}
