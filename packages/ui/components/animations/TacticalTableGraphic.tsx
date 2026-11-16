'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Box, Text, Group, Badge, SimpleGrid } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconSwords,
  IconCards,
  IconClock,
  IconCircleCheck,
  IconRadar2,
} from '@tabler/icons-react';

export type TableCategory = 'wargaming' | 'card_board';
export type TableStatus = 'free' | 'occupied';

export interface TacticalTableProps {
  id: string;
  name: string;
  category: TableCategory;
  status: TableStatus;
  /** Pass a JS Date object or ISO string for when the current session ends */
  occupiedUntil?: Date | string | null;
  /** Optional subtitle e.g. "60x44″ Battlemat" or "4-Player Pod" */
  dimensionsLabel?: string;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
  onSelect?: (id: string) => void;
}

/** Helper to compute live remaining time and formatted target timestamp */
function useTableCountdown(occupiedUntil?: Date | string | null, status?: TableStatus) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (status !== 'occupied' || !occupiedUntil) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status, occupiedUntil]);

  if (status !== 'occupied' || !occupiedUntil) {
    return { formattedUntil: null, remainingText: null, isOvertime: false };
  }

  const targetDate = typeof occupiedUntil === 'string' ? new Date(occupiedUntil) : occupiedUntil;
  const targetMs = targetDate.getTime();

  if (Number.isNaN(targetMs)) {
    return { formattedUntil: null, remainingText: null, isOvertime: false };
  }

  const formattedUntil = targetDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const diffMs = targetMs - now;
  const isOvertime = diffMs <= 0;
  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);

  const hours = Math.floor(absDiffSec / 3600);
  const minutes = Math.floor((absDiffSec % 3600) / 60);
  const seconds = absDiffSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const remainingText =
    hours > 0
      ? `${isOvertime ? '+' : '-'}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${isOvertime ? '+' : '-'}${pad(minutes)}:${pad(seconds)}`;

  return { formattedUntil, remainingText, isOvertime };
}

export function TacticalTableGraphic({
  id,
  name,
  category,
  status,
  occupiedUntil,
  dimensionsLabel,
  primaryColor,
  accentColor,
  surfaceColor,
  textColor,
  onSelect,
}: TacticalTableProps) {
  const isOccupied = status === 'occupied';
  const { formattedUntil, remainingText, isOvertime } = useTableCountdown(occupiedUntil, status);

  // Dynamic CSS custom properties matching your GTS graphic scope
  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
    ...(textColor ? { '--gfx-text': textColor } : {}),
    '--table-active-color': isOccupied
      ? 'var(--gfx-accent, #f59e0b)'
      : 'var(--gfx-primary, #10b981)',
  } as CSSProperties;

  const defaultDims = category === 'wargaming' ? '60" × 44" SECTOR' : 'TCG / BOARD POD';

  return (
    <motion.div
      className="gts-graphic-scope gts-table-card"
      data-status={status}
      data-category={category}
      style={customVars}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onClick={() => onSelect?.(id)}
    >
      {/* Ambient background tactical grid inside the card */}
      <svg className="gts-table-bg-grid" aria-hidden="true">
        <defs>
          <pattern id={`grid-${id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="color-mix(in srgb, var(--table-active-color) 10%, transparent)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
      </svg>

      {/* Top Header: Table Name & Type Icon */}
      <Group justify="space-between" align="center" className="gts-table-header">
        <Group gap={8} align="center">
          <Box className="gts-table-icon-box">
            {category === 'wargaming' ? <IconSwords size={16} /> : <IconCards size={16} />}
          </Box>
          <div>
            <Text className="gts-table-title">{name}</Text>
            <Text className="gts-table-subtitle">{dimensionsLabel ?? defaultDims}</Text>
          </div>
        </Group>

        <Badge
          variant="light"
          className="gts-table-badge"
          leftSection={
            isOccupied ? (
              <IconRadar2 size={12} className="gts-spin-slow" />
            ) : (
              <IconCircleCheck size={12} />
            )
          }
        >
          {isOccupied ? 'ENGAGED' : 'OPEN'}
        </Badge>
      </Group>

      {/* Center Interactive Tabletop Surface Graphic */}
      <div className="gts-table-viewport">
        {category === 'wargaming' ? (
          <WargamingSurface isOccupied={isOccupied} />
        ) : (
          <CardBoardSurface isOccupied={isOccupied} />
        )}

        {/* Chair / Player Station Indicators around the table perimeter */}
        <div className="gts-table-chairs-top">
          <span className="gts-chair-pill" />
          {category === 'card_board' && <span className="gts-chair-pill" />}
        </div>
        <div className="gts-table-chairs-bottom">
          <span className="gts-chair-pill" />
          {category === 'card_board' && <span className="gts-chair-pill" />}
        </div>
      </div>

      {/* Bottom Telemetry Bar: Free status or Occupied Datetime Countdown */}
      <div className="gts-table-footer">
        <AnimatePresence mode="wait">
          {isOccupied ? (
            <motion.div
              key="occupied-hud"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="gts-table-telemetry-row"
            >
              <Group gap={6} align="center">
                <IconClock size={14} style={{ color: 'var(--table-active-color)' }} />
                <Text size="xs" className="gts-telemetry-label">
                  {formattedUntil ? `UNTIL ${formattedUntil}` : 'IN SESSION'}
                </Text>
              </Group>

              {remainingText && (
                <div className="gts-countdown-pill" data-overtime={isOvertime ? 'true' : undefined}>
                  <span>{remainingText}</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="free-hud"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="gts-table-telemetry-row"
            >
              <Group gap={6} align="center">
                <span className="gts-status-dot-free" />
                <Text size="xs" className="gts-telemetry-label">
                  READY FOR DEPLOYMENT
                </Text>
              </Group>
              <Text size="xs" className="gts-telemetry-meta">
                AVAILABLE NOW
              </Text>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * SURFACE 1: WARGAMING / TABLETOP BATTLEMAT (60x44 Tactical Layout)
 * ========================================================================== */
function WargamingSurface({ isOccupied }: { isOccupied: boolean }) {
  const objectives = [
    { cx: 50, cy: 38 },
    { cx: 190, cy: 38 },
    { cx: 120, cy: 70 }, // Center Objective
    { cx: 50, cy: 102 },
    { cx: 190, cy: 102 },
  ];

  return (
    <div className="gts-surface-frame">
      <svg viewBox="0 0 240 140" className="gts-surface-svg">
        {/* Deployment Zone Lines */}
        <line
          x1="0"
          y1="28"
          x2="240"
          y2="28"
          stroke="var(--table-active-color)"
          strokeWidth="1"
          strokeDasharray="6 4"
          strokeOpacity="0.45"
        />
        <line
          x1="0"
          y1="112"
          x2="240"
          y2="112"
          stroke="var(--table-active-color)"
          strokeWidth="1"
          strokeDasharray="6 4"
          strokeOpacity="0.45"
        />
        {/* Center No-Man's Land Crosshair */}
        <line
          x1="120"
          y1="0"
          x2="120"
          y2="140"
          stroke="var(--table-active-color)"
          strokeWidth="1"
          strokeOpacity="0.2"
        />

        {/* L-Ruins / Terrain Footprints */}
        <rect
          x="78"
          y="42"
          width="24"
          height="18"
          rx="2"
          fill="color-mix(in srgb, var(--table-active-color) 14%, transparent)"
          stroke="var(--table-active-color)"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        <rect
          x="138"
          y="80"
          width="24"
          height="18"
          rx="2"
          fill="color-mix(in srgb, var(--table-active-color) 14%, transparent)"
          stroke="var(--table-active-color)"
          strokeWidth="1"
          strokeOpacity="0.5"
        />

        {/* 5 Tactical Objective Markers */}
        {objectives.map((obj, idx) => (
          <g key={idx}>
            {/* Outer 3" Control Zone Ring */}
            <motion.circle
              cx={obj.cx}
              cy={obj.cy}
              r={idx === 2 ? 16 : 12}
              fill="none"
              stroke="var(--table-active-color)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              animate={
                isOccupied
                  ? {
                      scale: [0.92, 1.15, 0.92],
                      opacity: [0.4, 0.95, 0.4],
                      rotate: idx % 2 === 0 ? 360 : -360,
                    }
                  : { scale: 1, opacity: 0.35 }
              }
              transition={{
                duration: isOccupied ? 3.5 : 0,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformOrigin: `${obj.cx}px ${obj.cy}px` }}
            />
            {/* Core 40mm Marker */}
            <circle
              cx={obj.cx}
              cy={obj.cy}
              r="3.5"
              fill="var(--table-active-color)"
              opacity={isOccupied ? 1 : 0.6}
            />
          </g>
        ))}
      </svg>

      {/* Active Radar Scanline when Occupied */}
      {isOccupied && (
        <motion.div
          className="gts-surface-scanline"
          animate={{ left: ['-10%', '110%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

/* ============================================================================
 * SURFACE 2: CARD / BOARDGAME TABLE (Playmat Zones & Central Arcane Core)
 * ========================================================================== */
function CardBoardSurface({ isOccupied }: { isOccupied: boolean }) {
  const slots = [-2, -1, 0, 1, 2];

  return (
    <div className="gts-surface-frame">
      <svg viewBox="0 0 240 140" className="gts-surface-svg">
        {/* Player 1 & Player 2 Playmat Dividers */}
        <line
          x1="16"
          y1="70"
          x2="224"
          y2="70"
          stroke="var(--table-active-color)"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Top Player Card Slots */}
        {slots.map((offset, i) => {
          const x = 110 + offset * 30;
          return (
            <motion.rect
              key={`top-${i}`}
              x={x}
              y="14"
              width="20"
              height="28"
              rx="2.5"
              fill={
                isOccupied
                  ? 'color-mix(in srgb, var(--table-active-color) 22%, transparent)'
                  : 'transparent'
              }
              stroke="var(--table-active-color)"
              strokeWidth="1.2"
              strokeOpacity={isOccupied ? 0.85 : 0.35}
              animate={
                isOccupied
                  ? { y: [14, i % 2 === 0 ? 18 : 14, 14], opacity: [0.65, 1, 0.65] }
                  : { y: 14, opacity: 0.35 }
              }
              transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}

        {/* Bottom Player Card Slots */}
        {slots.map((offset, i) => {
          const x = 110 + offset * 30;
          return (
            <motion.rect
              key={`bot-${i}`}
              x={x}
              y="98"
              width="20"
              height="28"
              rx="2.5"
              fill={
                isOccupied
                  ? 'color-mix(in srgb, var(--table-active-color) 22%, transparent)'
                  : 'transparent'
              }
              stroke="var(--table-active-color)"
              strokeWidth="1.2"
              strokeOpacity={isOccupied ? 0.85 : 0.35}
              animate={
                isOccupied
                  ? { y: [98, i % 2 !== 0 ? 94 : 98, 98], opacity: [0.65, 1, 0.65] }
                  : { y: 98, opacity: 0.35 }
              }
              transition={{ duration: 2.4, delay: i * 0.25, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}

        {/* Central Board / Turn Dial Emblem */}
        <motion.g
          animate={isOccupied ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '120px 70px' }}
        >
          <circle
            cx="120"
            cy="70"
            r="16"
            fill="var(--gfx-surface, #0b0f17)"
            stroke="var(--table-active-color)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <polygon
            points="120,58 130,70 120,82 110,70"
            fill="color-mix(in srgb, var(--table-active-color) 30%, transparent)"
            stroke="var(--table-active-color)"
            strokeWidth="1.2"
          />
        </motion.g>
      </svg>
    </div>
  );
}

/* ============================================================================
 * GRID CONTAINER: Responsive Arena Floor Plan
 * ========================================================================== */
export interface TacticalTableGridProps {
  tables: TacticalTableProps[];
  onSelectTable?: (id: string) => void;
}

export function TacticalTableGrid({ tables, onSelectTable }: TacticalTableGridProps) {
  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
      spacing="lg"
      verticalSpacing="lg"
    >
      {tables.map((table) => (
        <TacticalTableGraphic
          key={table.id}
          {...table}
          onSelect={onSelectTable ?? table.onSelect}
        />
      ))}
    </SimpleGrid>
  );
}