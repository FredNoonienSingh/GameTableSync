import { useTranslations, useLocale } from 'next-intl';
import {
  IconCalendarEvent,
  IconBrandDiscord,
  IconTrophy,
  IconSwords,
  IconMap2,
  IconListCheck,
  IconUserScan,
  IconCompass,
  IconCards,
  IconDeviceMobile,
  IconAward,
  IconFeather,
} from '@tabler/icons-react';
import { AnimatedBackground } from '@gts/ui';
import { Section } from '@gts/ui';
import { SubSection } from '@gts/ui';
import { BrandHeader } from '@gts/ui';
import { LaunchCountdown } from '@gts/ui';
import { ContactForm } from '@gts/ui';
import { Footer } from '@gts/ui';
import { LandingNavbar } from '@gts/ui';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale(); // Grabs 'de' or 'en' from the URL automatically

  return (
    <main style={{ position: 'relative', overflowX: 'hidden' }}>
      <LandingNavbar/>
      <AnimatedBackground />

      {/* 1. Intro Section with Shimmering Logo & Countdown */}
      <Section
        variant="intro"
        badge={t('intro.badge')}
        title={t('intro.title')}
        description={t('intro.subtitle')}
        headerSlot={<BrandHeader/>}
      >
        <LaunchCountdown
          labels={{
            label: t('intro.countdown.label'),
            days: t('intro.countdown.days'),
            hours: t('intro.countdown.hours'),
            minutes: t('intro.countdown.minutes'),
            seconds: t('intro.countdown.seconds'),
          }}
        />
      </Section>

      {/* 2. General Core Engine Section */}
      <Section
        id="general"
        variant="hub"
        badge={t('general.badge')}
        title={t('general.title')}
        description={t('general.description')}
      >
        <SubSection
          icon={<IconCalendarEvent size={20} />}
          title={t('general.subScheduling.title')}
          description={t('general.subScheduling.description')}
        />
        <SubSection
          icon={<IconBrandDiscord size={20} />}
          title={t('general.subDiscord.title')}
          description={t('general.subDiscord.description')}
        />
        <SubSection
          icon={<IconTrophy size={20} />}
          title={t('general.subMatchmaking.title')}
          description={t('general.subMatchmaking.description')}
        />
      </Section>

      {/* 3. Tabletop Section (Reversed for alternating flow) */}
      <Section
        id="tabletop"
        variant="d6"
        reverse
        badge={t('tabletop.badge')}
        title={t('tabletop.title')}
        description={t('tabletop.description')}
      >
        <SubSection
          icon={<IconSwords size={20} />}
          title={t('tabletop.subSystems.title')}
          description={t('tabletop.subSystems.description')}
        />
        <SubSection
          icon={<IconMap2 size={20} />}
          title={t('tabletop.subCampaign.title')}
          description={t('tabletop.subCampaign.description')}
        />
        <SubSection
          icon={<IconListCheck size={20} />}
          title={t('tabletop.subListViewer.title')}
          description={t('tabletop.subListViewer.description')}
        />
      </Section>

      {/* 4. RPG Section */}
      <Section
        id="rpg"
        variant="d20"
        badge={t('rpg.badge')}
        title={t('rpg.title')}
        description={t('rpg.description')}
      >
        <SubSection
          icon={<IconUserScan size={20} />}
          title={t('rpg.subSheets.title')}
          description={t('rpg.subSheets.description')}
        />
        <SubSection
          icon={<IconCompass size={20} />}
          title={t('rpg.subWorldMap.title')}
          description={t('rpg.subWorldMap.description')}
        />
        <SubSection
          icon={<IconFeather size={20} />}
          title={t('rpg.subSession.title')}
          description={t('rpg.subSession.description')}
        />
      </Section>

      {/* 5. TCG Section (Reversed) */}
      <Section
        id="tcg"
        variant="tcg"
        reverse
        badge={t('tcg.badge')}
        title={t('tcg.title')}
        description={t('tcg.description')}
      >
        <SubSection
          icon={<IconCards size={20} />}
          title={t('tcg.subDeckViewer.title')}
          description={t('tcg.subDeckViewer.description')}
        />
        <SubSection
          icon={<IconDeviceMobile size={20} />}
          title={t('tcg.subIngame.title')}
          description={t('tcg.subIngame.description')}
        />
        <SubSection
          icon={<IconAward size={20} />}
          title={t('tcg.subDraft.title')}
          description={t('tcg.subDraft.description')}
        />
      </Section>

      {/* 6. Contact & Footer */}
      <ContactForm
        labels={{
          title: t('Contact.title'),
          subtitle: t('Contact.subtitle'),
          emailLabel: t('Contact.emailLabel'),
          subjectLabel: t('Contact.subjectLabel'),
          messageLabel: t('Contact.messageLabel'),
          success: t('Contact.success'),
          error: t('Contact.error'),
          submit: t('Contact.submit'),
        }}
      />
      <Footer
        imprintHref={`/${locale}/imprint`}
        privacyHref={`/${locale}/privacy`}
        termsHref={`/${locale}/terms`}
        labels={{
          rights: tFooter('copyright'),
          imprint: tFooter('imprint'),
          privacy: tFooter('privacy'),
          terms: tFooter('terms'),
        }}
      />
    </main>
  );
}