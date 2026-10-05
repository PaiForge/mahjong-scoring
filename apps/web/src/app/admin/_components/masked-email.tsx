"use client";

import { useState } from "react";

import { maskEmail } from "../_lib/mask-email";

interface MaskedEmailProps {
  readonly email: string | null | undefined;
  readonly labels: {
    readonly revealEmail: string;
    readonly hideEmail: string;
  };
}

/** アドレスが無いときに表示する文字列 */
const EMPTY = "-";

/**
 * 既定で伏せて表示し、押すと全文を見せるメールアドレス
 * マスク付きメールアドレス
 *
 * 想定している脅威は居合わせた第三者 — 通話中にユーザー一覧を画面共有した、
 * 横から画面を覗かれた、といった場面で、必要のない実アドレスを持ち帰られること。
 * 既定で伏せておけば、アドレスが画面に出るのは管理者が意図して開いたときだけになる。
 *
 * 全文はブラウザに送っている（切り替えはクライアント側なので RSC ペイロードに
 * 含まれ、開発者ツールから読める）。これは意図どおり — 管理画面の利用者は
 * そもそもアドレスを見てよい人で、守る相手は利用者ではなく周りの人。
 * 操作している本人からデータを隠す目的には使わないこと。
 */
export function MaskedEmail({ email, labels }: MaskedEmailProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!email) return <span>{EMPTY}</span>;

  const label = isRevealed ? labels.hideEmail : labels.revealEmail;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{isRevealed ? email : maskEmail(email)}</span>
      <button
        type="button"
        onClick={() => setIsRevealed((revealed) => !revealed)}
        aria-label={label}
        aria-pressed={isRevealed}
        title={label}
        className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <EyeIcon crossed={isRevealed} />
      </button>
    </span>
  );
}

/** 目のアイコン。`crossed` で斜線入り（= 隠す） */
function EyeIcon({ crossed }: { readonly crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  );
}
