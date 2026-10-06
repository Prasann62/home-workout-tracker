// ============================================================
// SETTINGS TAB — Preferences, Data & Personal Server Sync
// ============================================================
import React, { useState, useEffect } from 'react';
import { Storage } from '../utils/storage.js';
import { getBackendConfig, saveBackendConfig, checkBackendHealth, syncWithBackend } from '../utils/apiSync.js';
import Dialog from './ui/Dialog.jsx';

export default function SettingsTab({ onOpenPrograms }) {
  const [dialogState, setDialogState] = useState({ isOpen: false });

  // Backend sync state
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // { message, type: 'info'|'success'|'error' }
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const cfg = getBackendConfig();
    setServerUrl(cfg.url);
    setApiKey(cfg.apiKey);
    setLastSyncedAt(cfg.lastSyncedAt);
  }, []);

  const handleSaveBackend = () => {
    saveBackendConfig(serverUrl, apiKey);
    setSyncStatus({ message: 'Backend config saved!', type: 'success' });
  };

  const handleTestConnection = async () => {
    saveBackendConfig(serverUrl, apiKey);
    setSyncStatus({ message: 'Testing connection...', type: 'info' });
    const res = await checkBackendHealth();
    if (res.ok) {
      setSyncStatus({ message: `Connected to ${res.data.app} (v${res.data.version})!`, type: 'success' });
    } else {
      setSyncStatus({ message: `Connection failed: ${res.message}`, type: 'error' });
    }
  };

  const handleSyncNow = async () => {
    saveBackendConfig(serverUrl, apiKey);
    setIsSyncing(true);
    setSyncStatus({ message: 'Syncing with personal backend...', type: 'info' });

    const result = await syncWithBackend();
    setIsSyncing(false);

    if (result.success) {
      const cfg = getBackendConfig();
      setLastSyncedAt(cfg.lastSyncedAt);
      setSyncStatus({
        message: `Sync complete! Synced ${result.syncedCounts.workouts} workouts, ${result.syncedCounts.sets} sets, ${result.syncedCounts.bodyweight} weight logs.`,
        type: 'success'
      });
    } else {
      setSyncStatus({ message: result.error, type: 'error' });
    }
  };

  const handleReset = () => {
    setDialogState({
      isOpen: true,
      title: 'Reset All Data?',
      message: 'This will permanently delete your workout history, personal records, and custom plans. This action cannot be undone.',
      confirmText: 'Erase Data',
      danger: true,
      onConfirm: () => {
        Storage.resetAllData();
        window.location.reload();
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
  };

  return (
    <div className="settings-container" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Preferences & Personal Backend Sync</p>
      </header>

      {/* Backend Server Configuration Section */}
      <section className="settings-section" style={{ background: 'var(--bg2, #1e293b)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1rem', color: '#00e5ff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🖥️ Personal Backend Sync
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Server Base URL</label>
            <input
              type="text"
              placeholder="http://192.168.1.100:4000"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Static API Key</label>
            <input
              type="password"
              placeholder="repai_secret_key_change_me"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {lastSyncedAt && (
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Last Synced: {new Date(lastSyncedAt).toLocaleString()}
            </div>
          )}

          {syncStatus && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              background: syncStatus.type === 'error' ? 'rgba(255,56,20,0.15)' : syncStatus.type === 'success' ? 'rgba(56,239,125,0.15)' : 'rgba(0,229,255,0.15)',
              color: syncStatus.type === 'error' ? '#ff3814' : syncStatus.type === 'success' ? '#38ef7d' : '#00e5ff',
              border: `1px solid ${syncStatus.type === 'error' ? '#ff3814' : syncStatus.type === 'success' ? '#38ef7d' : '#00e5ff'}`
            }}>
              {syncStatus.message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleTestConnection}
              style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              Test Health
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSyncNow}
              disabled={isSyncing}
              style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', background: '#00e5ff', color: '#0f172a' }}
            >
              {isSyncing ? 'Syncing...' : '🔄 SYNC NOW'}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Workout Programs</h2>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Training Routines</strong>
            <p>Browse expert workout programs</p>
          </div>
          <button className="btn btn-secondary" onClick={onOpenPrograms}>View</button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Privacy</h2>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>On-Device AI & Storage</strong>
            <p>Camera frames and pose data never leave your phone</p>
          </div>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
        </div>
      </section>

      <section className="settings-section">
        <h2>Data Management</h2>
        <div className="settings-item">
          <div className="settings-item-text">
            <strong>Reset Progress</strong>
            <p>Clear all history and personal records</p>
          </div>
          <button className="btn btn-danger" onClick={handleReset}>Reset</button>
        </div>
      </section>

      <section className="settings-section">
        <h2>About</h2>
        <p className="settings-about">
          ILA AI Coach · Version 2.0.0 (On-Device AI + Personal Sync)
        </p>
      </section>

      <Dialog {...dialogState} />
    </div>
  );
}
