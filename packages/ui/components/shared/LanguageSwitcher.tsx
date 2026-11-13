'use client';

import { useEffect, useState } from 'react';
import { Menu, UnstyledButton, Text, Group } from '@mantine/core';
import { IconLanguage, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface LanguageSwitcherProps {
  locales?: readonly string[];
}

function getNativeLanguageName(code: string): string {
  try {
    const display = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    if (!display) return code.toUpperCase();
    return display.charAt(0).toUpperCase() + display.slice(1);
  } catch {
    return code.toUpperCase();
  }
}

export function LanguageSwitcher({ locales: propLocales }: LanguageSwitcherProps = {}) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [availableLocales, setAvailableLocales] = useState<readonly string[]>(
    propLocales ?? ['de', 'en']
  );

  useEffect(() => {
    if (propLocales && propLocales.length > 0) {
      setAvailableLocales(propLocales);
      return;
    }
    const domLocales = document.documentElement.getAttribute('data-locales');
    if (domLocales) {
      const parsed = domLocales
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) setAvailableLocales(parsed);
    }
  }, [propLocales]);

  const handleSelectLocale = (nextLocale: string) => {
    if (nextLocale === currentLocale) return;

    const segments = (pathname || '/').split('/');
    if (segments.length > 1 && availableLocales.includes(segments[1])) {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }

    const nextPath = segments.join('/') || `/${nextLocale}`;
    const query = searchParams?.toString();
    router.replace(query ? `${nextPath}?${query}` : nextPath);
  };

  return (
    <Menu
      shadow="md"
      width={175}
      position="bottom-end"
      zIndex={1001} /* Forces dropdown above the 1000 z-index navbar */
      transitionProps={{ transition: 'pop' }}
      classNames={{
        dropdown: 'gts-app-menu-dropdown',
        item: 'gts-app-menu-item',
      }}
    >
      <Menu.Target>
        <UnstyledButton className="brand-logo gts-lang-trigger" aria-label="Select language">
          <IconLanguage size={16} />
          <span>{currentLocale.toUpperCase()}</span>
          <IconChevronDown size={12} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {availableLocales.map((code) => {
          const isActive = code === currentLocale;
          return (
            <Menu.Item
              key={code}
              onClick={() => handleSelectLocale(code)}
              className={isActive ? 'gts-lang-item-active' : undefined}
              rightSection={isActive ? <IconCheck size={14} /> : null}
            >
              <Group gap="xs" wrap="nowrap">
                <Text span size="xs" fw={800} className="brand-logo" w={26}>
                  {code.toUpperCase()}
                </Text>
                <Text span size="sm">
                  {getNativeLanguageName(code)}
                </Text>
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}