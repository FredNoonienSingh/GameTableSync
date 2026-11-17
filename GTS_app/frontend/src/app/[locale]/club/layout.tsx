'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Center,
  Container,
  Paper,
  Stack,
  Badge,
  Title,
  Text,
  Alert,
  TextInput,
  PasswordInput,
  Button,
  Loader,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconAlertTriangle,
  IconMail,
  IconLock,
} from '@tabler/icons-react';
import {
  AppHeader,
  AnimatedBackground,
  ClubShell,
  type ClubShellClubSummary,
} from '@gts/ui';
import {
  ClubManagementProvider,
  useClubManagement,
} from '../../../context/ClubManagementContext';

function ClubLayoutInner({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname() || `/${locale}/club`;

  const {
    authorized,
    clubRoles,
    selectedClubId,
    setSelectedClubId,
    clubDetail,
    isOwner,
    isKeymaster,
    refreshSession,
  } = useClubManagement();

  // Unlisted Club Login Mask state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleClubLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.msg || 'Anmeldung fehlgeschlagen.');
        return;
      }

      const roles = Array.isArray(data.club_roles) ? data.club_roles : [];
      const appAdmin = Boolean(data.is_app_admin);

      const licRes = await fetch('/api/billing/licenses', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userLicenses = licRes.ok ? await licRes.json() : [];

      if (roles.length === 0 && !appAdmin && userLicenses.length === 0) {
        setLoginError(
          'Zugriff verweigert: Dieser Account besitzt keine Club-Owner-, Keymaster- oder Mitarbeiter-Berechtigung.'
        );
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('is_admin', String(appAdmin));
      if (data.user) {
        localStorage.setItem('gts_user', JSON.stringify(data.user));
      }
      localStorage.setItem('gts_club_roles', JSON.stringify(roles));
      window.dispatchEvent(new Event('gts-user-updated'));

      setLoginPassword('');
      await refreshSession();
    } catch {
      setLoginError('Backend nicht erreichbar.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('is_app_admin');
    localStorage.removeItem('gts_user');
    localStorage.removeItem('gts_club_roles');
    window.dispatchEvent(new Event('gts-user-updated'));
    window.location.href = `/${locale}`;
  };

  if (authorized === null) {
    return (
      <Center mih="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Unlisted Login Portal when not authenticated as Club Owner / Employee
  if (authorized === false) {
    return (
      <main className="gts-club-login-root">
        <AnimatedBackground />
        <Center mih="100vh" px="md" className="gts-relative-layer">
          <Container size={440} w="100%">
            <Paper p="xl" radius="md" className="gts-army-panel gts-panel-header gts-form">
              <Stack align="center" gap={6} mb="lg">
                <div className="gts-club-login-icon">
                  <IconBuildingStore size={32} className="gts-section-icon" />
                </div>
                <Badge variant="outline" className="gts-tier-badge">
                  STORE & CLUB PORTAL
                </Badge>
                <Title order={2} className="brand-logo gts-army-title" ta="center">
                  CLUB MANAGEMENT LOGIN
                </Title>
                <Text size="xs" ta="center" className="gts-text-muted">
                  Zugang für Club-Besitzer (Store Owners), Keymaster und Mitarbeiter
                </Text>
              </Stack>

              {loginError && (
                <Alert
                  className="gts-alert"
                  data-tone="danger"
                  mb="md"
                  icon={<IconAlertTriangle size={16} />}
                  withCloseButton
                  onClose={() => setLoginError(null)}
                >
                  {loginError}
                </Alert>
              )}

              <form onSubmit={handleClubLogin}>
                <Stack gap="sm">
                  <TextInput
                    label="Club-Owner / Staff E-Mail"
                    placeholder="store@gametablesync.com"
                    leftSection={<IconMail size={16} />}
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.currentTarget.value)}
                  />
                  <PasswordInput
                    label="Passwort"
                    placeholder="••••••••"
                    leftSection={<IconLock size={16} />}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.currentTarget.value)}
                  />
                  <Button
                    type="submit"
                    variant="default"
                    className="gts-btn-primary"
                    fullWidth
                    mt="sm"
                    loading={loginLoading}
                  >
                    Club-Kommandozentrale öffnen
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Container>
        </Center>
      </main>
    );
  }

  const clubsList: ClubShellClubSummary[] = clubRoles.map((r) => ({
    id: r.club_id,
    name: r.club_name,
    slug: r.club_slug,
    tier_label: r.tier_limits?.name || r.tier,
    role_label: r.is_owner ? 'OWNER' : r.is_keymaster ? 'KEYMASTER' : r.role_title || 'STAFF',
  }));

  const activeClubSummary: ClubShellClubSummary | null = clubDetail
    ? {
        id: clubDetail.id,
        name: clubDetail.name,
        slug: clubDetail.slug,
        tier_label: clubDetail.tier_limits?.name || clubDetail.tier,
        role_label: isOwner ? 'OWNER' : isKeymaster ? 'KEYMASTER' : 'STAFF',
      }
    : clubsList.find((c) => c.id === selectedClubId) || null;

  return (
    <div className="gts-club-root">
      <AppHeader locale={locale} clubRoles={clubRoles} />
      <AnimatedBackground />

      <ClubShell
        locale={locale}
        activePath={pathname}
        club={activeClubSummary}
        clubs={clubsList}
        onSelectClub={setSelectedClubId}
        onLogout={handleLogout}
        labels={{
          title: 'CLUB MANAGEMENT',
          overview: 'Übersicht & Tische',
          publicPage: 'Store- & Club-Seite',
          events: 'Events',
          tournaments: 'Turniere',
          pictures: 'Bilder & Galerie',
          banlist: 'Hausverbote (Banlist)',
          employees: 'Mitarbeiter & Schichten',
          licenses: 'Lizenz-Management',
          logout: 'Abmelden',
          mobileMenuButton: 'Club-Menü',
          switchClubPlaceholder: 'Store / Club wechseln',
        }}
      >
        {children}
      </ClubShell>
    </div>
  );
}

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClubManagementProvider>
      <ClubLayoutInner>{children}</ClubLayoutInner>
    </ClubManagementProvider>
  );
}
