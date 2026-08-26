"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/app/_components/modal-shell";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { ScoreTable } from "@/app/(user)/(public)/reference/score-table/_components/score-table";
import type { ScoreTableFocus } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

interface ScoreTableModalLinkProps {
  /** ハイライトさせる和了（正解の親子・ロンツモ・翻・符） */
  readonly focus: ScoreTableFocus;
}

/**
 * 点数表参照モーダルの導線
 * 点数表モーダル
 *
 * 答え合わせから出題ループを離脱せずに、正解が点数早見表のどこに
 * あるかを確かめるための導線。リンクを押したときだけモーダルで
 * 点数早見表を開き、正解のセル（満貫以上は区分行）をハイライトする。
 * 暗記用のぼかしトグルは参照中の誤タップ事故を防ぐため無効にする。
 */
export function ScoreTableModalLink({ focus }: ScoreTableModalLinkProps) {
  const t = useTranslations("score");
  const tScoreTable = useTranslations("scoreTable");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 ${TEXT_LINK_CLASSES}`}
        onClick={() => setIsOpen(true)}
      >
        {/* 点数表ナビと同じアイコン。行き先が同じものだと一目で分かるようにする */}
        <TableIcon className="size-4 shrink-0" />
        {t("result.viewScoreTable")}
      </button>
      <ModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        labelledBy={titleId}
        widthClassName="max-w-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-bold text-surface-900">
            {tScoreTable("pageTitle")}
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={tCommon("close")}
            className="text-surface-400 transition-colors hover:text-surface-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <ScoreTable focus={focus} blurToggleEnabled={false} />
        </div>
      </ModalShell>
    </>
  );
}
