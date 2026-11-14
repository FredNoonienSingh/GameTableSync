// packages/ui/components/game/battle-hud/BattleUnitInspector.tsx
'use client';

import type { ReactNode } from 'react';
import {
  Paper,
  Group,
  SegmentedControl,
  ActionIcon,
  Select,
  Button,
  Badge,
  Text,
} from '@mantine/core';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import {
  IconChevronLeft,
  IconChevronRight,
  IconBolt,
  IconArrowsLeftRight,
  IconUsers,
  IconMinus,
  IconPlus,
  IconHeartFilled,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ArmyUnitDatasheet } from '../../army-viewer/ArmyUnitDatasheet';
import type { ParsedUnit } from '../../army-viewer/armyParser';
import type { UnitLiveStatus } from './types';

const SWIPE_CONFIDENCE_THRESHOLD = 8000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

export interface BattleUnitInspectorProps {
  inspectorSide: 'player' | 'opponent';
  onChangeInspectorSide: (side: 'player' | 'opponent') => void;
  playerUnitIndex: number;
  playerUnitCount: number;
  opponentUnitIndex: number;
  opponentUnitCount: number;
  selectedUnitId: string;
  onSelectUnitId: (id: string) => void;
  unitSelectData: { value: string; label: string }[];
  onPaginateUnit: (direction: number) => void;
  swipeDir: number;
  activeUnit?: ParsedUnit;
  activeStatus?: UnitLiveStatus | null;
  onAdjustModels: (delta: number) => void;
  onAdjustWounds: (delta: number) => void;
  onToggleShock: () => void;
  isPhone: boolean;
  isCompactHud: boolean;
  onToggleBottomTray: () => void;
  onOpenCompareModal: () => void;
  bottomTrayNode?: ReactNode;
}

export function BattleUnitInspector({
  inspectorSide,
  onChangeInspectorSide,
  playerUnitIndex,
  playerUnitCount,
  opponentUnitIndex,
  opponentUnitCount,
  selectedUnitId,
  onSelectUnitId,
  unitSelectData,
  onPaginateUnit,
  swipeDir,
  activeUnit,
  activeStatus,
  onAdjustModels,
  onAdjustWounds,
  onToggleShock,
  isPhone,
  isCompactHud,
  onToggleBottomTray,
  onOpenCompareModal,
  bottomTrayNode,
}: BattleUnitInspectorProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <div className="gts-battle-main-pane">
      {/* Top Unit Switcher Toolbar */}
      <Paper p={6} radius="md" className="gts-army-panel">
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={6} wrap="nowrap" miw={0}>
            <SegmentedControl
              size="xs"
              value={inspectorSide}
              onChange={(val) => onChangeInspectorSide(val as 'player' | 'opponent')}
              data={[
                {
                  label: `${t('own')} (${playerUnitIndex + 1}/${playerUnitCount})`,
                  value: 'player',
                },
                {
                  label: `${t('enemy')} (${opponentUnitIndex + 1}/${opponentUnitCount})`,
                  value: 'opponent',
                },
              ]}
            />

            <ActionIcon size="md" variant="default" onClick={() => onPaginateUnit(-1)}>
              <IconChevronLeft size={14} />
            </ActionIcon>

            <Select
              size="xs"
              searchable={!isPhone}
              w={isPhone ? 190 : 250}
              value={selectedUnitId}
              onChange={(val) => val && onSelectUnitId(val)}
              data={unitSelectData}
            />

            <ActionIcon size="md" variant="default" onClick={() => onPaginateUnit(1)}>
              <IconChevronRight size={14} />
            </ActionIcon>
          </Group>

          {!isPhone && (
            <Group gap="xs" wrap="nowrap">
              {!isCompactHud && (
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconBolt size={14} />}
                  onClick={onToggleBottomTray}
                >
                  {t('tabs.strats')}
                </Button>
              )}

              <Button
                size="xs"
                variant="default"
                leftSection={<IconArrowsLeftRight size={14} />}
                className="brand-logo gts-game-cta-join"
                onClick={onOpenCompareModal}
              >
                {t('vsCompare')}
              </Button>
            </Group>
          )}
        </Group>
      </Paper>

      {/* Single-Line Zero-Shift Live Unit Control Bar */}
      {activeUnit && activeStatus && (
        <div className="gts-unit-live-control-bar" data-side={inspectorSide}>
          <Group gap="xs" wrap="nowrap" miw={0}>
            <Badge
              size="sm"
              variant="filled"
              color={inspectorSide === 'player' ? 'brandBlue.6' : 'red.6'}
              className="brand-logo"
            >
              {inspectorSide === 'player' ? t('own') : t('enemy')}
            </Badge>
            <Text
              size="sm"
              fw={800}
              className="brand-logo"
              td={activeStatus.destroyed ? 'line-through' : undefined}
              c={activeStatus.destroyed ? 'red.4' : undefined}
              truncate
            >
              {activeUnit.name.toUpperCase()}
            </Text>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Group gap={4} wrap="nowrap">
              <IconUsers size={14} color="var(--gts-text-secondary)" />
              {!isPhone && (
                <Text size="11px" fw={700} className="brand-logo" c="dimmed">
                  {t('modelsLabel')}:
                </Text>
              )}
              <ActionIcon size="sm" variant="default" onClick={() => onAdjustModels(-1)}>
                <IconMinus size={12} />
              </ActionIcon>
              <Badge size="md" variant="outline" w={64} ta="center">
                {activeStatus.currentModels}/{activeStatus.maxModels}
              </Badge>
              <ActionIcon size="sm" variant="default" onClick={() => onAdjustModels(1)}>
                <IconPlus size={12} />
              </ActionIcon>
            </Group>

            <Group gap={4} wrap="nowrap">
              <IconHeartFilled size={14} color="var(--gts-danger)" />
              {!isPhone && (
                <Text size="11px" fw={700} className="brand-logo" c="dimmed">
                  {t('woundsLabel')}:
                </Text>
              )}
              <ActionIcon size="sm" variant="default" onClick={() => onAdjustWounds(-1)}>
                <IconMinus size={12} />
              </ActionIcon>
              <Badge
                size="md"
                variant="filled"
                w={78}
                ta="center"
                color={
                  activeStatus.destroyed
                    ? 'gray'
                    : activeStatus.currentWounds <= activeStatus.maxWounds / 2
                      ? 'orange'
                      : inspectorSide === 'player'
                        ? 'brandBlue.6'
                        : 'red.6'
                }
              >
                {activeStatus.currentWounds}/{activeStatus.maxWounds} W
              </Badge>
              <ActionIcon size="sm" variant="default" onClick={() => onAdjustWounds(1)}>
                <IconPlus size={12} />
              </ActionIcon>
            </Group>

            {activeStatus.destroyed ? (
              <Badge
                size="lg"
                color="red"
                variant="filled"
                w={110}
                ta="center"
                className="brand-logo"
              >
                {t('destroyed')}
              </Badge>
            ) : (
              <Button
                size="compact-xs"
                color={activeStatus.battleShocked ? 'yellow' : 'gray'}
                variant={activeStatus.battleShocked ? 'filled' : 'default'}
                leftSection={<IconAlertTriangle size={12} />}
                w={110}
                onClick={onToggleShock}
              >
                {t('shocked')}
              </Button>
            )}
          </Group>
        </div>
      )}

      {/* Swipeable & Scrollable Datasheet Deck */}
      <div className="gts-battle-datasheet-scroll">
        {activeUnit && (
          <AnimatePresence initial={false} mode="wait" custom={swipeDir}>
            <motion.div
              key={`${inspectorSide}-${activeUnit.id}`}
              className="gts-battle-swipe-deck"
              initial={{ opacity: 0, x: swipeDir >= 0 ? 48 : -48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: swipeDir >= 0 ? -48 : 48 }}
              transition={{ duration: 0.16 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              onDragEnd={(_e, { offset, velocity }: PanInfo) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -SWIPE_CONFIDENCE_THRESHOLD || offset.x < -75) {
                  onPaginateUnit(1);
                } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD || offset.x > 75) {
                  onPaginateUnit(-1);
                }
              }}
            >
              <ArmyUnitDatasheet unit={activeUnit} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {bottomTrayNode}
    </div>
  );
}