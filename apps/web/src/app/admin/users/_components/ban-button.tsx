'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { banUser } from '../_actions/ban-user';

interface BanButtonProps {
  readonly targetUserId: string;
}

/**
 * BAN ボタン — クリックでモーダル表示、理由入力後に BAN 実行
 * BANボタン
 */
export function BanButton({ targetUserId }: BanButtonProps) {
  const t = useTranslations('admin');
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined) => {
      const trimmed = reason.trim();
      if (trimmed.length === 0) {
        return { error: t('banUser.errorReasonRequired') };
      }
      const result = await banUser(targetUserId, trimmed);
      if ('error' in result) {
        return { error: t('banUser.errorFailed') };
      }
      setIsOpen(false);
      setReason('');
      return undefined;
    },
    undefined,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
      >
        BAN
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">{t('banUser.title')}</h3>

            <form action={formAction}>
              <label htmlFor="ban-reason" className="mb-1 block text-sm font-medium">
                {t('banUser.reasonLabel')}
              </label>
              <textarea
                id="ban-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('banUser.reasonPlaceholder')}
                className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                maxLength={1000}
              />

              {state?.error && (
                <p className="mb-3 text-sm text-red-600">{state.error}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setReason('');
                  }}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {t('banUser.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? t('banUser.pending') : t('banUser.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
