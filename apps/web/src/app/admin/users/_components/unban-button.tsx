'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { unbanUser } from '../_actions/unban-user';

interface UnbanButtonProps {
  readonly targetUserId: string;
}

/**
 * BAN 解除ボタン — クリックで確認モーダル表示後に BAN 解除を実行
 * BAN解除ボタン
 */
export function UnbanButton({ targetUserId }: UnbanButtonProps) {
  const t = useTranslations('admin');
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined) => {
      const result = await unbanUser(targetUserId);
      if ('error' in result) {
        return { error: t('unbanUser.errorFailed') };
      }
      setIsOpen(false);
      return undefined;
    },
    undefined,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors"
      >
        {t('unbanUser.confirm')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">{t('unbanUser.title')}</h3>
            <p className="mb-4 text-sm text-gray-600">{t('unbanUser.confirmMessage')}</p>

            <form action={formAction}>
              {state?.error && (
                <p className="mb-3 text-sm text-red-600">{state.error}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {t('unbanUser.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? t('unbanUser.pending') : t('unbanUser.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
