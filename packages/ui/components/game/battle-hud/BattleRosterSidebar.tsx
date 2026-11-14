// packages/ui/components/game/battle-hud/BattleRosterSidebar.tsx
'use client';

import { Group, Stack, Text, ActionIcon, Badge, Progress, Tooltip } from '@mantine/core';
import {
  IconSwords,
  IconShield,
  IconChevronUp,
  IconChevronDown,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconCrown,
  IconMinus,
  IconPlus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import type { ParsedUnit } from '../../army-viewer/armyParser';
import {
  createInitialUnitStatus,
  type BattleCompanionArmyInput,
  type UnitLiveStatus,
} from './types';

export interface BattleRosterSidebarProps {
  playerArmy: BattleCompanionArmyInput;
  opponentArmy: BattleCompanionArmyInput;
  unitStatuses: Record<string, UnitLiveStatus>;
  inspectorSide: 'player' | 'opponent';
  selectedPlayerUnitId: string;
  selectedOpponentUnitId: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  ownListOpen: boolean;
  onToggleOwnList: () => void;
  enemyListOpen: boolean;
  onToggleEnemyList: () => void;
  onSelectUnit: (side: 'player' | 'opponent', unitId: string) => void;
  onAdjustModels: (side: 'player' | 'opponent', unit: ParsedUnit, delta: number) => void;
  onAdjustWounds: (side: 'player' | 'opponent', unit: ParsedUnit, delta: number) => void;
  onToggleShock: (side: 'player' | 'opponent', unit: ParsedUnit) => void;
}

export function BattleRosterSidebar({
  playerArmy,
  opponentArmy,
  unitStatuses,
  inspectorSide,
  selectedPlayerUnitId,
  selectedOpponentUnitId,
  sidebarCollapsed,
  onToggleSidebar,
  ownListOpen,
  onToggleOwnList,
  enemyListOpen,
  onToggleEnemyList,
  onSelectUnit,
  onAdjustModels,
  onAdjustWounds,
  onToggleShock,
}: BattleRosterSidebarProps) {
  const t = useTranslations('BattleCompanion40k');

  const renderSidebarUnitRow = (side: 'player' | 'opponent', unit: ParsedUnit) => {
    const key = `${side}:${unit.id}`;
    const st = unitStatuses[key] ?? createInitialUnitStatus(unit);
    const isSelected =
      inspectorSide === side &&
      (side === 'player'
        ? selectedPlayerUnitId === unit.id
        : selectedOpponentUnitId === unit.id);
    const badgeColor = side === 'player' ? 'brandBlue.4' : 'red.4';

    return (
      <div
        key={unit.id}
        className="gts-battle-unit-row"
        data-side={side}
        data-selected={isSelected ? 'true' : undefined}
        data-destroyed={st.destroyed ? 'true' : undefined}
        data-shocked={st.battleShocked ? 'true' : undefined}
        onClick={() => onSelectUnit(side, unit.id)}
      >
        <Group justify="space-between" wrap="nowrap" mb={4}>
          <Group gap={5} wrap="nowrap" miw={0}>
            {unit.isWarlord && <IconCrown size={12} color="#ffd43b" />}
            <Text
              size="xs"
              fw={700}
              td={st.destroyed ? 'line-through' : undefined}
              truncate
            >
              {unit.name}
            </Text>
          </Group>

          <Group gap={4} wrap="nowrap">
            {st.destroyed ? (
              <Badge size="xs" color="red" variant="filled" miw={74} ta="center">
                {t('destroyed')}
              </Badge>
            ) : st.battleShocked ? (
              <Badge size="xs" color="yellow" variant="filled" miw={74} ta="center">
                {t('shocked')}
              </Badge>
            ) : (
              <Badge
                size="xs"
                variant="outline"
                className="gts-game-meta-tag"
                miw={74}
                ta="center"
              >
                {unit.points} PTS
              </Badge>
            )}
          </Group>
        </Group>

        <Group
          justify="space-between"
          wrap="nowrap"
          gap={4}
          onClick={(e) => e.stopPropagation()}
        >
          {st.maxModels > 1 ? (
            <Group gap={2} wrap="nowrap">
              <ActionIcon
                size="xs"
                variant="default"
                onClick={() => onAdjustModels(side, unit, -1)}
              >
                <IconMinus size={10} />
              </ActionIcon>
              <Badge size="xs" variant="light" color="gray" miw={52} ta="center">
                {st.currentModels}/{st.maxModels} M
              </Badge>
              <ActionIcon
                size="xs"
                variant="default"
                onClick={() => onAdjustModels(side, unit, 1)}
              >
                <IconPlus size={10} />
              </ActionIcon>
            </Group>
          ) : (
            <Badge size="xs" variant="outline" color="gray" miw={52} ta="center">
              1 M
            </Badge>
          )}

          <Group gap={2} wrap="nowrap">
            <ActionIcon
              size="xs"
              variant="default"
              onClick={() => onAdjustWounds(side, unit, -1)}
            >
              <IconMinus size={10} />
            </ActionIcon>
            <Badge
              size="xs"
              variant="outline"
              color={
                st.destroyed
                  ? 'gray'
                  : st.currentWounds <= st.maxWounds / 2
                    ? 'orange'
                    : badgeColor
              }
              miw={58}
              ta="center"
            >
              {st.currentWounds}/{st.maxWounds} W
            </Badge>
            <ActionIcon
              size="xs"
              variant="default"
              onClick={() => onAdjustWounds(side, unit, 1)}
            >
              <IconPlus size={10} />
            </ActionIcon>
          </Group>

          <ActionIcon
            size="xs"
            disabled={st.destroyed}
            color={st.battleShocked ? 'yellow' : 'gray'}
            variant={st.battleShocked ? 'filled' : 'default'}
            onClick={() => onToggleShock(side, unit)}
            title={t('shocked')}
          >
            <IconAlertTriangle size={11} />
          </ActionIcon>
        </Group>

        <Progress
          mt={4}
          size={3}
          value={(st.currentWounds / st.maxWounds) * 100}
          color={st.destroyed ? 'gray' : side === 'player' ? 'brandBlue.5' : 'red.5'}
        />
      </div>
    );
  };

  return (
    <div
      className="gts-battle-sidebar"
      data-collapsed={sidebarCollapsed ? 'true' : undefined}
    >
      <Group justify={sidebarCollapsed ? 'center' : 'space-between'} px="xs" py={6}>
        {!sidebarCollapsed && (
          <Text size="xs" fw={700} className="brand-logo">
            {t('unitPane.roster')}
          </Text>
        )}
        <Tooltip label={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}>
          <ActionIcon size="sm" variant="subtle" onClick={onToggleSidebar}>
            {sidebarCollapsed ? (
              <IconLayoutSidebarLeftExpand size={16} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={16} />
            )}
          </ActionIcon>
        </Tooltip>
      </Group>

      {!sidebarCollapsed && (
        <div className="gts-battle-sidebar-scroll">
          <Stack gap="sm">
            <div>
              <button
                type="button"
                className="gts-battle-roster-header"
                onClick={onToggleOwnList}
              >
                <Group gap={6} wrap="nowrap">
                  <IconSwords size={14} color="var(--gts-primary)" />
                  <Text size="xs" fw={700} className="brand-logo">
                    {t('own')}: {playerArmy.metadata.faction.toUpperCase()} (
                    {playerArmy.units.length})
                  </Text>
                </Group>
                {ownListOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </button>

              {ownListOpen && (
                <Stack gap={6} mt={6}>
                  {playerArmy.units.map((unit) => renderSidebarUnitRow('player', unit))}
                </Stack>
              )}
            </div>

            <div>
              <button
                type="button"
                className="gts-battle-roster-header"
                onClick={onToggleEnemyList}
              >
                <Group gap={6} wrap="nowrap">
                  <IconShield size={14} color="var(--gts-danger)" />
                  <Text size="xs" fw={700} className="brand-logo">
                    {t('enemy')}: {opponentArmy.metadata.faction.toUpperCase()} (
                    {opponentArmy.units.length})
                  </Text>
                </Group>
                {enemyListOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </button>

              {enemyListOpen && (
                <Stack gap={6} mt={6}>
                  {opponentArmy.units.map((unit) => renderSidebarUnitRow('opponent', unit))}
                </Stack>
              )}
            </div>
          </Stack>
        </div>
      )}
    </div>
  );
}