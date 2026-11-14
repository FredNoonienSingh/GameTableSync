// packages/ui/components/game/GameMtgSetupModal.tsx
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

export type MtgFormatType =
  | 'Commander / EDH'
  | 'Standard'
  | 'Modern'
  | 'Pioneer'
  | 'Legacy'
  | 'Pauper'
  | 'Limited / Draft';

export interface GameMtgSettings {
  format: MtgFormatType;
  playerCount: 2 | 4;
  startingLife: 20 | 25 | 30 | 40;
  matchFormat: 'Bo1' | 'Bo3';
  clockMinutesPerPlayer: number;
  clockMode: 'chess' | 'round' | 'off';
  trackCommanderDamage: boolean;
  trackMonarchAndInitiative: boolean;
}

export const DEFAULT_MTG_SETTINGS: GameMtgSettings = {
  format: 'Commander / EDH',
  playerCount: 4,
  startingLife: 40,
  matchFormat: 'Bo1',
  clockMinutesPerPlayer: 50,
  clockMode: 'chess',
  trackCommanderDamage: true,
  trackMonarchAndInitiative: true,
};

const MTG_FORMATS: MtgFormatType[] = [
  'Commander / EDH',
  'Modern',
  'Standard',
  'Pioneer',
  'Legacy',
  'Pauper',
  'Limited / Draft',
];

const inputClassNames = {
  input: 'gts-input-field',
  label: 'gts-input-label',
};

export interface GameMtgSetupPanelProps {
  settings: GameMtgSettings;
  onChange: (next: GameMtgSettings) => void;
  onRotateSeats?: () => void;
  onStartOrResume?: () => void;
  ctaLabel?: string;
}

export function GameMtgSetupPanel({
  settings,
  onChange,
  onRotateSeats,
  onStartOrResume,
  ctaLabel,
}: GameMtgSetupPanelProps) {
  const t = useTranslations('BattleCompanionMtg');

  const handleFormatChange = (val: string | null) => {
    const fmt = (val as MtgFormatType) || 'Commander / EDH';
    const isCmd = fmt === 'Commander / EDH';
    onChange({
      ...settings,
      format: fmt,
      playerCount: isCmd ? 4 : 2,
      startingLife: isCmd ? 40 : 20,
      matchFormat: isCmd ? 'Bo1' : 'Bo3',
      trackCommanderDamage: isCmd,
    });
  };

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

          {onRotateSeats && (
            <Button
              size="xs"
              variant="outline"
              leftSection={<IconArrowsLeftRight size={14} />}
              className="brand-logo"
              onClick={onRotateSeats}
            >
              {t('setup.rotateSeats')}
            </Button>
          )}
        </Group>

        <Divider color="var(--gts-border-subtle)" />

        <Grid gap="md">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label={t('setup.format')}
              data={MTG_FORMATS}
              value={settings.format}
              onChange={handleFormatChange}
              classNames={inputClassNames}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.playerCount')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={String(settings.playerCount)}
              onChange={(val) => {
                const count = val === '4' ? 4 : 2;
                onChange({
                  ...settings,
                  playerCount: count,
                  startingLife: count === 4 ? 40 : settings.startingLife,
                });
              }}
              data={[
                { label: t('setup.twoPlayers'), value: '2' },
                { label: t('setup.fourPlayers'), value: '4' },
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 6, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.startingLife')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={String(settings.startingLife)}
              onChange={(val) =>
                onChange({
                  ...settings,
                  startingLife: Number(val) as GameMtgSettings['startingLife'],
                })
              }
              data={['20', '25', '30', '40']}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Text className="gts-input-label" mb={4}>
              {t('setup.matchSeries')}
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={settings.matchFormat}
              onChange={(val) =>
                onChange({ ...settings, matchFormat: val as 'Bo1' | 'Bo3' })
              }
              data={[
                { label: 'Best of 1 (Bo1)', value: 'Bo1' },
                { label: 'Best of 3 (Bo3)', value: 'Bo3' },
              ]}
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
                onChange({ ...settings, clockMode: val as GameMtgSettings['clockMode'] })
              }
              data={[
                { label: t('setup.clockChess'), value: 'chess' },
                { label: t('setup.clockRound'), value: 'round' },
                { label: t('setup.clockOff'), value: 'off' },
              ]}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              label={t('setup.minutesPerPlayer')}
              value={settings.clockMinutesPerPlayer}
              min={10}
              max={180}
              step={5}
              disabled={settings.clockMode === 'off'}
              onChange={(val) =>
                onChange({ ...settings, clockMinutesPerPlayer: Number(val) || 50 })
              }
              leftSection={<IconClock size={15} />}
              classNames={inputClassNames}
            />
          </Grid.Col>
        </Grid>

        <Group justify="space-between" wrap="wrap" pt="xs">
          <Group gap="lg" wrap="wrap">
            <Switch
              size="xs"
              checked={settings.trackCommanderDamage}
              onChange={(e) =>
                onChange({ ...settings, trackCommanderDamage: e.currentTarget.checked })
              }
              label={
                <Text size="xs" fw={700}>
                  {t('setup.trackCommanderDamage')}
                </Text>
              }
            />
            <Switch
              size="xs"
              checked={settings.trackMonarchAndInitiative}
              onChange={(e) =>
                onChange({
                  ...settings,
                  trackMonarchAndInitiative: e.currentTarget.checked,
                })
              }
              label={
                <Text size="xs" fw={700}>
                  {t('setup.trackMonarch')}
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

export function GameMtgSetupModal({
  opened,
  onClose,
  ...panelProps
}: GameMtgSetupPanelProps & { opened: boolean; onClose: () => void }) {
  const t = useTranslations('BattleCompanionMtg');

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
      <GameMtgSetupPanel {...panelProps} onStartOrResume={onClose} />
    </Modal>
  );
}