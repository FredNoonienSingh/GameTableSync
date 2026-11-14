'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  Paper,
  ThemeIcon,
  Grid,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  Container
} from '@mantine/core';
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
  IconSparkles,
  IconArrowRight
} from '@tabler/icons-react';
import {
  AnimatedBackground,
  Section,
  SubSection,
  BrandHeader,
  LaunchCountdown,
  ContactForm,
  Footer,
  LandingNavbar,
  CommandHubGraphic,
  FallingD6Graphic,
  RotatingD20Graphic,
  FanningCardsGraphic,
} from '@gts/ui';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  return (
    <main style={{ position: 'relative', overflowX: 'hidden' }}>
      <LandingNavbar />
      <AnimatedBackground />

      {/* 1. Intro Section with Shimmering Logo & Countdown */}
      <Section
        badge={t('intro.badge')}
        title={t('intro.title')}
        description={t('intro.subtitle')}
        headerSlot={<BrandHeader />}
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
      <Container size="xl" py={{ base: 40, md: 70 }} style={{ flex: 1, position: 'relative', zIndex: 2 }}>

        {/* 1. Free Forever for Players Callout Banner */}
        <Paper
          p={{ base: 'lg', sm: 'xl' }}
          radius="md"
          mb={{ base: 40, md: 60 }}
          style={{
            backgroundColor: 'rgba(15, 16, 12, 0.9)',
            border: '1px solid rgba(41, 212, 255, 0.35)',
            borderLeft: '4px solid #29d4ff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(41, 212, 255, 0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Grid align="center" gap="xl">
            <Grid>
              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon
                    size="md"
                    radius="sm"
                    style={{ backgroundColor: 'rgba(41, 212, 255, 0.15)', color: '#29d4ff' }}
                  >
                    <IconSparkles size={16} />
                  </ThemeIcon>
                  <Badge color="cyan" variant="outline" size="sm">
                    {tCommon('playerFree.badge')}
                  </Badge>
                </Group>
                <Title
                  order={3}

                  className="brand-logo"
                  style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)' }}
                >
                  {tCommon('playerFree.title')}
                </Title>
                <Text size="sm" c="gray.3" lh={1.6}>
                  {tCommon('playerFree.description')}
                </Text>
              </Stack>
            </Grid>
            <Grid>
              <Button
                component="a"
                href={`/${locale}/players`}
                size="lg"
                radius="md"
                fullWidth
                rightSection={<IconArrowRight size={18} />}
                className="brand-logo"
                styles={{
                  root: {
                    backgroundColor: 'rgba(41, 212, 255, 0.15)',
                    border: '1px solid #29d4ff',
                    color: '#fff',
                    height: 'auto',
                    minHeight: '3rem',
                    padding: '0.6rem 1rem',
                  },
                  label: {
                    whiteSpace: 'normal',
                    textAlign: 'center',
                  },
                }}
              >
                {tCommon('playerFree.cta')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* 2. General Core Engine Section */}
      <Section
        id="general"
        badge={t('general.badge')}
        title={t('general.title')}
        description={t('general.description')}
        graphicSlot={(progress) => <CommandHubGraphic progress={progress} />}
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
        reverse
        badge={t('tabletop.badge')}
        title={t('tabletop.title')}
        description={t('tabletop.description')}
        graphicSlot={(progress) => <FallingD6Graphic progress={progress} />}
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
        badge={t('rpg.badge')}
        title={t('rpg.title')}
        description={t('rpg.description')}
        graphicSlot={(progress) => <RotatingD20Graphic progress={progress} />}
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
        reverse
        badge={t('tcg.badge')}
        title={t('tcg.title')}
        description={t('tcg.description')}
        graphicSlot={(progress) => <FanningCardsGraphic progress={progress} />}
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
          rights: tCommon('footer.copyright'),
          imprint: tCommon('footer.imprint'),
          privacy: tCommon('footer.privacy'),
          terms: tCommon('footer.terms'),
        }}
      />
    </main>
  );
}