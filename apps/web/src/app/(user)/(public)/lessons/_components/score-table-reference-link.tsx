"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Role, WinType } from "@mahjong-scoring/core";
import type { ScoreTableViewMode } from "@mahjong-scoring/features/score-table/score-grid";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { ReferenceModal } from "@/app/(user)/_components/reference-modal";
import { ScoreTable } from "@/app/(user)/(public)/reference/score-table/_components/score-table";

interface ScoreTableReferenceLinkProps {
  /** 開いたときの親子のタブ。直前の表と同じ親子にそろえる */
  readonly role: Role;
  /** 開いたときのロンツモのタブ。直前の表と同じ和了にそろえる */
  readonly winType: WinType;
  /** 開いたときの表示モード（満貫以上の表の下では `high_score`） */
  readonly viewMode?: ScoreTableViewMode;
}

/**
 * 教本の点数表の右下に添える、点数早見表を開くリンク
 * 点数早見表リンク
 *
 * 章の表は早見表から数行・数列を抜き出したものなので、「全体のどこに
 * あたるか」を本文を離れずに確かめられるよう、早見表をモーダルで開く。
 * ページ遷移にすると読んでいた位置を失う。タブは直前の表と同じ親子・
 * ロンツモに合わせ、探す手間を省く。ハイライトは付けない — 章の表は
 * 1 セルではなく行や列の並びを見せているため、指す 1 セルが無い。
 *
 * 移動ではなく参照なので、ボタンではなくテキストリンクの体裁にする。
 * 表の右下に置くのは、表を読み終えた視線の終点だから。
 */
export function ScoreTableReferenceLink({
  role,
  winType,
  viewMode = "normal",
}: ScoreTableReferenceLinkProps) {
  const t = useTranslations("scoreTable");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`text-xs ${TEXT_LINK_CLASSES}`}
      >
        {t("openReference")}
      </button>
      <ReferenceModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("pageTitle")}
      >
        <ScoreTable
          initialRole={role}
          initialWinType={winType}
          initialViewMode={viewMode}
          blurToggleEnabled={false}
        />
      </ReferenceModal>
    </div>
  );
}
