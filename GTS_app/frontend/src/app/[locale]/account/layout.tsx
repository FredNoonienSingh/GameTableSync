'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  AppHeader,
  AnimatedBackground,
  AccountShell,
  type AccountShellUser,
} from '@gts/ui';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Account.sidebar');
  const locale = useLocale();
  const pathname = usePathname() || `/${locale}/account`;

  const [user, setUser] = useState<AccountShellUser | null>(null);

  useEffect(() => {
    const syncFromStorage = () => {
      const isAdmin = localStorage.getItem('is_admin') === 'true';
      const rawUser = localStorage.getItem('gts_user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUser({
            id: parsed.id,
            username: parsed.username || 'Kommandant',
            email: parsed.email || '',
            discord_account: parsed.discord_account,
            discord_id: parsed.discord_id,
            avatar_url: parsed.avatar_url,
            isAdmin: parsed.is_app_admin !== undefined ? Boolean(parsed.is_app_admin) : isAdmin,
          });
        } catch {
          // Fallback below
        }
      }
    };

    // 1. Instant hydration from localStorage
    syncFromStorage();

    // Listen for live profile/avatar updates from AccountSettingsPage
    window.addEventListener('gts-user-updated', syncFromStorage);

    // 2. Refresh live profile & S3 avatar from backend
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/account/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            localStorage.setItem('gts_user', JSON.stringify(data.user));
            setUser({
              id: data.user.id,
              username: data.user.username || 'Kommandant',
              email: data.user.email || '',
              discord_account: data.user.discord_account,
              discord_id: data.user.discord_id,
              avatar_url: data.user.avatar_url,
              isAdmin: Boolean(data.user.is_app_admin),
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('gts-user-updated', syncFromStorage);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('gts_user');
    window.location.href = `/${locale}`;
  };

  return (
    <div style={{ position: 'relative', overflowX: 'clip', minHeight: '100vh' }}>
      <AppHeader locale={locale} />
      <AnimatedBackground />

      <AccountShell
        locale={locale}
        activePath={pathname}
        user={user}
        onLogout={handleLogout}
        labels={{
          title: t('title'),
          overview: t('overview'),
          clubs: t('clubs'),
          tournaments: t('tournaments'),
          games: t('games'),
          systems: t('systems'),
          systemsWargaming: t('systemsWargaming'),
          systemsTcg: t('systemsTcg'),
          systemsRpg: t('systemsRpg'),
          settings: t('settings'),
          logout: t('logout'),
          discordVerified: t('discordVerified'),
          adminBadge: t('adminBadge'),
          mobileMenuButton: t('mobileMenuButton'),
        }}
      >
        {children}
      </AccountShell>
    </div>
  );
}