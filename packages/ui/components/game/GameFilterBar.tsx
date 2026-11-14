'use client';

import {
  Paper,
  Grid,
  Select,
  Text,
  SegmentedControl,
  NumberInput,
  TextInput,
  Group,
  Button,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export interface GameFilterValues {
  system: string | null;
  venue: 'all' | 'club' | 'virtual' | string;
  maxPoints: number | '';
  dateFrom: string;
  dateTo: string;
}

export interface GameFilterBarProps {
  values: GameFilterValues;
  systemOptions?: string[];
  onChange: (next: GameFilterValues) => void;
  onReset: () => void;
}

const DEFAULT_SYSTEMS = [
  'Warhammer 40k',
  'Horus Heresy (30k)',
  'Age of Sigmar',
  'Old World',
  'Kill Team',
  'Combat Patrol',
];

const inputClassNames = {
  input: 'gts-input-field',
  label: 'gts-input-label',
};

export function GameFilterBar({
  values,
  systemOptions = DEFAULT_SYSTEMS,
  onChange,
  onReset,
}: GameFilterBarProps) {
  const t = useTranslations();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  return (
    <Paper p="md" radius="md" className="gts-filter-bar">
      <Grid gap="md" align="flex-end">
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Select
            label={tr('GameFilter.system', 'SPIELSYSTEM')}
            placeholder={tr('GameFilter.allSystems', 'Alle Systeme')}
            data={systemOptions}
            value={values.system}
            onChange={(val) => onChange({ ...values, system: val })}
            clearable
            classNames={inputClassNames}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Text className="gts-input-label" mb={4}>
            {tr('GameFilter.venue', 'PLATTFORM / ORT')}
          </Text>
          <SegmentedControl
            fullWidth
            size="sm"
            value={values.venue}
            onChange={(val) => onChange({ ...values, venue: val })}
            data={[
              { label: tr('GameFilter.venueAll', 'Alle'), value: 'all' },
              { label: tr('GameFilter.venueClub', 'Vor Ort'), value: 'club' },
              { label: tr('GameFilter.venueVirtual', 'Online'), value: 'virtual' },
            ]}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 2 }}>
          <NumberInput
            label={tr('GameFilter.maxPoints', 'MAX. PUNKTE')}
            placeholder="2000"
            value={values.maxPoints}
            onChange={(val) => onChange({ ...values, maxPoints: val as number | '' })}
            min={0}
            step={500}
            hideControls
            classNames={inputClassNames}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 6, sm: 2 }}>
          <TextInput
            type="date"
            label={tr('GameFilter.dateFrom', 'FRÜHESTENS')}
            value={values.dateFrom}
            onChange={(e) => onChange({ ...values, dateFrom: e.currentTarget.value })}
            classNames={inputClassNames}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 6, sm: 2 }}>
          <TextInput
            type="date"
            label={tr('GameFilter.dateTo', 'SPÄTESTENS')}
            value={values.dateTo}
            onChange={(e) => onChange({ ...values, dateTo: e.currentTarget.value })}
            classNames={inputClassNames}
          />
        </Grid.Col>
      </Grid>

      <Group justify="flex-end" mt="md">
        <Button
          variant="outline"
          size="xs"
          leftSection={<IconSearch size={14} />}
          className="brand-logo"
          onClick={onReset}
        >
          {tr('GameFilter.reset', 'FILTER ZURÜCKSETZEN')}
        </Button>
      </Group>
    </Paper>
  );
}