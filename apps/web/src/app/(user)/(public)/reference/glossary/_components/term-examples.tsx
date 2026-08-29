import { getTranslations } from "next-intl/server";

import { ExampleCard } from "@/app/(user)/_components/example-card";
import { TileSet } from "@/app/(user)/_components/tile-set";
import type { GlossaryTermExample } from "@/lib/glossary/types";

interface TermExamplesProps {
  readonly examples: readonly GlossaryTermExample[];
}

/**
 * 7 枚以上並べる例（面子手・七対子など）は 1 段小さい牌にする。
 * それでも狭い画面では収まらないため、外側で横スクロールさせる。
 */
const MANY_TILES_THRESHOLD = 7;

/**
 * 用語の例示牌
 * 用語の例示
 *
 * 「順子」「両面」「暗槓」のように、定義の文だけでは形が浮かばない語に
 * 実物を並べて見せる。注記は牌が何であるかを補うもので、定義の言い換えは
 * 置かない（同じことを 2 回読ませない）。
 */
export async function TermExamples({ examples }: TermExamplesProps) {
  const t = await getTranslations("glossary");

  return (
    <div className="space-y-3">
      {examples.map((example, index) => (
        <ExampleCard key={index} spacing="space-y-2">
          <div className="overflow-x-auto">
            <TileSet
              tiles={example.tiles}
              faceDownIndexes={example.faceDownIndexes}
              size={example.tiles.length >= MANY_TILES_THRESHOLD ? "xs" : "sm"}
            />
          </div>
          {example.captionKey !== undefined && (
            <p className="text-xs text-surface-500">
              {t(`captions.${example.captionKey}`)}
            </p>
          )}
        </ExampleCard>
      ))}
    </div>
  );
}
