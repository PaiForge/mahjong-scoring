/**
 * お問い合わせ
 *
 * @description
 * 運営への問い合わせフォーム。内容は Resend 経由で運営のメールアドレスへ
 * メールとして届く（DB には保存しない）。未ログインでも使える。
 * 迷惑送信は IP レートリミットで絞る。
 *
 * @flow
 * 1. 入力（このページ） — 検証を通ると内容をクエリに載せて確認画面へ
 * 2. /contact/confirm — 内容を見せて「送信する」。「入力画面に戻る」は
 *    同じクエリで 1 に戻り、各欄が埋まった状態になる
 * 3. 送信成功で /contact/success へ
 *
 * route group `(index)` は、この indexの loading.tsx を兄弟ルート（`confirm` / `success`）の祖先にせずに置くための
 * もの。いまは静的ルートなので loading.tsx を外してあり（静的ルートは境界を持たない。不変条件と
 * 理由は `apps/web/src/app/loading-boundaries.test.ts`）、group だけが残っている。再び動的にする
 * ときは loading.tsx をこの group に置く。page.tsx を 1 つ上に移すと、そのときに兄弟を巻き込む。
 */
import { Suspense } from "react";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { ContactForm } from "../_components/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("contact", {
    title: "pageTitle",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <section className="space-y-6">
        <SectionTitle>{t("form.sectionTitle")}</SectionTitle>
        <p className="text-sm text-surface-500">{t("description")}</p>
        {/* ContactForm は useSearchParams() を読むため、静的ルートでは
            このサブツリーだけがクライアント描画になる */}
        <Suspense>
          <ContactForm />
        </Suspense>
      </section>
    </ContentContainer>
  );
}
