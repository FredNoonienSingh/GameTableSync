'use client';

import {
  Group,
  Button,
  UnstyledButton,
  Text,
  Box,
  Burger,
  Drawer,
  ScrollArea,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslations, useLocale } from 'next-intl';

export function LandingNavbar() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const t = useTranslations('Common.Navbar');
  const locale = useLocale();

  const navLinks = [
    { link: `/${locale}/organizers`, label: t('organizers') },
    { link: `/${locale}/players`, label: t('players') },
    { link: `/${locale}/pricing`, label: t('pricing') },
  ];

  const linkStyles = {
    color: '#C1C2C5',
    fontWeight: 500,
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'color 0.2s, background-color 0.2s',
  };

  const items = navLinks.map((item) => (
    <UnstyledButton
      key={item.label}
      component="a"
      href={item.link}
      onClick={closeDrawer}
      style={linkStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.backgroundColor = 'rgba(24, 100, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#C1C2C5';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {item.label}
    </UnstyledButton>
  ));

  return (
    <Box
      component="header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        zIndex: 1000,
        backgroundColor: 'rgba(10, 11, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(24, 100, 255, 0.15)',
      }}
    >
      <Group justify="space-between" h="100%" px={{ base: 'md', lg: 'xl' }}>
        <Group gap="lg" visibleFrom="sm">
          {items}
        </Group>

        <Group visibleFrom="sm">
          <Button
            component="a"
            href={`/${locale}/demo`}
            variant="outline"
            color="brandBlue.5"
            radius="md"
          >
            {t('cta')}
          </Button>
        </Group>

        <Burger
          opened={drawerOpened}
          onClick={toggleDrawer}
          hiddenFrom="sm"
          color="#C1C2C5"
          size="sm"
          ml="auto"
        />
      </Group>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title={
          <Text className="brand-logo" size="lg" c="white">
            Navigation
          </Text>
        }
        hiddenFrom="sm"
        zIndex={1000000}
        styles={{
          content: { backgroundColor: '#0a0b08' },
          header: { backgroundColor: '#0a0b08', borderBottom: '1px solid #1a1b1e' },
          close: { color: '#C1C2C5' },
        }}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" color="#1a1b1e" />

          <Box px="md">
            {items.map((item, index) => (
              <div key={index} style={{ marginBottom: '1rem' }}>
                {item}
              </div>
            ))}
          </Box>

          <Divider my="sm" color="#1a1b1e" />

          <Group justify="center" pb="xl" px="md">
            <Button
              component="a"
              href={`/${locale}/demo`}
              onClick={closeDrawer}
              variant="outline"
              color="brandBlue.5"
              fullWidth
              radius="md"
            >
              {t('cta')}
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}