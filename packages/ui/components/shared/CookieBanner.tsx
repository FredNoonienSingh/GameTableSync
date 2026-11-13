'use client';

import { Paper, Text, Button, Group, Title, Stack } from '@mantine/core';
import { IconCookie } from '@tabler/icons-react';

export interface CookieBannerProps {
  opened: boolean;
  onAccept: () => void;
}

export function CookieBanner({ opened, onAccept }: CookieBannerProps) {
  if (!opened) return null;

  return (
    <Paper p="md" radius={0} className="gts-cookie-banner">
      <Group justify="space-between" align="center" wrap="wrap" px={{ base: 'xs', md: 'xl' }}>
        <Group className="gts-cookie-content" wrap="nowrap">
          <IconCookie size={40} className="gts-cookie-icon" />
          <Stack gap={2}>
            <Title order={5} className="gts-cookie-title">
              BÜROKRATIE DES ADMINISTRATUMS
            </Title>
            <Text size="sm" c="gray.4" className="gts-cookie-text">
              Ironischerweise verwenden wir hier überhaupt keine Tracking-Cookies. Wir haben weder die Zeit noch das Interesse, deine Daten auszuwerten. Aber die heiligen Gesetze fordern, dass wir dir dieses Banner zeigen. Klick es einfach weg, damit wir beide in Frieden gelassen werden.
            </Text>
          </Stack>
        </Group>

        <Button
          onClick={onAccept}
          variant="outline"
          color="red"
          mt={{ base: 'md', sm: 0 }}
          fullWidth={{ base: true, sm: false }}
          className="gts-cookie-btn"
        >
          AKZEPTIEREN & VERSCHWINDEN
        </Button>
      </Group>
    </Paper>
  );
}