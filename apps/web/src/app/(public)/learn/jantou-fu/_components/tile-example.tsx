"use client";

import { Hai } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";

interface TileExampleProps {
  tiles: readonly HaiKindId[];
  fu: number;
  label: string;
}

export function TileExample({ tiles, fu, label }: TileExampleProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {tiles.map((hai, i) => (
          <Hai key={i} hai={hai} size="sm" />
        ))}
      </div>
      <div className="text-sm">
        <span className="font-semibold text-surface-900">{fu}符</span>
        <span className="ml-2 text-surface-500">{label}</span>
      </div>
    </div>
  );
}
