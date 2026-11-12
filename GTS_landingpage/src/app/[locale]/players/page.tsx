import { useTranslations, useLocale } from 'next-intl';
import { Container, Title, Text, Badge, Stack, Paper, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { AnimatedBackground, LandingNavbar, SimpleHeader, Footer } from '@gts/ui';

export default function PlayersPage() {
  const t = useTranslations('Common.PlayersPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  return (
    <main style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNavbar />
      <AnimatedBackground />
      <SimpleHeader href={`/${locale}`} />

      <Container size="md" py={{ base: 60, md: 100 }} style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
        <Paper
          p={{ base: 'xl', sm: '3rem' }}
          radius="md"
          w="100%"
          style={{
            backgroundColor: 'rgba(15, 16, 12, 0.88)',
            border: '1px solid rgba(41, 212, 255, 0.25)',
            borderTop: '3px solid #29d4ff',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Stack gap="lg" align="flex-start">
            <Badge color="cyan" variant="outline" size="lg">
              {t('badge')}
            </Badge>
            <Title order={1} c="white" className="brand-logo" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}>
              {t('title')}
            </Title>
            <Text size="lg" c="gray.3" lh={1.6}>
              {t('description')}
            </Text>
            <Button
              component="a"
              href={`/${locale}`}
              variant="outline"
              color="cyan"
              leftSection={<IconArrowLeft size={18} />}
              mt="md"
            >
              {t('back')}
            </Button>
          </Stack>
        </Paper>
      </Container>

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