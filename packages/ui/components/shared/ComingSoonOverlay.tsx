// packages/ui/components/shared/ComingSoonOverlay.tsx
'use client';

import { useState, type ReactNode, type CSSProperties } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { IconClockHour4, IconEye, IconEyeOff } from '@tabler/icons-react';

export interface ComingSoonOverlayProps {
  /** Banner text (defaults to "COMING SOON") */
  label?: string;
  /** Optional subtext right next to the badge */
  sublabel?: string;
  /** Toggle the overlay on/off conditionally (default: true) */
  active?: boolean;
  /** Fade the banner out on desktop hover & allow tap-to-peek on mobile (default: true) */
  revealOnHover?: boolean;
  /** Opacity of the backdrop tint over the container, from 0 to 1 (default: 0.45) */
  backdropOpacity?: number;
  /** Opacity of the banner stripe itself, from 0 to 1 (default: 0.85) */
  bannerOpacity?: number;
  /** Opacity of the wrapped children underneath, from 0 to 1 (default: 0.45) */
  contentOpacity?: number;
  /** Blur intensity in px for the backdrop (default: 3) */
  blur?: number;
  /** Banner style: horizontal ribbon, tilted stamp, or compact pill */
  variant?: 'ribbon' | 'tilted' | 'pill';
  /** If children are passed, it wraps them in a relative box automatically */
  children?: ReactNode;
}

const clamp01 = (val: number) => Math.max(0, Math.min(1, val));

export function ComingSoonOverlay({
  label = 'COMING SOON',
  sublabel,
  active = true,
  revealOnHover = true,
  backdropOpacity = 0.45,
  bannerOpacity = 0.85,
  contentOpacity = 0.45,
  blur = 3,
  variant = 'ribbon',
  children,
}: ComingSoonOverlayProps) {
  const [isPeeked, setIsPeeked] = useState(false);

  if (!active) {
    return <>{children}</>;
  }

  const cssVars = {
    '--cs-blur': `${blur}px`,
    '--cs-backdrop-alpha': `${Math.round(clamp01(backdropOpacity) * 100)}%`,
    '--cs-banner-alpha': `${Math.round(clamp01(bannerOpacity) * 100)}%`,
    '--cs-content-opacity': clamp01(contentOpacity),
  } as CSSProperties;

  const handleTogglePeek = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!revealOnHover) return;
    e.stopPropagation();
    setIsPeeked((prev) => !prev);
  };

  const overlayNode = (
    <div
      className="gts-coming-soon-backdrop"
      data-variant={variant}
      data-revealable={revealOnHover ? 'true' : undefined}
      data-peeked={isPeeked ? 'true' : undefined}
      style={cssVars}
      role={revealOnHover ? 'button' : undefined}
      tabIndex={revealOnHover ? 0 : undefined}
      aria-label={label}
      onClick={handleTogglePeek}
      onPointerDownCapture={(e) => {
        if (revealOnHover) e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTogglePeek(e);
        }
      }}
    >
      <div className="gts-coming-soon-banner" data-variant={variant}>
        <Group gap={8} justify="center" align="center" wrap="nowrap">
          <IconClockHour4 size={16} className="gts-coming-soon-icon" />
          <Text component="span" className="brand-logo gts-coming-soon-text">
            {label}
          </Text>
          {sublabel && (
            <Text component="span" size="xs" className="gts-coming-soon-subtext">
              — {sublabel}
            </Text>
          )}
          {revealOnHover && (
            <IconEye size={14} className="gts-coming-soon-peek-hint" />
          )}
        </Group>
      </div>

      {/* Small floating corner indicator shown when mobile user tapped to peek */}
      {revealOnHover && (
        <div className="gts-coming-soon-peek-pill" data-peeked={isPeeked ? 'true' : undefined}>
          <IconEyeOff size={13} />
          <span className="brand-logo">{label}</span>
        </div>
      )}
    </div>
  );

  // Mode 1: Wrapper around any component/container
  if (children) {
    return (
      <Box
        className="gts-coming-soon-wrapper"
        data-revealable={revealOnHover ? 'true' : undefined}
        data-peeked={isPeeked ? 'true' : undefined}
        style={cssVars}
      >
        <div className="gts-coming-soon-content">{children}</div>
        {overlayNode}
      </Box>
    );
  }

  // Mode 2: Standalone sibling placed inside any relative parent container
  return overlayNode;
}