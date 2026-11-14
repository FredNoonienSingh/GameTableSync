'use client';

import { Paper, Group, Title, Badge, Text, Stack, Table } from '@mantine/core';
import { IconListDetails, IconCrown, IconSparkles } from '@tabler/icons-react';
import { ArmyMetadata, ParsedUnit } from './armyParser';

export function ArmyHeaderCard({ metadata }: { metadata: ArmyMetadata }) {
  return (
    <Paper p="xl" mb="xl" radius="md" className="gts-army-header-card">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <div>
          <Group gap="sm" align="center" wrap="wrap">
            <Title order={1} className="brand-logo gts-army-title">
              {(metadata.name || 'ARMY ROSTER').toUpperCase()}
            </Title>
            <Badge variant="outline" size="lg" className="gts-game-meta-tag">
              {metadata.system}
            </Badge>
          </Group>
          <Text size="lg" fw={700} mt={4} className="gts-army-faction">
            {metadata.faction}
          </Text>
          {metadata.detachment && (
            <Badge color="brandBlue.5" variant="light" size="md" mt="xs">
              Detachment / Formation: {metadata.detachment}
            </Badge>
          )}
        </div>

        <Stack align="flex-end" gap={4}>
          <Badge size="xl" variant="outline" className="brand-logo gts-army-points-badge">
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
    <Paper p="md" mb="xl" radius="md" className="gts-army-panel">
      <Group gap="xs" mb="sm">
        <IconListDetails size={18} className="gts-army-section-icon" />
        <Title order={4} className="brand-logo gts-army-title">
          ARMY ROSTER ÜBERSICHT ({units.length} EINHEITEN)
        </Title>
      </Group>

      <Table.ScrollContainer minWidth={640}>
        <Table
          withRowBorders={true}
          classNames={{
            thead: 'gts-army-table-head',
            th: 'gts-army-table-th',
            td: 'gts-army-table-td',
          }}
        >
          <Table.Thead>
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
                className="gts-army-table-row-clickable"
                onClick={() => handleRowClick(unit.id)}
              >
                <Table.Td fw={700}>
                  <Group gap="xs">
                    <Text size="sm" fw={700}>
                      {unit.totalModels > 1 ? `(${unit.totalModels}) ` : ''}
                      {unit.name}
                    </Text>
                    {unit.isWarlord && (
                      <Badge color="yellow" size="xs" leftSection={<IconCrown size={10} />}>
                        Warlord / General
                      </Badge>
                    )}
                    {unit.badges.map((b) => (
                      <Badge
                        key={b.name}
                        color={b.color}
                        size="xs"
                        leftSection={<IconSparkles size={10} />}
                      >
                        {b.name}
                        {b.pts > 0 ? ` (+${b.pts})` : ''}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <Badge variant="outline" size="sm" className="gts-game-meta-tag">
                      {unit.role}
                    </Badge>
                    {unit.forceName &&
                      unit.forceName !== 'Army Roster' &&
                      unit.forceName !== 'Battle March' && (
                        <Badge color="brandBlue.5" variant="dot" size="xs">
                          {unit.forceName}
                        </Badge>
                      )}
                  </Group>
                </Table.Td>
                <Table.Td ta="center" className="gts-army-points-cell">
                  {unit.points}
                </Table.Td>
                <Table.Td className="gts-army-loadout-cell">
                  {unit.leadsNames.length > 0 && (
                    <Text size="xs" c="brandBlue.4" fw={600}>
                      • Führt: {unit.leadsNames.join(', ')}
                    </Text>
                  )}
                  {unit.ledByNames.length > 0 && (
                    <Text size="xs" c="brandCyan.4" fw={600}>
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
      </Table.ScrollContainer>
    </Paper>
  );
}