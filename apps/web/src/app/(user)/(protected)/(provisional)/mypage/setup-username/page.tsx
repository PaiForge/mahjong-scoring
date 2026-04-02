import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ContentContainer } from '@/app/_components/content-container';
import { PageTitle } from '@/app/_components/page-title';

import { UsernameForm } from './_components/username-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setupUsername');

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function SetupUsernamePage() {
  const t = await getTranslations('setupUsername');

  return (
    <ContentContainer>
      <PageTitle>{t('title')}</PageTitle>
      <div className="mt-8">
        <UsernameForm />
      </div>
    </ContentContainer>
  );
}
