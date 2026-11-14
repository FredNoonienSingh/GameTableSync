'use client';

import { useState, useEffect } from 'react';
import { Paper, Title, Image, Group, Grid, Stack, Box, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';

export interface GalleryImageItem {
  src: string;
  alt: string;
}

export interface GalleryShowcaseProps {
  images: GalleryImageItem[];
  title?: string;
  height?: number;
  intervalMs?: number;
}

export function GalleryShowcase({
  images,
  title,
  height = 440,
  intervalMs = 4500,
}: GalleryShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const t = useTranslations();
  const tr = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  if (images.length === 0) {
    return (
      <Paper p="xl" radius="md" className="gts-section-paper">
        <Text c="dimmed" ta="center">
          {tr('Gallery.empty', 'Keine Bilder in der Galerie gefunden.')}
        </Text>
      </Paper>
    );
  }

  const upcomingIndices = [
    (currentIndex + 1) % images.length,
    (currentIndex + 2) % images.length,
  ];

  return (
    <Paper p="xl" radius="md" className="gts-section-paper">
      <Group justify="space-between" align="center" mb="md">
        <Title order={3} className="brand-logo gts-army-title">
          {title || tr('Gallery.title', 'IMPRESSIONEN // GALERIE')}
        </Title>
        <Text size="xs" fw={700} className="brand-logo" c="dimmed">
          {currentIndex + 1} / {images.length}
        </Text>
      </Group>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 9 }} h={{ base: 280, md: height }}>
          <Box key={currentIndex} className="gts-gallery-frame">
            <Image
              src={images[currentIndex]?.src}
              alt={images[currentIndex]?.alt}
              fit="cover"
              style={{ width: '100%', height: '100%' }}
              fallbackSrc="https://placehold.co/800x500/14161b/29d4ff?text=GTS+ARENA"
            />
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }} h={height} visibleFrom="md">
          <Stack h="100%" justify="space-between" gap="md">
            {upcomingIndices.map((imgIdx, idx) => {
              const img = images[imgIdx];
              return (
                <Box
                  key={`${currentIndex}-${idx}`}
                  className="gts-gallery-frame gts-gallery-thumb"
                  style={{ flex: 1 }}
                  onClick={() => setCurrentIndex(imgIdx)}
                >
                  <Image
                    src={img?.src}
                    alt={img?.alt}
                    fit="cover"
                    style={{ width: '100%', height: '100%' }}
                    fallbackSrc="https://placehold.co/300x220/14161b/1864ff?text=NEXT"
                  />
                </Box>
              );
            })}
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}