'use client';

import { useTranslations } from 'next-intl';
import { AccountSectionOutline } from '@gts/ui';

export default function AccountSystemsWargamingPage() {
  const t = useTranslations('Account.systems.wargaming');

  return (
    <AccountSectionOutline
      badge={t('badge')}
      title={t('title')}
      subtitle={t('subtitle')}
      cards={[
        {
          badge: t('cardArmies.badge'),
          title: t('cardArmies.title'),
          description: t('cardArmies.description'),
        },
        {
          badge: t('cardElo.badge'),
          title: t('cardElo.title'),
          description: t('cardElo.description'),
        },
        {
          badge: t('cardCrusade.badge'),
          title: t('cardCrusade.title'),
          description: t('cardCrusade.description'),
        },
      ]}
    />
  );
}