'use client';

import { Paper, Group, Title, Badge, Text, Stack, Table } from '@mantine/core';
import { IconListDetails, IconCrown, IconSparkles } from '@tabler/icons-react';
import { ArmyMetadata, ParsedUnit } from './armyParser';

export function ArmyHeaderCard({ metadata }: { metadata: ArmyMetadata }) {
  return (
    <Paper
      p="xl"
      mb="xl"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #354b60',
        borderTop: '4px solid #e0282b',
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Group gap="sm" align="center">
            <Title order={1} c="white" className="brand-logo" style={{ letterSpacing: '0.05em' }}>
              {(metadata.name || 'ARMY ROSTER').toUpperCase()}
            </Title>
            <Badge color="gray" variant="light" size="lg">
              {metadata.system}
            </Badge>
          </Group>
          <Text c="gray.3" size="lg" fw={700} mt={4}>
            {metadata.faction}
          </Text>
          {metadata.detachment && (
            <Badge color="indigo" variant="filled" size="md" mt="xs">
              Detachment / Formation: {metadata.detachment}
            </Badge>
          )}
        </div>
        <Stack align="flex-end" gap={4}>
          <Badge color="red" size="xl" variant="outline">
            {metadata.points} {metadata.points_limit ? `/ ${metadata.points_limit}` : ''} PKT
          </Badge>
          {metadata.raw_system && (
            <Text c="dimmed" size="xs">
              {metadata.raw_system}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

export function ArmyRosterTable({
  units,
  onSelectUnit,
}: {
  units: ParsedUnit[];
  onSelectUnit?: (unitId: string) => void;
}) {
  const handleRowClick = (unitId: string) => {
    if (onSelectUnit) {
      onSelectUnit(unitId);
    } else if (typeof document !== 'undefined') {
      document.getElementById(`unit-${unitId}`)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Paper p="md" mb="xl" style={{ backgroundColor: '#121418', border: '1px solid #354b60' }}>
      <Group gap="xs" mb="sm">
        <IconListDetails size={18} color="#e0282b" />
        <Title order={4} c="white" className="brand-logo" style={{ letterSpacing: '0.05em' }}>
          ARMY ROSTER ÜBERSICHT ({units.length} EINHEITEN)
        </Title>
      </Group>
      <Table
        highlightOnHover
        withRowBorders={true}
        styles={{
          th: { color: '#a6a7ab', fontSize: '12px', borderBottom: '1px solid #354b60' },
          td: { color: 'white', fontSize: '13px', borderColor: '#1a1d24' },
        }}
      >
        <Table.Thead style={{ backgroundColor: '#1a1d24' }}>
          <Table.Tr>
            <Table.Th>Einheit</Table.Th>
            <Table.Th>Rolle / Detachment</Table.Th>
            <Table.Th ta="center">Punkte</Table.Th>
            <Table.Th>Modelle & Optionen</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {units.map((unit) => (
            <Table.Tr
              key={unit.id}
              style={{ cursor: 'pointer' }}
              onClick={() => handleRowClick(unit.id)}
            >
              <Table.Td fw={700}>
                <Group gap="xs">
                  <Text size="sm" fw={700} c="white">
                    {unit.totalModels > 1 ? `(${unit.totalModels}) ` : ''}
                    {unit.name}
                  </Text>
                  {unit.isWarlord && (
                    <Badge color="yellow" size="xs" leftSection={<IconCrown size={10} />}>
                      Warlord / General
                    </Badge>
                  )}
                  {unit.badges.map((b) => (
                    <Badge key={b.name} color={b.color} size="xs" leftSection={<IconSparkles size={10} />}>
                      {b.name}
                      {b.pts > 0 ? ` (+${b.pts})` : ''}
                    </Badge>
                  ))}
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <Badge color="dark" variant="outline" size="sm">
                    {unit.role}
                  </Badge>
                  {unit.forceName && unit.forceName !== 'Army Roster' && unit.forceName !== 'Battle March' && (
                    <Badge color="indigo" variant="dot" size="xs">
                      {unit.forceName}
                    </Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td ta="center" fw={700} c="red.4">
                {unit.points}
              </Table.Td>
              <Table.Td c="gray.4" style={{ fontSize: '12px' }}>
                {unit.leadsNames.length > 0 && (
                  <Text size="xs" c="indigo.3" fw={600}>
                    • Führt: {unit.leadsNames.join(', ')}
                  </Text>
                )}
                {unit.ledByNames.length > 0 && (
                  <Text size="xs" c="teal.3" fw={600}>
                    • Angeführt von: {unit.ledByNames.join(', ')}
                  </Text>
                )}
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {unit.modelsText}
                  {unit.wargearText ? ` — ${unit.wargearText}` : ''}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}