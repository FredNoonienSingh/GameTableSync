'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Group,
  Box,
  Menu,
  Button,
  UnstyledButton,
  Text,
  ActionIcon,
  Burger,
  Drawer,
  Stack,
  NavLink,
  Divider,
} from '@mantine/core';
import {
  IconChevronDown,
  IconUser,
  IconSwords,
  IconShield,
  IconCards,
  IconTrophy,
  IconCompass,
  IconDeviceMobile,
  IconLogin,
  IconLogout,
  IconLockAccess,
  IconLayoutDashboard,
  IconBuildingStore,
} from '@tabler/icons-react';
import defaultPureLogo from '../../assets/gametablesync_pure.png';
import { LoginModal } from '@gts/ui';

export interface AppHeaderClubRole {
  club_id: string;
  club_name: string;
  club_slug?: string;
  tier?: string;
  is_owner?: boolean;
  is_keymaster?: boolean;
  role_title?: string;
}

export interface AppHeaderLabels {
  dashboard?: string;
  tabletop?: string;
  ttSystems?: string;
  ttCampaign?: string;
  ttRoster?: string;
  rpg?: string;
  rpgSheets?: string;
  rpgWorldmap?: string;
  rpgSessions?: string;
  tcg?: string;
  tcgDecks?: string;
  tcgCompanion?: string;
  tcgPods?: string;
  gameFinder?: string;
  account?: string;
  clubManagement?: string;
  login?: string;
  logout?: string;
  admin?: string;
}

export interface AppHeaderProps {
  logoSrc?: string | { src: string; height: number; width: number };
  locale?: string;
  labels?: AppHeaderLabels;
  /** Optional overrides if controlled via external AuthContext */
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  clubRoles?: AppHeaderClubRole[];
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

const defaultLabels: Required<AppHeaderLabels> = {
  dashboard: 'Dashboard',
  tabletop: 'Tabletop',
  ttSystems: 'Multi-System Support',
  ttCampaign: 'Narrative Campaign Editor',
  ttRoster: 'Army List Viewer',
  rpg: 'RPG',
  rpgSheets: 'Charakterbögen',
  rpgWorldmap: 'Welt- & Hex-Karten',
  rpgSessions: 'Session Logs & Bastionen',
  tcg: 'TCG',
  tcgDecks: 'DeckViewer & Legality',
  tcgCompanion: 'Live In-Game Companion',
  tcgPods: 'Draft Pods & Ledger',
  gameFinder: 'Game Finder',
  account: 'Benutzerkonto',
  clubManagement: 'Club Management',
  login: 'Login',
  logout: 'Abmelden',
  admin: 'Sudo Admin',
};

const menuClassNames = {
  dropdown: 'gts-app-menu-dropdown',
  item: 'gts-app-menu-item',
};

export function AppHeader({
  logoSrc = defaultPureLogo,
  locale = 'de',
  labels,
  isAuthenticated,
  isAdmin,
  clubRoles,
  onOpenLogin,
  onLogout,
}: AppHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Self-contained auth & LoginModal state (works out-of-the-box in @gts/ui)
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [localAdmin, setLocalAdmin] = useState(false);
  const [localClubRoles, setLocalClubRoles] = useState<AppHeaderClubRole[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    const syncHeaderState = () => {
      const token = localStorage.getItem('token');
      setLocalToken(token);
      setLocalAdmin(
        localStorage.getItem('is_admin') === 'true' ||
          localStorage.getItem('is_app_admin') === 'true'
      );
      const rawRoles = localStorage.getItem('gts_club_roles');
      if (rawRoles) {
        try {
          setLocalClubRoles(JSON.parse(rawRoles));
        } catch {
          setLocalClubRoles([]);
        }
      } else {
        setLocalClubRoles([]);
      }

      if (token) {
        fetch('/api/account/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.club_roles && Array.isArray(data.club_roles)) {
              setLocalClubRoles(data.club_roles);
              localStorage.setItem('gts_club_roles', JSON.stringify(data.club_roles));
            }
          })
          .catch(() => {});
      }
    };

    syncHeaderState();
    window.addEventListener('gts-user-updated', syncHeaderState);
    return () => {
      window.removeEventListener('gts-user-updated', syncHeaderState);
    };
  }, []);

  const loggedIn = isAuthenticated !== undefined ? isAuthenticated : Boolean(localToken);
  const adminUser = isAdmin !== undefined ? isAdmin : localAdmin;
  const activeClubRoles = clubRoles !== undefined ? clubRoles : localClubRoles;
  const hasClubManagement = activeClubRoles.length > 0;

  const t = { ...defaultLabels, ...labels };
  const p = (path: string) => `/${locale}${path === '/' ? '' : path}`;

  const closeMobile = () => setMobileDrawerOpen(false);

  const handleTriggerLogin = () => {
    closeMobile();
    if (onOpenLogin) {
      onOpenLogin();
    } else {
      setAuthError(null);
      setAuthSuccess(null);
      setModalOpened(true);
    }
  };

  const handleTriggerLogout = () => {
    closeMobile();
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('is_app_admin');
      localStorage.removeItem('gts_user');
      localStorage.removeItem('gts_club_roles');
      setLocalToken(null);
      setLocalAdmin(false);
      setLocalClubRoles([]);
      window.location.reload();
    }
  };

  const handleLoginSubmit = async (payload: { email: string; password: string }) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.msg || 'Anmeldung fehlgeschlagen.');
        return;
      }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('is_admin', String(Boolean(data.is_app_admin)));
      if (data.user) {
        localStorage.setItem('gts_user', JSON.stringify(data.user));
      }
      if (Array.isArray(data.club_roles)) {
        localStorage.setItem('gts_club_roles', JSON.stringify(data.club_roles));
        setLocalClubRoles(data.club_roles);
      }
      setLocalToken(data.access_token);
      setLocalAdmin(Boolean(data.is_app_admin));
      setModalOpened(false);
      window.location.reload();
    } catch {
      setAuthError('Server nicht erreichbar. Bitte versuche es erneut.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (payload: {
    username: string;
    email: string;
    password: string;
    discord_account: string | null;
  }) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.msg || 'Registrierung fehlgeschlagen.');
        return;
      }
      setAuthSuccess(data.msg || 'Account erfolgreich erstellt!');
      await handleLoginSubmit({ email: payload.email, password: payload.password });
    } catch {
      setAuthError('Server nicht erreichbar. Bitte versuche es erneut.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      <Box component="header" className="gts-app-header">
        <Group justify="space-between" w="100%" align="center" wrap="nowrap">
          {/* LEFT: Logo & Brand */}
          <Link href={p('/')} className="gts-app-header-brand-link">
            <Group gap="sm" wrap="nowrap">
              {logoSrc && !imgError && (
                <Image
                  src={logoSrc}
                  alt="GameTableSync"
                  width={38}
                  height={38}
                  className="gts-app-header-logo"
                  onError={() => setImgError(true)}
                  priority
                />
              )}
              <Text className="brand-logo gts-app-header-title" size="md">
                GameTableSync
              </Text>
            </Group>
          </Link>

          {/* CENTER: Desktop Navigation (visibleFrom="sm") */}
          <Group gap="lg" visibleFrom="sm" wrap="nowrap">
            <Button
              component={Link}
              href={p('/')}
              variant="default"
              size="sm"
              className="gts-btn-ghost gts-app-nav-btn"
            >
              {t.dashboard}
            </Button>

            {/* Tabletop Dropdown */}
            <Menu
              shadow="md"
              width={230}
              position="bottom-start"
              transitionProps={{ transition: 'pop' }}
              classNames={menuClassNames}
            >
              <Menu.Target>
                <UnstyledButton className="gts-app-menu-trigger">
                  {t.tabletop} <IconChevronDown size={14} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  href={p('/tabletop/systems')}
                  leftSection={<IconSwords size={16} className="gts-text-primary" />}
                >
                  {t.ttSystems}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href={p('/tabletop/campaign')}
                  leftSection={<IconTrophy size={16} className="gts-text-primary" />}
                >
                  {t.ttCampaign}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href={p('/tabletop/roster')}
                  leftSection={<IconShield size={16} className="gts-text-primary" />}
                >
                  {t.ttRoster}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {/* RPG Dropdown */}
            <Menu
              shadow="md"
              width={230}
              position="bottom-start"
              transitionProps={{ transition: 'pop' }}
              classNames={menuClassNames}
            >
              <Menu.Target>
                <UnstyledButton className="gts-app-menu-trigger">
                  {t.rpg} <IconChevronDown size={14} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  href={p('/rpg/sheets')}
                  leftSection={<IconShield size={16} className="gts-text-accent" />}
                >
                  {t.rpgSheets}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href={p('/rpg/worldmap')}
                  leftSection={<IconCompass size={16} className="gts-text-accent" />}
                >
                  {t.rpgWorldmap}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href={p('/rpg/sessions')}
                  leftSection={<IconSwords size={16} className="gts-text-accent" />}
                >
                  {t.rpgSessions}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {/* TCG Dropdown */}
            <Menu
              shadow="md"
              width={230}
              position="bottom-start"
              transitionProps={{ transition: 'pop' }}
              classNames={menuClassNames}
            >
              <Menu.Target>
                <UnstyledButton className="gts-app-menu-trigger">
                  {t.tcg} <IconChevronDown size={14} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  href={p('/tcg/decks')}
                  leftSection={<IconCards size={16} className="gts-text-primary" />}
                >
                  {t.tcgDecks}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href={p('/tcg/companion')}
                  leftSection={<IconDeviceMobile size={16} className="gts-text-primary" />}
                >
                  {t.tcgCompanion}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href={p('/tcg/pods')}
                  leftSection={<IconTrophy size={16} className="gts-text-primary" />}
                >
                  {t.tcgPods}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button
              component={Link}
              href={p('/game-finder')}
              variant="default"
              size="sm"
              className="gts-btn-ghost gts-app-nav-btn"
            >
              {t.gameFinder}
            </Button>
          </Group>

          {/* RIGHT: Auth Button / Account Menu + Mobile Burger */}
          <Group gap="xs" wrap="nowrap">
            {loggedIn ? (
              <Menu
                shadow="md"
                width={220}
                position="bottom-end"
                transitionProps={{ transition: 'pop' }}
                classNames={menuClassNames}
              >
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    radius="md"
                    className="gts-icon-btn"
                    title={t.account}
                  >
                    <IconUser size={20} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    href={p('/account')}
                    leftSection={<IconUser size={16} className="gts-text-primary" />}
                  >
                    {t.account}
                  </Menu.Item>
                  {hasClubManagement && (
                    <Menu.Item
                      component={Link}
                      href={p('/club')}
                      leftSection={<IconBuildingStore size={16} className="gts-text-accent" />}
                    >
                      {t.clubManagement}
                    </Menu.Item>
                  )}
                  {adminUser && (
                    <Menu.Item
                      component={Link}
                      href={p('/sudo-admin')}
                      leftSection={<IconLockAccess size={16} className="gts-text-gold" />}
                    >
                      {t.admin}
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    className="gts-app-menu-item-danger"
                    leftSection={<IconLogout size={16} />}
                    onClick={handleTriggerLogout}
                  >
                    {t.logout}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                variant="default"
                size="sm"
                radius="md"
                leftSection={<IconLogin size={16} />}
                onClick={handleTriggerLogin}
                className="brand-logo gts-btn-primary"
              >
                {t.login}
              </Button>
            )}

            {/* Mobile Burger Trigger (hiddenFrom="sm") */}
            <Burger
              opened={mobileDrawerOpen}
              onClick={() => setMobileDrawerOpen((o) => !o)}
              hiddenFrom="sm"
              size="sm"
              className="gts-shell-burger"
              aria-label="Navigation öffnen"
            />
          </Group>
        </Group>
      </Box>

      {/* MOBILE NAVIGATION DRAWER */}
      <Drawer
        opened={mobileDrawerOpen}
        onClose={closeMobile}
        position="right"
        size="290px"
        padding="md"
        title={
          <Text className="brand-logo" fw={700} size="sm">
            GAMETABLESYNC
          </Text>
        }
        hiddenFrom="sm"
        zIndex={1000}
        classNames={{
          content: 'gts-modal-content',
          header: 'gts-modal-header',
          title: 'gts-modal-title',
          close: 'gts-modal-close',
        }}
      >
        <Stack gap="xs">
          <NavLink
            component={Link}
            href={p('/')}
            label={t.dashboard}
            leftSection={<IconLayoutDashboard size={18} className="gts-text-primary" />}
            onClick={closeMobile}
          />

          <NavLink
            label={t.tabletop}
            leftSection={<IconSwords size={18} className="gts-text-primary" />}
            childrenOffset={24}
            defaultOpened
          >
            <NavLink
              component={Link}
              href={p('/tabletop/systems')}
              label={t.ttSystems}
              onClick={closeMobile}
            />
            <NavLink
              component={Link}
              href={p('/tabletop/campaign')}
              label={t.ttCampaign}
              onClick={closeMobile}
            />
            <NavLink
              component={Link}
              href={p('/tabletop/roster')}
              label={t.ttRoster}
              onClick={closeMobile}
            />
          </NavLink>

          <NavLink
            label={t.rpg}
            leftSection={<IconCompass size={18} className="gts-text-accent" />}
            childrenOffset={24}
          >
            <NavLink
              component={Link}
              href={p('/rpg/sheets')}
              label={t.rpgSheets}
              onClick={closeMobile}
            />
            <NavLink
              component={Link}
              href={p('/rpg/worldmap')}
              label={t.rpgWorldmap}
              onClick={closeMobile}
            />
            <NavLink
              component={Link}
              href={p('/rpg/sessions')}
              label={t.rpgSessions}
              onClick={closeMobile}
            />
          </NavLink>

          <NavLink
            label={t.tcg}
            leftSection={<IconCards size={18} className="gts-text-primary" />}
            childrenOffset={24}
          >
            <NavLink
              component={Link}
              href={p('/tcg/decks')}
              label={t.tcgDecks}
              onClick={closeMobile}
            />
            <NavLink
              component={Link}
              href={p('/tcg/companion')}
              label={t.tcgCompanion}
              onClick={closeMobile}
            />
            <NavLink
              component={Link}
              href={p('/tcg/pods')}
              label={t.tcgPods}
              onClick={closeMobile}
            />
          </NavLink>

          <NavLink
            component={Link}
            href={p('/game-finder')}
            label={t.gameFinder}
            leftSection={<IconTrophy size={18} className="gts-text-primary" />}
            onClick={closeMobile}
          />

          <Divider my="sm" className="gts-divider" />

          {loggedIn ? (
            <>
              <NavLink
                component={Link}
                href={p('/account')}
                label={t.account}
                leftSection={<IconUser size={18} className="gts-text-primary" />}
                onClick={closeMobile}
              />
              {hasClubManagement && (
                <NavLink
                  component={Link}
                  href={p('/club')}
                  label={t.clubManagement}
                  leftSection={<IconBuildingStore size={18} className="gts-text-accent" />}
                  onClick={closeMobile}
                />
              )}
              {adminUser && (
                <NavLink
                  component={Link}
                  href={p('/sudo-admin')}
                  label={t.admin}
                  leftSection={<IconLockAccess size={18} className="gts-text-gold" />}
                  onClick={closeMobile}
                />
              )}
              <Button
                variant="default"
                className="gts-btn-danger"
                fullWidth
                mt="xs"
                leftSection={<IconLogout size={16} />}
                onClick={handleTriggerLogout}
              >
                {t.logout}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              fullWidth
              leftSection={<IconLogin size={16} />}
              onClick={handleTriggerLogin}
              className="brand-logo gts-modal-submit-btn"
            >
              {t.login}
            </Button>
          )}
        </Stack>
      </Drawer>

      {/* EMBEDDED LOGIN MODAL (When triggered directly from AppHeader) */}
      <LoginModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onLogin={handleLoginSubmit}
        onRegister={handleRegisterSubmit}
        locale={locale}
        isLoading={authLoading}
        errorMsg={authError}
        successMsg={authSuccess}
      />
    </>
  );
}