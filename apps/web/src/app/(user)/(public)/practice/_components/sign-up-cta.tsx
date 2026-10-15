import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
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
      <SignUpCtaCard
        message={t("signUpCta.message")}
        description={t("signUpCta.description")}
      />
    </ResultBlockSection>
  );
}

/**
 * ランキングの下に置く未ログインユーザー向けの登録 CTA
 * ランキング下の登録導線
 *
 * 結果画面を末尾までスクロールした人は、ページ上部の `SignUpCta` を
 * 通り過ぎたあとに他の人の名前が並ぶ上位を見ている。その直後で
 * 「自分も載る」ことを訴える。上部の CTA と同じカードで、文言だけ
 * ランキングに寄せる（`challenge.signUpCta.leaderboard`）。
 *
 * 見出しを持たず、ランキングのセクションの末尾に続けて置く — 文言が
 * 直上の表を指しているため、別のセクションに切り離すと何に載るのかが
 * 離れる。アプリの結果画面はランキングを出さないので、同じ位置の案内は
 * ランキングに触れない別の文言にしている（`recordCta.result`）。
 */
export async function LeaderboardSignUpCta() {
  const t = await getTranslations("challenge");

  return (
    <SignUpCtaCard
      message={t("signUpCta.leaderboard.message")}
      description={t("signUpCta.leaderboard.description")}
    />
  );
}

/** 登録 CTA のカード（訴える文言・登録ボタン・ログインへのサブリンク） */
async function SignUpCtaCard({
  message,
  description,
}: {
  readonly message: string;
  readonly description: string;
}) {
  const t = await getTranslations("challenge");

  return (
    <div className="rounded-panel border border-panel bg-brand-subtle p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-surface-900">{message}</p>
          <p className="mt-1 text-sm text-surface-600">{description}</p>
        </div>
        <div
          className={`flex w-full flex-col items-center ${SUB_LINK_GAP} sm:w-auto sm:items-end`}
        >
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
  );
}
