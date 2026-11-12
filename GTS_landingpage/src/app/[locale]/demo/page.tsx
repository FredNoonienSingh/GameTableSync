'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Container, Title, Text, Badge, Stack, Paper, Button, Group } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconArrowLeft, IconSettings } from '@tabler/icons-react';
import { AnimatedBackground, LandingNavbar, SimpleHeader, CommandForgeGraphic, Footer } from '@gts/ui';

export default function DemoPage() {
  const t = useTranslations('Common.DemoPage');
  const tFooter = useTranslations('Common.footer');
  const locale = useLocale();

  return (
    <main style={{ position: 'relative', overflowX: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNavbar />
      <AnimatedBackground />
      <SimpleHeader href={`/${locale}`} />

      <Container size="md" py={{ base: 40, md: 80 }} style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
        <Paper
          p={{ base: 'xl', sm: '3.5rem' }}
          radius="md"
          w="100%"
          style={{
            backgroundColor: 'rgba(15, 16, 12, 0.9)',
            border: '1px solid rgba(24, 100, 255, 0.3)',
            borderTop: '4px solid #29d4ff',
            boxShadow: '0 16px 50px rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack align="center" ta="center" gap="lg">
            <CommandForgeGraphic />

            <Badge color="cyan" variant="outline" size="lg" style={{ letterSpacing: '0.1em' }}>
              {t('badge')}
            </Badge>

            <Title
              order={1}
              c="white"
              className="brand-logo"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
                lineHeight: 1.2,
                textShadow: '0 4px 25px rgba(41, 212, 255, 0.3)',
              }}
            >
              {t('title')}
            </Title>

            <Text size="md" c="gray.3" maw={560} lh={1.6}>
              {t('description')}
            </Text>

            <Group
              gap="xs"
              px="md"
              py={8}
              style={{
                backgroundColor: 'rgba(24, 100, 255, 0.1)',
                border: '1px solid rgba(24, 100, 255, 0.3)',
                borderRadius: 6,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'flex', color: '#29d4ff' }}
              >
                <IconSettings size={16} />
              </motion.div>
              <Text size="xs" c="cyan.3" className="brand-logo" style={{ letterSpacing: '0.08em' }}>
                {t('status')}
              </Text>
            </Group>

            <Button
              component="a"
              href={`/${locale}`}
              variant="outline"
              color="brandBlue.5"
              size="md"
              leftSection={<IconArrowLeft size={18} />}
              mt="sm"
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