'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  IconListCheck,
  IconSwords,
  IconMap2,
  IconTrophy,
  IconCalendarEvent,
  IconBrandDiscord,
  IconDeviceGamepad2,
} from '@tabler/icons-react';
import {
  Section,
  SubSection,
  FeatureShowcaseCard,
  FallingD6Graphic,
  HobbyEssentialsGraphic,
  AnimatedContainerBackground,
  BCMockup,
  ComingSoonOverlay,
  type ShowcaseImageSource,
} from '@gts/ui';

export interface WargamingTabProps {
  companionMockupSrc?: ShowcaseImageSource;
}

export function WargamingTab({
  companionMockupSrc = BCMockup,
}: WargamingTabProps) {
  const locale = useLocale();
  const t = useTranslations('PlayersPage.wargaming');

  return (
    <>
      <AnimatedContainerBackground />

        <FeatureShowcaseCard
        badge={t('companion.badge')}
        title={t('companion.title')}
        description={t('companion.description')}
        inlineLinkText={t('companion.inlineLink')}
        href={`/${locale}/demo-40k`}
        linkLabel={t('companion.cta')}
        imageSrc={companionMockupSrc}
        imageAlt={t('companion.imageAlt')}
        imageTag={t('companion.imageTag')}
      >
        <SubSection
          icon={<IconDeviceGamepad2 size={20} />}
          title={t('companion.subHud.title')}
          description={t('companion.subHud.description')}
        />
      </FeatureShowcaseCard>


      <Section
        badge={t('arsenal.badge')}
        title={t('arsenal.title')}
        description={t('arsenal.description')}
        graphicSlot={(progress) => <FallingD6Graphic progress={progress} />}
      >
        <ComingSoonOverlay label="COMING SOON"
          variant='tilted'
          backdropOpacity={0.05}
          contentOpacity={1}
          bannerOpacity={0.05}
          blur={.1}>
          <SubSection
            icon={<IconListCheck size={20} />}
            title={t('arsenal.subListViewer.title')}
            description={t('arsenal.subListViewer.description')}
          />
        </ComingSoonOverlay>
        <SubSection
          icon={<IconSwords size={20} />}
          title={t('arsenal.subMatchmaking.title')}
          description={t('arsenal.subMatchmaking.description')}
        />
        <SubSection
          icon={<IconMap2 size={20} />}
          title={t('arsenal.subCrusade.title')}
          description={t('arsenal.subCrusade.description')}
        />
      </Section >

      <Section
        reverse
        badge={t('competitive.badge')}
        title={t('competitive.title')}
        description={t('competitive.description')}
        graphicSlot={(progress) => <HobbyEssentialsGraphic progress={progress} />}
      >
        <SubSection
          icon={<IconTrophy size={20} />}
          title={t('competitive.subElo.title')}
          description={t('competitive.subElo.description')}
        />
        <SubSection
          icon={<IconCalendarEvent size={20} />}
          title={t('competitive.subTournaments.title')}
          description={t('competitive.subTournaments.description')}
        />
        <SubSection
          icon={<IconBrandDiscord size={20} />}
          title={t('competitive.subDiscord.title')}
          description={t('competitive.subDiscord.description')}
        />
      </Section>
    </>
  );
}