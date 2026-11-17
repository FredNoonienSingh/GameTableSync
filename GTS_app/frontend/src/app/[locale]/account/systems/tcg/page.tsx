'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionOutline } from '@gts/ui';

export default function AccountSystemsTcgPage() {
  const t = useTranslations('Account.systems.tcg');

  return (
    <AccountSectionOutline
      badge={t('badge')}
      title={t('title')}
      subtitle={t('subtitle')}
      cards={[
        {
          badge: t('cardDecks.badge'),
          title: t('cardDecks.title'),
          description: t('cardDecks.description'),
        },
        {
          badge: t('cardPods.badge'),
          title: t('cardPods.title'),
          description: t('cardPods.description'),
        },
        {
          badge: t('cardWallet.badge'),
          title: t('cardWallet.title'),
          description: t('cardWallet.description'),
        },
      ]}
    />
  );
}