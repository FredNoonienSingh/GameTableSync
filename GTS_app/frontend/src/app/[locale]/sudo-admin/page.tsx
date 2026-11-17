'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Table,
  TextInput,
  Select,
  Modal,
  PasswordInput,
  Tabs,
  ActionIcon,
  Tooltip,
  Center,
  Loader,
  Alert,
  Switch,
  Progress,
} from '@mantine/core';
import {
  IconShieldLock,
  IconUsers,
  IconBuildingStore,
  IconDatabase,
  IconTrash,
  IconRefresh,
  IconExternalLink,
  IconBook,
  IconTerminal2,
  IconSearch,
  IconCheck,
  IconAlertTriangle,
  IconLock,
  IconMail,
  IconLogout,
  IconPlus,
  IconWorldDownload,
} from '@tabler/icons-react';
import { AnimatedBackground } from '@gts/ui';

interface AdminUserRow {
  id: string;
  display_name: string;
  email: string;
  discord_account: string | null;
  is_app_admin: boolean;
  owned_clubs_count: number;
  created_at: string | null;
}

interface AdminClubRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  owner_name: string | null;
  tier: string;
  tables_count: number;
  employees_count: number;
  bans_count: number;
}

interface CatalogSystemRow {
  id: string;
  name: string;
  github_repo: string;
  last_sync_sha: string | null;
  last_synced_at: string | null;
  factions_count: number;
}

interface SyncStatusDto {
  is_running: boolean;
  phase: string;
  current_system: string | null;
  current_repo: string | null;
  current_file: string | null;
  repos_completed: number;
  repos_total: number;
  files_completed: number;
  files_total: number;
  percent: number;
  message: string;
  last_error: string | null;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('gts_token');
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

export default function SudoAdminPage() {
  const router = useRouter();
  const locale = useLocale();

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Built-in Login Mask state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [buildVersion, setBuildVersion] = useState<string>('...');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Data states
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [clubs, setClubs] = useState<AdminClubRow[]>([]);
  const [tiersMap, setTiersMap] = useState<Record<string, any>>({});
  const [catalogSystems, setCatalogSystems] = useState<CatalogSystemRow[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatusDto | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  // Custom Repo Form state
  const [newSystemName, setNewSystemName] = useState('');
  const [newGithubRepo, setNewGithubRepo] = useState('');

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [clubSearch, setClubSearch] = useState('');

  // User Deletion Modal state
  const [userToDelete, setUserToDelete] = useState<AdminUserRow | null>(null);
  const [sudoPassword, setSudoPassword] = useState('');
  const [deletingUser, setDeletingUser] = useState(false);

  const landingDevUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/${locale}/dev`;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://localhost:3000/${locale}/dev`;
    }
    return `https://gametablesync.com/${locale}/dev`;
  }, [locale]);

  const swaggerUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'http://localhost:5001/apidocs';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5001/apidocs';
    }
    return '/apidocs';
  }, []);

  const loadAllSudoData = async () => {
    setLoadingData(true);
    try {
      const headers = getAuthHeaders();
      const [usersRes, clubsRes, tiersRes, sysRes, sanityRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/clubs', { headers }),
        fetch('/api/billing/tiers'),
        fetch('/api/catalog/systems'),
        fetch('/api/sanity'),
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (clubsRes.ok) setClubs(await clubsRes.json());
      if (tiersRes.ok) setTiersMap(await tiersRes.json());
      if (sysRes.ok) setCatalogSystems(await sysRes.json());
      if (sanityRes.ok) {
        const s = await sanityRes.json();
        setBuildVersion(s.version || 'unknown');
      }
    } catch (err) {
      console.error('Failed to load sudo data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    const verifyExistingSession = async () => {
      try {
        const res = await fetch('/api/account/overview', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          if (active) setAuthorized(false);
          return;
        }
        const data = await res.json();
        if (!data?.user?.is_app_admin) {
          if (active) setAuthorized(false);
          return;
        }
        if (active) {
          setAuthorized(true);
          loadAllSudoData();
        }
      } catch {
        if (active) setAuthorized(false);
      }
    };
    verifyExistingSession();
    return () => {
      active = false;
    };
  }, []);

  // Poll /api/catalog/sync-status every 1.5s while unlocked
  useEffect(() => {
    if (!authorized) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/catalog/sync-status');
        if (res.ok) {
          const status: SyncStatusDto = await res.json();
          setSyncStatus((prev) => {
            if (prev?.is_running && !status.is_running) {
              loadAllSudoData();
            }
            return status;
          });
          setSyncingCatalog(Boolean(status.is_running));
        }
      } catch {
        // ignore transient network errors
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 1500);
    return () => clearInterval(timer);
  }, [authorized]);

  const handleSudoLogin = async (e: React.FormEvent) => {
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

      if (!data.is_app_admin) {
        setLoginError(
          'Zugriff verweigert: Dieser Account besitzt keine AppAdmin (Sudo) Berechtigung.'
        );
        return;
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('is_app_admin', 'true');
      if (data.user) {
        localStorage.setItem('gts_user', JSON.stringify(data.user));
      }

      setAuthorized(true);
      setLoginPassword('');
      loadAllSudoData();
    } catch {
      setLoginError('Backend nicht erreichbar.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('is_app_admin');
    setAuthorized(false);
  };

  const handleToggleSudoRole = async (u: AdminUserRow) => {
    setStatusBanner(null);
    const res = await fetch(`/api/admin/users/${u.id}/sudo-role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === u.id ? { ...item, is_app_admin: data.is_app_admin } : item
        )
      );
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Rollenwechsel.' });
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || !sudoPassword) return;
    setDeletingUser(true);
    setStatusBanner(null);

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: sudoPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
        setSudoPassword('');
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Löschung fehlgeschlagen.' });
      }
    } finally {
      setDeletingUser(false);
    }
  };

  const handleOverrideClubTier = async (clubId: string, newTier: string | null) => {
    if (!newTier) return;
    setStatusBanner(null);
    const res = await fetch(`/api/admin/clubs/${clubId}/tier`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tier: newTier }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setClubs((prev) =>
        prev.map((c) => (c.id === clubId ? { ...c, tier: newTier } : c))
      );
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Tier-Update fehlgeschlagen.' });
    }
  };

  const handleDeleteClub = async (club: AdminClubRow) => {
    if (!window.confirm(`Club "${club.name}" wirklich unwiderruflich löschen?`)) return;
    setStatusBanner(null);
    const res = await fetch(`/api/admin/clubs/${club.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setClubs((prev) => prev.filter((c) => c.id !== club.id));
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Club konnte nicht gelöscht werden.' });
    }
  };

  const handleTriggerCatalogSync = async (force: boolean, discoverAllOrg = false) => {
    setSyncingCatalog(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/admin/catalog/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ force, discover_all_org: discoverAllOrg }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Sync-Fehler.' });
      }
    } catch {
      setSyncingCatalog(false);
    }
  };

  const handleAddCustomRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystemName.trim() || !newGithubRepo.trim()) return;
    setStatusBanner(null);

    const res = await fetch('/api/admin/catalog/repos', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: newSystemName.trim(),
        github_repo: newGithubRepo.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setNewSystemName('');
      setNewGithubRepo('');
      loadAllSudoData();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Hinzufügen.' });
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.discord_account || '').toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.owner_name || '').toLowerCase().includes(q)
    );
  }, [clubs, clubSearch]);

  const tierSelectOptions = useMemo(() => {
    const keys = Object.keys(tiersMap);
    if (keys.length === 0) {
      return [
        { value: 'tier_1', label: 'Outpost (Tier 1)' },
        { value: 'tier_2', label: 'Stronghold (Tier 2)' },
        { value: 'tier_3', label: 'Fortress (Tier 3)' },
      ];
    }
    return keys.map((k) => ({
      value: k,
      label: tiersMap[k]?.display_label || tiersMap[k]?.name || k,
    }));
  }, [tiersMap]);

  if (authorized === null) {
    return (
      <Center mih="100vh">
        <Loader size="lg" color="red" />
      </Center>
    );
  }

  // --- BUILT-IN SUDO LOGIN MASK ---
  if (authorized === false) {
    return (
      <main style={{ position: 'relative', minHeight: '100vh' }}>
        <AnimatedBackground />
        <Center mih="100vh" px="md" style={{ position: 'relative', zIndex: 2 }}>
          <Container size={420} w="100%">
            <Paper p="xl" radius="md" className="gts-army-panel">
              <Stack align="center" gap={6} mb="lg">
                <IconShieldLock size={38} color="#ef4444" />
                <Badge color="red" variant="filled">
                  RESTRICTED ACCESS
                </Badge>
                <Title order={2} className="brand-logo gts-army-title" ta="center">
                  SUDO AUTHENTICATION
                </Title>
                <Text size="xs" c="dimmed" ta="center">
                  Bitte mit deinem AppAdmin-Account anmelden
                </Text>
              </Stack>

              {loginError && (
                <Alert
                  color="red"
                  mb="md"
                  icon={<IconAlertTriangle size={16} />}
                  withCloseButton
                  onClose={() => setLoginError(null)}
                >
                  {loginError}
                </Alert>
              )}

              <form onSubmit={handleSudoLogin}>
                <Stack gap="sm">
                  <TextInput
                    label="AppAdmin E-Mail"
                    placeholder="admin@gametablesync.com"
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
                  <Button type="submit" color="red" fullWidth mt="sm" loading={loginLoading}>
                    Sudo-Konsole entsperren
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Container>
        </Center>
      </main>
    );
  }

  // --- UNLOCKED SUDO CONSOLE ---
  return (
    <main style={{ position: 'relative', minHeight: '100vh', paddingBottom: 80 }}>
      <AnimatedBackground />

      <Container size="xl" pt={{ base: 90, md: 110 }} style={{ position: 'relative', zIndex: 2 }}>
        <Paper p="lg" radius="md" mb="xl" className="gts-army-panel">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm">
              <IconShieldLock size={30} color="#ef4444" />
              <div>
                <Group gap="xs">
                  <Title order={2} className="brand-logo gts-army-title">
                    SUDO ADMIN CONSOLE
                  </Title>
                  <Badge color="red" variant="filled">
                    ROOT / APP_ADMIN
                  </Badge>
                  <Badge variant="outline" className="gts-game-meta-tag">
                    BUILD: {buildVersion}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  Unlisted Platform Control Room • Globale Benutzer-, Lizenz- & Katalog-Steuerung
                </Text>
              </div>
            </Group>

            <Group gap="sm" wrap="wrap">
              <Button
                variant="light"
                color="blue"
                leftSection={<IconBook size={16} />}
                onClick={() => router.push(`/${locale}/catalog`)}
              >
                BSData Catalog Explorer
              </Button>

              <Button
                component="a"
                href={landingDevUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                color="violet"
                leftSection={<IconTerminal2 size={16} />}
                rightSection={<IconExternalLink size={14} />}
              >
                Landingpage /{locale}/dev
              </Button>

              <Button
                component="a"
                href={swaggerUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                color="gray"
                rightSection={<IconExternalLink size={14} />}
              >
                Swagger API Docs
              </Button>

              <ActionIcon
                variant="light"
                size="lg"
                onClick={loadAllSudoData}
                loading={loadingData}
                title="Daten neu laden"
              >
                <IconRefresh size={18} />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                onClick={handleLogout}
                title="Sudo-Sitzung sperren"
              >
                <IconLogout size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>

        {statusBanner && (
          <Alert
            mb="lg"
            color={statusBanner.type === 'success' ? 'teal' : 'red'}
            icon={
              statusBanner.type === 'success' ? (
                <IconCheck size={18} />
              ) : (
                <IconAlertTriangle size={18} />
              )
            }
            withCloseButton
            onClose={() => setStatusBanner(null)}
          >
            {statusBanner.msg}
          </Alert>
        )}

        <Tabs defaultValue="catalog" variant="pills" radius="md">
          <Tabs.List mb="lg">
            <Tabs.Tab value="catalog" leftSection={<IconDatabase size={16} />}>
              BSData Sync & Repositories ({catalogSystems.length})
            </Tabs.Tab>
            <Tabs.Tab value="clubs" leftSection={<IconBuildingStore size={16} />}>
              Clubs & Tier-Overrides ({clubs.length})
            </Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              Plattform-Benutzer ({users.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* TAB 1: BSDATA SYNC & REPOS */}
          <Tabs.Panel value="catalog">
            <Paper p="lg" radius="md" className="gts-army-panel">
              <Group justify="space-between" mb="lg" wrap="wrap" gap="md">
                <div>
                  <Title order={4} className="brand-logo gts-army-title">
                    BSDATA GITHUB INGESTION PIPELINE (.CAT, .CATZ & .JSON)
                  </Title>
                  <Text size="xs" c="dimmed">
                    Automatischer Cron-Sync läuft täglich um 04:00 Uhr (Europe/Berlin) sowie beim
                    Container-Start
                  </Text>
                </div>

                <Group gap="sm" wrap="wrap">
                  <Button
                    variant="light"
                    color="blue"
                    loading={syncingCatalog}
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => handleTriggerCatalogSync(false, false)}
                  >
                    Delta-Sync (SHA Check)
                  </Button>
                  <Button
                    variant="filled"
                    color="orange"
                    loading={syncingCatalog}
                    leftSection={<IconDatabase size={16} />}
                    onClick={() => handleTriggerCatalogSync(true, false)}
                  >
                    Force Re-Parse Alle
                  </Button>
                  <Button
                    variant="light"
                    color="teal"
                    loading={syncingCatalog}
                    leftSection={<IconWorldDownload size={16} />}
                    onClick={() => handleTriggerCatalogSync(false, true)}
                  >
                    Alle 170+ BSData Repos entdecken & syncen
                  </Button>
                </Group>
              </Group>

              {/* LIVE PROGRESS BAR */}
              {syncStatus && (syncStatus.is_running || syncStatus.phase === 'completed') && (
                <Paper
                  p="md"
                  mb="lg"
                  radius="md"
                  style={{
                    background: 'rgba(24, 100, 255, 0.08)',
                    border: '1px solid var(--gts-border-faint)',
                  }}
                >
                  <Group justify="space-between" mb={6}>
                    <Group gap="xs">
                      <Badge
                        color={syncStatus.is_running ? 'blue' : 'teal'}
                        variant="filled"
                        size="sm"
                      >
                        {syncStatus.is_running ? 'SYNC LÄUFT' : 'SYNC FERTIG'}
                      </Badge>
                      <Text size="sm" fw={600}>
                        {syncStatus.message}
                      </Text>
                    </Group>
                    <Text size="xs" fw={700} c="blue.4">
                      {syncStatus.percent ?? 0}%
                    </Text>
                  </Group>

                  <Progress
                    value={syncStatus.percent ?? 0}
                    size="lg"
                    radius="xl"
                    striped={syncStatus.is_running}
                    animated={syncStatus.is_running}
                    color={syncStatus.is_running ? 'blue' : 'teal'}
                  />

                  <Group justify="space-between" mt={6}>
                    <Text size="xs" c="dimmed">
                      Repositories: {syncStatus.repos_completed} / {syncStatus.repos_total}
                      {syncStatus.current_system ? ` • System: ${syncStatus.current_system}` : ''}
                    </Text>
                    {syncStatus.files_total > 0 && (
                      <Text size="xs" c="dimmed">
                        Katalog-Dateien: {syncStatus.files_completed} / {syncStatus.files_total}
                        {syncStatus.current_file ? ` (${syncStatus.current_file})` : ''}
                      </Text>
                    )}
                  </Group>

                  {syncStatus.last_error && (
                    <Text size="xs" c="red.4" mt={4}>
                      Letzte Warnung: {syncStatus.last_error}
                    </Text>
                  )}
                </Paper>
              )}

              {/* ADD CUSTOM GITHUB REPO FORM */}
              <form onSubmit={handleAddCustomRepo}>
                <Group mb="lg" align="flex-end" wrap="wrap">
                  <TextInput
                    label="Neues Spielsystem hinzufügen"
                    placeholder="z.B. Warhammer 40k (9th Edition)"
                    size="xs"
                    style={{ flex: 1, minWidth: 220 }}
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.currentTarget.value)}
                  />
                  <TextInput
                    label="GitHub Repository (Owner/Repo)"
                    placeholder="z.B. BSData/wh40k-9e"
                    size="xs"
                    style={{ flex: 1, minWidth: 220 }}
                    value={newGithubRepo}
                    onChange={(e) => setNewGithubRepo(e.currentTarget.value)}
                  />
                  <Button
                    type="submit"
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                  >
                    Repository registrieren
                  </Button>
                </Group>
              </form>

              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Spielsystem</Table.Th>
                    <Table.Th>GitHub Repository</Table.Th>
                    <Table.Th>Fraktionen in DB</Table.Th>
                    <Table.Th>Letzter Commit SHA</Table.Th>
                    <Table.Th>Zuletzt Synchronisiert</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {catalogSystems.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td fw={700}>{s.name}</Table.Td>
                      <Table.Td>
                        <Text
                          component="a"
                          href={`https://github.com/${s.github_repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          c="blue.4"
                        >
                          {s.github_repo}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline">{s.factions_count} Fraktionen</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="gray" variant="light">
                          {s.last_sync_sha ? s.last_sync_sha.slice(0, 8) : 'Noch nicht geladen'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {s.last_synced_at
                            ? new Date(s.last_synced_at).toLocaleString('de-DE')
                            : 'Ausstehend...'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {/* TAB 2: CLUBS */}
          <Tabs.Panel value="clubs">
            <Paper p="lg" radius="md" className="gts-army-panel">
              <Group justify="space-between" mb="md" wrap="wrap">
                <div>
                  <Title order={4} className="brand-logo gts-army-title">
                    ALLE REGISTRIERTEN CLUBS & STORES
                  </Title>
                  <Text size="xs" c="dimmed">
                    Lizenz-Tiers ohne Stripe direkt überschreiben oder Clubs global entfernen
                  </Text>
                </div>
                <TextInput
                  placeholder="Club oder Besitzer suchen..."
                  leftSection={<IconSearch size={15} />}
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.currentTarget.value)}
                  w={{ base: '100%', sm: 280 }}
                  size="xs"
                />
              </Group>

              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Club / Slug</Table.Th>
                    <Table.Th>Besitzer</Table.Th>
                    <Table.Th>Tische / Staff / Bans</Table.Th>
                    <Table.Th>Aktives Lizenz-Tier (Sudo Override)</Table.Th>
                    <Table.Th ta="right">Aktionen</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredClubs.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Text fw={700} size="sm">
                          {c.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          /{c.slug}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.owner_name || 'Unbekannt'}</Text>
                        <Text size="xs" c="dimmed">
                          {c.owner_id.slice(0, 8)}...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Badge size="xs" variant="outline">
                            {c.tables_count} Tische
                          </Badge>
                          <Badge size="xs" variant="outline" color="blue">
                            {c.employees_count} Staff
                          </Badge>
                          {c.bans_count > 0 && (
                            <Badge size="xs" variant="filled" color="red">
                              {c.bans_count} Bans
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Select
                          size="xs"
                          w={210}
                          value={c.tier}
                          data={tierSelectOptions}
                          onChange={(val) => handleOverrideClubTier(c.id, val)}
                        />
                      </Table.Td>
                      <Table.Td ta="right">
                        <Tooltip label="Club global löschen">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteClub(c)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredClubs.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5} ta="center">
                        <Text size="sm" c="dimmed" py="md">
                          Keine Clubs gefunden.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          {/* TAB 3: USERS */}
          <Tabs.Panel value="users">
            <Paper p="lg" radius="md" className="gts-army-panel">
              <Group justify="space-between" mb="md" wrap="wrap">
                <div>
                  <Title order={4} className="brand-logo gts-army-title">
                    GLOBALE BENUTZERVERWALTUNG
                  </Title>
                  <Text size="xs" c="dimmed">
                    AppAdmin-Rechte vergeben oder Benutzerkonten endgültig von der Plattform löschen
                  </Text>
                </div>
                <TextInput
                  placeholder="Name, E-Mail oder Discord suchen..."
                  leftSection={<IconSearch size={15} />}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.currentTarget.value)}
                  w={{ base: '100%', sm: 280 }}
                  size="xs"
                />
              </Group>

              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Benutzer</Table.Th>
                    <Table.Th>E-Mail / Discord</Table.Th>
                    <Table.Th>Eigene Clubs</Table.Th>
                    <Table.Th>Sudo (AppAdmin)</Table.Th>
                    <Table.Th ta="right">Global Löschen</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredUsers.map((u) => (
                    <Table.Tr key={u.id}>
                      <Table.Td>
                        <Text fw={700} size="sm">
                          {u.display_name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {u.id}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{u.email}</Text>
                        {u.discord_account && (
                          <Text size="xs" c="blue.4">
                            Discord: {u.discord_account}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" size="sm">
                          {u.owned_clubs_count} Club(s)
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Switch
                          size="xs"
                          color="red"
                          checked={u.is_app_admin}
                          onChange={() => handleToggleSudoRole(u)}
                          label={u.is_app_admin ? 'AppAdmin' : 'Standard'}
                        />
                      </Table.Td>
                      <Table.Td ta="right">
                        <Tooltip label="Account endgültig löschen">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => setUserToDelete(u)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Container>

      <Modal
        opened={Boolean(userToDelete)}
        onClose={() => {
          setUserToDelete(null);
          setSudoPassword('');
        }}
        title="Sudo-Bestätigung: Benutzer global löschen"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Möchtest du den Account <strong>{userToDelete?.display_name}</strong> (
            {userToDelete?.email}) wirklich unwiderruflich aus der gesamten Datenbank löschen?
          </Text>
          <PasswordInput
            label="Dein AppAdmin-Passwort zur Bestätigung"
            placeholder="Passwort eingeben..."
            value={sudoPassword}
            onChange={(e) => setSudoPassword(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="sm">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => {
                setUserToDelete(null);
                setSudoPassword('');
              }}
            >
              Abbrechen
            </Button>
            <Button
              color="red"
              loading={deletingUser}
              disabled={!sudoPassword}
              onClick={handleConfirmDeleteUser}
            >
              Endgültig löschen
            </Button>
          </Group>
        </Stack>
      </Modal>
    </main>
  );
}