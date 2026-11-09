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
    <Paper
      p="md"
      radius={0}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#101113',
        borderTop: '2px solid #e0282b',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.8)',
      }}
    >
      <Group justify="space-between" align="center" wrap="wrap" px={{ base: 'xs', md: 'xl' }}>
        <Group style={{ flex: 1, minWidth: '300px' }} wrap="nowrap">
          <IconCookie color="#e5c158" size={40} style={{ flexShrink: 0, filter: 'drop-shadow(1px 1px 2px #000)' }} />
          <Stack gap={2}>
            <Title 
              order={5} 
              style={{ 
                fontFamily: 'Impact, "Arial Black", sans-serif', 
                letterSpacing: '0.05em', 
                color: '#ffffff',
                textShadow: '1px 1px 0px #000'
              }}
            >
              BÜROKRATIE DES ADMINISTRATUMS
            </Title>
            <Text size="sm" c="gray.4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
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
          style={{ 
            fontFamily: 'Impact, "Arial Black", sans-serif', 
            letterSpacing: '0.05em',
            boxShadow: '0 4px 8px rgba(0,0,0,0.8)'
          }}
        >
          AKZEPTIEREN & VERSCHWINDEN
        </Button>
      </Group>
    </Paper>
  );
}