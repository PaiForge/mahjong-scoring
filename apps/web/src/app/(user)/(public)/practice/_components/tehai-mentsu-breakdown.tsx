"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MentsuType, resolveMentsuStructure } from "@mahjong-scoring/core";
import type { AgariContext, HaiKindId, Tehai } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface TehaiMentsuBreakdownProps {
  /** 分割する手牌（和了牌を含む14枚。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了状況。分割の解決（= 点数計算と同じ構造選択）に使う */
  readonly context: AgariContext;
}

/** 牌グループ1つ（面子 or 雀頭）とその種別ラベル */
function TileGroup({
  hais,
  label,
}: {
  readonly hais: readonly HaiKindId[];
  readonly label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex">
        {hais.map((kindId, i) => (
          <Hai key={i} hai={kindId} size="sm" />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * 手牌の面子・雀頭分割表示
 * 面子分解表示
 *
 * 結果の問題詳細で、理牌された手牌を「4面子1雀頭」に分けて見せる
 * 開閉式のビュー。既定は閉。どの牌がどの面子を構成するかが並びから
 * 読めるようになり、符・翻の内訳と手牌が結びつく。
 *
 * 分割はライブラリが点数計算で採用した構造（ScoreDetail.structure）を
 * resolveMentsuStructure で引く。面子分解は一意ではなく、独自に分解すると
 * 符内訳と食い違う分割を出しかねないため。変則手（七対子・国士無双）や
 * 分割を復元できない手牌ではトグルごと何も描画しない。
 *
 * 出題中の画面には置かないこと。待ちや符を問う練習では分割が答えを
 * 割ってしまう。正解を開示する文脈（結果詳細）専用。
 */
export function TehaiMentsuBreakdown({
  tehai,
  context,
}: TehaiMentsuBreakdownProps) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  const structure = useMemo(
    () => resolveMentsuStructure(tehai, context),
    [tehai, context],
  );

  if (!structure) return undefined;

  const mentsuLabels: Record<string, string> = {
    [MentsuType.Shuntsu]: t("shuntsu"),
    [MentsuType.Koutsu]: t("koutsu"),
    [MentsuType.Kantsu]: t("kantsu"),
  };

  return (
    <div>
      <button
        type="button"
        className={`text-sm ${TEXT_LINK_CLASSES}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? t("mentsuBreakdownHide") : t("mentsuBreakdownShow")}
      </button>
      {isOpen && (
        <div id={panelId} className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {structure.fourMentsu.map((mentsu, i) => (
            <TileGroup
              key={i}
              hais={mentsu.hais}
              label={mentsuLabels[mentsu.type] ?? ""}
            />
          ))}
          <TileGroup hais={structure.jantou.hais} label={t("jantou")} />
        </div>
      )}
    </div>
  );
}
