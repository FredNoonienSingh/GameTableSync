'use client';

import { useEffect, useState } from 'react';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const [scheme, setScheme] = useState<'dark' | 'light'>('dark');

  const applyDomTheme = (target: 'dark' | 'light') => {
    const html = document.documentElement;
    html.setAttribute('data-mantine-color-scheme', target);
    html.style.backgroundColor = target === 'dark' ? '#0f100c' : '#f4f6fb';
    html.style.colorScheme = target;
  };

  useEffect(() => {
    const saved =
      (localStorage.getItem('mantine-color-scheme-value') as 'dark' | 'light' | null) || 'dark';
    setScheme(saved);
    applyDomTheme(saved);
  }, []);

  const handleToggle = () => {
    const next = scheme === 'dark' ? 'light' : 'dark';
    setScheme(next);
    applyDomTheme(next);
    localStorage.setItem('mantine-color-scheme-value', next);

    try {
      setColorScheme(next);
    } catch {
      // Ignore if provider context is busy
    }
  };

  return (
    <ActionIcon
      onClick={handleToggle}
      variant="default"
      size="lg"
      radius="md"
      aria-label="Toggle color scheme"
      className="gts-theme-toggle-btn"
    >
      {scheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}