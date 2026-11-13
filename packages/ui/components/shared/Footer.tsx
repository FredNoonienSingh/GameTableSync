'use client';

import { useState } from 'react';
import { Container, Group, Text, Box, Stack, Divider } from '@mantine/core';
import Link from 'next/link';
import Image from 'next/image';
import { gtsPureLogo } from '@gts/ui';

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
  logoSrc = gtsPureLogo,
  imprintHref = '/imprint',
  privacyHref = '/privacy',
  termsHref = '/terms',
}: FooterProps) {
  const [imgError, setImgError] = useState(false);
  const t = { ...defaultLabels, ...labels };

  return (
    <Box component="footer" py="xl" className="gts-footer">
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
                  className="gts-footer-logo"
                  onError={() => setImgError(true)}
                />
              )}
              <Text   className="brand-logo gts-footer-brand" size="sm">
                GAMETABLESYNC
              </Text>
            </Group>
            <Group gap="xl">
              <Link href={imprintHref} className="gts-footer-link">
                {t.imprint}
              </Link>
              <Link href={privacyHref} className="gts-footer-link">
                {t.privacy}
              </Link>
              <Link href={termsHref} className="gts-footer-link">
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