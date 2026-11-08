/**
 * アカウント
 *
 * @description ログインの単位としてのアカウントを扱うページ。メールアドレスの
 *   確認と変更、ログイン方法（メールアドレスとパスワード / Google / Apple）の
 *   一覧と追加・削除、そして退会への入口を持つ。
 *
 *   ログイン方法は認証サーバーの連携（identity）1 つを 1 行にする。同じ
 *   メールアドレスの Google / Apple でログインしたときの自動連携は認証サーバーが
 *   黙って行う（切る設定が無い）ので、ここはあるものを全部見せる。同じ
 *   プロバイダの連携は何個でもつなげる（仕事用と個人用の Google、付け替えの
 *   途中の新旧）。1 つに縛ると、Google だけでログインしている人が別の Google に
 *   付け替えるのに「先に外す」ことになり、外す側の「web の手段を残す」ガードと
 *   行き止まりになる。同じ Google アカウントが 2 つのアカウントにつながることは
 *   認証サーバーが拒む。
 *
 *   パスワードは画面で直接受け取らず、再設定のメール（`/reset-password`）で
 *   決めてもらう。Secure password change の再認証を画面に持たずに済み、
 *   Google / Apple だけの人も同じ道で足せる。外す操作は「外した後に web で
 *   ログインできる手段（パスワードか Google）が残る」ときだけ（判定は
 *   features の `evaluateIdentityRemoval`）。Apple の追加は iOS のアプリにしか
 *   無いので、Apple の行は連携しているときだけ出す。
 *
 *   退会の導線はこのページの最下部にだけ置く。以前はプロフィール編集の最下部に
 *   あったが、プロフィール編集は本登録の直後に誘導される画面で、登録したばかりの
 *   人に「削除」の文言を見せることになっていた。「他人に見せる自分」を整える
 *   プロフィールと、契約・ログインの単位であるアカウントは別の概念なので、
 *   退会はアカウント側に属する。
 *
 *   退会は普段の画面から見えないほうがよい一方で、探せば見つかる場所にも
 *   あるべきなので（「退会できない」という不信感を避ける）、多くのサービスと
 *   同じ「アカウント → 一番下」に揃える。プライバシーポリシーからの直リンクも残す。
 * @flow マイページ → アカウント → メールアドレスを変更する（確認メール 2 通 →
 *   `/auth/callback` → ここへ報せ付きで戻る）/ パスワードを設定（メール →
 *   `/reset-password`）/ Google アカウントを追加（Google → `/auth/callback` →
 *   ここへ）/ 外す（確認モーダル）→ （最下部の）アカウントを削除 → 退会
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { isApplePrivateRelayEmail } from "@mahjong-scoring/features/account/login-methods";

import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import {
  ACCOUNT_PAGE_PATH,
  readAccountPageNotice,
} from "@/lib/users/account-page-notice";
import { getAccountLoginState } from "@/lib/users/login-methods";
import { MypageSubpageLayout } from "../../_components/mypage-subpage-layout";
import { EmailCard } from "../_components/email-card";
import { LoginMethodsCard } from "../_components/login-methods-card";
import { prepareRouteLocale } from "@/i18n/route-locale";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";

import { confirmedGuardOptions } from "../../../_lib/guard-options";

/** 退会のページ（ロケール非依存のパス） */
const DELETE_ACCOUNT_PATH = "/mypage/account/delete";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mypage/account">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/mypage/account");
  return createPrivateMetadata("mypageAccount", "pageTitle", { locale });
}

interface MypageAccountPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MypageAccountPage({
  params: routeParams,
  searchParams,
}: MypageAccountPageProps &
  Pick<PageProps<"/[locale]/mypage/account">, "params">) {
  const locale = await prepareRouteLocale(routeParams, "/mypage/account");
  const { user } = await requireConfirmedUser(
    confirmedGuardOptions(ACCOUNT_PAGE_PATH, locale),
  );
  const [t, state, params] = await Promise.all([
    getTranslations("mypageAccount"),
    getAccountLoginState(user.id),
    searchParams,
  ]);
  const notice = readAccountPageNotice(params);
  const relayBlocked = isApplePrivateRelayEmail(state.email);

  return (
    <MypageSubpageLayout title={t("pageTitle")}>
      <div className="space-y-8">
        {notice !== undefined && (
          <p
            role="status"
            className="rounded-panel border border-panel bg-brand-subtle px-4 py-3 text-sm font-bold"
          >
            {t(`notices.${notice}`)}
          </p>
        )}

        <section className="space-y-4">
          <SectionTitle>{t("email.title")}</SectionTitle>
          <EmailCard
            email={state.email}
            pendingEmail={state.pendingEmail}
            relayBlocked={relayBlocked}
          />
        </section>

        <section className="space-y-4">
          <SectionTitle>{t("methods.title")}</SectionTitle>
          <LoginMethodsCard
            identities={state.identities}
            hasPassword={state.hasPassword}
            email={state.email}
            relayBlocked={relayBlocked}
          />
        </section>
      </div>

      {/* 退会への入口。本文から区切り線で切り離して最下部に置き、
          ログイン情報を見に来ただけの人の視線には入りにくくする。 */}
      <div className="mt-10 border-t border-panel pt-6 text-center">
        <Link
          href={resolveNavTargetFor(DELETE_ACCOUNT_PATH, locale).href}
          className={`text-sm ${TEXT_LINK_CLASSES}`}
        >
          {t("deleteAccountLink")}
        </Link>
      </div>
    </MypageSubpageLayout>
  );
}
