import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { IntroductionGuide } from "./_components/introduction-guide";

/** KaTeX CSS（数式レンダリング用） */
const KATEX_CSS_HREF = "https://cdn.jsdelivr.net/npm/katex@0.16.44/dist/katex.min.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("introduction.learn");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default function LearnIntroductionPage() {
  return (
    <>
      <link rel="stylesheet" href={KATEX_CSS_HREF} />
      <LearnPageLayout namespace="introduction.learn">
        <IntroductionGuide />
      </LearnPageLayout>
    </>
  );
}
