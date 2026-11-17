'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Avatar,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconExternalLink,
  IconLock,
  IconMapPin,
  IconSearch,
  IconUserCheck,
  IconUserPlus,
} from '@tabler/icons-react';
import { getClubAuthHeaders } from '@/context/ClubManagementContext';

export default function AccountClubsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'de';

  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clubs', {
        headers: getClubAuthHeaders(),
      });
      if (res.ok) {
        setClubs(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const handleToggleMembership = async (club: any) => {
    setBusyId(club.id);
    try {
      const isLeave = Boolean(club.membership_status);
      const res = await fetch(`/api/clubs/${club.slug}/join`, {
        method: isLeave ? 'DELETE' : 'POST',
        headers: getClubAuthHeaders(),
      });
      if (res.ok) {
        await loadClubs();
      }
    } finally {
      setBusyId(null);
    }
  };

  const myClubs = clubs.filter(
    (c) => c.membership_status === 'Approved' || c.membership_status === 'Pending'
  );
  const filteredDirectory = clubs.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.address?.city || '').toLowerCase().includes(q) ||
      (c.slug || '').toLowerCase().includes(q)
    );
  });

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p="xl" radius="md" withBorder className="gts-panel-header gts-form">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={4}>
            <Badge variant="outline" w="fit-content" className="gts-status-badge" data-tone="accent">
              STORES & VEREINE
            </Badge>
            <Title order={2} className="brand-logo gts-army-title">
              MEINE CLUBS & STORES
            </Title>
          </Stack>
          <TextInput
            placeholder="Store oder Club suchen..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={{ base: '100%', sm: 280 }}
          />
        </Group>
      </Paper>

      {myClubs.length > 0 && (
        <Paper p="lg" radius="md" withBorder className="gts-panel-card">
          <Text mb="md" className="gts-section-heading">
            VERBUNDENE STORES & VEREINSMITGLIEDSCHAFTEN ({myClubs.length})
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {myClubs.map((club) => {
              const isOutpost = club.tier === 'tier_1';
              return (
                <Paper key={club.id} p="md" radius="md" className="gts-subcard-accent">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar src={club.logo_url || null} radius="md" size={44} className="gts-logo-fallback">
                        <IconBuildingStore size={20} />
                      </Avatar>
                      <Stack gap={2}>
                        <Group gap={6}>
                          <Text fw={700} size="sm" className="gts-text-heading">
                            {club.name}
                          </Text>
                          <Badge
                            size="xs"
                            variant="outline"
                            className="gts-status-badge"
                            data-tone={club.membership_status === 'Approved' ? 'success' : 'warning'}
                          >
                            {club.membership_status === 'Approved'
                              ? isOutpost
                                ? 'Mitglied'
                                : 'Verbunden'
                              : 'Anfrage offen'}
                          </Badge>
                        </Group>
                        {club.address?.city && (
                          <Group gap={4}>
                            <IconMapPin size={12} className="gts-text-muted gts-shrink-0" />
                            <Text size="xs" className="gts-text-muted">
                              {club.address.city}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    </Group>

                    <Button
                      component={Link}
                      href={`/${locale}/s/${club.slug}`}
                      size="xs"
                      variant="default"
                      className="gts-btn-secondary"
                      rightSection={<IconExternalLink size={14} />}
                    >
                      Zur Seite
                    </Button>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Paper>
      )}

      <Paper p="lg" radius="md" withBorder className="gts-panel-card">
        <Text mb="md" className="gts-section-heading">
          ALLE STORES & CLUBS ({filteredDirectory.length})
        </Text>

        {loading ? (
          <Loader size="sm" />
        ) : filteredDirectory.length === 0 ? (
          <Text size="xs" className="gts-text-muted">
            Keine Stores oder Clubs gefunden.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {filteredDirectory.map((club) => {
              const isOutpost = club.tier === 'tier_1';
              return (
                <Paper key={club.id} p="md" radius="md" className="gts-subcard">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar src={club.logo_url || null} radius="md" size={44} className="gts-logo-fallback">
                          <IconBuildingStore size={20} />
                        </Avatar>
                        <Stack gap={2}>
                          <Group gap={6}>
                            <Text fw={700} size="sm" className="gts-text-heading">
                              {club.name}
                            </Text>
                            <Badge size="xs" variant="outline" className="gts-status-badge" data-tone={isOutpost ? 'accent' : undefined}>
                              {isOutpost ? 'Club' : 'Store'}
                            </Badge>
                            {club.is_private && (
                              <Badge
                                size="xs"
                                variant="outline"
                                className="gts-status-badge"
                                data-tone="muted"
                                leftSection={<IconLock size={10} />}
                              >
                                Privat
                              </Badge>
                            )}
                          </Group>
                          {club.address?.city ? (
                            <Group gap={4}>
                              <IconMapPin size={12} className="gts-text-muted gts-shrink-0" />
                              <Text size="xs" className="gts-text-muted">
                                {club.address.city}
                              </Text>
                            </Group>
                          ) : (
                            <Text size="xs" className="gts-text-muted">
                              {club.description
                                ? club.description.slice(0, 70)
                                : isOutpost
                                  ? 'Vereinsseite (Mitgliederbereich)'
                                  : 'Offizielle Store-Seite'}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Group>

                    <Group justify="space-between" align="center">
                      <Button
                        component={Link}
                        href={`/${locale}/s/${club.slug}`}
                        size="xs"
                        variant="default"
                        className="gts-btn-ghost"
                        rightSection={<IconExternalLink size={14} />}
                      >
                        Store-Seite öffnen
                      </Button>

                      {!club.is_owner_or_staff && (
                        <Button
                          size="xs"
                          variant="default"
                          className={
                            club.membership_status === 'Approved'
                              ? 'gts-btn-success'
                              : club.membership_status === 'Pending'
                                ? 'gts-btn-secondary'
                                : 'gts-btn-primary'
                          }
                          loading={busyId === club.id}
                          leftSection={
                            club.membership_status === 'Approved' ? (
                              <IconUserCheck size={14} />
                            ) : (
                              <IconUserPlus size={14} />
                            )
                          }
                          onClick={() => handleToggleMembership(club)}
                        >
                          {club.membership_status === 'Approved'
                            ? 'Verbunden (Trennen)'
                            : club.membership_status === 'Pending'
                              ? 'Anfrage zurückziehen'
                              : isOutpost || club.is_private
                                ? 'Beitritt anfragen'
                                : 'Mit Store verbinden'}
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}
      </Paper>
    </Stack>
  );
}
