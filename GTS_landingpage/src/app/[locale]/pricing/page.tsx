// src/app/pricing/page.tsx
'use client';

import { Container, Title, Text, Button, Card, Group } from '@mantine/core';
import Link from 'next/link'; // Der native Next.js Router-Link

export default function PricingPage() {
  return (
    <Container size="sm" py={80} ta="center">
      <Title order={1} c="white">CHOOSE YOUR TIER</Title>
      <Text c="dimmed" mt="md" mb="xl">
        Transparente Preise für deinen Tabletop-Club.
      </Text>

      <Card shadow="sm" padding="lg" radius="md" withBorder bg="dark.7">
        <Title order={2} c="brandGold.8">PRO TIER</Title>
        <Text fw={700} size="xl" mt="md" c="white">39 € / Monat</Text>
        <Text c="gray.4" mt="sm">Inklusive Kampagnen-Editor und Custom Branding.</Text>
        
        <Group justify="center" mt="xl">
          {/* Zurück zur Startseite - Next.js Link mit Mantine Button verschmolzen */}
          <Button component={Link} href="/" variant="outline" color="brandRed.6">
            Back to Home
          </Button>
        </Group>
      </Card>
    </Container>
  );
}