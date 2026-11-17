'use client';

import React, { useState, useMemo } from 'react';
import {
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
  SimpleGrid,
  Alert,
} from '@mantine/core';
import {
  IconPlus,
  IconArrowUpRight,
  IconExternalLink,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  useClubManagement,
  getClubAuthHeaders,
  type ClubLicenseDto,
} from '../../../../context/ClubManagementContext';

export default function ClubLicensesPage() {
  const {
    licenses,
    tiersMap,
    refreshSession,
    setSelectedClubId,
  } = useClubManagement();

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const [extraSlotTier, setExtraSlotTier] = useState<string>('tier_2');
  const [addingSlot, setAddingSlot] = useState(false);

  const [assignLicenseId, setAssignLicenseId] = useState<string | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);

  const hasCitadelPrimary = useMemo(
    () => licenses.some((l) => l.tier === 'tier_3' && l.status === 'active'),
    [licenses]
  );

  const unassignedLicenses = useMemo(
    () => licenses.filter((l) => !l.club_id && l.status === 'active'),
    [licenses]
  );

  const handleUpgradeLicense = async (lic: ClubLicenseDto, targetTier: string) => {
    setStatusBanner(null);
    const res = await fetch(`/api/billing/licenses/${lic.id}/upgrade`, {
      method: 'PUT',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({ tier: targetTier }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await refreshSession();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Upgrade fehlgeschlagen.' });
    }
  };

  const handleAddCombinedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSlot(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/billing/licenses/add-slot', {
        method: 'POST',
        headers: getClubAuthHeaders(),
        body: JSON.stringify({ tier: extraSlotTier }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
        await refreshSession();
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Buchen.' });
      }
    } finally {
      setAddingSlot(false);
    }
  };

  const handleCreateStoreFromSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetLicId = assignLicenseId || unassignedLicenses[0]?.id;
    if (!targetLicId || !newStoreName.trim()) return;
    setCreatingStore(true);
    setStatusBanner(null);

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: getClubAuthHeaders(),
        body: JSON.stringify({
          name: newStoreName.trim(),
          address_city: newStoreCity.trim() || null,
          license_id: targetLicId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
        setNewStoreName('');
        setNewStoreCity('');
        await refreshSession();
        if (data.club?.id) {
          setSelectedClubId(data.club.id);
        }
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Anlegen.' });
      }
    } finally {
      setCreatingStore(false);
    }
  };

  const handleOpenStripePortal = async () => {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({ return_url: window.location.href }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.mock) {
        setStatusBanner({ type: 'success', msg: data.msg });
      } else if (data.portal_url) {
        window.location.href = data.portal_url;
      }
    } else {
      setStatusBanner({ type: 'error', msg: data.msg });
    }
  };

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p="lg" radius="md" className="gts-panel-header">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <Title order={2} className="brand-logo gts-army-title">
              LIZENZEN
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {licenses.length} AKTIV
            </Badge>
          </Group>

          <Button
            variant="default"
            className="gts-btn-secondary"
            size="xs"
            rightSection={<IconExternalLink size={14} />}
            onClick={handleOpenStripePortal}
          >
            Stripe Portal
          </Button>
        </Group>
      </Paper>

      {statusBanner && (
        <Alert
          className="gts-alert"
          data-tone={statusBanner.type === 'success' ? 'success' : 'danger'}
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

      {/* 1. Active Licenses Table */}
      <Paper p="lg" radius="md" className="gts-panel-card">
        <Table striped highlightOnHover className="gts-data-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Typ</Table.Th>
              <Table.Th>Tier</Table.Th>
              <Table.Th>Store / Club</Table.Th>
              <Table.Th>Preis</Table.Th>
              <Table.Th>Upgrade</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {licenses.map((lic) => {
              const currentRank = lic.tier_rank || 1;
              const availableUpgrades = (['tier_2', 'tier_3'] as const).filter((tKey) => {
                const cfg = tiersMap[tKey];
                const targetRank = cfg?.rank || (tKey === 'tier_2' ? 2 : 3);
                return targetRank > currentRank && cfg?.purchase_mode !== 'contact_only';
              });

              return (
                <Table.Tr key={lic.id}>
                  <Table.Td>
                    <Group gap={6}>
                      <Badge
                        size="xs"
                        variant="outline"
                        className="gts-status-badge"
                        data-tone={lic.license_type === 'combined' ? 'gold' : undefined}
                      >
                        {lic.license_type === 'combined' ? 'MULTI-STORE' : 'EINZEL'}
                      </Badge>
                      {lic.discount_percent > 0 && (
                        <Badge size="xs" variant="outline" className="gts-status-badge" data-tone="success">
                          -{lic.discount_percent}%
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="outline" className="gts-tier-badge">
                      {lic.tier_details?.display_label || lic.tier}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {lic.club_name ? (
                      <Badge variant="outline" className="gts-status-badge" data-tone="success">
                        {lic.club_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gts-status-badge" data-tone="warning">
                        Frei
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={700} className="gts-text-heading">
                      {lic.price_eur?.toFixed(2)} € / Mo.
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {availableUpgrades.length === 0 ? (
                      <Badge variant="outline" size="xs" className="gts-status-badge" data-tone="muted">
                        Max. Tier
                      </Badge>
                    ) : (
                      <Group gap="xs">
                        {availableUpgrades.map((upKey) => {
                          const upCfg = tiersMap[upKey];
                          return (
                            <Button
                              key={upKey}
                              size="xs"
                              variant="default"
                              className="gts-btn-primary"
                              rightSection={<IconArrowUpRight size={14} />}
                              onClick={() => handleUpgradeLicense(lic, upKey)}
                            >
                              {upCfg?.name || upKey}
                            </Button>
                          );
                        })}
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* 2. Unassigned License Slots -> Create Store */}
      {unassignedLicenses.length > 0 && (
        <Paper
          component="form"
          onSubmit={handleCreateStoreFromSlot}
          p="lg"
          radius="md"
          className="gts-panel-card gts-form"
        >
          <Text className="gts-section-heading" mb="md">
            FREIEN LIZENZ-SLOT ZUWEISEN ({unassignedLicenses.length})
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="sm" className="gts-align-end">
            <Select
              label="Lizenz"
              size="xs"
              value={assignLicenseId || unassignedLicenses[0]?.id}
              onChange={setAssignLicenseId}
              data={unassignedLicenses.map((l) => ({
                value: l.id,
                label: `${l.tier_details?.name || l.tier} (${l.price_eur?.toFixed(2)} €/Mo)`,
              }))}
            />
            <TextInput
              label="Store-Name"
              placeholder="z.B. Citadel Store München"
              size="xs"
              required
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.currentTarget.value)}
            />
            <TextInput
              label="Stadt"
              placeholder="München"
              size="xs"
              value={newStoreCity}
              onChange={(e) => setNewStoreCity(e.currentTarget.value)}
            />
            <Button
              type="submit"
              size="xs"
              variant="default"
              className="gts-btn-primary"
              loading={creatingStore}
              leftSection={<IconPlus size={14} />}
            >
              Store anlegen
            </Button>
          </SimpleGrid>
        </Paper>
      )}

      {/* 3. Multi-Store Expansion (-10%) */}
      <Paper
        p="lg"
        radius="md"
        className="gts-panel-card gts-form gts-license-plan"
        data-active={hasCitadelPrimary ? 'true' : undefined}
      >
        <Group justify="space-between" mb="sm" wrap="wrap">
          <Text className="gts-section-heading">
            ZUSÄTZLICHE STORE-LIZENZ (-10% MULTI-STORE)
          </Text>
          <Badge
            variant="outline"
            className="gts-status-badge"
            data-tone={hasCitadelPrimary ? 'gold' : 'muted'}
          >
            {hasCitadelPrimary ? 'CITADEL AKTIV' : 'ERFORDERT CITADEL'}
          </Badge>
        </Group>

        {hasCitadelPrimary && (
          <form onSubmit={handleAddCombinedSlot}>
            <Group align="flex-end" gap="md" wrap="wrap">
              <Select
                label="Tier (-10%)"
                size="xs"
                className="gts-grow-240"
                value={extraSlotTier}
                onChange={(v) => setExtraSlotTier(v || 'tier_2')}
                data={[
                  { value: 'tier_2', label: 'Stronghold (-10%)' },
                  { value: 'tier_3', label: 'Citadel (-10%)' },
                ]}
              />
              <Button
                type="submit"
                size="xs"
                variant="default"
                className="gts-btn-primary"
                loading={addingSlot}
                leftSection={<IconPlus size={14} />}
              >
                Zusatz-Lizenz buchen
              </Button>
            </Group>
          </form>
        )}
      </Paper>
    </Stack>
  );
}
