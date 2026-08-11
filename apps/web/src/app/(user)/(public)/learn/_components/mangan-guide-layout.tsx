import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/_components/section-title";

import { GuideParagraph } from "./guide-paragraph";

interface ManganGuideLayoutProps {
  /** 章の翻訳名前空間（例: "manganKoRon.learn"） */
  readonly namespace: string;
  /** body2 と body3 の間に差し込む点数表 */
  readonly table: ReactNode;
}

/**
 * 満貫以上セクションの章レイアウト
 * 満貫ガイドレイアウト
 *
 * 4章（子ロン・親ロン・子ツモ・親ツモ）で共通の構成。
 * 本文は bodyTitle / body1 / body2 / body3 の4キーを持つ前提で、
 * 章ごとの違いは名前空間と差し込む点数表だけ。
 */
export async function ManganGuideLayout({
  namespace,
  table,
}: ManganGuideLayoutProps) {
  const t = await getTranslations(namespace);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionTitle>{t("bodyTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("body1")}</GuideParagraph>
        <GuideParagraph preLine>{t("body2")}</GuideParagraph>
        {table}
        <GuideParagraph preLine>{t("body3")}</GuideParagraph>
      </section>
    </div>
  );
}
