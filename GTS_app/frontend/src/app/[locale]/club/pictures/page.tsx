'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  TextInput,
  FileButton,
  SimpleGrid,
  Alert,
  ActionIcon,
  Image as MantineImage,
  Box,
  Select,
} from '@mantine/core';
import {
  IconUpload,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconLock,
} from '@tabler/icons-react';
import { GalleryShowcase } from '@gts/ui';
import {
  useClubManagement,
  getClubAuthHeaders,
} from '../../../../context/ClubManagementContext';

const DEFAULT_GALLERY_NAME = 'IMPRESSIONEN // GALERIE';

interface ClubPictureDto {
  id: string;
  club_id: string;
  gallery_name?: string;
  title: string;
  s3_key: string;
  url: string;
  created_at: string | null;
}

export default function ClubPicturesPage() {
  const { selectedClubId, clubDetail, isKeymaster } = useClubManagement();

  const [pictures, setPictures] = useState<ClubPictureDto[]>([]);
  const [galleries, setGalleries] = useState<string[]>([DEFAULT_GALLERY_NAME]);
  const [selectedGallery, setSelectedGallery] = useState<string>(DEFAULT_GALLERY_NAME);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const isCitadelOrAbove =
    clubDetail?.tier === 'tier_3' ||
    clubDetail?.tier === 'tier_4' ||
    Boolean(clubDetail?.tier_limits?.can_edit_logo_and_description);
  const maxGalleries = Number(
    clubDetail?.tier_limits?.max_galleries ?? (isCitadelOrAbove ? 10 : 1)
  );

  const loadPictures = useCallback(async () => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/pictures`, {
      headers: getClubAuthHeaders(),
    });
    if (res.ok) {
      const data: ClubPictureDto[] = await res.json();
      setPictures(data);
      const fromPics = Array.from(
        new Set(data.map((p) => p.gallery_name || DEFAULT_GALLERY_NAME))
      );
      const fromTheme = Array.isArray((clubDetail?.theme_config as any)?.galleries)
        ? (clubDetail?.theme_config as any).galleries
        : [];
      const merged = Array.from(
        new Set([DEFAULT_GALLERY_NAME, ...fromTheme, ...fromPics])
      ).slice(0, maxGalleries);
      setGalleries(merged);
    }
  }, [selectedClubId, clubDetail?.theme_config, maxGalleries]);

  useEffect(() => {
    loadPictures();
  }, [loadPictures]);

  const handleAddGallery = () => {
    const clean = newGalleryName.trim();
    if (!clean) return;
    if (galleries.includes(clean)) {
      setSelectedGallery(clean);
      setNewGalleryName('');
      return;
    }
    if (galleries.length >= maxGalleries) {
      setStatusBanner({
        type: 'error',
        msg: `Maximal ${maxGalleries} Galerie(n) in diesem Tier verfügbar.`,
      });
      return;
    }
    setGalleries((prev) => [...prev, clean]);
    setSelectedGallery(clean);
    setNewGalleryName('');
  };

  const handleUploadPicture = async (file: File | null) => {
    if (!file || !selectedClubId) return;
    setUploading(true);
    setStatusBanner(null);

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('gts_token');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('gallery_name', selectedGallery || DEFAULT_GALLERY_NAME);
    if (title.trim()) {
      formData.append('title', title.trim());
    }

    try {
      const res = await fetch(`/api/clubs/${selectedClubId}/pictures`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatusBanner({ type: 'success', msg: data.msg });
        setTitle('');
        await loadPictures();
      } else {
        setStatusBanner({ type: 'error', msg: data.msg || 'Upload fehlgeschlagen.' });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePicture = async (picId: string) => {
    if (!selectedClubId) return;
    const res = await fetch(`/api/clubs/${selectedClubId}/pictures/${picId}`, {
      method: 'DELETE',
      headers: getClubAuthHeaders(),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusBanner({ type: 'success', msg: data.msg });
      await loadPictures();
    } else {
      setStatusBanner({ type: 'error', msg: data.msg });
    }
  };

  const currentGalleryPictures = useMemo(
    () =>
      pictures.filter(
        (p) => (p.gallery_name || DEFAULT_GALLERY_NAME) === selectedGallery
      ),
    [pictures, selectedGallery]
  );

  const showcaseImages = useMemo(
    () =>
      currentGalleryPictures.map((p) => ({
        src: p.url,
        alt: p.title || clubDetail?.name || 'Club Bild',
      })),
    [currentGalleryPictures, clubDetail?.name]
  );

  return (
    <Stack gap="lg" maw={1100}>
      <Paper p="lg" radius="md" className="gts-panel-header">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <Title order={2} className="brand-logo gts-army-title">
              BILDER & GALERIEN
            </Title>
            <Badge variant="outline" size="sm" className="brand-logo gts-tier-badge">
              {clubDetail?.name || ''}
            </Badge>
          </Group>
          <Group gap="xs">
            <Badge variant="outline" className="gts-status-badge">
              {galleries.length} / {maxGalleries} GALERIEN
            </Badge>
            <Badge variant="outline" className="gts-status-badge" data-tone="accent">
              {pictures.length} BILDER GESAMT
            </Badge>
          </Group>
        </Group>
      </Paper>

      {statusBanner && (
        <Alert
          className="gts-alert"
          data-tone={statusBanner.type === 'success' ? 'success' : 'danger'}
          icon={
            statusBanner.type === 'success' ? (
              <IconCheck size={18} />
            ) : (
              <IconAlertTriangle size={18} />
            )
          }
          withCloseButton
          onClose={() => setStatusBanner(null)}
        >
          {statusBanner.msg}
        </Alert>
      )}

      {isKeymaster && (
        <Paper p="lg" radius="md" className="gts-panel-card gts-form">
          <Stack gap="md">
            <Group gap="xs">
              <IconUpload size={18} className="gts-section-icon" />
              <Text className="gts-section-heading">GALERIE VERWALTEN</Text>
            </Group>
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
              <Select
                label="Aktive Galerie auswählen"
                value={selectedGallery}
                onChange={(val) => val && setSelectedGallery(val)}
                data={galleries.map((g) => ({ value: g, label: g }))}
                className="gts-grow-240"
              />

              {maxGalleries > 1 ? (
                <Group gap="xs" align="flex-end">
                  <TextInput
                    label="Neue Galerie anlegen"
                    placeholder="z.B. Turnier-Impressionen"
                    value={newGalleryName}
                    onChange={(e) => setNewGalleryName(e.currentTarget.value)}
                  />
                  <Button
                    variant="default"
                    className="gts-btn-secondary"
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddGallery}
                  >
                    Galerie hinzufügen
                  </Button>
                </Group>
              ) : (
                <Badge
                  variant="outline"
                  className="gts-status-badge"
                  data-tone="muted"
                  leftSection={<IconLock size={12} />}
                >
                  1 Galerie inklusive (Mehrere Galerien ab Citadel)
                </Badge>
              )}
            </Group>

            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                label="Bildtitel"
                placeholder="z.B. Turniertisch 1"
                className="gts-grow-240"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
              />
              <FileButton
                onChange={handleUploadPicture}
                accept="image/png,image/jpeg,image/webp,image/gif"
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="default"
                    className="gts-btn-primary"
                    loading={uploading}
                    leftSection={<IconUpload size={16} />}
                  >
                    Bild in „{selectedGallery}“ hochladen
                  </Button>
                )}
              </FileButton>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* GalleryShowcase from @gts/ui */}
      <GalleryShowcase
        title={selectedGallery}
        images={showcaseImages}
        height={380}
      />

      {/* Image Management Grid for Selected Gallery */}
      {currentGalleryPictures.length > 0 && (
        <Paper p="lg" radius="md" className="gts-panel-card">
          <Text className="gts-eyebrow" mb="sm">
            BILDER IN „{selectedGallery}“ VERWALTEN ({currentGalleryPictures.length})
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {currentGalleryPictures.map((pic) => (
              <Paper
                key={pic.id}
                p="xs"
                radius="md"
                className="gts-subcard"
              >
                <Box className="gts-thumb-frame gts-thumb-frame-md">
                  <MantineImage
                    src={pic.url}
                    alt={pic.title || 'Club Bild'}
                    className="gts-thumb-img"
                  />
                </Box>
                <Group justify="space-between" mt="xs" wrap="nowrap">
                  <Text size="xs" fw={600} truncate="end" className="gts-text-heading">
                    {pic.title || 'Unbenannt'}
                  </Text>
                  {isKeymaster && (
                    <ActionIcon
                      variant="default"
                      className="gts-icon-btn-danger"
                      size="sm"
                      onClick={() => handleDeletePicture(pic.id)}
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  )}
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
}
