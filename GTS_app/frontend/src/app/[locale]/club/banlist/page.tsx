'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  SimpleGrid,
  Alert,
} from '@mantine/core';
import {
  IconBan,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  useClubManagement,
  getClubAuthHeaders,
} from '../../../../context/ClubManagementContext';

interface ClubBanDto {
  id: string;
  user_id: string;
  display_name: string;
  banned_by_name: string | null;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function ClubBanlistPage() {
  const { selectedClubId, clubDetail, isKeymaster } = useClubManagement();

  const [bans, setBans] = useState<ClubBanDto[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const loadBans = useCallback(async () => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/bans`, {
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      setBans(await res.json());
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadBans();
  }, [loadBans]);

  const handleCreateBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !identifier.trim()) return;
    setStatusBanner(null);

    const res = await fetch(`/api/clubs/${selectedClubId}/bans`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({
        user_identifier: identifier.trim(),
        reason: reason.trim() || null,
        expires_at: expiresAt || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setIdentifier('');
      setReason('');
      setExpiresAt('');
      await loadBans();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Ban fehlgeschlagen.' });
    }
  };

  const handleUnbanUser = async (bannedUserId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/bans/${bannedUserId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadBans();
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
              BANLIST
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {clubDetail?.name || ''}
            </Badge>
          </Group>
          <Badge variant="outline" className="gts-status-badge" data-tone="danger">
            {bans.length} AKTIV
          </Badge>
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

      {isKeymaster && (
        <Paper
          component="form"
          onSubmit={handleCreateBan}
          p="lg"
          radius="md"
          className="gts-panel-card gts-form"
        >
          <Group gap="xs" mb="md">
            <IconBan size={18} className="gts-section-icon" />
            <Text className="gts-section-heading">HAUSVERBOT</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="sm" className="gts-align-end">
            <TextInput
              label="Spieler / E-Mail"
              placeholder="spieler@beispiel.de"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.currentTarget.value)}
            />
            <TextInput
              label="Begründung"
              placeholder="Optional"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
            />
            <TextInput
              label="Gültig bis"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.currentTarget.value)}
            />
            <Button
              type="submit"
              variant="default"
              className="gts-btn-danger"
              leftSection={<IconBan size={14} />}
            >
              Hausverbot erteilen
            </Button>
          </SimpleGrid>
        </Paper>
      )}

      <Paper p="lg" radius="md" className="gts-panel-card">
        {bans.length === 0 ? (
          <div className="gts-empty-state">Keine aktiven Hausverbote.</div>
        ) : (
          <Table striped highlightOnHover className="gts-data-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Spieler</Table.Th>
                <Table.Th>Grund</Table.Th>
                <Table.Th>Von</Table.Th>
                <Table.Th>Bis</Table.Th>
                {isKeymaster && <Table.Th>Aktion</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {bans.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td fw={700} className="gts-text-heading">{b.display_name}</Table.Td>
                  <Table.Td className="gts-text-secondary">{b.reason || '—'}</Table.Td>
                  <Table.Td>{b.banned_by_name || 'System'}</Table.Td>
                  <Table.Td>
                    {b.expires_at
                      ? new Date(b.expires_at).toLocaleDateString('de-DE')
                      : 'Permanent'}
                  </Table.Td>
                  {isKeymaster && (
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="default"
                        className="gts-btn-success"
                        onClick={() => handleUnbanUser(b.user_id)}
                      >
                        Aufheben
                      </Button>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
