"use client";

import { useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { localizedHref } from "@/i18n/public-path";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

import {
  evaluateIdentityRemoval,
  isApplePrivateRelayEmail,
  type LinkedIdentity,
  type LoginMethods,
} from "@mahjong-scoring/features/account/login-methods";

import { Button } from "@/app/[locale]/(user)/_components/button";
import { ConfirmationModal } from "@/app/[locale]/(user)/_components/confirmation-modal";
import { GoogleIcon } from "@/app/_components/google-icon";
import { SettingsCard } from "@/app/[locale]/(user)/_components/setting-toggle-row";
import { createClient } from "@/lib/supabase/client";
import {
  ACCOUNT_PAGE_PATH,
  LINK_RETURN_GOOGLE,
  LINK_RETURN_PARAM,
} from "@/lib/users/account-page-notice";
import { requestPasswordSetup } from "../_actions/request-password-setup";
import type { RequestPasswordSetupError } from "../_actions/request-password-setup";
import { unlinkLoginIdentity } from "../_actions/unlink-login-identity";
import type { UnlinkLoginIdentityError } from "../_actions/unlink-login-identity";
import { LoginMethodRow } from "./login-method-row";

interface LoginMethodsCardProps extends LoginMethods {
  readonly email: string | undefined;
  /** 今のアドレスが Apple の中継アドレスで、パスワード設定のメールが届かない */
  readonly relayBlocked: boolean;
}

/**
 * ログイン方法の一覧
 * ログイン方法カード
 *
 * 1 行目はメールアドレスとパスワード（設定済み / 未設定と、設定・変更のメールを
 * 送るボタン）。続けて Google / Apple の連携を 1 つずつ（連携先のアドレスと
 * 「外す」）、最後に「Google アカウントを追加」。同じ Google が複数つながって
 * いてもそのまま全部出す（付け替えの途中は新旧が並ぶ）。
 *
 * 「外す」はサーバーと同じ判定（`evaluateIdentityRemoval`）で先に無効にし、
 * 理由を行の下に出す。押せるときは確認モーダルを挟む。
 *
 * Google の追加は認証サーバーの `linkIdentity` で Google へ移動し、結果は
 * `/auth/callback` がこのページへ報せ付きで戻す。
 *
 * 英語のページから始めたときは、`/auth/callback` に `locale=<言語>` を付けて
 * 同じ言語のこのページへ戻させる（`/auth/callback` は言語の接頭辞を持たない
 * 共通の入口なので、言語を URL で運ぶ）。日本語では付けない（従来の URL のまま。
 * 無い場合は日本語として扱われる）。外した後の読み直しも同じ言語のこのページ。
 */
export function LoginMethodsCard({
  identities,
  hasPassword,
  email,
  relayBlocked,
}: LoginMethodsCardProps) {
  const locale = useLocale();
  const t = useTranslations("mypageAccount.methods");
  const tProviders = useTranslations("mypageAccount.login.providers");
  const router = useRouter();
  const [removing, setRemoving] = useState<LinkedIdentity | undefined>();
  /** 進行中の操作: "password" / "google" / 外している連携の ID */
  const [busy, setBusy] = useState<string | undefined>();

  const methods: LoginMethods = { identities, hasPassword };

  const handlePasswordSetup = async () => {
    setBusy("password");
    try {
      const result = await requestPasswordSetup();
      if ("error" in result) {
        toast.error(mapPasswordError(result.error));
        return;
      }
      toast.success(t("password.sentToast", { email: result.email }));
    } catch {
      toast.error(t("errors.unknown"));
    } finally {
      setBusy(undefined);
    }
  };

  const mapPasswordError = (code: RequestPasswordSetupError): string => {
    switch (code) {
      case "relayAddress":
      case "noEmail":
      case "sendFailed":
      case "rateLimited":
      case "unauthorized":
      case "banned":
        return t(`errors.${code}`);
      default: {
        const exhaustive: never = code;
        return exhaustive;
      }
    }
  };

  const mapUnlinkError = (code: UnlinkLoginIdentityError): string => {
    switch (code) {
      case "removal:notLinked":
      case "removal:notRemovable":
      case "removal:lastWebMethod":
      case "appleUnavailable":
      case "unlinkFailed":
      case "rateLimited":
      case "unauthorized":
      case "banned":
        return t(`errors.${code}`);
      default: {
        const exhaustive: never = code;
        return exhaustive;
      }
    }
  };

  const handleUnlink = async () => {
    if (!removing) return;
    const target = removing;
    setRemoving(undefined);
    setBusy(target.id);
    try {
      const result = await unlinkLoginIdentity(target.id);
      if ("error" in result) {
        toast.error(mapUnlinkError(result.error));
        return;
      }
      toast.success(t("removedToast"));
      router.replace(localizedHref(ACCOUNT_PAGE_PATH, locale));
    } catch {
      toast.error(t("errors.unknown"));
    } finally {
      setBusy(undefined);
    }
  };

  const handleAddGoogle = async () => {
    setBusy("google");
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set(LINK_RETURN_PARAM, LINK_RETURN_GOOGLE);
      if (locale !== DEFAULT_LOCALE) {
        callbackUrl.searchParams.set("locale", locale);
      }
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) {
        toast.error(t("errors.unknown"));
        setBusy(undefined);
      }
      // 成功すると Google へ移動するので、ボタンは移動中のまま
    } catch {
      toast.error(t("errors.unknown"));
      setBusy(undefined);
    }
  };

  const identityDetail = (identity: LinkedIdentity): string | undefined =>
    identity.provider === "apple" && isApplePrivateRelayEmail(identity.email)
      ? t("apple.privateRelay")
      : identity.email;

  return (
    <>
      <SettingsCard>
        <LoginMethodRow
          title={tProviders("email")}
          detail={hasPassword ? t("password.set") : t("password.unset")}
          note={relayBlocked ? t("password.relayBlocked") : undefined}
          action={
            <Button
              variant="neutral"
              size="sm"
              onClick={handlePasswordSetup}
              disabled={relayBlocked || busy !== undefined}
            >
              {busy === "password"
                ? t("password.sending")
                : hasPassword
                  ? t("password.change")
                  : t("password.setup")}
            </Button>
          }
        />

        {identities
          .filter((identity) => identity.provider !== "email")
          .map((identity) => {
            const decision = evaluateIdentityRemoval(methods, identity.id);
            return (
              <LoginMethodRow
                key={identity.id}
                title={tProviders(identity.provider)}
                detail={identityDetail(identity)}
                note={
                  decision.allowed
                    ? undefined
                    : decision.reason === "lastWebMethod"
                      ? t("cannotRemove.lastWebMethod")
                      : undefined
                }
                action={
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    onClick={() => setRemoving(identity)}
                    disabled={!decision.allowed || busy !== undefined}
                  >
                    {busy === identity.id ? t("removing") : t("remove")}
                  </Button>
                }
              />
            );
          })}

        <div className="px-5 py-4">
          <Button
            variant="neutral"
            size="sm"
            onClick={handleAddGoogle}
            disabled={busy !== undefined}
            className="gap-2"
          >
            <GoogleIcon className="size-4" />
            {busy === "google" ? t("google.adding") : t("google.add")}
          </Button>
        </div>
      </SettingsCard>

      <ConfirmationModal
        isOpen={removing !== undefined}
        onClose={() => setRemoving(undefined)}
        onConfirm={handleUnlink}
        title={t("confirmRemove.title", {
          provider: removing ? tProviders(removing.provider) : "",
        })}
        message={
          removing
            ? t("confirmRemove.message", {
                email: identityDetail(removing) ?? email ?? "",
              })
            : undefined
        }
        confirmText={t("confirmRemove.ok")}
        cancelText={t("confirmRemove.cancel")}
        confirmVariant="danger"
      />
    </>
  );
}
