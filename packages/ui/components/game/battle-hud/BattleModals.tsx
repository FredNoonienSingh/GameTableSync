// packages/ui/components/game/battle-hud/BattleModals.tsx
'use client';

import { Modal, Grid, Stack, Select, ScrollArea, Group, Text } from '@mantine/core';
import { IconArrowsLeftRight, IconListDetails } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ArmyHeaderCard, ArmyRosterTable } from '../../army-viewer/ArmyRosterOverview';
import { ArmyUnitDatasheet, ArmyRulesGlossary } from '../../army-viewer/ArmyUnitDatasheet';
import type { ParsedUnit } from '../../army-viewer/armyParser';
import type { BattleCompanionArmyInput } from './types';

export interface BattleCompareModalProps {
  opened: boolean;
  onClose: () => void;
  playerFaction: string;
  opponentFaction: string;
  selectedPlayerUnitId: string;
  onSelectPlayerUnitId: (id: string) => void;
  playerUnitSelectData: { value: string; label: string }[];
  selectedPlayerUnit?: ParsedUnit;
  selectedOpponentUnitId: string;
  onSelectOpponentUnitId: (id: string) => void;
  opponentUnitSelectData: { value: string; label: string }[];
  selectedOpponentUnit?: ParsedUnit;
}

export function BattleCompareModal({
  opened,
  onClose,
  playerFaction,
  opponentFaction,
  selectedPlayerUnitId,
  onSelectPlayerUnitId,
  playerUnitSelectData,
  selectedPlayerUnit,
  selectedOpponentUnitId,
  onSelectOpponentUnitId,
  opponentUnitSelectData,
  selectedOpponentUnit,
}: BattleCompareModalProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="96%"
      centered
      title={
        <Group gap="xs">
          <IconArrowsLeftRight size={18} color="var(--gts-accent)" />
          <Text fw={700} className="brand-logo">
            {t('vsModalTitle')}
          </Text>
        </Group>
      }
      classNames={{
        content: 'gts-modal-content',
        header: 'gts-modal-header',
      }}
    >
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="sm">
            <Select
              label={`${t('selectOwnUnit')} (${playerFaction})`}
              searchable
              value={selectedPlayerUnitId}
              onChange={(val) => val && onSelectPlayerUnitId(val)}
              data={playerUnitSelectData}
              classNames={{
                input: 'gts-input-field',
                label: 'gts-input-label',
              }}
            />
            <ScrollArea.Autosize mah="72dvh" offsetScrollbars>
              {selectedPlayerUnit && <ArmyUnitDatasheet unit={selectedPlayerUnit} />}
            </ScrollArea.Autosize>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="sm">
            <Select
              label={`${t('selectEnemyUnit')} (${opponentFaction})`}
              searchable
              value={selectedOpponentUnitId}
              onChange={(val) => val && onSelectOpponentUnitId(val)}
              data={opponentUnitSelectData}
              classNames={{
                input: 'gts-input-field',
                label: 'gts-input-label',
              }}
            />
            <ScrollArea.Autosize mah="72dvh" offsetScrollbars>
              {selectedOpponentUnit && <ArmyUnitDatasheet unit={selectedOpponentUnit} />}
            </ScrollArea.Autosize>
          </Stack>
        </Grid.Col>
      </Grid>
    </Modal>
  );
}

export interface BattleArmyViewerModalProps {
  army: BattleCompanionArmyInput | null;
  opened: boolean;
  onClose: () => void;
  onSelectUnit: (unitId: string) => void;
}

export function BattleArmyViewerModal({
  army,
  opened,
  onClose,
  onSelectUnit,
}: BattleArmyViewerModalProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95%"
      centered
      title={
        <Group gap="xs">
          <IconListDetails size={18} color="var(--gts-accent)" />
          <Text fw={700} className="brand-logo">
            {t('armyViewer')} — {army?.metadata.name.toUpperCase()}
          </Text>
        </Group>
      }
      classNames={{
        content: 'gts-modal-content',
        header: 'gts-modal-header',
      }}
    >
      {army && (
        <ScrollArea.Autosize mah="80dvh" offsetScrollbars>
          <Stack gap="lg">
            <ArmyHeaderCard metadata={army.metadata} />
            <ArmyRosterTable units={army.units} onSelectUnit={onSelectUnit} />
            {army.armyRules && army.armyRules.length > 0 && (
              <ArmyRulesGlossary rules={army.armyRules} />
            )}
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
}