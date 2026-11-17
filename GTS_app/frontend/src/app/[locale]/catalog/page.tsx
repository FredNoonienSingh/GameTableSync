'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Stack,
  Badge,
  Title,
  Text,
  Box,
  Center,
  Loader,
  Button,
  Group,
  Paper,
  Progress,
} from '@mantine/core';
import {
  IconSwords,
  IconShield,
  IconFlame,
  IconSkull,
  IconCrosshair,
  IconRefresh,
  IconDatabase,
} from '@tabler/icons-react';
import {
  AnimatedBackground,
  TabbedShowcase,
  type TabbedShowcaseItem,
} from '@gts/ui';

import { SystemCatalogTab } from './SystemCatalogTab';
import { type CatalogSystemDto } from './catalogAdapter';

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
  updated_at: string | null;
}

function getSystemVisuals(systemName: string): { icon: React.ReactNode; color: string } {
  const lower = systemName.toLowerCase();
  if (lower.includes('11th') || lower.includes('11e')) {
    return { icon: <IconSwords size={18} />, color: '#2563eb' };
  }
  if (lower.includes('40k') || lower.includes('40,000')) {
    return { icon: <IconSwords size={18} />, color: '#1864ff' };
  }
  if (lower.includes('sigmar') || lower.includes('warcry')) {
    return { icon: <IconFlame size={18} />, color: '#d97706' };
  }
  if (lower.includes('heresy') || lower.includes('imperial') || lower.includes('titanicus')) {
    return { icon: <IconShield size={18} />, color: '#e11d48' };
  }
  if (lower.includes('kill team') || lower.includes('necromunda')) {
    return { icon: <IconCrosshair size={18} />, color: '#ea580c' };
  }
  if (lower.includes('old world') || lower.includes('middle-earth')) {
    return { icon: <IconSkull size={18} />, color: '#7c3aed' };
  }
  return { icon: <IconSwords size={18} />, color: '#1864ff' };
}

export default function AppCatalogPage() {
  const [systems, setSystems] = useState<CatalogSystemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusDto>({
    is_running: false,
    phase: 'idle',
    current_system: null,
    current_repo: null,
    current_file: null,
    repos_completed: 0,
    repos_total: 0,
    files_completed: 0,
    files_total: 0,
    percent: 0,
    message: 'Prüfe Synchronisations-Status...',
    last_error: null,
    updated_at: null,
  });

  const loadSystems = () => {
    fetch('/api/catalog/systems')
      .then((res) => res.json())
      .then((data: CatalogSystemDto[]) => {
        setSystems(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to fetch catalog systems:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSystems();
  }, []);

  // Poll sync progress every 1.5s
  useEffect(() => {
    const checkProgress = async () => {
      try {
        const res = await fetch('/api/catalog/sync-status');
        if (res.ok) {
          const status: SyncStatusDto = await res.json();
          setSyncStatus((prev) => {
            if (
              (prev.is_running && !status.is_running) ||
              prev.repos_completed !== status.repos_completed
            ) {
              loadSystems();
            }
            return status;
          });
        }
      } catch {
        // ignore transient network errors
      }
    };
    checkProgress();
    const timer = setInterval(checkProgress, 1500);
    return () => clearInterval(timer);
  }, []);

  const systemTabs: TabbedShowcaseItem[] = useMemo(() => {
    return systems.map((sys) => {
      const { icon, color } = getSystemVisuals(sys.name);
      return {
        value: sys.id,
        label: `${sys.name} (${sys.factions_count})`,
        icon,
        color,
        content: () => <SystemCatalogTab system={sys} accentColor={color} />,
      };
    });
  }, [systems]);

  const progressValue = syncStatus.is_running
    ? Math.max(4, syncStatus.percent || 0)
    : syncStatus.phase === 'completed'
      ? 100
      : systems.length > 0
        ? 100
        : 0;

  return (
    <main style={{ position: 'relative', overflowX: 'clip', minHeight: '100vh' }}>
      <AnimatedBackground />

      <Box
        component="section"
        pt={{ base: 90, md: 110 }}
        pb={{ base: 16, md: 24 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <Container size="lg">
          <Stack align="center" ta="center" gap="sm" mb="md">
            <Badge variant="outline" size="lg" className="brand-logo gts-game-meta-tag">
              BSDATA CODEX ARCHIVE
            </Badge>
            <Title order={1} className="brand-logo gts-section-intro-title">
              SYSTEM DATASHEET EXPLORER
            </Title>
            <Text size="md" maw={680} style={{ color: 'var(--gts-text-secondary)' }}>
              Täglich um 04:00 Uhr automatisch synchronisierte Einheitenprofile, Waffenwerte und
              Punktekosten aller unterstützten Tabletop-Systeme.
            </Text>
          </Stack>

          {/* ALWAYS-VISIBLE SYNC PROGRESS BAR PANEL */}
          <Paper
            p="md"
            mt="md"
            radius="md"
            className="gts-army-panel"
            style={{ maxWidth: 780, margin: '0 auto' }}
          >
            <Group justify="space-between" mb={8} wrap="wrap">
              <Group gap="xs">
                <IconDatabase
                  size={16}
                  color={syncStatus.is_running ? '#3b82f6' : '#10b981'}
                />
                <Badge
                  color={
                    syncStatus.is_running
                      ? 'blue'
                      : syncStatus.phase === 'error'
                        ? 'red'
                        : 'teal'
                  }
                  variant="filled"
                  size="sm"
                >
                  {syncStatus.is_running
                    ? 'SYNC AKTIV'
                    : syncStatus.phase === 'error'
                      ? 'SYNC WARNUNG'
                      : 'KATALOG BEREIT'}
                </Badge>
                <Text size="xs" fw={600}>
                  {syncStatus.message || 'Bereit.'}
                </Text>
              </Group>

              <Group gap="xs">
                <Text size="xs" fw={700} c={syncStatus.is_running ? 'blue.4' : 'teal.4'}>
                  {progressValue}%
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  leftSection={<IconRefresh size={13} />}
                  onClick={loadSystems}
                >
                  Refresh
                </Button>
              </Group>
            </Group>

            <Progress
              value={progressValue}
              size="lg"
              radius="xl"
              striped={syncStatus.is_running}
              animated={syncStatus.is_running}
              color={
                syncStatus.is_running
                  ? 'blue'
                  : syncStatus.phase === 'error'
                    ? 'red'
                    : 'teal'
              }
            />

            <Group justify="space-between" mt={8} wrap="wrap">
              <Text size="xs" c="dimmed">
                Systeme: {syncStatus.repos_completed || systems.length} /{' '}
                {syncStatus.repos_total || systems.length}
                {syncStatus.current_system ? ` • Aktiv: ${syncStatus.current_system}` : ''}
              </Text>
              {syncStatus.files_total > 0 && (
                <Text size="xs" c="dimmed">
                  Dateien: {syncStatus.files_completed} / {syncStatus.files_total}
                  {syncStatus.current_file ? ` (${syncStatus.current_file})` : ''}
                </Text>
              )}
            </Group>

            {syncStatus.last_error && (
              <Text size="xs" c="red.4" mt={4}>
                Hinweis: {syncStatus.last_error}
              </Text>
            )}
          </Paper>
        </Container>
      </Box>

      {loading ? (
        <Center py={100} style={{ position: 'relative', zIndex: 2 }}>
          <Stack align="center" gap="md">
            <Loader size="lg" color="blue" />
            <Text size="sm" c="dimmed">
              Lade synchronisierte Spielsysteme...
            </Text>
          </Stack>
        </Center>
      ) : systemTabs.length === 0 ? (
        <Center py={80} style={{ position: 'relative', zIndex: 2 }}>
          <Stack align="center" gap="md">
            <Loader size="md" color="blue" />
            <Text c="dimmed">
              Initiale Katalog-Synchronisation läuft... Sobald das erste System geladen ist,
              erscheinen hier automatisch die Tabs.
            </Text>
          </Stack>
        </Center>
      ) : (
        <TabbedShowcase tabs={systemTabs} fullHeight containerSize="xl" />
      )}
    </main>
  );
}