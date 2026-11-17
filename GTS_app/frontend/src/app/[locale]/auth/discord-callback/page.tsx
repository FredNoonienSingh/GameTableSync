'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Center, Loader, Stack, Text } from '@mantine/core';

function DiscordCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';

  useEffect(() => {
    const finishDiscordLogin = async () => {
      const token = searchParams.get('access_token');
      const isAdmin = searchParams.get('is_app_admin') === 'true';

      if (!token) {
        router.replace(`/${locale}`);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('is_admin', String(isAdmin));

      // Fetch the full user profile (including S3 avatar_url and Discord handle)
      try {
        const res = await fetch('/api/account/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            localStorage.setItem('gts_user', JSON.stringify(data.user));
          }
          if (Array.isArray(data.club_roles)) {
            localStorage.setItem('gts_club_roles', JSON.stringify(data.club_roles));
          }
        }
      } catch {
        // Ignore network hiccup; AccountLayout will retry /api/account/me
      }

      window.location.href = `/${locale}/account`;
    };

    finishDiscordLogin();
  }, [searchParams, router, locale]);

  return (
    <Center mih="100vh">
      <Stack align="center" gap="sm">
        <Loader color="blue" size="lg" />
        <Text size="sm" c="dimmed">
          Discord-Profil und Avatar werden synchronisiert...
        </Text>
      </Stack>
    </Center>
  );
}

export default function DiscordCallbackPage() {
  return (
    <Suspense
      fallback={
        <Center mih="100vh">
          <Loader color="blue" size="lg" />
        </Center>
      }
    >
      <DiscordCallbackHandler />
    </Suspense>
  );
}