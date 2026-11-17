'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionOutline } from '@gts/ui';

export default function AccountGamesPage() {
  const t = useTranslations('Account.games');

  return (
    <AccountSectionOutline
      badge={t('badge')}
      title={t('title')}
      subtitle={t('subtitle')}
      cards={[
        {
          badge: t('cardHosted.badge'),
          title: t('cardHosted.title'),
          description: t('cardHosted.description'),
        },
        {
          badge: t('cardScheduled.badge'),
          title: t('cardScheduled.title'),
          description: t('cardScheduled.description'),
        },
        {
          badge: t('cardPast.badge'),
          title: t('cardPast.title'),
          description: t('cardPast.description'),
        },
      ]}
    />
  );
}