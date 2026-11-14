'use client';

import { Modal, Group, Text, ScrollArea, Stack, Paper, Table, Badge } from '@mantine/core';
import { IconListDetails, IconCrown } from '@tabler/icons-react';
import type { MtgPlayerInput } from './types';

export interface MtgDecklistModalProps {
  player: MtgPlayerInput | null;
  opened: boolean;
  onClose: () => void;
}

export function MtgDecklistModal({ player, opened, onClose }: MtgDecklistModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      title={
        <Group gap="xs">
          <IconListDetails size={18} color="var(--gts-accent)" />
          <Text fw={700} className="brand-logo">
            {player?.deckName.toUpperCase()} — {player?.playerName.toUpperCase()}
          </Text>
        </Group>
      }
      classNames={{
        content: 'gts-modal-content',
        header: 'gts-modal-header',
      }}
    >
      {player && (
        <ScrollArea.Autosize mah="75dvh" offsetScrollbars>
          <Stack gap="md">
            {player.commanderName && (
              <Paper p="sm" radius="md" className="gts-subsection-paper">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconCrown size={16} color="#ffd43b" />
                    <Text size="xs" fw={700} className="brand-logo" c="dimmed">
                      COMMANDER:
                    </Text>
                    <Text size="sm" fw={800}>
                      {player.commanderName}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    {player.colorIdentity.map((mana) => (
                      <span key={mana} className="gts-mtg-mana-dot" data-mana={mana}>
                        {mana}
                      </span>
                    ))}
                  </Group>
                </Group>
              </Paper>
            )}

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
                  <Table.Th ta="center" w={60}>
                    Qty
                  </Table.Th>
                  <Table.Th>Card Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th ta="center">Mana</Table.Th>
                  <Table.Th ta="right">Section</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {player.cards.map((card, i) => (
                  <Table.Tr key={`${card.name}-${i}`}>
                    <Table.Td ta="center" fw={700}>
                      {card.quantity}x
                    </Table.Td>
                    <Table.Td fw={700}>{card.name}</Table.Td>
                    <Table.Td>{card.typeLine}</Table.Td>
                    <Table.Td ta="center">{card.manaCost || '-'}</Table.Td>
                    <Table.Td ta="right">
                      <Badge size="xs" variant="outline">
                        {card.section}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
}
