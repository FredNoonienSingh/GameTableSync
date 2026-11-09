'use client';

import { useState } from 'react';
import { Container, Group, Text, Box, Stack, Divider } from '@mantine/core';
import Link from 'next/link';
import Image from 'next/image';
import defaultPureLogo from '../assets/gametablesync_pure.png';

export interface FooterLabels {
  rights?: string;
  imprint?: string;
  privacy?: string;
  terms?: string;
}

export interface FooterProps {
  labels?: FooterLabels;
  logoSrc?: string | { src: string; height: number; width: number };
  imprintHref?: string;
  privacyHref?: string;
  termsHref?: string;
}

const defaultLabels: Required<FooterLabels> = {
  rights: '© 2027 GameTableSync. All rights reserved.',
  imprint: 'Imprint',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
};

export function Footer({ 
  labels, 
  logoSrc = defaultPureLogo,
  imprintHref = '/imprint',
  privacyHref = '/privacy',
  termsHref = '/terms'
}: FooterProps) {
  const [imgError, setImgError] = useState(false);
  const t = { ...defaultLabels, ...labels };

  return (
    <Box
      component="footer"
      py="xl"
      style={{
        backgroundColor: '#0a0b08',
        borderTop: '1px solid rgba(24, 100, 255, 0.15)',
        zIndex: 1,
        position: 'relative',
      }}
    >
      <Container size="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              {logoSrc && !imgError && (
                <Image
                  src={logoSrc}
                  alt="GameTableSync"
                  width={28}
                  height={28}
                  style={{ width: 'auto', height: '28px' }}
                  onError={() => setImgError(true)}
                />
              )}
              <Text c="white" className="brand-logo" size="sm" style={{ letterSpacing: '0.1em' }}>
                GAMETABLESYNC
              </Text>
            </Group>
            <Group gap="xl">
              <Link href={imprintHref} style={{ color: '#909296', textDecoration: 'none', fontSize: '0.85rem' }}>
                {t.imprint}
              </Link>
              <Link href={privacyHref} style={{ color: '#909296', textDecoration: 'none', fontSize: '0.85rem' }}>
                {t.privacy}
              </Link>
              <Link href={termsHref} style={{ color: '#909296', textDecoration: 'none', fontSize: '0.85rem' }}>
                {t.terms}
              </Link>
            </Group>
          </Group>
          <Divider color="dark.5" />
          <Text c="dimmed" size="xs" ta="center">
            {t.rights}
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}