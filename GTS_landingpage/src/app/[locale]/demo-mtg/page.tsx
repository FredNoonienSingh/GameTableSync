'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AnimatedBackground,
  BattleCompanionMtg,
  GameMtgSetupModal,
  DEFAULT_MTG_SETTINGS,
  type GameMtgSettings,
  type MtgPlayerInput,
} from '@gts/ui';
import { useLocale, useTranslations } from 'next-intl';

const MOCK_MTG_PLAYERS: MtgPlayerInput[] = [
  {
    id: 'seat-1',
    playerName: 'Archmagos',
    deckName: 'Urza Artificer Control',
    commanderName: 'Urza, Lord High Artificer',
    colorIdentity: ['U'],
    cards: [
      { quantity: 1, name: 'Urza, Lord High Artificer', typeLine: 'Legendary Creature — Human Artificer', manaCost: '2UU', section: 'Commander' },
      { quantity: 1, name: 'Sol Ring', typeLine: 'Artifact', manaCost: '1', section: 'Mainboard' },
      { quantity: 1, name: 'Mana Vault', typeLine: 'Artifact', manaCost: '1', section: 'Mainboard' },
      { quantity: 1, name: 'Winter Orb', typeLine: 'Artifact', manaCost: '2', section: 'Mainboard' },
      { quantity: 1, name: 'Force of Will', typeLine: 'Instant', manaCost: '3UU', section: 'Mainboard' },
    ],
  },
  {
    id: 'seat-2',
    playerName: 'IronForged',
    deckName: 'Rakdos Lord of Riots',
    commanderName: 'Rakdos, Lord of Riots',
    colorIdentity: ['B', 'R'],
    cards: [
      { quantity: 1, name: 'Rakdos, Lord of Riots', typeLine: 'Legendary Creature — Demon', manaCost: 'BBRR', section: 'Commander' },
      { quantity: 1, name: 'Kozilek, Butcher of Truth', typeLine: 'Legendary Creature — Eldrazi', manaCost: '10', section: 'Mainboard' },
      { quantity: 1, name: 'Lightning Bolt', typeLine: 'Instant', manaCost: 'R', section: 'Mainboard' },
    ],
  },
  {
    id: 'seat-3',
    playerName: 'AtraxaPrime',
    deckName: 'Phyrexian Superfriends',
    commanderName: "Atraxa, Praetors' Voice",
    colorIdentity: ['W', 'U', 'B', 'G'],
    cards: [
      { quantity: 1, name: "Atraxa, Praetors' Voice", typeLine: 'Legendary Creature — Phyrexian Angel', manaCost: 'GWUB', section: 'Commander' },
      { quantity: 1, name: 'Doubling Season', typeLine: 'Enchantment', manaCost: '4G', section: 'Mainboard' },
      { quantity: 1, name: 'Skithiryx, the Blight Dragon', typeLine: 'Legendary Creature — Phyrexian Dragon', manaCost: '3BB', section: 'Mainboard' },
    ],
  },
  {
    id: 'seat-4',
    playerName: 'KrenkoMob',
    deckName: 'Mono-Red Goblin Swarm',
    commanderName: 'Krenko, Mob Boss',
    colorIdentity: ['R'],
    cards: [
      { quantity: 1, name: 'Krenko, Mob Boss', typeLine: 'Legendary Creature — Goblin Warrior', manaCost: '2RR', section: 'Commander' },
      { quantity: 1, name: 'Goblin Chieftain', typeLine: 'Creature — Goblin', manaCost: '1RR', section: 'Mainboard' },
      { quantity: 1, name: 'Impact Tremors', typeLine: 'Enchantment', manaCost: '1R', section: 'Mainboard' },
    ],
  },
];

export default function DemoMtgCompanion() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('BattleCompanionMtg');

  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<GameMtgSettings>(DEFAULT_MTG_SETTINGS);
  const [seats, setSeats] = useState<MtgPlayerInput[]>(MOCK_MTG_PLAYERS);

  const handleRotateSeats = () => {
    setSeats((prev) => [...prev.slice(1), prev[0]]);
  };

  return (
    <main className="gts-battle-hud">
      <AnimatedBackground />

      <BattleCompanionMtg
        players={seats}
        settings={settings}
        onBack={() => router.push(`/${locale}/players`)}
        backLabel={t('exitMatch')}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      <GameMtgSetupModal
        opened={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onChange={setSettings}
        onRotateSeats={handleRotateSeats}
      />
    </main>
  );
}