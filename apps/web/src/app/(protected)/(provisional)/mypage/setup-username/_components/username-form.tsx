'use client';

import { type FormEvent, useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { validateUsername } from '@/lib/username';

/**
 * ユーザー名登録フォーム。
 * 初回ログイン後にユーザー名と表示名を設定する。
 *
 * ユーザー名セットアップフォーム
 */
export function UsernameForm() {
  const t = useTranslations('setupUsername');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getValidationMessage = useCallback(
    (errorKey: string): string => {
      switch (errorKey) {
        case 'too_short':
          return t('validation.tooShort');
        case 'too_long':
          return t('validation.tooLong');
        case 'invalid_format':
          return t('validation.invalidFormat');
        case 'reserved':
          return t('validation.reserved');
        case 'username_taken':
          return t('validation.taken');
        case 'username_already_set':
          return t('validation.alreadySet');
        default:
          return t('validation.error');
      }
    },
    [t]
  );

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (error) {
      setError(undefined);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      setError(getValidationMessage(validationError));
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const res = await fetch('/api/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          displayName: displayName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(getValidationMessage(data.error));
        setIsSubmitting(false);
        return;
      }

      router.push('/mypage');
    } catch {
      setError(getValidationMessage('unknown'));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-surface-800">
          {t('usernameLabel')} <span className="text-red-500">*</span>
        </label>
        <p className="mb-2 text-xs text-surface-500">{t('usernameDescription')}</p>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          placeholder={t('usernamePlaceholder')}
          maxLength={20}
          autoFocus
          autoComplete="off"
          className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          <li className="text-xs text-red-500">{t('cannotChange')}</li>
          <li className="text-xs text-surface-500">{t('usernameHint')}</li>
        </ul>
      </div>

      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-surface-800">
          {t('displayNameLabel')}
        </label>
        <p className="mb-2 text-xs text-surface-500">{t('displayNameDescription')}</p>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('displayNamePlaceholder')}
          maxLength={50}
          autoComplete="off"
          className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
        />
        <ul className="mt-2 list-inside list-disc">
          <li className="text-xs text-surface-500">{t('displayNameCanChange')}</li>
          <li className="text-xs text-surface-500">{t('displayNameMaxLength')}</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || username.trim().length === 0}
        className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
