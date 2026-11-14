'use client';

import { useState, useEffect, type CSSProperties } from 'react';
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
import { useMotionValue } from 'framer-motion';
import {
  IconSwords,
  IconPalette,
  IconPlayerPlay,
  IconPlayerPause,
} from '@tabler/icons-react';

// Single top-level import from the UI package
import {
  AnimatedBackground,
  ThemeToggle,
  LanguageSwitcher,
  SubSection,
  GameCard,
  GameFilterBar,
  LaunchCountdown,
  CookieBanner,
  LoginModal,
  GalleryShowcase,
  TournamentCard,
  TournamentStandingsTable,
  LeaderboardTable,
  CommandForgeGraphic,
  CommandHubGraphic,
  FallingD6Graphic,
  RotatingD20Graphic,
  PortalDiceSummonGraphic,
  FanningCardsGraphic,
  CardCycloneGraphic,
  CardDrawGraphic,
  HexTilePathGraphic,
  HobbyEssentialsGraphic,
  OutpostGraphic,
  StrongholdGraphic,
  CitadelGraphic,
  FortressOfTerraGraphic,
  ArmyHeaderCard,
  ArmyRosterTable,
  ArmyUnitDatasheet,
  ArmyRulesGlossary,
  BattleCompanion40k,
  type UIGame,
  type GameFilterValues,
  type UITournament,
  type UITournamentStanding,
  type UILeaderboardSystemBoard,
  type ArmyMetadata,
  type ParsedUnit,
} from '@gts/ui';

export const MOCK_ARMY_METADATA: ArmyMetadata = {
  name: 'Omnissiahs Vengeance',
  system: 'WARHAMMER 40,000',
  faction: 'Adeptus Mechanicus',
  detachment: 'Skitarii Hunter Cohort',
  points: 1995,
  points_limit: 2000,
};

export const MOCK_ARMY_UNITS: ParsedUnit[] = [
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

export const MOCK_ARMY_RULES = [
  {
    name: 'Doctrina Imperatives',
    description:
      'At the start of the battle round, you can select one of the following Doctrina Imperatives to be active for your army until the end of the battle round:\n- **Protector Imperative**: Ranged weapons have the [HEAVY] ability.\n- **Conqueror Imperative**: Ranged weapons have the [ASSAULT] ability.',
  },
];

export const MOCK_OPPONENT_METADATA: ArmyMetadata = {
  name: 'Siege of Hydra Cordatus',
  system: 'WARHAMMER 40,000',
  faction: 'Chaos Space Marines (Iron Warriors)',
  detachment: 'Fellhammer Siege-Host',
  points: 2000,
  points_limit: 2000,
};

export const MOCK_OPPONENT_UNITS: ParsedUnit[] = [
  {
    id: 'opp-unit-1',
    name: 'Lord Discordant on Helstalker',
    totalModels: 1,
    role: 'Character',
    points: 190,
    isWarlord: true,
    forceName: 'Iron Warriors',
    badges: [{ name: 'Iron Artifice', color: 'orange', pts: 10 }],
    modelsText: '1x Lord Discordant on Helstalker',
    wargearText: 'Baleflamer, Magma cutter, Impaler chainglaive, Bladed limbs & tail',
    leadsNames: [],
    ledByNames: [],
    statProfiles: [
      {
        id: 'op1',
        name: 'Lord Discordant',
        typeName: 'Model',
        characteristics: [
          { name: 'M', $text: '14"' },
          { name: 'T', $text: '9' },
          { name: 'SV', $text: '2+' },
          { name: 'W', $text: '10' },
          { name: 'LD', $text: '6+' },
          { name: 'OC', $text: '4' },
        ],
      },
    ],
    rangedWeapons: [
      {
        id: 'orw1',
        name: 'Baleflamer',
        typeName: 'Ranged Weapon',
        _count: 1,
        characteristics: [
          { name: 'Range', $text: '12"' },
          { name: 'A', $text: 'D6+3' },
          { name: 'BS', $text: 'N/A' },
          { name: 'S', $text: '6' },
          { name: 'AP', $text: '-1' },
          { name: 'D', $text: '2' },
        ],
      },
    ],
    meleeWeapons: [
      {
        id: 'omw1',
        name: 'Impaler chainglaive',
        typeName: 'Melee Weapon',
        _count: 1,
        characteristics: [
          { name: 'Range', $text: 'Melee' },
          { name: 'A', $text: '5' },
          { name: 'WS', $text: '2+' },
          { name: 'S', $text: '8' },
          { name: 'AP', $text: '-2' },
          { name: 'D', $text: '3' },
        ],
      },
    ],
    abilities: [
      {
        name: 'Corrupt Machine Spirits',
        typeName: 'Abilities',
        characteristics: [
          {
            name: 'Description',
            $text: 'At the start of your Shooting phase, select one visible enemy **Vehicle** within 12" and roll one D6: on a 2-3, it suffers D3 mortal wounds; on a 4-5, it cannot shoot next turn; on a 6, both apply.',
          },
        ],
      },
    ],
    rules: [{ name: 'Dark Pacts', description: '' }],
    keywords: ['Mounted', 'Character', 'Daemon', 'Vehicle', 'Lord Discordant'],
  },
];

const TENANT_PRESETS: Record<string, { label: string; primary: string; accent: string }> = {
  default: { label: 'GTS Default (Electric Blue)', primary: '#1864ff', accent: '#29d4ff' },
  terra: { label: 'Imperial Gold (Terra)', primary: '#d97706', accent: '#fde047' },
  citadel: { label: 'Warp Violet (Citadel)', primary: '#7c3aed', accent: '#c084fc' },
  khorne: { label: 'Crimson Crusade', primary: '#e0282b', accent: '#ff8787' },
  necron: { label: 'Tomb World Gauss', primary: '#10b981', accent: '#6ee7b7' },
};

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
    players: [{ user_id: 10, display_name: 'TechPriest_Frederic', army: 'Adeptus Mechanicus' }],
  },
  {
    id: 2,
    status: 'Matched',
    start_time: '2026-11-21T14:00:00Z',
    created_by_id: 10,
    is_virtual: true,
    is_approved: true,
    format_type: '1v1',
    system: 'HORUS HERESY',
    points: 3000,
    players: [
      { user_id: 10, display_name: 'TechPriest_Frederic', army: 'Iron Warriors' },
      { user_id: 22, display_name: 'Praetor_Basti', army: 'Imperial Fists' },
    ],
  },
  {
    id: 3,
    status: 'Open',
    start_time: '2026-11-22T19:00:00Z',
    created_by_id: 45,
    is_virtual: false,
    is_approved: false,
    format_type: '2v2',
    system: 'AGE OF SIGMAR',
    points: 2000,
    players: [
      { user_id: 45, display_name: 'SigmarHelden', army: 'Stormcast Eternals', team: 'Team 1' },
      { user_id: 51, display_name: 'SkavenLord', army: 'Skaven', team: 'Team 2' },
    ],
  },
];

const MOCK_TOURNAMENT: UITournament = {
  id: 101,
  name: 'STUTTGART IRON CRUSADE GT 2026',
  system: 'Warhammer 40k',
  format_type: '2000 PTS WTC',
  status: 'Registration',
  start_date: '2026-12-05T09:00:00Z',
  max_players: 4,
  participants_count: 3,
  round_duration_days: 14,
  participants: [
    { user_id: 10, display_name: 'TechPriest_Frederic', army_list_id: 1, army_list_name: 'Omnissiahs Vengeance' },
    { user_id: 22, display_name: 'Praetor_Basti', army_list_id: 2, army_list_name: 'VII Legion Dorn' },
    { user_id: 31, display_name: 'KriegMarshal', army_list_id: null, army_list_name: null },
  ],
  matches: [
    {
      id: 501,
      round_number: 1,
      player1_id: 10,
      player1_name: 'TechPriest_Frederic',
      player2_id: 22,
      player2_name: 'Praetor_Basti',
      score_player1: 18,
      score_player2: 12,
      winner_id: 10,
      hand_in_by: '2026-12-12T20:00:00Z',
      status: 'Completed',
    },
    {
      id: 502,
      round_number: 1,
      player1_id: 31,
      player1_name: 'KriegMarshal',
      player2_id: null,
      player2_name: null,
      score_player1: null,
      score_player2: null,
      winner_id: null,
      hand_in_by: '2026-12-12T20:00:00Z',
      status: 'Open',
    },
  ],
};

const MOCK_STANDINGS: UITournamentStanding[] = [
  { userId: 10, name: 'TechPriest_Frederic', wins: 3, draws: 0, losses: 0, totalScore: 56 },
  { userId: 22, name: 'Praetor_Basti', wins: 2, draws: 0, losses: 1, totalScore: 44 },
  { userId: 31, name: 'KriegMarshal', wins: 1, draws: 1, losses: 1, totalScore: 31 },
  { userId: 99, name: 'Erebus_WordBearer', wins: 0, draws: 0, losses: 3, totalScore: 8, isDisqualified: true },
];

const MOCK_LEADERBOARD: Record<string, UILeaderboardSystemBoard> = {
  'Warhammer 40k': {
    ranked: [
      {
        user_id: 10,
        rank: 1,
        display_name: 'TechPriest_Frederic',
        matches_played: 14,
        wins: 12,
        draws: 1,
        losses: 1,
        podiums: { first: 2, second: 1, third: 0 },
      },
      {
        user_id: 22,
        rank: 2,
        display_name: 'Praetor_Basti',
        matches_played: 12,
        wins: 9,
        draws: 1,
        losses: 2,
        podiums: { first: 1, second: 1, third: 1 },
      },
    ],
    unranked: [
      { user_id: 77, display_name: 'Neophyte_Lukas', podiums: { first: 0, second: 0, third: 0 } },
      { user_id: 78, display_name: 'HiveTyrant_Max', podiums: { first: 0, second: 0, third: 1 } },
    ],
  },
  'Horus Heresy (30k)': {
    ranked: [
      {
        user_id: 10,
        rank: 1,
        display_name: 'TechPriest_Frederic',
        matches_played: 8,
        wins: 7,
        draws: 0,
        losses: 1,
        podiums: { first: 1, second: 0, third: 0 },
      },
    ],
    unranked: [],
  },
};

const MOCK_GALLERY_IMAGES = [
  { src: 'https://placehold.co/900x500/14161b/29d4ff?text=TABLE+1+:+PERMAFROST+SECTOR', alt: 'Table 1' },
  { src: 'https://placehold.co/900x500/101216/1864ff?text=TABLE+2+:+FORGE+WORLD+ALPHA', alt: 'Table 2' },
  { src: 'https://placehold.co/900x500/1c1e24/c084fc?text=TABLE+3+:+CITADEL+ARENA', alt: 'Table 3' },
];

function ClassTag({ name, desc }: { name: string; desc?: string }) {
  return (
    <Group justify="space-between" mb="xs" wrap="wrap" gap="xs">
      <Code
        style={{
          backgroundColor: 'rgba(24, 100, 255, 0.14)',
          color: 'var(--gts-accent)',
          border: '1px solid var(--gts-border-subtle)',
          fontWeight: 700,
          fontSize: '0.78rem',
          padding: '3px 8px',
        }}
      >
        {name}
      </Code>
      {desc && (
        <Text size="xs" style={{ color: 'var(--gts-text-muted)' }}>
          {desc}
        </Text>
      )}
    </Group>
  );
}

export default function DevKitchenSinkPage() {
  const [sliderVal, setSliderVal] = useState<number>(50);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [tenantKey, setTenantKey] = useState<string>('default');
  const [cookieOpen, setCookieOpen] = useState<boolean>(false);
  const [loginOpen, setLoginOpen] = useState<boolean>(false);

  const [filterVals, setFilterVals] = useState<GameFilterValues>({
    system: null,
    venue: 'all',
    maxPoints: '',
    dateFrom: '',
    dateTo: '',
  });

  const progress = useMotionValue(0.5);

  useEffect(() => {
    if (!autoPlay) {
      progress.set(sliderVal / 100);
    }
  }, [sliderVal, autoPlay, progress]);

  useEffect(() => {
    if (!autoPlay) return;
    let frameId: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 3500;
      const wave = (Math.sin(elapsed * Math.PI * 2) + 1) / 2;
      progress.set(wave);
      setSliderVal(Math.round(wave * 100));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [autoPlay, progress]);

  const activePreset = TENANT_PRESETS[tenantKey] ?? TENANT_PRESETS.default;
  const tenantOverrideStyle = (
    tenantKey === 'default'
      ? {}
      : {
        '--gts-primary': activePreset.primary,
        '--gts-accent': activePreset.accent,
      }
  ) as CSSProperties;

  return (
    <Box style={{ minHeight: '100vh', position: 'relative', ...tenantOverrideStyle }}>
      <AnimatedBackground />

      <Box className="gts-landing-navbar" style={{ height: 'auto', minHeight: 70, padding: '10px 0' }}>
        <Container size="xl">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="sm">
              <Badge variant="outline" className="brand-logo gts-price-badge" size="lg">
                /DEV SANDBOX
              </Badge>
              <Text fw={700} className="brand-logo" size="sm">
                GTS UI & CSS CATALOG
              </Text>
            </Group>

            <Group gap="xs" style={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
              <Button
                size="compact-xs"
                variant="outline"
                onClick={() => setAutoPlay(!autoPlay)}
                leftSection={autoPlay ? <IconPlayerPause size={12} /> : <IconPlayerPlay size={12} />}
              >
                {autoPlay ? 'PAUSE' : 'PLAY'}
              </Button>
              <Slider
                value={sliderVal}
                onChange={(val) => {
                  setAutoPlay(false);
                  setSliderVal(val);
                }}
                style={{ flex: 1 }}
                size="sm"
                label={(v) => `progress: ${(v / 100).toFixed(2)}`}
              />
            </Group>

            <Group gap="sm">
              <SegmentedControl
                size="xs"
                value={tenantKey}
                onChange={setTenantKey}
                data={[
                  { label: 'GTS Blue', value: 'default' },
                  { label: 'Terra Gold', value: 'terra' },
                  { label: 'Citadel', value: 'citadel' },
                  { label: 'Crimson', value: 'khorne' },
                  { label: 'Gauss', value: 'necron' },
                ]}
              />
              <LanguageSwitcher />
              <ThemeToggle />
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="xl" pt={110} pb={120} style={{ position: 'relative', zIndex: 2 }}>
        <Stack gap={60}>
          <Stack gap="md">
            <Title order={2} className="brand-logo">
              1. GLOBAL CSS VARIABLES (:root & [data-mantine-color-scheme])
            </Title>
            <Grid gap="md">
              {[
                { varName: '--gts-primary', desc: 'Primary Brand / Borders / Glows' },
                { varName: '--gts-accent', desc: 'Secondary Cyan / Highlights' },
                { varName: '--gts-danger', desc: 'Destructive / Error / Red' },
                { varName: '--gts-warning', desc: 'Pending / Warning / Amber' },
                { varName: '--gts-gold', desc: 'Imperial Gold / Badges' },
                { varName: '--gts-bg-canvas', desc: 'Page Body Background' },
                { varName: '--gts-bg-panel', desc: 'Section Glass Panel' },
                { varName: '--gts-bg-card', desc: 'Standard Card Surface' },
                { varName: '--gts-bg-subcard', desc: 'Nested SubSection / Arena Box' },
                { varName: '--gts-bg-modal', desc: 'Modal & Dropdown Surface' },
                { varName: '--gts-bg-input', desc: 'Form Input Background' },
                { varName: '--gts-text-heading', desc: 'Primary Titles (White / Dark Slate)' },
              ].map((token) => (
                <Grid.Col key={token.varName} span={{ base: 12, xs: 6, md: 3 }}>
                  <Paper p="sm" radius="md" className="gts-subsection-paper">
                    <Group wrap="nowrap" gap="sm">
                      <Box
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 6,
                          backgroundColor: `var(${token.varName})`,
                          border: '1px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                        }}
                      />
                      <Stack gap={2}>
                        <Code style={{ fontSize: '0.72rem' }}>{token.varName}</Code>
                        <Text size="xs" style={{ color: 'var(--gts-text-muted)' }}>
                          {token.desc}
                        </Text>
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          <Stack gap="md">
            <Title order={2} className="brand-logo">
              2. CONTAINER & SURFACE CLASSES
            </Title>
            <Grid gap="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="xl" radius="md" className="gts-section-paper" h="100%">
                  <ClassTag name=".gts-section-paper" desc="Main Section Glass Container" />
                  <Title order={4} className="brand-logo" mb="xs">
                    SECTION GLASS PANEL
                  </Title>
                  <Text size="sm" style={{ color: 'var(--gts-text-secondary)' }}>
                    Uses <Code>--gts-bg-panel</Code> with <Code>backdrop-filter: blur(8px)</Code> and
                    subtle primary border.
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="xl" radius="sm" className="gts-subsection-paper" h="100%">
                  <ClassTag name=".gts-subsection-paper" desc="3px Left Accent Callout Box" />
                  <Title order={4} className="brand-logo" mb="xs">
                    SUBSECTION CALLOUT BOX
                  </Title>
                  <Text size="sm" style={{ color: 'var(--gts-text-secondary)' }}>
                    Uses <Code>--gts-bg-subcard</Code> with a 3px solid <Code>--gts-primary</Code> left
                    border.
                  </Text>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="xl" radius="md" className="gts-contact-card" h="100%">
                  <ClassTag name=".gts-contact-card" desc="3px Top Accent Form Container" />
                  <Title order={4} className="brand-logo" mb="xs">
                    TERMINAL FORM CARD
                  </Title>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper
                  p="xl"
                  radius="md"
                  className="gts-price-card"
                  style={{ '--card-color': '#7c3aed' } as CSSProperties}
                  h="100%"
                >
                  <ClassTag name=".gts-price-card" desc="Dynamic --card-color Container" />
                  <Title order={4} className="brand-logo" mb="xs">
                    DYNAMIC TIER CARD
                  </Title>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="xl" radius="md" className="gts-countdown-box" h="100%">
                  <ClassTag name=".gts-countdown-box" desc="Glowing HUD Metric Tile" />
                  <Title order={4} className="brand-logo" mb="xs">
                    HUD METRIC TILE
                  </Title>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          <Stack gap="md">
            <Title order={2} className="brand-logo">
              3. TYPOGRAPHY, BUTTONS, INPUTS & BADGES
            </Title>
            <Grid gap="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="lg" radius="md" className="gts-section-paper" h="100%">
                  <Stack gap="md">
                    <div>
                      <ClassTag name=".brand-logo .gts-section-intro-title" desc="Hero H1" />
                      <Title order={1} className="brand-logo gts-section-intro-title">
                        HERO HEADING
                      </Title>
                    </div>
                    <div>
                      <ClassTag name=".brand-logo .gts-section-title" desc="Section H2" />
                      <Title order={2} c="brandBlue.4" className="brand-logo gts-section-title">
                        SECTION TITLE
                      </Title>
                    </div>
                    <div>
                      <ClassTag name=".brand-logo .gts-subsection-title" desc="SubSection H4" />
                      <Title order={4} className="brand-logo gts-subsection-title">
                        SUBSECTION HEADING
                      </Title>
                    </div>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="lg" radius="md" className="gts-section-paper" h="100%">
                  <Stack gap="md">
                    <div>
                      <ClassTag name=".gts-price-cta-root" desc="Inherits --card-color with Glow Hover" />
                      <Group grow>
                        <Button
                          variant="default"
                          className="brand-logo"
                          style={{ '--card-color': 'var(--gts-primary)' } as CSSProperties}
                          classNames={{ root: 'gts-price-cta-root', label: 'gts-price-cta-label' }}
                        >
                          PRIMARY TIER CTA
                        </Button>
                        <Button
                          variant="default"
                          className="brand-logo"
                          style={{ '--card-color': '#d97706' } as CSSProperties}
                          classNames={{ root: 'gts-price-cta-root', label: 'gts-price-cta-label' }}
                        >
                          GOLD TIER CTA
                        </Button>
                      </Group>
                    </div>
                    <div>
                      <ClassTag name=".gts-player-free-btn" desc="Accent Cyan Callout Button" />
                      <Button variant="default" fullWidth className="brand-logo gts-player-free-btn">
                        ZUR SPIELER SEITE (.gts-player-free-btn)
                      </Button>
                    </div>
                    <div>
                      <ClassTag
                        name="classNames={{ input: 'gts-input-field', label: 'gts-input-label' }}"
                        desc="Terminal Input Styling"
                      />
                      <TextInput
                        label="COMMANDER EMAIL"
                        placeholder="commander@club.com"
                        classNames={{
                          input: 'gts-input-field',
                          label: 'gts-input-label',
                        }}
                      />
                    </div>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          <Stack gap="md">
            <Title order={2} className="brand-logo">
              4. PRICING TIER FORTIFICATION GRAPHICS
            </Title>
            <Grid gap="lg">
              {[
                {
                  name: '<OutpostGraphic />',
                  props: 'primaryColor="#29d4ff" accentColor="#8ae9ff"',
                  node: (
                    <OutpostGraphic
                      progress={progress}
                      primaryColor="#29d4ff"
                      accentColor="#8ae9ff"
                    />
                  ),
                },
                {
                  name: '<StrongholdGraphic />',
                  props: 'primaryColor="#1864ff" accentColor="#29d4ff"',
                  node: (
                    <StrongholdGraphic
                      progress={progress}
                      primaryColor="#1864ff"
                      accentColor="#29d4ff"
                    />
                  ),
                },
                {
                  name: '<CitadelGraphic />',
                  props: 'primaryColor="#7c3aed" accentColor="#c084fc"',
                  node: (
                    <CitadelGraphic
                      progress={progress}
                      primaryColor="#7c3aed"
                      accentColor="#c084fc"
                    />
                  ),
                },
                {
                  name: '<FortressOfTerraGraphic />',
                  props: 'primaryColor="#d97706" accentColor="#fde047"',
                  node: (
                    <FortressOfTerraGraphic
                      progress={progress}
                      primaryColor="#d97706"
                      accentColor="#fde047"
                    />
                  ),
                },
              ].map((item) => (
                <Grid.Col key={item.name} span={{ base: 12, sm: 6, lg: 3 }}>
                  <Paper p="md" radius="md" className="gts-section-paper">
                    <ClassTag name={item.name} />
                    <Text size="xs" mb="xs" style={{ color: 'var(--gts-text-muted)' }}>
                      {item.props}
                    </Text>
                    <Box className="gts-section-graphic-box" style={{ height: 260 }}>
                      {item.node}
                    </Box>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          <Stack gap="md">
            <Title order={2} className="brand-logo">
              5. SCROLL & FEATURE ANIMATION GRAPHICS (.gts-graphic-scope)
            </Title>
            <Grid gap="lg">
              {[
                { name: '<CommandHubGraphic />', node: <CommandHubGraphic progress={progress} /> },
                { name: '<CommandForgeGraphic />', node: <CommandForgeGraphic /> },
                { name: '<FallingD6Graphic />', node: <FallingD6Graphic progress={progress} /> },
                { name: '<RotatingD20Graphic />', node: <RotatingD20Graphic progress={progress} /> },
                {
                  name: '<PortalDiceSummonGraphic />',
                  node: <PortalDiceSummonGraphic progress={progress} />,
                },
                { name: '<HexTilePathGraphic />', node: <HexTilePathGraphic progress={progress} /> },
                {
                  name: '<HobbyEssentialsGraphic />',
                  node: <HobbyEssentialsGraphic progress={progress} />,
                },
                { name: '<FanningCardsGraphic />', node: <FanningCardsGraphic progress={progress} /> },
                { name: '<CardCycloneGraphic />', node: <CardCycloneGraphic progress={progress} /> },
                { name: '<CardDrawGraphic />', node: <CardDrawGraphic progress={progress} /> },
              ].map((gfx) => (
                <Grid.Col key={gfx.name} span={{ base: 12, sm: 6, md: 4 }}>
                  <Paper p="md" radius="md" className="gts-section-paper">
                    <ClassTag name={gfx.name} desc="Scroll-linked MotionValue" />
                    <Box className="gts-section-graphic-box" style={{ height: 300 }}>
                      {gfx.node}
                    </Box>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          <Stack gap="md">
            <Title order={2} className="brand-logo">
              6. COMPOSITE UI COMPONENTS (MATCHMAKING & OVERLAYS)
            </Title>

            <ClassTag
              name="<GameFilterBar /> (.gts-filter-bar)"
              desc="Extracted from GameFinder.tsx"
            />
            <GameFilterBar
              values={filterVals}
              onChange={setFilterVals}
              onReset={() =>
                setFilterVals({
                  system: null,
                  venue: 'all',
                  maxPoints: '',
                  dateFrom: '',
                  dateTo: '',
                })
              }
            />

            <ClassTag
              name="<GameCard /> (.gts-game-card)"
              desc="States: Open Challenge (Primary), Matched Lock (Accent), Pending Approval (Warning)"
            />
            <Grid gap="lg">
              {MOCK_GAMES.map((game) => (
                <Grid.Col key={game.id} span={{ base: 12, md: 4 }}>
                  <GameCard
                    game={game}
                    currentUserId={10}
                    isAuthenticated={true}
                    onJoinClick={() => { }}
                    onLeaveClick={() => { }}
                    onDeleteClick={() => { }}
                  />
                </Grid.Col>
              ))}
            </Grid>

            <Grid gap="lg" mt="md" align="stretch">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="lg" radius="md" className="gts-section-paper" h="100%">
                  <ClassTag name="<SubSection /> (.gts-subsection-paper)" />
                  <Stack gap="sm">
                    <SubSection
                      title="SWISS & WTC PAIRINGS"
                      description="Automated table assignments, differential scoring matrices, and live round clocks."
                      icon={<IconSwords size={20} />}
                    />
                    <SubSection
                      title="WHITE-LABEL TENANT ENGINE"
                      description="Instant CSS variable injection per subdomain or custom convention domain."
                      icon={<IconPalette size={20} />}
                    />
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="lg" radius="md" className="gts-section-paper" h="100%">
                  <ClassTag name="<LaunchCountdown /> & Interactive Overlays" />
                  <LaunchCountdown
                    labels={{
                      label: 'SYSTEM ONLINE IN',
                      days: 'DAYS',
                      hours: 'HRS',
                      minutes: 'MIN',
                      seconds: 'SEC',
                    }}
                  />

                  <Divider my="lg" color="var(--gts-border-subtle)" />

                  <Group justify="center" gap="md">
                    <Button
                      variant="outline"
                      onClick={() => setLoginOpen(true)}
                      className="brand-logo"
                    >
                      OPEN &lt;LoginModal /&gt;
                    </Button>
                    <Button
                      variant="outline"
                      color="red"
                      onClick={() => setCookieOpen(!cookieOpen)}
                      className="brand-logo"
                    >
                      {cookieOpen ? 'HIDE' : 'SHOW'} &lt;CookieBanner /&gt;
                    </Button>
                  </Group>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          {/* ================================================================
              7. ARMY ROSTER & DATASHEETS
             ================================================================ */}
          <Stack gap="md">
            <Title order={2} className="brand-logo">
              7. ARMY ROSTER & DATASHEETS
            </Title>
            <ClassTag
              name="<ArmyHeaderCard />, <ArmyRosterTable />, <ArmyUnitDatasheet />, <ArmyRulesGlossary />"
              desc="Theme-aware faction rosters, stat tables, and markdown-enabled rules."
            />

            <ArmyHeaderCard metadata={MOCK_ARMY_METADATA} />
            <ArmyRosterTable units={MOCK_ARMY_UNITS} />

            <Stack gap="xl">
              {MOCK_ARMY_UNITS.map((unit) => (
                <ArmyUnitDatasheet key={unit.id} unit={unit} />
              ))}
            </Stack>

            <ArmyRulesGlossary rules={MOCK_ARMY_RULES} />
          </Stack>

          <Divider color="var(--gts-border-subtle)" />

          {/* ================================================================
              8. TOURNAMENTS, STANDINGS, LEADERBOARD & GALLERY (EXTRACTED POC)
             ================================================================ */}
          <Stack gap="md">
            <Title order={2} className="brand-logo">
              8. TOURNAMENTS, LEADERBOARD & GALLERY
            </Title>

            <ClassTag
              name="<TournamentCard /> & <TournamentMatchupGraphic />"
              desc="Swiss tournament overview card with embedded slot/matchup matrix"
            />
            <TournamentCard
              tournament={MOCK_TOURNAMENT}
              isAuthenticated={true}
              isRegistered={false}
              onRegisterClick={() => { }}
              onUnregisterClick={() => { }}
              onViewDetails={() => { }}
            />

            <ClassTag
              name="<TournamentStandingsTable />"
              desc="Extracted from TournamentDetailView.tsx"
            />
            <TournamentStandingsTable standings={MOCK_STANDINGS} />

            <ClassTag
              name="<LeaderboardTable /> & <PodiumIcons />"
              desc="Multi-system ELO & Podium Leaderboard"
            />
            <LeaderboardTable data={MOCK_LEADERBOARD} />

            <ClassTag
              name="<GalleryShowcase />"
              desc="Auto-rotating arena gallery with clickable upcoming thumbnails"
            />
            <GalleryShowcase images={MOCK_GALLERY_IMAGES} />
          </Stack>
        </Stack>
      </Container>

      <LoginModal
        opened={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={() => setLoginOpen(false)}
        onRegister={() => setLoginOpen(false)}
      />
      <Divider color="var(--gts-border-subtle)" />

      {/* ================================================================
              9. WARHAMMER 40,000 LIVE BATTLE COMPANION
             ================================================================ */}
      <Stack gap="md">
        <Title order={2} className="brand-logo">
          9. WARHAMMER 40,000 IN-GAME BATTLE COMPANION
        </Title>
        <ClassTag
          name="<BattleCompanion40k />"
          desc="Live CP/VP ledger, WTC 20-0 matrix, phase stepper, chess clock, wound/battle-shock tracker & dual datasheet inspector"
        />
        <BattleCompanion40k
          playerArmy={{
            playerName: 'TechPriest_Frederic',
            metadata: MOCK_ARMY_METADATA,
            units: MOCK_ARMY_UNITS,
          }}
          opponentArmy={{
            playerName: 'Warsmith_Basti',
            metadata: MOCK_OPPONENT_METADATA,
            units: MOCK_OPPONENT_UNITS,
          }}
        />
      </Stack>
      <CookieBanner opened={cookieOpen} onAccept={() => setCookieOpen(false)} />
    </Box>
  );
}