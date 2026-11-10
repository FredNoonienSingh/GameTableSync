'use client';

import { useState } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Paper,
  Stack,
  Title,
  Text,
  Notification,
  Box,
  Container,
  Grid,
  Badge,
  Group,
  ThemeIcon,
  Anchor,
} from '@mantine/core';
import { IconSend, IconCheck, IconX, IconMail, IconBrandDiscord } from '@tabler/icons-react';

export interface ContactFormLabels {
  title?: string;
  subtitle?: string;
  emailLabel?: string;
  subjectLabel?: string;
  messageLabel?: string;
  success?: string;
  error?: string;
  submit?: string;
}

const defaultLabels: Required<ContactFormLabels> = {
  title: 'Join the Command Network',
  subtitle: 'Establish secure communications for early access and support inquiries.',
  emailLabel: 'Commander Email',
  subjectLabel: 'Subject',
  messageLabel: 'Transmission Message',
  success: 'Transmission sent successfully!',
  error: 'Transmission failed. Please try again.',
  submit: 'Send Transmission',
};


export function ContactForm({ labels }: { labels?: ContactFormLabels }) {
  const t = { ...defaultLabels, ...labels };

  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputStyles = {
    input: {
      backgroundColor: '#0a0b08',
      borderColor: 'rgba(24, 100, 255, 0.2)',
      color: '#fff',
      padding: '1.25rem 1rem',
    },
    label: {
      color: '#C1C2C5',
      marginBottom: '0.5rem',
      fontFamily: '"Orbitron", sans-serif',
      letterSpacing: '0.05em',
      fontSize: '0.85rem',
    },
  };

  return (
    <Box component="section" py={{ base: 80, md: 140 }} style={{ position: 'relative', zIndex: 1 }}>
      <Container size="lg" w="100%">
        <Grid gap={{ base: 50, md: 80 }} align="center">
          {/* Linke Spalte: Kommando-Text & Alternative Kontaktwege */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              <Badge color="brandBlue.5" variant="outline" size="lg" style={{ letterSpacing: '0.1em' }}>
                SECURE CHANNEL
              </Badge>
              <Title
                order={2}
                c="white"
                className="brand-logo"
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                  lineHeight: 1.1,
                  textShadow: '0 4px 25px rgba(24, 100, 255, 0.35)',
                }}
              >
                {t.title}
              </Title>
              <Text size="lg" c="gray.4" lh={1.6}>
                {t.subtitle}
              </Text>

              <Stack gap="lg" mt="xl">
                <Anchor href="mailto:info@GameTableSync.com" underline="never">
                  <Group
                    style={{ transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <ThemeIcon
                      size="xl"
                      variant="light"
                      color="brandBlue.5"
                      radius="md"
                      style={{ backgroundColor: 'rgba(24, 100, 255, 0.15)' }}
                    >
                      <IconMail size={22} />
                    </ThemeIcon>
                    <Text c="gray.3" className="brand-logo" size="sm" style={{ letterSpacing: '0.05em' }}>
                      info@GameTableSync.com
                    </Text>
                  </Group>
                </Anchor>

                <Button
                  component={discordUrl ? 'a' : 'button'}
                  href={discordUrl || undefined}
                  target={discordUrl ? '_blank' : undefined}
                  disabled={!discordUrl}
                  size="lg"
                  radius="md"
                  leftSection={<IconBrandDiscord size={22} />}
                  className="brand-logo"
                  style={{
                    backgroundColor: discordUrl ? '#5865F2' : undefined,
                    color: '#fff',
                    letterSpacing: '0.05em',
                    width: 'fit-content',
                  }}
                >
                  Official Community Server
                </Button>
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Rechte Spalte: Das Terminal-Formular */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper
              p={{ base: 'xl', sm: 'clamp(2rem, 4vw, 3rem)' }}
              radius="md"
              style={{
                backgroundColor: 'rgba(15, 16, 12, 0.85)',
                border: '1px solid rgba(24, 100, 255, 0.25)',
                borderTop: '3px solid #1864ff',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <form onSubmit={handleSubmit}>
                <Stack gap="lg">
                  <TextInput
                    required
                    type="email"
                    label={t.emailLabel}
                    placeholder="commander@club.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    styles={inputStyles}
                  />

                  <TextInput
                    required
                    label={t.subjectLabel}
                    placeholder="Early Access / Support"
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value)}
                    styles={inputStyles}
                  />

                  <Textarea
                    required
                    label={t.messageLabel}
                    placeholder="..."
                    minRows={5}
                    value={message}
                    onChange={(e) => setMessage(e.currentTarget.value)}
                    styles={inputStyles}
                  />

                  {status === 'success' && (
                    <Notification
                      icon={<IconCheck size={18} />}
                      color="teal"
                      onClose={() => setStatus('idle')}
                      withCloseButton={false}
                    >
                      {t.success}
                    </Notification>
                  )}

                  {status === 'error' && (
                    <Notification icon={<IconX size={18} />} color="red" onClose={() => setStatus('idle')}>
                      {t.error}
                    </Notification>
                  )}
                    <Button
                      type="submit"
                      size="xl"
                      color="brandBlue.6"
                      loading={status === 'loading'}
                      leftSection={<IconSend size={20} />}
                      className="brand-logo"
                      mt="md"
                      fullWidth
                      styles={{
                        root: {
                          height: 'auto', // Allows the button to grow vertically if text wraps
                          minHeight: '3.5rem', // Maintains the "xl" size appearance
                          padding: '0.75rem 1rem', // Ensures padding if it wraps to two lines
                        },
                      label: {
                        whiteSpace: 'normal', // Prevents clipping by allowing line breaks
                        textAlign: 'center',
                        lineHeight: 1.2,
                        fontSize: 'clamp(0.9rem, 4vw, 1.125rem)', // Scales font down on small screens
                        },
                       }}
>
                    {t.submit}
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}