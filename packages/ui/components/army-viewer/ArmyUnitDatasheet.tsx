'use client';

import { Paper, Group, Title, Badge, Text, Grid, Stack, Divider } from '@mantine/core';
import { IconCrown, IconSparkles, IconSwords, IconShield, IconBolt } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { ParsedUnit } from './armyParser';
import { ArmyStatTablesBySchema, FormattedRuleText } from './ArmyFormatters';

export function ArmyUnitDatasheet({ unit }: { unit: ParsedUnit }) {
  const t = useTranslations('BattleCompanion40k');
  const leadsText = unit.leadsNames.join(', ');
  const ledByText = unit.ledByNames.join(', ');

  return (
    <Paper id={`unit-${unit.id}`} p="lg" radius="md" className="gts-army-panel">
      {/* Unit Header */}
      <Group justify="space-between" mb="xs" pb="xs" className="gts-army-unit-header">
        <Group gap="xs">
          <Title order={3} className="brand-logo gts-army-title">
            {unit.totalModels > 1 ? `(${unit.totalModels}) ` : ''}
            {unit.name}
          </Title>
          <Badge variant="outline" className="gts-game-meta-tag">
            {unit.role}
          </Badge>
          {unit.forceName &&
            unit.forceName !== 'Army Roster' &&
            unit.forceName !== 'Battle March' && (
              <Badge color="brandBlue.5" variant="light">
                {unit.forceName}
              </Badge>
            )}
          {unit.isWarlord && (
            <Badge color="yellow" variant="filled" leftSection={<IconCrown size={12} />}>
              {t('datasheet.warlord')}
            </Badge>
          )}
          {unit.badges.map((b) => (
            <Badge
              key={b.name}
              color={b.color}
              variant="filled"
              leftSection={<IconSparkles size={12} />}
            >
              {b.name}
              {b.pts > 0 ? ` (+${b.pts} pts)` : ''}
            </Badge>
          ))}
          {leadsText && (
            <Badge color="brandBlue.6" variant="filled">
              {t('datasheet.leads')}: {leadsText}
            </Badge>
          )}
          {ledByText && (
            <Badge color="teal" variant="filled">
              {t('datasheet.ledBy')}: {ledByText}
            </Badge>
          )}
        </Group>

        <Badge size="lg" variant="outline" className="brand-logo gts-army-unit-pts-badge">
          {unit.points} PTS
        </Badge>
      </Group>

      {/* Models & Loadout Subtitle */}
      <Text size="xs" mb="md" className="gts-army-loadout-line">
        <span className="gts-army-loadout-strong">{t('datasheet.models')}:</span> {unit.modelsText}
        {unit.wargearText ? (
          <>
            {' '}
            | <span className="gts-army-loadout-strong">{t('datasheet.wargear')}:</span>{' '}
            {unit.wargearText}
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
              <Text size="xs" fw={700} mb="xs" className="gts-army-subcol-header">
                <IconSwords size={15} />
                <span>{t('datasheet.rangedWeapons')}</span>
              </Text>
              <ArmyStatTablesBySchema
                profiles={unit.rangedWeapons}
                defaultTitle="Weapon"
                showCount={true}
              />
            </>
          )}

          {unit.meleeWeapons.length > 0 && (
            <>
              <Text size="xs" fw={700} mb="xs" className="gts-army-subcol-header">
                <IconShield size={15} />
                <span>{t('datasheet.meleeWeapons')}</span>
              </Text>
              <ArmyStatTablesBySchema
                profiles={unit.meleeWeapons}
                defaultTitle="Weapon"
                showCount={true}
              />
            </>
          )}
        </Grid.Col>

        {/* Abilities, Wargear, Special Rules & Psychic Column */}
        <Grid.Col span={{ base: 12, md: 5 }} className="gts-army-abilities-col">
          <Text size="xs" fw={700} mb="xs" className="gts-army-subcol-header">
            <IconBolt size={15} />
            <span>{t('datasheet.abilitiesAndRules')}</span>
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
                    <Text size="sm" fw={700}>
                      {ab.name}
                    </Text>
                    {ab.typeName &&
                      ab.typeName !== 'Abilities' &&
                      ab.typeName !== 'Special Rule' && (
                        <Badge size="xs" variant="outline" className="gts-game-meta-tag">
                          {ab.typeName}
                        </Badge>
                      )}
                  </Group>
                  {nonEmptyChars.map((c, cIdx) => (
                    <div key={cIdx}>
                      {nonEmptyChars.length > 1 && c.name !== 'Description' && (
                        <Text size="xs" fw={700} mt={2} className="gts-army-faction">
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
              <div style={{ marginTop: 6 }}>
                <Text size="sm" fw={700}>
                  {t('datasheet.specialRules')}
                </Text>
                <Text size="xs" className="gts-army-loadout-line">
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
          <Divider my="sm" color="var(--gts-border-faint)" />
          <Text size="xs" className="gts-army-keywords-bar">
            <span className="gts-army-loadout-strong">{t('datasheet.keywords')}: </span>
            {unit.keywords.join(', ')}
          </Text>
        </>
      )}
    </Paper>
  );
}

export function ArmyRulesGlossary({ rules }: { rules: { name: string; description: string }[] }) {
  const t = useTranslations('BattleCompanion40k');
  if (!rules || rules.length === 0) return null;

  return (
    <Paper p="xl" mt="xl" radius="md" className="gts-army-panel">
      <Title order={3} mb="md" className="brand-logo gts-army-title">
        {t('datasheet.glossaryTitle')}
      </Title>
      <Grid gap="lg">
        {rules.map(({ name, description }) => (
          <Grid.Col span={{ base: 12, md: 6 }} key={name}>
            <Text fw={700} size="sm" mb={2}>
              {name}
            </Text>
            <FormattedRuleText text={description} />
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
}