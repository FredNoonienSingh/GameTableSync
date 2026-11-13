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
import { ThemeToggle } from '@gts/ui';

export function LandingNavbar() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const t = useTranslations('Common.Navbar');
  const locale = useLocale();

  const navLinks = [
    { link: `/${locale}/organizers`, label: t('organizers') },
    { link: `/${locale}/players`, label: t('players') },
    { link: `/${locale}/pricing`, label: t('pricing') },
  ];

  const items = navLinks.map((item) => (
    <UnstyledButton
      key={item.label}
      component="a"
      href={item.link}
      onClick={closeDrawer}
      className="gts-nav-link"
    >
      {item.label}
    </UnstyledButton>
  ));

  return (
    <Box component="header" className="gts-landing-navbar">
      <Group justify="space-between" h="100%" px={{ base: 'md', lg: 'xl' }}>
        <Group gap="lg" visibleFrom="sm">
          {items}
        </Group>

        <Group gap="sm" visibleFrom="sm">
          <ThemeToggle />
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

        <Group gap="xs" hiddenFrom="sm" ml="auto">
          <ThemeToggle />
          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            color="var(--gts-text-secondary)"
            size="sm"
          />
        </Group>
      </Group>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title={
          <Text className="brand-logo" size="lg">
            Navigation
          </Text>
        }
        hiddenFrom="sm"
        zIndex={1000000}
        classNames={{
          content: 'gts-drawer-content',
          header: 'gts-drawer-header',
          close: 'gts-drawer-close',
        }}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" color="dark.6" />

          <Box px="md">
            {items.map((item, index) => (
              <div key={index} className="gts-drawer-item">
                {item}
              </div>
            ))}
          </Box>

          <Divider my="sm" color="dark.6" />

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