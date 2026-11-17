'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionOutline } from '@gts/ui';

export default function AccountSystemsRpgPage() {
  const t = useTranslations('Account.systems.rpg');

  return (
    <AccountSectionOutline
      badge={t('badge')}
      title={t('title')}
      subtitle={t('subtitle')}
      cards={[
        {
          badge: t('cardSheets.badge'),
          title: t('cardSheets.title'),
          description: t('cardSheets.description'),
        },
        {
          badge: t('cardCampaigns.badge'),
          title: t('cardCampaigns.title'),
          description: t('cardCampaigns.description'),
        },
        {
          badge: t('cardGm.badge'),
          title: t('cardGm.title'),
          description: t('cardGm.description'),
        },
      ]}
    />
  );
}