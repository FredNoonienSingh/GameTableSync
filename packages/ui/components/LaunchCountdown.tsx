'use client';

import { useEffect, useState } from 'react';
import { Group, Paper, Stack, Text } from '@mantine/core';

interface CountdownLabels {
  label: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date('2027-01-01T00:00:00').getTime();

export function LaunchCountdown({ labels }: { labels: CountdownLabels }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, TARGET_DATE - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, []);

  const units = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds },
  ];

  return (
    <Stack align="center" gap="sm" mt="lg">
      <Text
        size="xs"
        c="brandCyan.4"
        className="brand-logo"
        style={{ letterSpacing: '0.2em' }}
      >
        {labels.label} — 01.01.2027
      </Text>

      <Group gap="sm" justify="center" wrap="wrap">
        {units.map((unit) => (
          <Paper
            key={unit.label}
            px={{ base: 'md', sm: 'lg' }}
            py="sm"
            radius="md"
            style={{
              minWidth: 'clamp(74px, 18vw, 105px)',
              backgroundColor: 'rgba(15, 16, 12, 0.85)',
              border: '1px solid rgba(24, 100, 255, 0.45)',
              boxShadow: '0 0 20px rgba(24, 100, 255, 0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack gap={2} align="center">
              <Text
                className="brand-logo"
                c="white"
                style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
                  lineHeight: 1.1,
                }}
              >
                {mounted ? String(unit.value).padStart(2, '0') : '--'}
              </Text>
              <Text
                size="xs"
                c="brandBlue.4"
                className="brand-logo"
                style={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}
              >
                {unit.label}
              </Text>
            </Stack>
          </Paper>
        ))}
      </Group>
    </Stack>
  );
}