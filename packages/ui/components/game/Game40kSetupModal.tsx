'use client';

import {
  Modal,
  Paper,
  Grid,
  Stack,
  Group,
  Title,
  Text,
  Select,
  NumberInput,
  SegmentedControl,
  Switch,
  Button,
  Divider,
} from '@mantine/core';
import {
  IconSettings,
  IconClock,
  IconArrowsLeftRight,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export interface Game40kSettings {
  edition: '11th Edition';
  battleSize: 'Incursion (1000 pts)' | 'Strike Force (2000 pts)' | 'Onslaught (3000 pts)';
  pointsLimit: number;
  clockMinutesPerPlayer: number;
  clockMode: 'chess' | 'round' | 'off';
  scoringSystem: 'WTC 20-0' | 'GW Standard Differential';
  primaryMission: string;
  deploymentMap: string;
  secondaryMode: 'Tactical' | 'Fixed';
  firstTurnSide: 'player' | 'opponent';
  battleReadyPaintedPlayer: boolean;
  battleReadyPaintedOpponent: boolean;
  startingCp: number;
}

export const DEFAULT_40K_SETTINGS: Game40kSettings = {
  edition: '11th Edition',
  battleSize: 'Strike Force (2000 pts)',
  pointsLimit: 2000,
  clockMinutesPerPlayer: 90,
  clockMode: 'chess',
  scoringSystem: 'WTC 20-0',
  primaryMission: 'Take and Hold',
  deploymentMap: 'Crucible of Battle',
  secondaryMode: 'Tactical',
  firstTurnSide: 'player',
  battleReadyPaintedPlayer: true,
  battleReadyPaintedOpponent: true,
  startingCp: 0,
};

const PRIMARY_MISSIONS_11TH = [
  'Take and Hold',
  'Linchpin',
  'Scorched Earth',
  'Purge the Foe',
  'Terraform',
  'Supply Drop',
  'Hidden Supplies',
  'Burden of Trust',
];

const DEPLOYMENT_MAPS_11TH = [
  'Crucible of Battle',
  'Hammer and Anvil',
  'Dawn of War',
  'Tipping Point',
  'Sweeping Engagement',
  'Search and Destroy',
];

const inputClassNames = {
  input: 'gts-input-field',
  label: 'gts-input-label',
};

export interface Game40kSetupPanelProps {
  settings: Game40kSettings;
  onChange: (next: Game40kSettings) => void;
  playerLabel: string;
  opponentLabel: string;
  onSwapSides?: () => void;
  onStartOrResume?: () => void;
  ctaLabel?: string;
}

export function Game40kSetupPanel({
  settings,
  onChange,
  playerLabel,
  opponentLabel,
  onSwapSides,
  onStartOrResume,
  ctaLabel,
}: Game40kSetupPanelProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <Paper p={{ base: 'md', md: 'xl' }} radius="md" className="gts-contact-card">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm">
            <IconSettings size={22} color="var(--gts-accent)" />
            <div>
              <Title order={4} className="brand-logo gts-army-title">
                {t('setup.title')}
              </Title>
              <Text size="xs" c="dimmed">
                {t('setup.subtitle')}
              </Text>
            </div>
          </Group>

          {onSwapSides && (
            <Button
              size="xs"
              variant="outline"
              leftSection={<IconArrowsLeftRight size={14} />}
              className="brand-logo"
              onClick={onSwapSides}
            >
              {t('setup.swapSides')}
            </Button>
          )}
        </Group>

        <Divider color="var(--gts-border-subtle)" />

        <Grid gap="md">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={t('setup.battleSize')}
              data={[
                'Incursion (1000 pts)',
                'Strike Force (2000 pts)',
                'Onslaught (3000 pts)',
              ]}
              value={settings.battleSize}
              onChange={(val) => {
                const bSize =
                  (val as Game40kSettings['battleSize']) || 'Strike Force (2000 pts)';
                const pts = bSize.includes('1000')
                  ? 1000
                  : bSize.includes('3000')
                    ? 3000
                    : 2000;
                onChange({ ...settings, battleSize: bSize, pointsLimit: pts });
              }}
              classNames={inputClassNames}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={t('setup.primaryMission')}
              data={PRIMARY_MISSIONS_11TH}
              value={settings.primaryMission}
              onChange={(val) =>
                onChange({ ...settings, primaryMission: val || 'Take and Hold' })
              }
              classNames={inputClassNames}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={t('setup.deploymentMap')}
              data={DEPLOYMENT_MAPS_11TH}
              value={settings.deploymentMap}
              onChange={(val) =>
                onChange({ ...settings, deploymentMap: val || 'Crucible of Battle' })
              }
              classNames={inputClassNames}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.clockMode')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={settings.clockMode}
              onChange={(val) =>
                onChange({ ...settings, clockMode: val as Game40kSettings['clockMode'] })
              }
              data={[
                { label: t('setup.clockChess'), value: 'chess' },
                { label: t('setup.clockRound'), value: 'round' },
                { label: t('setup.clockOff'), value: 'off' },
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 4 }}>
            <NumberInput
              label={t('setup.minutesPerPlayer')}
              value={settings.clockMinutesPerPlayer}
              min={15}
              max={240}
              step={15}
              disabled={settings.clockMode === 'off'}
              onChange={(val) =>
                onChange({ ...settings, clockMinutesPerPlayer: Number(val) || 90 })
              }
              leftSection={<IconClock size={15} />}
              classNames={inputClassNames}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 4 }}>
            <NumberInput
              label={t('setup.startingCp')}
              value={settings.startingCp}
              min={0}
              max={5}
              onChange={(val) => onChange({ ...settings, startingCp: Number(val) || 0 })}
              classNames={inputClassNames}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.scoringMatrix')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={settings.scoringSystem}
              onChange={(val) =>
                onChange({
                  ...settings,
                  scoringSystem: val as Game40kSettings['scoringSystem'],
                })
              }
              data={['WTC 20-0', 'GW Standard Differential']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.secondaryMode')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={settings.secondaryMode}
              onChange={(val) =>
                onChange({
                  ...settings,
                  secondaryMode: val as Game40kSettings['secondaryMode'],
                })
              }
              data={[
                { label: t('setup.tactical'), value: 'Tactical' },
                { label: t('setup.fixed'), value: 'Fixed' },
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.firstTurn')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={settings.firstTurnSide}
              onChange={(val) =>
                onChange({ ...settings, firstTurnSide: val as 'player' | 'opponent' })
              }
              data={[
                { label: playerLabel, value: 'player' },
                { label: opponentLabel, value: 'opponent' },
              ]}
            />
          </Grid.Col>
        </Grid>

        <Group justify="space-between" wrap="wrap" pt="xs">
          <Group gap="lg" wrap="wrap">
            <Switch
              size="xs"
              checked={settings.battleReadyPaintedPlayer}
              onChange={(e) =>
                onChange({
                  ...settings,
                  battleReadyPaintedPlayer: e.currentTarget.checked,
                })
              }
              label={
                <Text size="xs" fw={700}>
                  {playerLabel}: +10 VP {t('painted')}
                </Text>
              }
            />
            <Switch
              size="xs"
              checked={settings.battleReadyPaintedOpponent}
              onChange={(e) =>
                onChange({
                  ...settings,
                  battleReadyPaintedOpponent: e.currentTarget.checked,
                })
              }
              label={
                <Text size="xs" fw={700}>
                  {opponentLabel}: +10 VP {t('painted')}
                </Text>
              }
            />
          </Group>

          {onStartOrResume && (
            <Button
              size="sm"
              variant="default"
              leftSection={<IconPlayerPlay size={16} />}
              className="brand-logo gts-game-cta-join"
              onClick={onStartOrResume}
            >
              {ctaLabel || t('setup.applyAndReturn')}
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

export function Game40kSetupModal({
  opened,
  onClose,
  ...panelProps
}: Game40kSetupPanelProps & { opened: boolean; onClose: () => void }) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      title={
        <Text fw={700} className="brand-logo">
          {t('setup.modalTitle')}
        </Text>
      }
      classNames={{
        content: 'gts-modal-content',
        header: 'gts-modal-header',
      }}
    >
      <Game40kSetupPanel {...panelProps} onStartOrResume={onClose} />
    </Modal>
  );
}