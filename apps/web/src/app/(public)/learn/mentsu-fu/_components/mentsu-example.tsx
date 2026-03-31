"use client";

import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai, HaiBack } from "@pai-forge/mahjong-react-ui";
import { useTranslations } from "next-intl";

interface MentsuExampleProps {
  readonly tiles: readonly HaiKindId[];
  readonly fu: number;
  readonly label: string;
  readonly isOpen?: boolean;
  readonly isKantsu?: boolean;
}

export function MentsuExample({ tiles, fu, label, isOpen, isKantsu }: MentsuExampleProps) {
  const t = useTranslations("mentsuFu.learn");

  const renderTiles = () => {
    if (isKantsu && !isOpen && tiles.length === 4) {
      return (
        <div className="flex gap-0.5">
          <HaiBack />
          <Hai hai={tiles[1]} />
          <Hai hai={tiles[2]} />
          <HaiBack />
        </div>
      );
    }

    return (
      <div className="flex gap-0.5">
        {tiles.map((tile, i) => (
          <Hai key={i} hai={tile} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {renderTiles()}
        <span className="text-sm text-surface-600">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${fu > 0 ? "text-primary-600" : "text-surface-400"}`}>
        {t("fuUnit", { value: fu })}
      </span>
    </div>
  );
}
