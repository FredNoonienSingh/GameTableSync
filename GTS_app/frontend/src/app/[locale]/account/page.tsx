'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionOutline } from '@gts/ui';

export default function AccountOverviewPage() {
  const t = useTranslations('Account.overview');

  return (
    <AccountSectionOutline
      badge={t('badge')}
      title={t('title')}
      subtitle={t('subtitle')}
      cards={[
        {
          badge: t('cardClubs.badge'),
          title: t('cardClubs.title'),
          description: t('cardClubs.description'),
        },
        {
          badge: t('cardTournaments.badge'),
          title: t('cardTournaments.title'),
          description: t('cardTournaments.description'),
        },
        {
          badge: t('cardGames.badge'),
          title: t('cardGames.title'),
          description: t('cardGames.description'),
        },
      ]}
    />
  );
}