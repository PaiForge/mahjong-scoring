import type { ReactNode } from "react";

import {
  type KnownAuthProvider,
  isKnownAuthProvider,
} from "@mahjong-scoring/features/account/auth-provider";

import { GoogleIcon } from "@/app/_components/google-icon";

interface LoginProviderIconsProps {
  /** `readLoginProviders` で並べ替え済みのプロバイダ */
  readonly providers: readonly string[];
  /** 既知のプロバイダの名前（ホバー・読み上げ用） */
  readonly labels: Readonly<Record<KnownAuthProvider, string>>;
}

/** 封筒（メール） */
function EnvelopeIcon() {
  return (
    <svg
      className="size-4 text-surface-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

/** Apple ロゴ */
function AppleIcon() {
  return (
    <svg
      className="size-4 text-surface-900"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

const PROVIDER_ICONS = {
  email: <EnvelopeIcon />,
  google: <GoogleIcon className="size-4" />,
  apple: <AppleIcon />,
} as const satisfies Record<KnownAuthProvider, ReactNode>;

/**
 * ログイン方法をアイコンで並べる
 * ログイン方法アイコン
 *
 * ユーザー一覧の列のため。連携を足せるようになって 1 人が複数のプロバイダを持つので、
 * 名前を並べると列が横に伸びる。アイコンにし、名前は `title`（ホバー）と
 * `aria-label`（読み上げ）で持たせる。辞書に無いプロバイダ（Supabase に足した直後等）は
 * アイコンを持たないので名前をそのまま出す。
 */
export function LoginProviderIcons({
  providers,
  labels,
}: LoginProviderIconsProps) {
  if (providers.length === 0) return "-";
  return (
    <span className="inline-flex items-center gap-1.5">
      {providers.map((provider) =>
        isKnownAuthProvider(provider) ? (
          <span
            key={provider}
            role="img"
            aria-label={labels[provider]}
            title={labels[provider]}
            className="inline-flex"
          >
            {PROVIDER_ICONS[provider]}
          </span>
        ) : (
          <span key={provider} className="text-xs text-surface-500">
            {provider}
          </span>
        ),
      )}
    </span>
  );
}
