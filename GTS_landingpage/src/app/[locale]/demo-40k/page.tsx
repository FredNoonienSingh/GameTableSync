'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box } from '@mantine/core';
import {
  AnimatedBackground,
  BattleCompanion40k,
  Game40kSetupModal,
  ArmyListView,
  parseArmyListData,
  DEFAULT_40K_SETTINGS,
  type Game40kSettings,
} from '@gts/ui';
import { useLocale, useTranslations } from 'next-intl';

import archmagosFredJson from './data/ArchmargosFred (1).json';
import bigForgeJson from './data/Big Forge.json';

type CompanionScreenMode = 'companion' | 'army-player' | 'army-opponent';

export default function Demo40kCompanion() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('BattleCompanion40k');

  const [screenMode, setScreenMode] = useState<CompanionScreenMode>('companion');
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [swapped, setSwapped] = useState<boolean>(false);
  const [settings, setSettings] = useState<Game40kSettings>(DEFAULT_40K_SETTINGS);

  const parsedAdMech = useMemo(() => parseArmyListData(archmagosFredJson), []);
  const parsedChaos = useMemo(() => parseArmyListData(bigForgeJson), []);

  const playerRoster = swapped ? parsedChaos : parsedAdMech;
  const opponentRoster = swapped ? parsedAdMech : parsedChaos;

  const playerRawJson = swapped ? bigForgeJson : archmagosFredJson;
  const opponentRawJson = swapped ? archmagosFredJson : bigForgeJson;

  return (
    <main
      style={{
        position: 'relative',
        overflow: screenMode === 'companion' ? 'hidden' : 'clip',
        height: screenMode === 'companion' ? '100dvh' : undefined,
        minHeight: '100dvh',
      }}
    >
      <AnimatedBackground />

      {screenMode === 'companion' ? (
        <BattleCompanion40k
          playerArmy={{
            playerName: playerRoster.metadata.name,
            metadata: playerRoster.metadata,
            units: playerRoster.units,
            armyRules: playerRoster.armyRules,
          }}
          opponentArmy={{
            playerName: opponentRoster.metadata.name,
            metadata: opponentRoster.metadata,
            units: opponentRoster.units,
            armyRules: opponentRoster.armyRules,
          }}
          settings={settings}
          onBack={() => router.push(`/${locale}/players`)}
          backLabel={t('exitMatch')}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onInspectFullArmy={(side) =>
            setScreenMode(side === 'player' ? 'army-player' : 'army-opponent')
          }
        />
      ) : (
        <Container size="xl" py="md" style={{ position: 'relative', zIndex: 2 }}>
          {screenMode === 'army-player' && (
            <Box>
              <ArmyListView
                data={{
                  metadata: playerRoster.metadata,
                  roster_data: playerRawJson,
                }}
                onBack={() => setScreenMode('companion')}
                backLabel={t('backToCompanion')}
              />
            </Box>
          )}

          {screenMode === 'army-opponent' && (
            <Box>
              <ArmyListView
                data={{
                  metadata: opponentRoster.metadata,
                  roster_data: opponentRawJson,
                }}
                onBack={() => setScreenMode('companion')}
                backLabel={t('backToCompanion')}
              />
            </Box>
          )}
        </Container>
      )}

      <Game40kSetupModal
        opened={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onChange={setSettings}
        playerLabel={playerRoster.metadata.name}
        opponentLabel={opponentRoster.metadata.name}
        onSwapSides={() => setSwapped((s) => !s)}
      />
    </main>
  );
}