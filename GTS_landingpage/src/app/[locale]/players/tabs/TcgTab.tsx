'use client';

import { useTranslations } from 'next-intl';
import {
  IconCards,
  IconDeviceMobile,
  IconAward,
  IconBolt,
  IconTrophy,
  IconRefresh,
} from '@tabler/icons-react';
import {
  Section,
  SubSection,
  FanningCardsGraphic,
  CardCycloneGraphic,
  AnimatedContainerBackground
} from '@gts/ui';

export function TcgTab() {
  const t = useTranslations('PlayersPage.tcg');

  return (
    <>
    <AnimatedContainerBackground/>
      <Section
        badge={t('companion.badge')}
        title={t('companion.title')}
        description={t('companion.description')}
        graphicSlot={(progress) => <FanningCardsGraphic progress={progress} />}
      >
        <SubSection
          icon={<IconCards size={20} />}
          title={t('companion.subDeckViewer.title')}
          description={t('companion.subDeckViewer.description')}
        />
        <SubSection
          icon={<IconDeviceMobile size={20} />}
          title={t('companion.subIngame.title')}
          description={t('companion.subIngame.description')}
        />
        <SubSection
          icon={<IconAward size={20} />}
          title={t('companion.subDraft.title')}
          description={t('companion.subDraft.description')}
        />
      </Section>

      <Section
        reverse
        badge={t('leagues.badge')}
        title={t('leagues.title')}
        description={t('leagues.description')}
        graphicSlot={(progress) => <CardCycloneGraphic progress={progress} />}
      >
        <SubSection
          icon={<IconBolt size={20} />}
          title={t('leagues.subPodTimer.title')}
          description={t('leagues.subPodTimer.description')}
        />
        <SubSection
          icon={<IconTrophy size={20} />}
          title={t('leagues.subStandings.title')}
          description={t('leagues.subStandings.description')}
        />
        <SubSection
          icon={<IconRefresh size={20} />}
          title={t('leagues.subCube.title')}
          description={t('leagues.subCube.description')}
        />
      </Section>
    </>
  );
}