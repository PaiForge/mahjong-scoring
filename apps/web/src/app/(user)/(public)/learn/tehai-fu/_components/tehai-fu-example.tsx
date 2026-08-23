"use client";

import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";

/** 注釈の意味づけと色の対応表 */
const ANNOTATION_TONE_CLASS = {
  /** 正しい計算結果 */
  result: "text-primary-600",
  /** 間違えやすく、注意を促したい結果 */
  caution: "text-amber-600",
} as const;

/** 注釈の意味づけ */
type AnnotationTone = keyof typeof ANNOTATION_TONE_CLASS;

interface TehaiFuExampleProps {
  readonly tiles: readonly HaiKindId[];
  readonly agariHai?: HaiKindId;
  readonly rotatedIndex?: number;
  readonly label: string;
  readonly annotation?: string;
  readonly annotationTone?: AnnotationTone;
}

export function TehaiFuExample({
  tiles,
  agariHai,
  rotatedIndex,
  label,
  annotation,
  annotationTone = "result",
}: TehaiFuExampleProps) {
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
      {/* 狭い画面では説明と結論の間で折り返す（結論の途中で切らない） */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm">
        <span className="text-surface-600">{label}</span>
        {annotation != null && (
          <span
            className={`font-semibold ${ANNOTATION_TONE_CLASS[annotationTone]}`}
          >
            {annotation}
          </span>
        )}
      </div>
    </div>
  );
}
