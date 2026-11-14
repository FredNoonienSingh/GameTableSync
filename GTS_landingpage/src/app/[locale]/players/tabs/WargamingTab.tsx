'use client';

import { useTranslations } from 'next-intl';
import {
  Container,
  Stack,
  Title,
  Text,
  Paper,
  Grid,
  Group,
  Badge,
  Button,
  Divider,
  Slider,
  SegmentedControl,
  Code,
  Box,
  TextInput,
} from '@mantine/core';
import {
  IconListCheck,
  IconSwords,
  IconMap2,
  IconTrophy,
  IconCalendarEvent,
  IconBrandDiscord,
} from '@tabler/icons-react';
import {
  Section,
  SubSection,
  GameCard,
  FallingD6Graphic,
  HobbyEssentialsGraphic,
  AnimatedContainerBackground,
  type UIGame,
  type ParsedUnit,
} from '@gts/ui';

const MOCK_GAMES: UIGame[] = [
  {
    id: 1,
    status: 'Open',
    start_time: '2026-11-20T18:30:00Z',
    created_by_id: 99,
    is_virtual: false,
    is_approved: true,
    format_type: '1v1',
    system: 'WARHAMMER 40,000',
    points: 2000,
    players: [{ user_id: 10, display_name: 'TobyTechPriest', army: 'Adeptus Mechanicus' }],
  }
]

const MOCK_ARMY_UNITS: ParsedUnit[] = [
  {
    id: 'unit-1',
    name: 'Skitarii Marshal',
    totalModels: 1,
    role: 'Character',
    points: 55,
    isWarlord: true,
    forceName: 'Adeptus Mechanicus',
    badges: [{ name: 'Clandestine Infiltrator', color: 'brandBlue.6', pts: 20 }],
    modelsText: '1x Skitarii Marshal',
    wargearText: 'Control stave, Mechanicus pistol',
    leadsNames: ['Skitarii Vanguard'],
    ledByNames: [],
    statProfiles: [
      {
        id: 'p1',
        name: 'Skitarii Marshal',
        typeName: 'Model',
        characteristics: [
          { name: 'M', $text: '6"' },
          { name: 'T', $text: '3' },
          { name: 'SV', $text: '4+' },
          { name: 'W', $text: '3' },
          { name: 'LD', $text: '7+' },
          { name: 'OC', $text: '1' },
        ],
      },
    ],
    rangedWeapons: [
      {
        id: 'rw1',
        name: 'Mechanicus pistol',
        typeName: 'Ranged Weapon',
        _count: 1,
        characteristics: [
          { name: 'Range', $text: '12"' },
          { name: 'A', $text: '3' },
          { name: 'BS', $text: '3+' },
          { name: 'S', $text: '4' },
          { name: 'AP', $text: '-1' },
          { name: 'D', $text: '1' },
        ],
      },
    ],
    meleeWeapons: [
      {
        id: 'mw1',
        name: 'Control stave',
        typeName: 'Melee Weapon',
        _count: 1,
        characteristics: [
          { name: 'Range', $text: 'Melee' },
          { name: 'A', $text: '4' },
          { name: 'WS', $text: '3+' },
          { name: 'S', $text: '6' },
          { name: 'AP', $text: '-1' },
          { name: 'D', $text: '2' },
        ],
      },
    ],
    abilities: [
      {
        name: 'Control Edict',
        typeName: 'Abilities',
        characteristics: [
          {
            name: 'Description',
            $text: 'While this model is leading a unit, you can **re-roll hit rolls of 1** for attacks made by models in that unit.',
          },
        ],
      },
    ],
    rules: [{ name: 'Doctrina Imperatives', description: '' }],
    keywords: ['Infantry', 'Character', 'Skitarii', 'Skitarii Marshal'],
  },
];

/*


*/

export function WargamingTab() {
  const t = useTranslations('PlayersPage.wargaming');

  return (
    <>
      <AnimatedContainerBackground />

      <Section
        badge={t('arsenal.badge')}
        title={t('arsenal.title')}
        description={t('arsenal.description')}
        graphicSlot={(progress) => <FallingD6Graphic progress={progress} />}
      >
        <SubSection
          icon={<IconListCheck size={20} />}
          title={t('arsenal.subListViewer.title')}
          description={t('arsenal.subListViewer.description')}
        />
        <SubSection
          icon={<IconSwords size={20} />}
          title={t('arsenal.subMatchmaking.title')}
          description={t('arsenal.subMatchmaking.description')}
        />
        <SubSection
          icon={<IconMap2 size={20} />}
          title={t('arsenal.subCrusade.title')}
          description={t('arsenal.subCrusade.description')}
        />
      </Section>

      <Section
        reverse
        badge={t('competitive.badge')}
        title={t('competitive.title')}
        description={t('competitive.description')}
        graphicSlot={(progress) => <HobbyEssentialsGraphic progress={progress} />}
      >
        <SubSection
          icon={<IconTrophy size={20} />}
          title={t('competitive.subElo.title')}
          description={t('competitive.subElo.description')}
        />
        <SubSection
          icon={<IconCalendarEvent size={20} />}
          title={t('competitive.subTournaments.title')}
          description={t('competitive.subTournaments.description')}
        />
        <SubSection
          icon={<IconBrandDiscord size={20} />}
          title={t('competitive.subDiscord.title')}
          description={t('competitive.subDiscord.description')}
        />
      </Section>
    </>
  );
}