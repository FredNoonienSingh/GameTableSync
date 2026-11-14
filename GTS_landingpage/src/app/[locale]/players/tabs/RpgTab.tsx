'use client';

import { useTranslations } from 'next-intl';
import {
  IconUserScan,
  IconCompass,
  IconFeather,
  IconCalendarEvent,
  IconBook,
  IconSparkles,
} from '@tabler/icons-react';
import {
  Section,
  SubSection,
  RotatingD20Graphic,
  HexTilePathGraphic,
  AnimatedContainerBackground
} from '@gts/ui';

export function RpgTab() {
  const t = useTranslations('PlayersPage.rpg');

  return (
    <>
    <AnimatedContainerBackground/>
      <Section
        badge={t('chronicles.badge')}
        title={t('chronicles.title')}
        description={t('chronicles.description')}
        graphicSlot={(progress) => <RotatingD20Graphic progress={progress} />}
      >
        <SubSection
          icon={<IconUserScan size={20} />}
          title={t('chronicles.subSheets.title')}
          description={t('chronicles.subSheets.description')}
        />
        <SubSection
          icon={<IconCompass size={20} />}
          title={t('chronicles.subWorldMap.title')}
          description={t('chronicles.subWorldMap.description')}
        />
        <SubSection
          icon={<IconFeather size={20} />}
          title={t('chronicles.subSession.title')}
          description={t('chronicles.subSession.description')}
        />
      </Section>

      <Section
        reverse
        badge={t('westMarches.badge')}
        title={t('westMarches.title')}
        description={t('westMarches.description')}
        graphicSlot={(progress) => <HexTilePathGraphic progress={progress} />}
      >
        <SubSection
          icon={<IconCalendarEvent size={20} />}
          title={t('westMarches.subDropIn.title')}
          description={t('westMarches.subDropIn.description')}
        />
        <SubSection
          icon={<IconBook size={20} />}
          title={t('westMarches.subCodex.title')}
          description={t('westMarches.subCodex.description')}
        />
        <SubSection
          icon={<IconSparkles size={20} />}
          title={t('westMarches.subLoot.title')}
          description={t('westMarches.subLoot.description')}
        />
      </Section>
    </>
  );
}