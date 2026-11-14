// packages/ui/components/game/battle-hud/BattleLandscapeGuard.tsx
'use client';

import { Badge, Title, Text, Button, Group } from '@mantine/core';
import {
  IconDeviceMobileRotated,
  IconMaximize,
  IconMinimize,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export interface BattleLandscapeGuardProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onDismissGuard?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function BattleLandscapeGuard({
  isFullscreen,
  onToggleFullscreen,
  onDismissGuard,
  onBack,
  backLabel,
}: BattleLandscapeGuardProps) {
  const t = useTranslations('BattleCompanion40k');

  return (
    <div className="gts-landscape-guard">
      <IconDeviceMobileRotated size={68} className="gts-rotate-icon-anim" />
      <Badge variant="outline" size="lg" className="brand-logo gts-game-badge">
        {t('landscape.badge')}
      </Badge>
      <Title order={2} className="brand-logo gts-army-title" maw={420}>
        {t('landscape.title')}
      </Title>
      <Text size="sm" maw={380} c="dimmed">
        {t('landscape.description')}
      </Text>
      <Button
        size="md"
        variant="default"
        leftSection={isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
        className="brand-logo gts-game-cta-join"
        onClick={() => {
          onToggleFullscreen();
          onDismissGuard?.();
        }}
      >
        {t('landscape.lockBtn')}
      </Button>
      <Group gap="xs" justify="center">
        {onBack && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconArrowLeft size={14} />}
            onClick={onBack}
          >
            {backLabel || t('back')}
          </Button>
        )}
      </Group>
    </div>
  );
}