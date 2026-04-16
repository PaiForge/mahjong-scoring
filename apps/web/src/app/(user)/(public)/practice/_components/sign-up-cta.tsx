import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * 未ログインユーザー向けの登録 CTA
 * 登録導線
 *
 * Server Component。結果画面で EXP セクションの代わりに表示される。
 * 「無料登録するとスコアを記録できます」というメッセージと、
 * `/sign-up` への CTA ボタン、`/sign-in` へのサブリンクを含む。
 * 認証状態の判定は呼び出し側 (`createPracticeResultPage`) で行うため、
 * このコンポーネント自身は常に CTA を描画する純粋コンポーネント。
 *
 * 参考プロジェクト (`blindfold-chess` の `SignUpBannerUI`) の
 * 「枠で囲って目立たせる」構成に合わせつつ、配色はプロジェクトの
 * primary（緑系）トークンを使った薄緑の塗りに置き換えている。
 */
export async function SignUpCta() {
  const t = await getTranslations("challenge");

  return (
    <section className="mt-10 min-h-[180px] rounded-lg border border-primary-200 bg-primary-50/60 p-4 sm:p-6">
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
          <Link
            href="/sign-up"
            className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 sm:w-auto"
          >
            {t("signUpCta.cta")}
          </Link>
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            {t("signUpCta.signInLink")}
          </Link>
        </div>
      </div>
    </section>
  );
}
