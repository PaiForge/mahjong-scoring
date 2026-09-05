import type { ReactNode } from "react";

import type { GuideTranslator } from "../_lib/guide-translator";
import { GuideColumn } from "./guide-column";
import { GuideParagraph } from "./guide-paragraph";

interface ChapterColumnProps {
  /** 章の名前空間で解決済みの翻訳関数 */
  readonly t: GuideTranslator;
  /** 本文のあとに続ける補足（注記など）。無ければ本文だけのコラムになる */
  readonly children?: ReactNode;
}

/**
 * 章末のコラム
 * 章末コラム
 *
 * 章の辞書が `columnLabel` / `columnTitle` / `columnBody` を持つ前提で、
 * ラベル・見出し・本文 1 段落を組み立てる。ほとんどの章のコラムはこの形
 * ちょうどで、章ごとに {@link GuideColumn} と {@link GuideParagraph} を
 * 並べ直すと辞書のキー名まで含めて同じ 5 行が写経される。
 *
 * 本文に注記などを足す章は `children` に渡す。段落を 2 つ以上持つ章
 * （`columnBody1` / `columnBody2`）はこの形に乗らないので、
 * {@link GuideColumn} を直接使うこと。
 */
export function ChapterColumn({ t, children }: ChapterColumnProps) {
  return (
    <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
      <GuideParagraph>
        {t.rich("columnBody", { br: () => <br /> })}
      </GuideParagraph>
      {children}
    </GuideColumn>
  );
}
