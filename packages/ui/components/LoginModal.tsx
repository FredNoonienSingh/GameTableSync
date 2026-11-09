'use client';

import React, { useState } from 'react';
import { Modal, Stack, Text, TextInput, PasswordInput, Button } from '@mantine/core';
import { IconShieldLock, IconUserPlus } from '@tabler/icons-react';

export interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
  onLogin: (payload: any) => void;
  onRegister: (payload: any) => void;
  isLoading?: boolean;
  errorMsg?: string | null;
  successMsg?: string | null;
}

const inputStyles = { 
  input: { backgroundColor: '#101113', color: 'white', borderColor: '#354b60' }, 
  label: { color: 'white' } 
};

export function LoginModal({ opened, onClose, onLogin, onRegister, isLoading, errorMsg, successMsg }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [discordAccount, setDiscordAccount] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const handleModalClose = () => {
    onClose();
    setTimeout(() => {
      setIsRegister(false);
      setLocalError('');
    }, 200); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (isRegister) {
      if (password !== passwordConfirm) {
        setLocalError('Passwörter stimmen nicht überein.');
        return;
      }
      onRegister({ username, email, password, discord_account: discordAccount || null });
    } else {
      onLogin({ email, password });
    }
  };

  const displayError = localError || errorMsg;

  return (
    <Modal 
      opened={opened} 
      onClose={handleModalClose} 
      title={isRegister ? "ACCOUNT ERSTELLEN" : "LOGIN"}
      centered
      styles={{
        content: { backgroundColor: '#1a1d24', color: 'white', border: '1px solid #354b60' },
        header: { backgroundColor: '#1a1d24', color: 'white' },
        title: { fontFamily: 'Impact, "Arial Black", sans-serif', letterSpacing: '0.05em', fontSize: '1.25rem' },
        close: { color: 'white', '&:hover': { backgroundColor: '#e0282b' } }
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {displayError && <Text c="red" fw={700} ta="center">{displayError}</Text>}
          {successMsg && <Text c="green" fw={700} ta="center">{successMsg}</Text>}

          {isRegister && (
            <>
              <TextInput 
                label="Benutzername" 
                placeholder="TabletopGeneral" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                styles={inputStyles} 
              />
              <TextInput 
                label="Discord-Account / User-ID (Optional)" 
                placeholder="z.B. @deinname oder 123456789012345678" 
                value={discordAccount}
                onChange={(e) => setDiscordAccount(e.target.value)}
                styles={inputStyles} 
              />
            </>
          )}
          <TextInput 
            label="E-Mail" 
            type="email"
            placeholder="deine@email.de" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            styles={inputStyles} 
          />
          <PasswordInput 
            label="Passwort" 
            placeholder="********" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            styles={inputStyles} 
          />
          {isRegister && (
            <PasswordInput 
              label="Passwort bestätigen" 
              placeholder="********" 
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              styles={inputStyles} 
            />
          )}
          
          <Button type="submit" loading={isLoading} fullWidth color="red" leftSection={isRegister ? <IconUserPlus size={18} /> : <IconShieldLock size={18} />} style={{ fontFamily: 'Impact', letterSpacing: '0.05em' }}>
            {isRegister ? "REGISTRIEREN" : "ANMELDEN"}
          </Button>
          
          <Text 
            size="xs" 
            c="gray.4" 
            ta="center" 
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setIsRegister(!isRegister);
              setLocalError('');
            }}
          >
            {isRegister ? "Bereits einen Account? Hier einloggen." : "Noch kein Account? Hier registrieren."}
          </Text>
        </Stack>
      </form>
    </Modal>
  );
}