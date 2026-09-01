import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ResultBlockSection } from "./result-block-section";

/**
 * 未ログインユーザー向けの登録 CTA
 * 登録導線
 *
 * Server Component。結果画面でログイン済みユーザーの記録セクションと同じ
 * スロットに表示される。「無料登録するとスコアを記録できます」という
 * メッセージと、`/sign-up` への CTA ボタン、`/sign-in` へのサブリンクを含む。
 * 認証状態の判定は呼び出し側 (`createPracticeResultPage`) で行うため、
 * このコンポーネント自身は常に CTA を描画する純粋コンポーネント。
 *
 * ログイン済み分岐とシルエット（SectionTitle + 本文、最小高さ）を揃えるため
 * `ResultBlockSection` + `SectionTitle` の骨格に載せる。中身のカードは
 * 参考プロジェクト (`blindfold-chess` の `SignUpBannerUI`) の
 * 「枠で囲って目立たせる」構成に合わせつつ、配色はプロジェクトの
 * primary（緑系）トークンを使った薄緑の塗りに置き換えている。
 */
export async function SignUpCta() {
  const t = await getTranslations("challenge");

  return (
    <ResultBlockSection>
      <SectionTitle>{t("signUpCta.sectionTitle")}</SectionTitle>
      <div className="rounded-lg border-3 border-ink bg-primary-50/60 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-surface-900">
              {t("signUpCta.message")}
            </p>
            <p className="mt-1 text-sm text-surface-600">
              {t("signUpCta.description")}
            </p>
          </div>
          <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:items-end">
            <LinkButton
              href="/sign-up"
              fullWidth
              className="whitespace-nowrap sm:w-auto"
            >
              {t("signUpCta.cta")}
            </LinkButton>
            <Link
              href="/sign-in"
              className={`text-xs font-semibold ${TEXT_LINK_CLASSES}`}
            >
              {t("signUpCta.signInLink")}
            </Link>
          </div>
        </div>
      </div>
    </ResultBlockSection>
  );
}
