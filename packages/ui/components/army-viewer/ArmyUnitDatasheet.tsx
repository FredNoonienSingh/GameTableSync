'use client';

import { Paper, Group, Title, Badge, Text, Grid, Stack, Divider } from '@mantine/core';
import { IconCrown, IconSparkles, IconSwords, IconShield, IconBolt } from '@tabler/icons-react';
import { ParsedUnit } from './armyParser';
import { ArmyStatTablesBySchema, FormattedRuleText } from './ArmyFormatters';

export function ArmyUnitDatasheet({ unit }: { unit: ParsedUnit }) {
  const leadsText = unit.leadsNames.join(', ');
  const ledByText = unit.ledByNames.join(', ');

  return (
    <Paper
      id={`unit-${unit.id}`}
      p="md"
      style={{ backgroundColor: '#121418', border: '1px solid #354b60' }}
    >
      {/* Unit Header */}
      <Group justify="space-between" mb="xs" pb="xs" style={{ borderBottom: '1px solid #1a1d24' }}>
        <Group gap="xs">
          <Title order={3} c="white">
            {unit.totalModels > 1 ? `(${unit.totalModels}) ` : ''}
            {unit.name}
          </Title>
          <Badge color="gray" variant="outline">
            {unit.role}
          </Badge>
          {unit.forceName && unit.forceName !== 'Army Roster' && unit.forceName !== 'Battle March' && (
            <Badge color="indigo" variant="light">
              {unit.forceName}
            </Badge>
          )}
          {unit.isWarlord && (
            <Badge color="yellow" variant="filled" leftSection={<IconCrown size={12} />}>
              Warlord / General
            </Badge>
          )}
          {unit.badges.map((b) => (
            <Badge key={b.name} color={b.color} variant="filled" leftSection={<IconSparkles size={12} />}>
              {b.name}
              {b.pts > 0 ? ` (+${b.pts} pts)` : ''}
            </Badge>
          ))}
          {leadsText && (
            <Badge color="indigo" variant="filled">
              Führt: {leadsText}
            </Badge>
          )}
          {ledByText && (
            <Badge color="teal" variant="filled">
              Angeführt von: {ledByText}
            </Badge>
          )}
        </Group>
        <Badge color="red" size="lg" variant="filled">
          {unit.points} PTS
        </Badge>
      </Group>

      {/* Models & Loadout Subtitle */}
      <Text size="xs" c="gray.4" mb="md">
        <strong style={{ color: 'white' }}>Modelle:</strong> {unit.modelsText}
        {unit.wargearText ? (
          <>
            {' '}
            | <strong style={{ color: 'white' }}>Ausrüstung:</strong> {unit.wargearText}
          </>
        ) : null}
      </Text>

      {/* Core Unit Stat Tables */}
      <ArmyStatTablesBySchema profiles={unit.statProfiles} defaultTitle="Model" showCount={false} />

      <Grid gap="xl" mt="xs">
        {/* Weapons Column */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          {unit.rangedWeapons.length > 0 && (
            <>
              <Text c="gray.4" size="sm" fw={700} mb="xs">
                <IconSwords size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                RANGED WEAPONS
              </Text>
              <ArmyStatTablesBySchema profiles={unit.rangedWeapons} defaultTitle="Weapon" showCount={true} />
            </>
          )}

          {unit.meleeWeapons.length > 0 && (
            <>
              <Text c="gray.4" size="sm" fw={700} mb="xs">
                <IconShield size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                MELEE WEAPONS
              </Text>
              <ArmyStatTablesBySchema profiles={unit.meleeWeapons} defaultTitle="Weapon" showCount={true} />
            </>
          )}
        </Grid.Col>

        {/* Abilities, Wargear, Special Rules & Psychic Column */}
        <Grid.Col span={{ base: 12, md: 5 }} style={{ borderLeft: '1px solid #1a1d24' }}>
          <Text c="gray.4" size="sm" fw={700} mb="xs">
            <IconBolt size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            ABILITIES, WARGEAR & RULES
          </Text>
          <Stack gap="sm">
            {unit.abilities.map((ab) => {
              const nonEmptyChars = (ab.characteristics || []).filter(
                (c) => c.$text && String(c.$text).trim().length > 0
              );
              if (nonEmptyChars.length === 0) return null;

              return (
                <div key={`${ab.typeName}-${ab.id || ab.name}`}>
                  <Group gap={6} align="center">
                    <Text c="white" size="sm" fw={700}>
                      {ab.name}
                    </Text>
                    {ab.typeName && ab.typeName !== 'Abilities' && ab.typeName !== 'Special Rule' && (
                      <Badge color="dark" size="xs" variant="outline">
                        {ab.typeName}
                      </Badge>
                    )}
                  </Group>
                  {nonEmptyChars.map((c, cIdx) => (
                    <div key={cIdx}>
                      {nonEmptyChars.length > 1 && c.name !== 'Description' && (
                        <Text size="xs" fw={700} c="gray.3" mt={2}>
                          {c.name}:
                        </Text>
                      )}
                      <FormattedRuleText text={String(c.$text)} />
                    </div>
                  ))}
                </div>
              );
            })}

            {unit.rules.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <Text c="white" size="sm" fw={700}>
                  Special Rules
                </Text>
                <Text c="gray.4" size="xs">
                  {unit.rules.map((r) => r.name).join(', ')}
                </Text>
              </div>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Footer Keywords / Traits */}
      {unit.keywords.length > 0 && (
        <>
          <Divider my="sm" color="#1a1d24" />
          <Text size="xs" c="dimmed">
            <strong style={{ color: '#a6a7ab' }}>Keywords / Traits: </strong>
            {unit.keywords.join(', ')}
          </Text>
        </>
      )}
    </Paper>
  );
}

export function ArmyRulesGlossary({ rules }: { rules: { name: string; description: string }[] }) {
  if (!rules || rules.length === 0) return null;

  return (
    <Paper p="xl" mt="xl" style={{ backgroundColor: '#121418', border: '1px solid #354b60' }}>
      <Title order={3} c="white" mb="md" className="brand-logo" style={{ letterSpacing: '0.05em' }}>
        ARMY & CORE RULES GLOSSAR
      </Title>
      <Grid gap="lg">
        {rules.map(({ name, description }) => (
          <Grid.Col span={{ base: 12, md: 6 }} key={name}>
            <Text c="white" fw={700} size="sm" mb={2}>
              {name}
            </Text>
            <FormattedRuleText text={description} />
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
}