"use client";

import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";

interface TehaiFuExampleProps {
  readonly tiles: readonly HaiKindId[];
  readonly agariHai?: HaiKindId;
  readonly rotatedIndex?: number;
  readonly label: string;
  readonly annotation?: string;
  readonly annotationColor?: "primary" | "amber";
}

export function TehaiFuExample({ tiles, agariHai, rotatedIndex, label, annotation, annotationColor = "primary" }: TehaiFuExampleProps) {
  const colorClass = annotationColor === "amber" ? "text-amber-600" : "text-primary-600";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-end gap-0.5">
          {tiles.map((tile, i) => (
            <Hai key={i} hai={tile} rotated={i === rotatedIndex} />
          ))}
        </div>
        {agariHai != null && (
          <>
            <span className="text-xs text-surface-400">+</span>
            <Hai hai={agariHai} />
          </>
        )}
      </div>
      <div className="text-sm">
        <span className="text-surface-600">{label}</span>
        {annotation != null && (
          <span className={`ml-2 font-semibold ${colorClass}`}>{annotation}</span>
        )}
      </div>
    </div>
  );
}
