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
  Textarea,
  SimpleGrid,
  Alert,
  ActionIcon,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
  IconCalendarEvent,
} from '@tabler/icons-react';
import {
  useClubManagement,
  getClubAuthHeaders,
} from '../../../../context/ClubManagementContext';

interface ClubEventDto {
  id: string;
  title: string;
  club_id: string;
  start_time: string;
  description: string | null;
  attendees_count: number;
  attendees: { id: string; display_name: string }[];
}

export default function ClubEventsPage() {
  const { selectedClubId, clubDetail, canManageEvents } = useClubManagement();

  const [events, setEvents] = useState<ClubEventDto[]>([]);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [description, setDescription] = useState('');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const loadEvents = useCallback(async () => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/events`, {
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      setEvents(await res.json());
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !title.trim() || !startTime) return;
    setStatusBanner(null);

    const res = await fetch(`/api/clubs/${selectedClubId}/events`, {
      method: 'POST',
      headers: getClubAuthHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        start_time: startTime,
        description: description.trim() || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      setTitle('');
      setStartTime('');
      setDescription('');
      await loadEvents();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg || 'Fehler beim Erstellen.' });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/events/${eventId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadEvents();
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
              EVENTS
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {clubDetail?.name || ''}
            </Badge>
          </Group>
          <Badge variant="outline" className="gts-status-badge" data-tone="accent">
            {events.length} GEPLANT
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

      {canManageEvents && (
        <Paper
          component="form"
          onSubmit={handleCreateEvent}
          p="lg"
          radius="md"
          className="gts-panel-card gts-form"
        >
          <Stack gap="md">
            <Group gap="xs">
              <IconCalendarEvent size={18} className="gts-section-icon" />
              <Text className="gts-section-heading">NEUES EVENT</Text>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" className="gts-align-end">
              <TextInput
                label="Titel"
                placeholder="Friday Night Tabletop"
                required
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
              />
              <TextInput
                label="Datum & Uhrzeit"
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.currentTarget.value)}
              />
            </SimpleGrid>

            <Textarea
              label="Beschreibung"
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />

            <Group justify="flex-end">
              <Button
                type="submit"
                variant="default"
                size="xs"
                className="gts-btn-primary"
                leftSection={<IconPlus size={14} />}
              >
                Event erstellen
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      <Paper p="lg" radius="md" className="gts-panel-card">
        <Text className="gts-section-heading" mb="md">
          TERMINE ({events.length})
        </Text>

        {events.length === 0 ? (
          <div className="gts-empty-state">Keine Events eingetragen.</div>
        ) : (
          <Table striped highlightOnHover className="gts-data-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Titel</Table.Th>
                <Table.Th>Startzeit</Table.Th>
                <Table.Th>Beschreibung</Table.Th>
                <Table.Th>Zusagen</Table.Th>
                {canManageEvents && <Table.Th>Löschen</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {events.map((ev) => (
                <Table.Tr key={ev.id}>
                  <Table.Td fw={700} className="gts-text-heading">{ev.title}</Table.Td>
                  <Table.Td>{new Date(ev.start_time).toLocaleString('de-DE')}</Table.Td>
                  <Table.Td className="gts-text-secondary">{ev.description || '—'}</Table.Td>
                  <Table.Td>
                    <Badge variant="outline" className="gts-status-badge" data-tone="accent">
                      {ev.attendees_count}
                    </Badge>
                  </Table.Td>
                  {canManageEvents && (
                    <Table.Td>
                      <ActionIcon
                        variant="default"
                        className="gts-icon-btn-danger"
                        onClick={() => handleDeleteEvent(ev.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
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
