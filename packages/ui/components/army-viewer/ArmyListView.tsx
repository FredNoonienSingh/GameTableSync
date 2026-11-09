'use client';

import { useMemo } from 'react';
import { Container, Button, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { ArmyMetadata, parseArmyListData } from './armyParser';
import { ArmyHeaderCard, ArmyRosterTable } from './ArmyRosterOverview';
import { ArmyUnitDatasheet, ArmyRulesGlossary } from './ArmyUnitDatasheet';

export interface ArmyListViewProps {
  data: {
    metadata: ArmyMetadata;
    roster_data: any;
  };
  onBack?: () => void;
  backLabel?: string;
}

export function ArmyListView({
  data,
  onBack,
  backLabel = 'ZURÜCK ZUM ACCOUNT',
}: ArmyListViewProps) {
  const parsed = useMemo(() => parseArmyListData(data), [data]);

  return (
    <Container size="xl" pt="calc(80px + 2rem)" pb="xl">
      {onBack && (
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
          mb="md"
          onClick={onBack}
        >
          {backLabel}
        </Button>
      )}

      <ArmyHeaderCard metadata={parsed.metadata} />

      <ArmyRosterTable units={parsed.units} />

      <Stack gap="xl">
        {parsed.units.map((unit) => (
          <ArmyUnitDatasheet key={unit.id} unit={unit} />
        ))}
      </Stack>

      <ArmyRulesGlossary rules={parsed.armyRules} />
    </Container>
  );
}

export * from './armyParser';
export * from './ArmyFormatters';
export * from './ArmyRosterOverview';
export * from './ArmyUnitDatasheet';