'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Grid,
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  TextInput,
  SegmentedControl,
  ScrollArea,
  UnstyledButton,
  Loader,
  Center,
  Pagination,
  Box,
} from '@mantine/core';
import { IconSearch, IconShield, IconDatabase } from '@tabler/icons-react';
// Import ArmyUnitDatasheet from your shared @gts/ui package
import { ArmyUnitDatasheet } from '@gts/ui';
import {
  type CatalogSystemDto,
  type CatalogFactionDto,
  type CatalogEntryDto,
  catalogEntryToParsedUnit,
} from './catalogAdapter';

const PAGE_SIZE = 12;

export function SystemCatalogTab({
  system,
  accentColor,
}: {
  system: CatalogSystemDto;
  accentColor: string;
}) {
  const [factions, setFactions] = useState<CatalogFactionDto[]>([]);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [entries, setEntries] = useState<CatalogEntryDto[]>([]);

  const [loadingFactions, setLoadingFactions] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [factionSearch, setFactionSearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // 1. Load Factions for this Game System
  useEffect(() => {
    let active = true;
    setLoadingFactions(true);

    fetch(`/api/catalog/systems/${system.id}/factions`)
      .then((res) => res.json())
      .then((data: CatalogFactionDto[]) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setFactions(list);
        if (list.length > 0) {
          setSelectedFactionId(list[0].id);
        } else {
          setSelectedFactionId(null);
          setEntries([]);
        }
      })
      .catch((err) => console.error('Failed to load factions:', err))
      .finally(() => {
        if (active) setLoadingFactions(false);
      });

    return () => {
      active = false;
    };
  }, [system.id]);

  // 2. Load Entries whenever a Faction is selected
  useEffect(() => {
    if (!selectedFactionId) return;
    let active = true;
    setLoadingEntries(true);
    setPage(1);

    fetch(`/api/catalog/factions/${selectedFactionId}/entries`)
      .then((res) => res.json())
      .then((data: CatalogEntryDto[]) => {
        if (!active) return;
        setEntries(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to load faction entries:', err))
      .finally(() => {
        if (active) setLoadingEntries(false);
      });

    return () => {
      active = false;
    };
  }, [selectedFactionId]);

  const selectedFaction = useMemo(
    () => factions.find((f) => f.id === selectedFactionId) || null,
    [factions, selectedFactionId]
  );

  const filteredFactions = useMemo(() => {
    const q = factionSearch.trim().toLowerCase();
    if (!q) return factions;
    return factions.filter((f) => f.name.toLowerCase().includes(q));
  }, [factions, factionSearch]);

  const filteredEntries = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    return entries.filter((e) => {
      if (entryTypeFilter !== 'all' && e.entry_type !== entryTypeFilter) {
        return false;
      }
      if (!q) return true;
      const nameMatch = e.name.toLowerCase().includes(q);
      const kwMatch = (e.profile_data?.keywords || []).some((k) =>
        k.toLowerCase().includes(q)
      );
      return nameMatch || kwMatch;
    });
  }, [entries, unitSearch, entryTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, page]);

  if (loadingFactions) {
    return (
      <Center py={80}>
        <Stack align="center" gap="sm">
          <Loader color="blue" size="lg" />
          <Text size="sm" c="dimmed">
            Lade Fraktionen für {system.name}...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Grid gutter="xl">
      {/* Left Sidebar: Faction Selector */}
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Paper p="md" radius="md" className="gts-army-panel" style={{ position: 'sticky', top: 90 }}>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconShield size={18} color={accentColor} />
              <Title order={4} className="brand-logo gts-army-title">
                FRAKTIONEN
              </Title>
            </Group>
            <Badge variant="outline" className="gts-game-meta-tag">
              {factions.length}
            </Badge>
          </Group>

          <TextInput
            placeholder="Fraktion filtern..."
            leftSection={<IconSearch size={15} />}
            value={factionSearch}
            onChange={(e) => setFactionSearch(e.currentTarget.value)}
            mb="sm"
            size="xs"
          />

          <ScrollArea.Autosize mah={540} type="auto" offsetScrollbars>
            <Stack gap={4}>
              {filteredFactions.map((fac) => {
                const isSelected = fac.id === selectedFactionId;
                return (
                  <UnstyledButton
                    key={fac.id}
                    onClick={() => setSelectedFactionId(fac.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(24, 100, 255, 0.16)' : 'transparent',
                      border: isSelected
                        ? `1px solid ${accentColor}`
                        : '1px solid transparent',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Text
                        size="sm"
                        fw={isSelected ? 700 : 500}
                        lineClamp={1}
                        style={{ color: isSelected ? '#fff' : 'var(--gts-text-secondary)' }}
                      >
                        {fac.name}
                      </Text>
                      {fac.revision && (
                        <Badge size="xs" variant="subtle" color="gray">
                          v{fac.revision}
                        </Badge>
                      )}
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </ScrollArea.Autosize>

          <Box mt="md" pt="xs" style={{ borderTop: '1px solid var(--gts-border-faint)' }}>
            <Group gap={6}>
              <IconDatabase size={13} color="var(--gts-text-secondary)" />
              <Text size="xs" c="dimmed" lineClamp={1}>
                Repo: {system.github_repo}
              </Text>
            </Group>
            {system.last_sync_sha && (
              <Text size="xs" c="dimmed">
                SHA: {system.last_sync_sha.slice(0, 7)}
              </Text>
            )}
          </Box>
        </Paper>
      </Grid.Col>

      {/* Main Content: Search & Unit Datasheets */}
      <Grid.Col span={{ base: 12, md: 9 }}>
        <Stack gap="lg">
          {/* Filter Bar */}
          <Paper p="md" radius="md" className="gts-army-panel">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <div>
                <Group gap="xs">
                  <Title order={3} className="brand-logo gts-army-title">
                    {selectedFaction ? selectedFaction.name : system.name}
                  </Title>
                  <Badge variant="outline" className="gts-game-meta-tag">
                    {filteredEntries.length} EINHEITEN
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  Automatisch synchronisierte Einheitenprofile, Waffen & Punktekosten
                </Text>
              </div>

              <Group gap="sm" wrap="wrap">
                <SegmentedControl
                  size="xs"
                  value={entryTypeFilter}
                  onChange={(val) => {
                    setEntryTypeFilter(val);
                    setPage(1);
                  }}
                  data={[
                    { label: 'Alle', value: 'all' },
                    { label: 'Units', value: 'unit' },
                    { label: 'Models', value: 'model' },
                    { label: 'Upgrades', value: 'upgrade' },
                  ]}
                />

                <TextInput
                  placeholder="Einheit oder Keyword suchen..."
                  leftSection={<IconSearch size={16} />}
                  value={unitSearch}
                  onChange={(e) => {
                    setUnitSearch(e.currentTarget.value);
                    setPage(1);
                  }}
                  w={{ base: '100%', sm: 260 }}
                  size="sm"
                />
              </Group>
            </Group>
          </Paper>

          {/* Datasheets List */}
          {loadingEntries ? (
            <Center py={80}>
              <Stack align="center" gap="sm">
                <Loader color="blue" size="lg" />
                <Text size="sm" c="dimmed">
                  Lade Datenblätter...
                </Text>
              </Stack>
            </Center>
          ) : paginatedEntries.length === 0 ? (
            <Paper p="xl" radius="md" className="gts-army-panel" ta="center">
              <Text c="dimmed">Keine Einheiten für diesen Filter gefunden.</Text>
            </Paper>
          ) : (
            <Stack gap="xl">
              {paginatedEntries.map((entry) => {
                const parsedUnit = catalogEntryToParsedUnit(entry, selectedFaction?.name);
                return <ArmyUnitDatasheet key={entry.id} unit={parsedUnit} />;
              })}
            </Stack>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Center mt="md">
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                color="blue"
                radius="md"
              />
            </Center>
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}