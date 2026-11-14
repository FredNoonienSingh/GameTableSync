// packages/ui/components/marketing/FeatureShowcaseCard.tsx
'use client';

import type { ReactNode, ElementType } from 'react';
import {
  Box,
  Container,
  Paper,
  Grid,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Button,
} from '@mantine/core';
import { IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';
import Link from 'next/link';

export type ShowcaseImageSource =
  | string
  | { src: string; width?: number; height?: number }
  | ElementType;

export interface FeatureShowcaseCardProps {
  id?: string;
  badge?: string;
  title: string;
  description: ReactNode;
  href: string;
  linkLabel: string;
  inlineLinkText?: string;
  imageSrc: ShowcaseImageSource;
  imageAlt: string;
  imageTag?: string;
  reverse?: boolean;
  children?: ReactNode;
  withContainer?: boolean;
}

function resolveImageUrl(imageSrc: ShowcaseImageSource): string | null {
  if (!imageSrc) return null;
  if (typeof imageSrc === 'string') return imageSrc;
  if (typeof imageSrc === 'object' && 'src' in imageSrc && typeof imageSrc.src === 'string') {
    return imageSrc.src;
  }
  return null;
}

export function FeatureShowcaseCard({
  id,
  badge,
  title,
  description,
  href,
  linkLabel,
  inlineLinkText,
  imageSrc,
  imageAlt,
  imageTag,
  reverse = false,
  children,
  withContainer = true,
}: FeatureShowcaseCardProps) {
  const resolvedUrl = resolveImageUrl(imageSrc);
  const SvgComponent = typeof imageSrc === 'function' ? (imageSrc as ElementType) : null;

  const cardContent = (
    <Paper p={{ base: 'lg', sm: 'xl' }} radius="md" className="gts-contact-card">
      <Grid gap={{ base: 24, md: 48 }} align="center">
        {/* Image / Mockup Column */}
        <Grid.Col
          span={{ base: 12, md: 6 }}
          order={{ base: 1, md: reverse ? 2 : 1 }}
        >
          <Link
            href={href}
            style={{ textDecoration: 'none', display: 'block' }}
            aria-label={linkLabel}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <Box className="gts-showcase-mockup-frame">
              {imageTag && (
                <Badge
                  size="sm"
                  variant="filled"
                  className="brand-logo gts-showcase-mockup-tag"
                >
                  {imageTag}
                </Badge>
              )}

              {resolvedUrl ? (
                <img
                  src={resolvedUrl}
                  alt={imageAlt}
                  className="gts-showcase-mockup-img"
                  loading="lazy"
                />
              ) : SvgComponent ? (
                <SvgComponent className="gts-showcase-mockup-img" aria-label={imageAlt} />
              ) : null}
            </Box>
          </Link>
        </Grid.Col>

        {/* Text & Link Column */}
        <Grid.Col
          span={{ base: 12, md: 6 }}
          order={{ base: 2, md: reverse ? 1 : 2 }}
        >
          <Stack gap="md">
            {badge && (
              <Badge
                variant="outline"
                size="md"
                w="fit-content"
                className="brand-logo gts-game-badge"
              >
                {badge}
              </Badge>
            )}

            <Title order={2} className="brand-logo gts-section-title">
              {title}
            </Title>

            <Text
              size="md"
              style={{ color: 'var(--gts-text-secondary)', lineHeight: 1.65 }}
            >
              {description}{' '}
              {inlineLinkText && (
                <Link
                  href={href}
                  className="gts-modal-toggle-link brand-logo"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  {inlineLinkText}
                </Link>
              )}
            </Text>

            {children && <Stack gap="xs">{children}</Stack>}
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );

  if (!withContainer) {
    return <Box id={id}>{cardContent}</Box>;
  }

  return (
    <Box id={id} component="section" py={{ base: 40, md: 80 }} className="gts-section">
      <Container size="lg" w="100%">
        {cardContent}
      </Container>
    </Box>
  );
}